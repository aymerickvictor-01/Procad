// Pilotage minimal de Microsoft Edge (ou Chrome) par le protocole DevTools, sans dépendance :
// Node 22 fournit fetch et WebSocket. Sert aux tests de bout en bout (e2e/scenario.mjs).
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const DEFAULT_BROWSER = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fonctions injectées dans chaque page : recherche d'éléments par libellé ou par texte visible.
const HELPERS = `
window.__e2e = {
  byLabel(text) {
    const label = [...document.querySelectorAll("label")].find((l) => l.textContent.trim().startsWith(text));
    if (!label) return null;
    return label.htmlFor ? document.getElementById(label.htmlFor) : label.querySelector("input,select,textarea");
  },
  byText(text, selector = "button, a, [role=switch]") {
    return [...document.querySelectorAll(selector)].find(
      (el) => el.offsetParent !== null && el.textContent.replace(/\\s+/g, " ").trim().includes(text),
    );
  },
  setValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : el instanceof HTMLSelectElement ? HTMLSelectElement : HTMLInputElement;
    Object.getOwnPropertyDescriptor(proto.prototype, "value").set.call(el, value);
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  },
};`;

export async function launchBrowser({ port = 9333, width = 1440, height = 1000 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), "procad-e2e-"));
  const proc = spawn(process.env.E2E_BROWSER ?? DEFAULT_BROWSER, [
    "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`, "--no-first-run", "--disable-gpu", "about:blank",
  ], { stdio: "ignore" });

  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === "page");
    } catch { /* navigateur pas encore prêt */ }
  }
  if (!target) throw new Error("Impossible de démarrer le navigateur.");

  const page = new Page(target.webSocketDebuggerUrl);
  await page.open();
  return {
    page,
    async close() {
      page.ws.close();
      proc.kill();
      await sleep(500);
      rmSync(profile, { recursive: true, force: true });
    },
  };
}

class Page {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    this.errors = [];
  }

  async open() {
    this.ws = new WebSocket(this.url);
    await new Promise((ok, ko) => ((this.ws.onopen = ok), (this.ws.onerror = ko)));
    this.ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: ok, reject: ko } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? ko(new Error(msg.error.message)) : ok(msg.result);
      } else if (msg.method) {
        this.listeners.forEach((fn) => fn(msg));
      }
    };
    // Erreurs JavaScript et console.error de l'application : relevées pour le rapport.
    this.listeners.push(({ method, params }) => {
      if (method === "Runtime.exceptionThrown") this.errors.push(params.exceptionDetails.exception?.description ?? params.exceptionDetails.text);
      if (method === "Runtime.consoleAPICalled" && params.type === "error")
        this.errors.push(params.args.map((a) => a.value ?? a.description ?? "").join(" "));
    });
    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await this.send("DOM.enable");
    await this.send("Page.addScriptToEvaluateOnNewDocument", { source: HELPERS });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, ko) => this.pending.set(id, { resolve: ok, reject: ko }));
  }

  async eval(expression) {
    const { result, exceptionDetails } = await this.send("Runtime.evaluate", {
      expression: `(async () => { ${expression} })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return result.value;
  }

  async goto(url) {
    const loaded = new Promise((ok) => {
      const fn = ({ method }) => method === "Page.loadEventFired" && (this.listeners.splice(this.listeners.indexOf(fn), 1), ok());
      this.listeners.push(fn);
    });
    await this.send("Page.navigate", { url });
    await loaded;
  }

  /** Attend qu'une expression JS (renvoyant une valeur « vraie ») le devienne. */
  async waitFor(expression, { timeout = 10000, label = expression } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        // Converti en booléen : un élément du DOM ne peut pas être renvoyé par valeur.
        const value = await this.eval(`return !!(${expression});`);
        if (value) return value;
      } catch { /* élément pas encore présent */ }
      await sleep(150);
    }
    throw new Error(`Délai dépassé en attendant : ${label}`);
  }

  waitText(text, timeout) {
    return this.waitFor(`document.body.innerText.includes(${JSON.stringify(text)})`, { timeout, label: `le texte « ${text} »` });
  }

  path() {
    return this.eval("return location.pathname + location.search;");
  }

  async fill(label, value) {
    await this.waitFor(`__e2e.byLabel(${JSON.stringify(label)})`, { label: `le champ « ${label} »` });
    await this.eval(`__e2e.setValue(__e2e.byLabel(${JSON.stringify(label)}), ${JSON.stringify(String(value))});`);
  }

  async selectOption(label, optionText) {
    await this.waitFor(
      `[...(__e2e.byLabel(${JSON.stringify(label)})?.options ?? [])].some((o) => o.text.includes(${JSON.stringify(optionText)}))`,
      { label: `l'option « ${optionText} »` },
    );
    await this.eval(`
      const select = __e2e.byLabel(${JSON.stringify(label)});
      const option = [...select.options].find((o) => o.text.includes(${JSON.stringify(optionText)}));
      __e2e.setValue(select, option.value);`);
  }

  async click(text, selector) {
    const args = `${JSON.stringify(text)}${selector ? `, ${JSON.stringify(selector)}` : ""}`;
    await this.waitFor(`__e2e.byText(${args})`, { label: `le bouton « ${text} »` });
    await this.eval(`__e2e.byText(${args}).click();`);
  }

  async clickSelector(selector) {
    await this.waitFor(`document.querySelector(${JSON.stringify(selector)})`, { label: selector });
    await this.eval(`document.querySelector(${JSON.stringify(selector)}).click();`);
  }

  /** Dépose des fichiers dans un <input type=file> (déclenche l'événement change). */
  async setFiles(selector, files) {
    await this.waitFor(`document.querySelector(${JSON.stringify(selector)})`, { label: selector });
    const { root } = await this.send("DOM.getDocument", { depth: 0 });
    const { nodeId } = await this.send("DOM.querySelector", { nodeId: root.nodeId, selector });
    await this.send("DOM.setFileInputFiles", { nodeId, files: files.map((f) => resolve(f)) });
  }

  async screenshot(path) {
    const { data } = await this.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    writeFileSync(path, Buffer.from(data, "base64"));
  }
}
