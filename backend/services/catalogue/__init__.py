"""
Catalogue réel des services de PROCAD ENGINEERING (document « SERVICES », octobre 2026).

Chargé par `python manage.py load_catalogue`. Les 19 métiers du document sont regroupés en
7 domaines et 15 services : « Construction (gros œuvre) » et « Réalisation du bâtiment » ne
forment qu'un service, de même que « Infographie 360 » et « Communication digitale ».

Images : photos Unsplash (licence Unsplash : usage commercial libre, sans attribution
obligatoire), dans images/ ; crédits dans images/CREDITS.md.
"""
from pathlib import Path

IMAGES_DIR = Path(__file__).resolve().parent / "images"

CATEGORIES = [
    {
        "slug": "etudes-conception",
        "name": "Études et conception",
        "description": "Architecture, ingénierie et estimation : vos projets étudiés avant le premier coup de pioche.",
    },
    {
        "slug": "construction-gros-oeuvre",
        "name": "Construction et gros œuvre",
        "description": "Réalisation de bâtiments, des fondations à la toiture, et protection contre les infiltrations.",
    },
    {
        "slug": "second-oeuvre-finitions",
        "name": "Second œuvre et finitions",
        "description": "Menuiserie, carrelage, marbre, décoration et peinture pour des intérieurs soignés.",
    },
    {
        "slug": "installations-techniques",
        "name": "Installations techniques",
        "description": "Électricité, plomberie, chauffage, froid et climatisation des bâtiments.",
    },
    {
        "slug": "industrie-metallerie",
        "name": "Industrie et métallerie",
        "description": "Fabrication métallique, soudure industrielle et maintenance des équipements électromécaniques.",
    },
    {
        "slug": "securite-informatique",
        "name": "Sécurité et informatique",
        "description": "Protection des sites, vidéosurveillance, réseaux et systèmes informatiques.",
    },
    {
        "slug": "communication-marquage",
        "name": "Communication et marquage",
        "description": "Création graphique, communication digitale, sérigraphie, broderie et objets publicitaires.",
    },
]

SERVICES = [
    # --- Études et conception ---------------------------------------------------------
    {
        "category": "etudes-conception",
        "slug": "conception-architecturale",
        "title": "Conception architecturale",
        "short": "Plans, esquisses et dossiers d'exécution pour vos maisons, immeubles et locaux professionnels.",
        "featured": True,
        "description": (
            "Un bâtiment réussi commence par un plan bien pensé. Nos architectes traduisent vos besoins, "
            "votre budget et les contraintes de votre terrain en un projet clair, fonctionnel et constructible.\n\n"
            "Nos prestations :\n"
            "– relevé et analyse du terrain, programme des besoins ;\n"
            "– esquisse et avant-projet, avec plusieurs variantes si nécessaire ;\n"
            "– plans, coupes et façades cotés ;\n"
            "– dossier de demande de permis de bâtir ;\n"
            "– plans d'exécution remis aux entreprises ;\n"
            "– suivi architectural pendant les travaux.\n\n"
            "Nous concevons des villas, des immeubles d'habitation, des bureaux, des commerces et des "
            "bâtiments publics, en neuf comme en extension ou en réhabilitation."
        ),
        "features": [
            "Projet adapté à votre budget",
            "Dossier de permis de bâtir",
            "Plans d'exécution détaillés",
            "Suivi architectural du chantier",
        ],
        "images": [
            ("archi-1.jpg", "Architecte traçant un plan au crayon et à la règle"),
            ("archi-2.jpg", "Plans d'architecture déroulés sur une table de travail"),
        ],
    },
    {
        "category": "etudes-conception",
        "slug": "ingenierie-etudes-techniques",
        "title": "Ingénierie : études techniques et estimatives",
        "short": "Calculs de structure, études techniques et chiffrage précis pour sécuriser votre projet avant les travaux.",
        "featured": True,
        "description": (
            "Avant de construire, il faut savoir ce que l'ouvrage doit supporter et ce qu'il va coûter. "
            "Notre bureau d'études réalise les calculs et les métrés qui permettent de construire juste : "
            "ni sous-dimensionné, ni surdimensionné.\n\n"
            "Nos prestations :\n"
            "– étude de structure : fondations, poteaux, poutres, dalles en béton armé ;\n"
            "– plans de ferraillage et de coffrage ;\n"
            "– études des réseaux : électricité, plomberie, assainissement ;\n"
            "– avant-métré, devis quantitatif et estimatif ;\n"
            "– étude de faisabilité et planning prévisionnel ;\n"
            "– diagnostic de bâtiments existants.\n\n"
            "Vous disposez ainsi d'un budget fiable pour décider, consulter des entreprises ou obtenir "
            "un financement."
        ),
        "features": [
            "Calculs de structure en béton armé",
            "Devis quantitatif et estimatif détaillé",
            "Plans de ferraillage et de coffrage",
            "Diagnostic de bâtiments existants",
        ],
        "images": [
            ("inge-1.jpg", "Ingénieurs étudiant des plans techniques sur ordinateur"),
            ("inge-2.jpg", "Ingénieurs en casque échangeant sur un chantier"),
        ],
    },
    # --- Construction et gros œuvre -----------------------------------------------------
    {
        "category": "construction-gros-oeuvre",
        "slug": "construction-realisation-batiments",
        "title": "Construction et réalisation de bâtiments",
        "short": "Gros œuvre complet et réalisation de vos bâtiments, des fondations jusqu'à la remise des clés.",
        "featured": True,
        "description": (
            "Nous réalisons vos bâtiments de bout en bout : terrassement, fondations, élévation, dalles "
            "et toiture. Avec nos équipes de second œuvre et d'installations techniques, nous pouvons aussi "
            "livrer l'ouvrage entièrement terminé, sans que vous ayez à coordonner plusieurs entreprises.\n\n"
            "Nos prestations :\n"
            "– implantation, terrassement et fondations ;\n"
            "– maçonnerie, poteaux, chaînages et dalles en béton armé ;\n"
            "– charpente et couverture ;\n"
            "– réalisation clés en main avec nos corps de métier ;\n"
            "– extension, surélévation et réhabilitation ;\n"
            "– réception des travaux et levée des réserves.\n\n"
            "Chaque chantier est suivi par un responsable unique, qui vous rend compte de l'avancement, "
            "du respect du planning et du budget."
        ),
        "features": [
            "Gros œuvre complet",
            "Réalisation clés en main possible",
            "Un interlocuteur unique sur le chantier",
            "Suivi du planning et du budget",
        ],
        "images": [
            ("construction-1.jpg", "Immeuble en construction avec une grue"),
            ("construction-2.jpg", "Ouvrier contrôlant le ferraillage sur un chantier"),
            ("construction-3.jpg", "Ouvriers montant les armatures de poteaux en béton armé"),
        ],
    },
    {
        "category": "construction-gros-oeuvre",
        "slug": "etancheite",
        "title": "Étanchéité à chaud et à froid",
        "short": "Toitures-terrasses, dalles, fondations et réservoirs protégés durablement contre l'eau.",
        "featured": False,
        "description": (
            "Les infiltrations dégradent rapidement un bâtiment, surtout en saison des pluies. Nous "
            "mettons en œuvre le procédé d'étanchéité adapté à chaque support pour le protéger "
            "durablement.\n\n"
            "Nos prestations :\n"
            "– étanchéité à chaud : membranes bitumineuses soudées au chalumeau ;\n"
            "– étanchéité à froid : résines, enduits et revêtements liquides ;\n"
            "– toitures-terrasses, balcons et dalles ;\n"
            "– murs enterrés, fondations et sous-sols ;\n"
            "– réservoirs, bassins et salles d'eau ;\n"
            "– recherche de fuites et reprise d'étanchéités existantes.\n\n"
            "Nous commençons par un diagnostic du support, puis nous vous proposons la solution la plus "
            "adaptée à l'usage de l'ouvrage et à votre budget."
        ),
        "features": [
            "Procédés à chaud et à froid",
            "Diagnostic du support avant travaux",
            "Toitures, terrasses, fondations, réservoirs",
            "Reprise d'étanchéités défaillantes",
        ],
        "images": [
            ("etancheite-1.jpg", "Application d'un revêtement d'étanchéité sur une toiture-terrasse"),
        ],
    },
    # --- Second œuvre et finitions --------------------------------------------------------
    {
        "category": "second-oeuvre-finitions",
        "slug": "menuiserie-ebenisterie-tapisserie",
        "title": "Menuiserie bois, ébénisterie et tapisserie",
        "short": "Portes, placards, cuisines, mobilier sur mesure, habillages bois et sièges tapissés.",
        "featured": False,
        "description": (
            "Notre atelier fabrique et pose des ouvrages en bois sur mesure, du plus fonctionnel au plus "
            "décoratif. Nous travaillons les essences locales et les panneaux selon l'usage et le style "
            "recherchés.\n\n"
            "Nos prestations :\n"
            "– portes, fenêtres et cadres ;\n"
            "– placards, dressings et cuisines ;\n"
            "– mobilier de bureau et de maison sur mesure ;\n"
            "– habillages muraux, plafonds et lambris ;\n"
            "– ébénisterie fine et restauration de meubles ;\n"
            "– tapisserie : fauteuils, canapés, chaises et têtes de lit.\n\n"
            "Chaque ouvrage part d'une prise de cotes sur place et d'un dessin validé avec vous avant "
            "fabrication."
        ),
        "features": [
            "Fabrication sur mesure en atelier",
            "Bois massif et panneaux",
            "Prise de cotes et dessin avant fabrication",
            "Tapisserie et restauration de sièges",
        ],
        "images": [
            ("menuiserie-1.jpg", "Menuisier travaillant le bois dans son atelier"),
            ("menuiserie-2.jpg", "Sculpture du bois au ciseau"),
        ],
    },
    {
        "category": "second-oeuvre-finitions",
        "slug": "carrelage-marbrerie",
        "title": "Carrelage et marbrerie",
        "short": "Pose de carrelage, faïence, marbre et granit pour sols, murs, escaliers et plans de travail.",
        "featured": False,
        "description": (
            "Un revêtement bien posé dure des décennies. Nous préparons les supports avec soin et posons "
            "carreaux, marbre et granit avec des joints réguliers et des niveaux parfaits.\n\n"
            "Nos prestations :\n"
            "– carrelage de sols intérieurs et extérieurs ;\n"
            "– faïence de salles de bain et de cuisines ;\n"
            "– marbre et granit : sols, escaliers, seuils et appuis ;\n"
            "– plans de travail, vasques et habillages ;\n"
            "– chapes et ragréages ;\n"
            "– rénovation et polissage de sols en marbre.\n\n"
            "Nous vous conseillons sur le choix des matériaux selon la pièce, le passage et l'entretien "
            "souhaité."
        ),
        "features": [
            "Préparation soignée des supports",
            "Carrelage, faïence, marbre et granit",
            "Escaliers et plans de travail",
            "Polissage et rénovation de marbre",
        ],
        "images": [
            ("carrelage-1.jpg", "Pose d'un carreau de faïence sur un mur encollé"),
            ("carrelage-2.jpg", "Sol en marbre poli"),
        ],
    },
    {
        "category": "second-oeuvre-finitions",
        "slug": "decoration-design-interieur-peinture",
        "title": "Décoration, design intérieur et peinture",
        "short": "Aménagement et décoration de vos intérieurs, peintures intérieures et extérieures, effets décoratifs.",
        "featured": True,
        "description": (
            "Nous concevons des intérieurs à votre image, pour les maisons comme pour les bureaux, "
            "hôtels et commerces, puis nous réalisons les finitions qui leur donnent leur caractère.\n\n"
            "Nos prestations :\n"
            "– conseil en aménagement et choix des couleurs ;\n"
            "– plans d'aménagement et perspectives ;\n"
            "– faux plafonds, staff et éclairage décoratif ;\n"
            "– peinture intérieure et extérieure ;\n"
            "– enduits décoratifs et effets de matière ;\n"
            "– revêtements muraux et décoration de vitrines.\n\n"
            "Le projet vous est présenté avant travaux pour que vous puissiez valider l'ambiance, les "
            "matériaux et les teintes."
        ),
        "features": [
            "Conseil couleurs et matériaux",
            "Projet présenté avant travaux",
            "Peinture intérieure et extérieure",
            "Faux plafonds et enduits décoratifs",
        ],
        "images": [
            ("deco-1.jpg", "Salon aménagé et décoré"),
            ("deco-2.jpg", "Peintre appliquant une peinture jaune au rouleau"),
        ],
    },
    # --- Installations techniques --------------------------------------------------------
    {
        "category": "installations-techniques",
        "slug": "electricite-batiment",
        "title": "Électricité bâtiment",
        "short": "Installations électriques neuves, rénovation, tableaux et mise en conformité des bâtiments.",
        "featured": True,
        "description": (
            "Nous réalisons des installations électriques sûres et bien dimensionnées pour les logements, "
            "bureaux, commerces et bâtiments publics, du raccordement au réseau jusqu'au dernier point "
            "lumineux.\n\n"
            "Nos prestations :\n"
            "– installations électriques neuves, encastrées ou apparentes ;\n"
            "– tableaux, protections et mise à la terre ;\n"
            "– éclairage intérieur et extérieur ;\n"
            "– réseaux courants faibles : téléphone, télévision, informatique ;\n"
            "– groupes électrogènes, onduleurs et installations solaires ;\n"
            "– diagnostic, dépannage et mise en conformité.\n\n"
            "Nos installations sont réalisées selon les règles de l'art, testées avant mise en service "
            "et accompagnées des plans de l'installation."
        ),
        "features": [
            "Installations neuves et rénovation",
            "Tableaux, protections et mise à la terre",
            "Solaire, onduleurs et groupes électrogènes",
            "Essais avant mise en service",
        ],
        "images": [
            ("electricite-1.jpg", "Électricien en casque effectuant une mesure sur une installation"),
            ("electricite-2.jpg", "Tableau électrique avec disjoncteurs"),
        ],
    },
    {
        "category": "installations-techniques",
        "slug": "plomberie-tuyauterie-chauffage",
        "title": "Plomberie, tuyauterie et chauffage",
        "short": "Réseaux d'eau, sanitaires, évacuations, chauffe-eau et tuyauterie pour bâtiments et industrie.",
        "featured": False,
        "description": (
            "De l'alimentation en eau à l'évacuation des eaux usées, nous installons et entretenons des "
            "réseaux fiables, sans fuite et faciles à maintenir.\n\n"
            "Nos prestations :\n"
            "– alimentation en eau froide et chaude ;\n"
            "– appareils sanitaires, salles de bain et cuisines ;\n"
            "– évacuations, assainissement et fosses septiques ;\n"
            "– chauffe-eau électriques et solaires ;\n"
            "– surpresseurs, pompes et réservoirs ;\n"
            "– tuyauterie industrielle : acier, PEHD, PVC et cuivre ;\n"
            "– recherche de fuites et dépannage.\n\n"
            "Les réseaux sont mis en pression et contrôlés avant la fermeture des murs et des plafonds."
        ),
        "features": [
            "Eau froide, eau chaude et évacuations",
            "Chauffe-eau électriques et solaires",
            "Tuyauterie industrielle",
            "Essais de pression avant fermeture",
        ],
        "images": [
            ("plomberie-1.jpg", "Plombier intervenant dans une salle de bain"),
            ("plomberie-2.jpg", "Réseaux d'eau encastrés en cours d'installation"),
        ],
    },
    {
        "category": "installations-techniques",
        "slug": "froid-climatisation",
        "title": "Froid et climatisation",
        "short": "Installation, entretien et dépannage de climatiseurs, chambres froides et équipements frigorifiques.",
        "featured": False,
        "description": (
            "Sous notre climat, une climatisation fiable est indispensable au confort et à la productivité. "
            "Nous dimensionnons, installons et entretenons vos équipements pour qu'ils consomment moins et "
            "durent plus longtemps.\n\n"
            "Nos prestations :\n"
            "– bilan thermique et choix des équipements ;\n"
            "– climatiseurs split, cassettes et gainables ;\n"
            "– climatisation centralisée de bureaux et d'immeubles ;\n"
            "– chambres froides et équipements frigorifiques ;\n"
            "– contrats d'entretien préventif ;\n"
            "– dépannage, recharge de fluide et remplacement de pièces.\n\n"
            "Un entretien régulier évite la plupart des pannes : nous proposons des visites planifiées "
            "adaptées à votre parc."
        ),
        "features": [
            "Dimensionnement selon les locaux",
            "Climatisation individuelle et centralisée",
            "Chambres froides",
            "Contrats d'entretien préventif",
        ],
        "images": [
            ("clim-1.jpg", "Technicien entretenant une unité extérieure de climatisation"),
            ("clim-2.jpg", "Unités de climatisation installées sur une terrasse"),
        ],
    },
    # --- Industrie et métallerie ---------------------------------------------------------
    {
        "category": "industrie-metallerie",
        "slug": "fabrication-metallique-mecanique",
        "title": "Fabrication métallique et mécanique",
        "short": "Soudure industrielle, chaudronnerie et ferronnerie : charpentes, portails, cuves et pièces sur mesure.",
        "featured": True,
        "description": (
            "Notre atelier de métallerie réalise des ouvrages en acier, inox et aluminium, du simple garde-corps "
            "à la charpente métallique ou à l'équipement industriel.\n\n"
            "Nos prestations :\n"
            "– soudure industrielle à l'arc, MIG et TIG ;\n"
            "– chaudronnerie : cuves, réservoirs, trémies et gaines ;\n"
            "– charpentes et structures métalliques, hangars ;\n"
            "– ferronnerie : portails, grilles, garde-corps et escaliers ;\n"
            "– fabrication et réparation de pièces mécaniques ;\n"
            "– traitement anticorrosion et peinture des ouvrages.\n\n"
            "Les ouvrages sont fabriqués d'après plans, en atelier ou sur site, puis posés par nos équipes."
        ),
        "features": [
            "Soudure à l'arc, MIG et TIG",
            "Chaudronnerie et charpente métallique",
            "Portails, grilles et garde-corps",
            "Traitement anticorrosion",
        ],
        "images": [
            ("metal-1.jpg", "Soudeur au travail, casque de protection et gerbe d'étincelles"),
            ("metal-2.jpg", "Découpe de métal à la meuleuse"),
        ],
    },
    {
        "category": "industrie-metallerie",
        "slug": "installation-maintenance-electromecanique",
        "title": "Installation et maintenance électromécanique",
        "short": "Moteurs, pompes, groupes électrogènes, armoires de commande et machines industrielles.",
        "featured": False,
        "description": (
            "Un arrêt de production coûte cher. Nous installons vos équipements électromécaniques et les "
            "maintenons en état de marche, avec des interventions préventives et des dépannages rapides.\n\n"
            "Nos prestations :\n"
            "– installation et mise en service de machines ;\n"
            "– moteurs électriques, pompes et compresseurs ;\n"
            "– groupes électrogènes : installation, entretien et réparation ;\n"
            "– armoires électriques de commande et d'automatisme ;\n"
            "– maintenance préventive et contrats d'entretien ;\n"
            "– diagnostic de pannes et remplacement de pièces.\n\n"
            "Nous intervenons dans les usines, les ateliers, les bâtiments tertiaires et les installations "
            "de pompage."
        ),
        "features": [
            "Installation et mise en service",
            "Moteurs, pompes et groupes électrogènes",
            "Armoires de commande",
            "Maintenance préventive",
        ],
        "images": [
            ("electromeca-1.jpg", "Technicien intervenant sur un moteur électrique"),
            ("electromeca-2.jpg", "Armoire électrique de commande ouverte"),
        ],
    },
    # --- Sécurité et informatique --------------------------------------------------------
    {
        "category": "securite-informatique",
        "slug": "securite-serrurerie-videosurveillance",
        "title": "Systèmes de sécurité, serrurerie et vidéosurveillance",
        "short": "Vidéosurveillance, alarmes, contrôle d'accès et serrurerie pour protéger vos biens et vos locaux.",
        "featured": False,
        "description": (
            "Nous étudions les points faibles de votre site et mettons en place des équipements de sécurité "
            "adaptés, pour les domiciles, les entreprises et les établissements recevant du public.\n\n"
            "Nos prestations :\n"
            "– vidéosurveillance avec consultation à distance sur téléphone ;\n"
            "– alarmes anti-intrusion et détection incendie ;\n"
            "– contrôle d'accès : badges, digicodes, interphones et visiophones ;\n"
            "– serrurerie : serrures de sûreté, portes blindées, ouverture et dépannage ;\n"
            "– clôtures électriques ;\n"
            "– maintenance des installations de sécurité.\n\n"
            "Nous vous formons à l'utilisation du système à la mise en service."
        ),
        "features": [
            "Étude des risques du site",
            "Consultation des caméras à distance",
            "Alarmes et contrôle d'accès",
            "Serrurerie et portes blindées",
        ],
        "images": [
            ("securite-1.jpg", "Caméras de vidéosurveillance fixées sur un mât"),
            ("securite-2.jpg", "Caméra dôme de vidéosurveillance"),
        ],
    },
    {
        "category": "securite-informatique",
        "slug": "maintenance-reseaux-systemes-informatiques",
        "title": "Maintenance réseaux et systèmes informatiques",
        "short": "Câblage, réseaux, serveurs et maintenance de votre parc informatique.",
        "featured": False,
        "description": (
            "Nous concevons, installons et maintenons l'infrastructure informatique des entreprises et "
            "administrations, pour que vos équipes travaillent sans interruption.\n\n"
            "Nos prestations :\n"
            "– câblage structuré, baies de brassage et fibre optique ;\n"
            "– réseaux locaux et Wi-Fi professionnel ;\n"
            "– installation et administration de serveurs ;\n"
            "– maintenance préventive et curative des ordinateurs et imprimantes ;\n"
            "– sauvegarde des données et protection antivirus ;\n"
            "– assistance aux utilisateurs.\n\n"
            "Les installations sont documentées (plans de câblage, configurations) pour faciliter les "
            "interventions futures."
        ),
        "features": [
            "Câblage structuré et fibre optique",
            "Wi-Fi professionnel",
            "Serveurs et sauvegardes",
            "Maintenance du parc informatique",
        ],
        "images": [
            ("reseaux-1.jpg", "Baie réseau avec câbles de fibre optique"),
            ("reseaux-2.jpg", "Technicien intervenant sur un équipement réseau"),
        ],
    },
    # --- Communication et marquage -------------------------------------------------------
    {
        "category": "communication-marquage",
        "slug": "infographie-communication-digitale",
        "title": "Infographie 360° et communication digitale",
        "short": "Identité visuelle, supports imprimés, visuels 3D, réseaux sociaux et présence en ligne.",
        "featured": False,
        "description": (
            "Nous prenons en charge votre communication de A à Z, de la création graphique à la diffusion "
            "sur Internet.\n\n"
            "Nos prestations :\n"
            "– logos, chartes graphiques et identité visuelle ;\n"
            "– cartes de visite, flyers, affiches, catalogues et kakémonos ;\n"
            "– perspectives 3D et visites virtuelles de vos projets ;\n"
            "– gestion de pages Facebook, Instagram et LinkedIn ;\n"
            "– campagnes publicitaires en ligne ;\n"
            "– création de sites web vitrines.\n\n"
            "Les mêmes équipes assurent la création et l'impression, pour des supports cohérents d'un bout "
            "à l'autre."
        ),
        "features": [
            "Identité visuelle complète",
            "Supports print et digitaux",
            "Perspectives 3D et visites virtuelles",
            "Animation des réseaux sociaux",
        ],
        "images": [
            ("infographie-1.jpg", "Graphiste travaillant sur une tablette graphique"),
            ("infographie-2.jpg", "Perspective 3D d'une villa moderne"),
            ("infographie-3.jpg", "Gestion d'une page professionnelle sur ordinateur et téléphone"),
        ],
    },
    {
        "category": "communication-marquage",
        "slug": "serigraphie-broderie-gravure-gadgets",
        "title": "Sérigraphie, broderie, gravure et objets publicitaires",
        "short": "Marquage de tenues, enseignes, gravure et gadgets personnalisés à vos couleurs.",
        "featured": False,
        "description": (
            "Nous personnalisons vos textiles et vos objets pour vos équipes, vos clients et vos événements.\n\n"
            "Nos prestations :\n"
            "– sérigraphie sur tee-shirts, polos, casquettes et sacs ;\n"
            "– broderie de logos sur tenues de travail et uniformes ;\n"
            "– gravure sur métal, bois, verre et plexiglas ;\n"
            "– plaques, trophées et signalétique ;\n"
            "– enseignes et panneaux publicitaires ;\n"
            "– gadgets personnalisés : stylos, mugs, clés USB, porte-clés, calendriers.\n\n"
            "Un bon à tirer vous est soumis avant toute production."
        ),
        "features": [
            "Sérigraphie et broderie de logos",
            "Gravure tous supports",
            "Enseignes et signalétique",
            "Bon à tirer avant production",
        ],
        "images": [
            ("serigraphie-1.jpg", "Écran de sérigraphie imprimant un motif"),
            ("serigraphie-2.jpg", "Machine à broder brodant un logo"),
            ("serigraphie-3.jpg", "Impression manuelle en sérigraphie"),
        ],
    },
]
