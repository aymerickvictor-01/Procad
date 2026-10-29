// Tests de bout en bout du site PROCAD dans un vrai navigateur (Edge sans interface).
//
//   node e2e/scenario.mjs            (environnement Docker de développement démarré)
//
// Crée un compte administrateur temporaire, déroule les parcours de la section 13 (étape 5)
// du document de conception, puis supprime tout ce qui a été créé. Captures : e2e/resultats/.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { launchBrowser } from "./cdp.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "e2e", "resultats");
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5174";
const IMAGE = join(ROOT, "postman", "fixtures", "image-test.png");

const USER = "e2e_admin";
const PASSWORD = `E2e-${Math.random().toString(36).slice(2)}-Procad!`;
const SERVICE = `Service E2E ${Date.now()}`;
const CATEGORY = "Catégorie E2E";
const SUBJECT = "Sujet E2E";

/** Exécute du code Python dans le shell Django ; renvoie la dernière ligne affichée. */
function django(code) {
  const output = execFileSync("docker", ["compose", "exec", "-T", "backend", "python", "manage.py", "shell"], {
    input: code,
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "ignore"],
  });
  return output.trim().split("\n").pop();
}

function setup() {
  return JSON.parse(
    django(`
import json
from django.contrib.auth.models import User
from django.core.cache import cache
from company.models import CompanyProfile
cache.clear()  # remet à zéro les limites de débit (connexion, contact)
User.objects.filter(username="${USER}").delete()
User.objects.create_user("${USER}", password="${PASSWORD}", is_staff=True)
print(json.dumps({"slogan": CompanyProfile.load().slogan}))
`),
  );
}

function cleanup(original) {
  django(`
from django.contrib.auth.models import User
from django.core.cache import cache
from company.models import CompanyProfile
from contact.models import ContactMessage
from services.models import Category, Service
from testimonials.models import Testimonial
Service.objects.filter(title__startswith="Service E2E").delete()
Category.objects.filter(name="${CATEGORY}").delete()
Testimonial.objects.filter(author_name="Client E2E").delete()
ContactMessage.objects.filter(email="e2e@example.com").delete()
User.objects.filter(username="${USER}").delete()
profile = CompanyProfile.load()
profile.slogan = ${JSON.stringify(original?.slogan ?? "")}
profile.save()
cache.clear()
print("ok")
`);
}

function expireSession() {
  django(`
from django.contrib.sessions.models import Session
from django.contrib.auth.models import User
uid = str(User.objects.get(username="${USER}").pk)
for session in Session.objects.all():
    if session.get_decoded().get("_auth_user_id") == uid:
        session.delete()
print("ok")
`);
}

/* --- Déroulé ----------------------------------------------------------------- */

const results = [];
let page;

async function step(name, fn) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - start });
    console.log(`  OK     ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.log(`  ÉCHEC  ${name}\n         ${error.message}`);
    await page.screenshot(join(OUT, "echec.png")).catch(() => {});
    throw error;
  }
}

const shot = (name) => page.screenshot(join(OUT, `${name}.png`));
const toast = (text) => page.waitText(text, 8000);
const confirmDialog = (label) => page.click(label, "dialog[open] button");

mkdirSync(OUT, { recursive: true });
console.log(`Tests de bout en bout sur ${BASE}\n`);
const original = setup();
const browser = await launchBrowser();
page = browser.page;
let serviceSlug;

try {
  /* Site public -------------------------------------------------------------- */
  await step("Accueil : la page s'affiche avec le logo", async () => {
    await page.goto(`${BASE}/`);
    await page.waitFor(`document.querySelector("header img[src*='logo']")`, { label: "le logo" });
    await page.waitFor(`document.querySelector("h1")`);
    await shot("01-accueil");
  });

  await step("Admin protégé : /admin redirige vers la connexion", async () => {
    await page.goto(`${BASE}/admin`);
    await page.waitFor(`location.pathname === "/admin/login"`, { label: "la page de connexion" });
  });

  /* Connexion ------------------------------------------------------------------ */
  await step("Connexion refusée avec un mauvais mot de passe", async () => {
    await page.fill("Identifiant", USER);
    await page.fill("Mot de passe", "mauvais-mot-de-passe");
    await page.click("Se connecter");
    await page.waitText("Identifiants incorrects.");
  });

  await step("Connexion réussie : tableau de bord", async () => {
    await page.fill("Mot de passe", PASSWORD);
    await page.click("Se connecter");
    await page.waitFor(`location.pathname === "/admin"`, { label: "le tableau de bord" });
    await page.waitText("Services publiés");
    await shot("02-tableau-de-bord");
  });

  /* Catégorie + service ------------------------------------------------------------ */
  await step("Créer une catégorie", async () => {
    await page.goto(`${BASE}/admin/categories`);
    await page.click("Nouvelle catégorie");
    await page.fill("Nom", CATEGORY);
    await page.click("Enregistrer", "dialog[open] button");
    await toast("Catégorie créée.");
    await page.waitText(CATEGORY);
    await shot("03-categories");
  });

  await step("Formulaire service : erreurs affichées si champs vides", async () => {
    await page.goto(`${BASE}/admin/services/nouveau`);
    await page.click("Enregistrer et publier");
    await page.waitText("Le titre est obligatoire.");
    await page.waitText("Choisissez une catégorie.");
  });

  await step("Créer un service avec image et points forts, puis le publier", async () => {
    await page.fill("Titre", SERVICE);
    await page.selectOption("Catégorie", CATEGORY);
    await page.fill("Prix indicatif", "Sur devis");
    await page.fill("Résumé", "Service créé par les tests de bout en bout.");
    await page.fill("Description complète", "Description complète du service de test.");
    await page.click("Ajouter un point fort");
    await page.click("Ajouter un point fort");
    await page.eval(`
      __e2e.setValue(document.querySelector('[aria-label="Point fort 1"]'), "Point A E2E");
      __e2e.setValue(document.querySelector('[aria-label="Point fort 2"]'), "Point B E2E");`);
    await page.setFiles('input[type="file"]', [IMAGE]);
    await page.waitFor(`[...document.images].some((img) => img.src.startsWith("blob:"))`, { label: "l'aperçu de l'image" });
    await page.click("Enregistrer et publier");
    await page.waitFor(`/\\/admin\\/services\\/\\d+\\/modifier$/.test(location.pathname)`, { label: "la page de modification" });
    await toast("Service créé.");
    await page.waitFor(`[...document.images].some((img) => img.src.includes("/media/services/"))`, { label: "l'image de couverture enregistrée" });
  });

  await step("Galerie : ajouter une image et son texte alternatif", async () => {
    await page.setFiles('input[type="file"][multiple]', [IMAGE]);
    await page.waitFor(`document.querySelectorAll('input[aria-label="Texte alternatif"]').length === 1`, { label: "l'image de la galerie" });
    await page.eval(`
      const alt = document.querySelector('input[aria-label="Texte alternatif"]');
      __e2e.setValue(alt, "Image de test E2E");
      // Sans interface, la page n'a pas toujours le focus : on émet directement la perte de focus.
      alt.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));`);
    await toast("Texte alternatif enregistré.");
    await shot("04-formulaire-service");
  });

  await step("Liste des services admin : le service est publié", async () => {
    await page.goto(`${BASE}/admin/services?search=E2E`);
    await page.waitText(SERVICE);
    await page.waitText("Publié");
    await shot("05-services-admin");
  });

  /* Côté visiteur ---------------------------------------------------------------------- */
  await step("Site public : le service apparaît dans la recherche", async () => {
    await page.goto(`${BASE}/services?search=E2E`);
    await page.waitText(SERVICE);
    serviceSlug = await page.eval(`return [...document.querySelectorAll('a[href^="/services/"]')].find((a) => a.textContent.includes(${JSON.stringify(SERVICE)})).getAttribute("href").split("/").pop();`);
  });

  await step("Site public : page détail avec points forts et galerie", async () => {
    await page.goto(`${BASE}/services/${serviceSlug}`);
    await page.waitText("Point A E2E");
    await page.waitText("Point B E2E");
    await page.waitFor(`document.querySelectorAll('button[aria-label^="Afficher l\\'image"]').length === 2`, { label: "les 2 miniatures" });
    await shot("06-detail-public");
  });

  await step("Contact : validation côté navigateur", async () => {
    await page.click("Demander un devis");
    await page.waitFor(`location.pathname === "/contact"`);
    await page.waitFor(`__e2e.byLabel("Service concerné").value === ${JSON.stringify(serviceSlug)}`, { label: "le service présélectionné" });
    await page.click("Envoyer le message");
    await page.waitText("Indiquez votre nom.");
    await page.waitText("Votre accord est nécessaire");
  });

  await step("Contact : envoi d'un message", async () => {
    await page.fill("Nom complet", "Visiteur E2E");
    await page.fill("E-mail", "e2e@example.com");
    await page.fill("Objet", SUBJECT);
    await page.fill("Message", "Message envoyé par les tests de bout en bout.");
    await page.eval(`document.querySelector('input[type="checkbox"]').click();`);
    await page.click("Envoyer le message");
    await page.waitText("Message envoyé");
  });

  /* Boîte de réception --------------------------------------------------------------- */
  await step("Messages : le message arrive non lu, s'ouvre et passe en lu", async () => {
    await page.goto(`${BASE}/admin/messages`);
    await page.waitText(SUBJECT);
    await page.click(SUBJECT, "ul button");
    await page.waitText("e2e@example.com");
    await page.waitText("Marquer non lu");
    await shot("07-messages");
  });

  await step("Messages : suppression avec confirmation", async () => {
    await page.click("Supprimer", "article button");
    await confirmDialog("Supprimer");
    await toast("Message supprimé.");
  });

  /* Témoignages -------------------------------------------------------------------------- */
  await step("Témoignages : création avec note, puis suppression", async () => {
    await page.goto(`${BASE}/admin/temoignages`);
    await page.click("Nouveau témoignage");
    await page.fill("Nom du client", "Client E2E");
    await page.fill("Témoignage", "Très bon travail (test).");
    await page.clickSelector('[aria-label="5 sur 5"]');
    await page.click("Enregistrer", "dialog[open] button");
    await toast("Témoignage créé.");
    await page.waitText("Client E2E");
    await shot("08-temoignages");
    await page.clickSelector('[aria-label="Supprimer le témoignage de Client E2E"]');
    await confirmDialog("Supprimer");
    await toast("Témoignage supprimé.");
  });

  /* Règles métier et cas limites ------------------------------------------------------------ */
  await step("Catégorie utilisée : suppression refusée avec explication", async () => {
    await page.goto(`${BASE}/admin/categories`);
    await page.clickSelector(`[aria-label="Supprimer « ${CATEGORY} »"]`);
    await confirmDialog("Supprimer");
    await page.waitText("Déplacez d'abord");
    await page.click("Annuler", "dialog[open] button");
  });

  await step("Entreprise : modification du slogan (puis restauration)", async () => {
    await page.goto(`${BASE}/admin/entreprise`);
    await page.fill("Slogan", "Slogan E2E");
    await page.click("Enregistrer", "form button");
    await toast("Profil de l'entreprise enregistré.");
    await shot("09-entreprise");
    await page.fill("Slogan", original.slogan || " ");
    await page.click("Enregistrer", "form button");
  });

  await step("Mon compte : mot de passe actuel incorrect refusé", async () => {
    await page.goto(`${BASE}/admin/compte`);
    await page.fill("Mot de passe actuel", "pas-le-bon");
    await page.fill("Nouveau mot de passe", "Nouveau-Mot-De-Passe-2026!");
    await page.fill("Confirmer", "Nouveau-Mot-De-Passe-2026!");
    await page.click("Modifier le mot de passe");
    await page.waitText("Le mot de passe actuel est incorrect.");
    await shot("10-compte");
  });

  await step("Suppression du service avec confirmation", async () => {
    await page.goto(`${BASE}/admin/services?search=E2E`);
    await page.clickSelector(`[aria-label^="Supprimer « Service E2E"]`);
    await confirmDialog("Supprimer");
    await toast("Service supprimé.");
  });

  await step("Session expirée : retour automatique à la connexion", async () => {
    expireSession();
    await page.click("Catégories", "nav a");
    await page.waitFor(`location.pathname === "/admin/login"`, { label: "la page de connexion", timeout: 8000 });
  });

  await step("Aucune erreur JavaScript pendant le parcours", async () => {
    if (page.errors.length) throw new Error(page.errors.slice(0, 5).join("\n         "));
  });
} catch {
  // L'étape en échec est déjà signalée ; on passe au nettoyage.
} finally {
  await browser.close();
  cleanup(original);
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} étapes réussies. Captures : e2e/resultats/`);
process.exit(failed ? 1 : 0);
