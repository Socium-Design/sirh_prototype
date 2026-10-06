#!/usr/bin/env python3
"""Génère docs/guide-equipe.pdf (guide d'installation et de prise en main de l'équipe).

Usage :  python3 -m venv .venv && .venv/bin/pip install reportlab
         .venv/bin/python docs/guide-source/generate_guide.py

Pour mettre le guide à jour : modifier le contenu ci-dessous (fonctions `h1`, `p`, `steps`, `code`, `note`, `table`),
relancer le script, committer le PDF. Polices standard (Helvetica/Courier) : éviter les flèches et pictogrammes
Unicode (absents de WinAnsi) ; les accents français et les guillemets « » sont gérés.
"""
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

OUT = Path(__file__).resolve().parent.parent / "guide-equipe.pdf"

NAVY = colors.HexColor("#182438")
BLUE = colors.HexColor("#067EFF")
LIGHT = colors.HexColor("#EEF4FF")
GREY = colors.HexColor("#5B6577")
CODE_BG = colors.HexColor("#F3F5F8")
WARN_BG = colors.HexColor("#FFF6E5")
WARN = colors.HexColor("#C77700")
OK_BG = colors.HexColor("#EAF7EE")
OK = colors.HexColor("#1E8E3E")

base = getSampleStyleSheet()
BODY = ParagraphStyle("body", parent=base["Normal"], fontName="Helvetica", fontSize=10, leading=14.5, alignment=TA_LEFT, spaceAfter=6)
SMALL = ParagraphStyle("small", parent=BODY, fontSize=8.5, leading=11.5, textColor=GREY)
H1 = ParagraphStyle("h1", parent=BODY, fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=NAVY, spaceBefore=4, spaceAfter=10)
H2 = ParagraphStyle("h2", parent=BODY, fontName="Helvetica-Bold", fontSize=12, leading=16, textColor=BLUE, spaceBefore=10, spaceAfter=4)
TITLE = ParagraphStyle("title", parent=BODY, fontName="Helvetica-Bold", fontSize=30, leading=34, textColor=colors.white)
SUB = ParagraphStyle("sub", parent=BODY, fontSize=13, leading=18, textColor=colors.HexColor("#CFE0FF"))
CODE = ParagraphStyle("code", fontName="Courier", fontSize=8.3, leading=11, textColor=colors.HexColor("#1B2333"))
CELL = ParagraphStyle("cell", parent=BODY, fontSize=9, leading=12, spaceAfter=0)
CELLB = ParagraphStyle("cellb", parent=CELL, fontName="Helvetica-Bold")


class Doc(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(filename, pagesize=A4, leftMargin=2.1 * cm, rightMargin=2.1 * cm, topMargin=2.2 * cm, bottomMargin=2.0 * cm, **kw)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="f")
        self.addPageTemplates([PageTemplate(id="cover", frames=[frame], onPage=self.cover), PageTemplate(id="body", frames=[frame], onPage=self.page)])

    def cover(self, canv, doc):
        w, h = A4
        canv.setFillColor(NAVY)
        canv.rect(0, 0, w, h, stroke=0, fill=1)
        canv.setFillColor(BLUE)
        canv.rect(0, h * 0.40, w, 0.25 * cm, stroke=0, fill=1)

    def page(self, canv, doc):
        w, h = A4
        canv.setStrokeColor(colors.HexColor("#D9DEE7"))
        canv.line(self.leftMargin, h - 1.6 * cm, w - self.rightMargin, h - 1.6 * cm)
        canv.setFont("Helvetica", 8)
        canv.setFillColor(GREY)
        canv.drawString(self.leftMargin, h - 1.3 * cm, "SIRH Prototype — Guide d'équipe")
        canv.drawRightString(w - self.rightMargin, h - 1.3 * cm, "Socium Design")
        canv.drawCentredString(w / 2, 1.1 * cm, f"{doc.page - 1}")

    def afterFlowable(self, fl):
        if isinstance(fl, Paragraph) and fl.style.name in ("h1", "h2"):
            level = 0 if fl.style.name == "h1" else 1
            text = fl.getPlainText()
            key = f"h{id(fl)}"
            self.canv.bookmarkPage(key)
            self.notify("TOCEntry", (level, text, self.page - 1, key))


def esc(t: str) -> str:
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


S = []


def h1(t):
    S.append(PageBreak())
    S.append(Paragraph(t, H1))


def h2(t):
    S.append(Paragraph(t, H2))


def p(t):
    S.append(Paragraph(t, BODY))


def bullets(items):
    for it in items:
        S.append(Paragraph(f"•&nbsp;&nbsp;{it}", ParagraphStyle("b", parent=BODY, leftIndent=14, firstLineIndent=-10, spaceAfter=3)))
    S.append(Spacer(1, 3))


def steps(items):
    for i, it in enumerate(items, 1):
        S.append(Paragraph(f"<b><font color='#067EFF'>{i}.</font></b>&nbsp;&nbsp;{it}", ParagraphStyle("s", parent=BODY, leftIndent=18, firstLineIndent=-16, spaceAfter=4)))
    S.append(Spacer(1, 3))


def code(text):
    t = Table([[Preformatted(text.strip("\n"), CODE)]], colWidths=[A4[0] - 4.2 * cm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), CODE_BG), ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D9DEE7")), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    S.append(t)
    S.append(Spacer(1, 7))


def box(kind, title, text):
    bg, bar = {"note": (LIGHT, BLUE), "warn": (WARN_BG, WARN), "ok": (OK_BG, OK)}[kind]
    inner = Paragraph(f"<b>{title}</b><br/>{text}", ParagraphStyle("n", parent=BODY, spaceAfter=0, fontSize=9.3, leading=13))
    t = Table([["", inner]], colWidths=[0.2 * cm, A4[0] - 4.4 * cm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, 0), bar), ("BACKGROUND", (1, 0), (1, 0), bg), ("LEFTPADDING", (1, 0), (1, 0), 9), ("RIGHTPADDING", (1, 0), (1, 0), 9), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7), ("LEFTPADDING", (0, 0), (0, 0), 0), ("RIGHTPADDING", (0, 0), (0, 0), 0)]))
    S.append(KeepTogether([t, Spacer(1, 8)]))


def table(header, rows, widths):
    data = [[Paragraph(h, CELLB) for h in header]] + [[Paragraph(c, CELL) for c in r] for r in rows]
    t = Table(data, colWidths=[w * (A4[0] - 4.2 * cm) for w in widths], repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), LIGHT), ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D9DEE7")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    S.append(t)
    S.append(Spacer(1, 8))


# ───────────────────────────── Couverture + sommaire ─────────────────────────────
S.append(Spacer(1, 7.5 * cm))
S.append(Paragraph("SIRH Prototype", TITLE))
S.append(Spacer(1, 6))
S.append(Paragraph("Guide d'installation et de prise en main de l'équipe", SUB))
S.append(Spacer(1, 3 * cm))
S.append(Paragraph("Du design system React au design system Angular, puis au prototype : comment tout a été mis en place, et comment chaque membre de l'équipe configure son poste (Git, VS Code, Claude Code) pour réaliser des fonctionnalités sur le dépôt <b>sirh_prototype</b>.", ParagraphStyle("c", parent=SUB, fontSize=11, leading=16)))
S.append(Spacer(1, 4 * cm))
S.append(Paragraph("Socium Design — Organisation GitHub : Socium-Design", ParagraphStyle("c2", parent=SUB, fontSize=10)))

from reportlab.platypus import NextPageTemplate  # noqa: E402

S.insert(0, NextPageTemplate("cover"))
S.append(NextPageTemplate("body"))
S.append(PageBreak())
S.append(Paragraph("Sommaire", ParagraphStyle("toctitle", parent=H1)))
toc = TableOfContents()
toc.levelStyles = [ParagraphStyle("t0", parent=BODY, fontName="Helvetica-Bold", fontSize=10.5, leading=16, leftIndent=0), ParagraphStyle("t1", parent=BODY, fontSize=9, leading=13, leftIndent=16, textColor=GREY)]
S.append(toc)

# ───────────────────────────── 1. Vue d'ensemble ─────────────────────────────
h1("1. Vue d'ensemble : trois dépôts, un seul objectif")
p("Le projet SIRH Socium repose sur <b>trois dépôts GitHub</b> de l'organisation <b>Socium-Design</b>. Comprendre leur rôle évite 90 % des confusions.")
table(
    ["Dépôt", "Rôle", "Technologie", "À modifier ?"],
    [
        ["<b>design_system</b>", "Design system d'origine, en React. Reste la <b>référence figée</b> (tokens Figma, composants, comportements).", "React, Vite, Storybook", "Non (lecture seule)"],
        ["<b>design_system_angular</b>", "Migration complète du design system en Angular 19 : 27 primitifs, 14 composés, 6 templates de page. Publié sous <b>@socium-design/angular-components</b>.", "Angular 19, Storybook 10, Tailwind v4, ng-packagr", "Par les mainteneurs du design system uniquement"],
        ["<b>sirh_prototype</b>", "L'application : le prototype vivant de tous les produits (Workspace, Perf, Job…). Il <b>consomme</b> le design system Angular comme une dépendance.", "Angular 19", "Oui — c'est là que toute l'équipe travaille"],
    ],
    [0.25, 0.37, 0.2, 0.18],
)
h2("Comment les pièces s'emboîtent")
code("""
 design_system (React)        design_system_angular                 sirh_prototype
 ---------------------        ---------------------                 --------------
 référence Figma/tokens  -->  composants Angular reconstruits  -->  pages du SIRH
 (figé, lecture seule)        + Storybook + tests                   (npm install du paquet)
                              publié : @socium-design/angular-components
""")
p("Règle d'or : <b>une page du prototype n'invente jamais un composant</b>. Elle assemble des composants du design system. Si un besoin n'est pas couvert, on le signale comme <b>GAP-DS</b> (écart du design system) au lieu de bricoler.")

# ───────────────────────────── 2. Historique ─────────────────────────────
h1("2. Comment on est passé de React à Angular")
p("Cette section raconte la méthode, pour que l'équipe comprenne <i>pourquoi</i> les composants sont écrits ainsi. Elle n'a pas besoin d'être refaite : le travail est terminé.")
h2("2.1 Le choix de la stratégie")
bullets([
    "Le produit réel (le SIRH) est en Angular, alors que le design system d'origine était en React : il fallait un équivalent Angular fidèle.",
    "Décision : un <b>nouveau dépôt séparé</b> (<font name='Courier'>design_system_angular</font>). Le dépôt React n'est jamais modifié : il sert de référence.",
    "Chaque composant Angular est <b>reconstruit à partir du vrai code React</b> (props, comportements réels), jamais deviné par analogie avec un élément HTML.",
])
h2("2.2 Les trois lots, par niveau de dépendance")
table(
    ["Lot", "Contenu", "Exemples"],
    [
        ["Lot 1 — primitifs (27)", "Composants sans dépendance vers un autre composant du kit.", "Button, Avatar, Badge, Tag, Input*, Checkbox, Switch, Tabs, Tooltip, Popover, SideNavigation, AppSwitch"],
        ["Lot 2 — composés (14)", "Composants qui assemblent des primitifs.", "Menu, Select, MultiSelect, Dialog, Drawer, CardGrid, DataTable, HeaderApp"],
        ["Lot 3 — templates (6)", "Pages complètes.", "AppShell, PageHome, PageList, PageDetails, PageForm, PageProfile"],
    ],
    [0.22, 0.38, 0.4],
)
h2("2.3 Les conventions qui en découlent")
bullets([
    "<b>Composants standalone</b> (aucun NgModule), signaux (<font name='Courier'>input()</font>, <font name='Courier'>output()</font>, <font name='Courier'>model()</font>), nouvelle syntaxe <font name='Courier'>@if</font> / <font name='Courier'>@for</font>.",
    "<b>Sélecteur d'attribut</b> quand le composant EST un élément natif (<font name='Courier'>&lt;button socButton&gt;</font>) : tous les attributs natifs fonctionnent. Sinon composant élément (<font name='Courier'>&lt;soc-card&gt;</font>).",
    "<b>Slots</b> (équivalent des props React « ReactNode ») : on range le contenu avec un attribut marqueur, par ex. <font name='Courier'>&lt;svg socButtonLeftIcon&gt;</font>.",
    "<b>Champs de formulaire</b> : tous compatibles <font name='Courier'>formControl</font>, <font name='Courier'>formControlName</font> et <font name='Courier'>ngModel</font>.",
    "<b>Styles</b> : tokens de design en variables CSS, polices auto-hébergées, une seule feuille <font name='Courier'>styles.css</font> compilée et livrée avec le paquet.",
])
h2("2.4 Les pièges rencontrés (déjà résolus, à connaître)")
table(
    ["Piège", "Conséquence", "Solution en place"],
    [
        ["Tailwind v4 et la compilation Angular/Storybook", "Aucune classe utilitaire générée, ou erreur au démarrage.", "Configuration webpack dédiée dans Storybook + directives @source."],
        ["Mémoire de Node pendant le build de Storybook", "Le build plante (OOM).", "<font name='Courier'>NODE_OPTIONS=--max-old-space-size=6144</font> intégré aux scripts."],
        ["Polices non chargées", "Texte en police système.", "@font-face embarqués dans la feuille de style."],
        ["Un même slot déclaré deux fois dans un template", "Contenu projeté perdu en silence.", "Un seul &lt;ng-content&gt; par sélecteur ; règle documentée."],
        ["Chaque composant embarquait tout Tailwind", "Paquet de 35 Mo.", "Une seule feuille compilée : 1,7 Mo."],
    ],
    [0.34, 0.28, 0.38],
)
box("ok", "Qualité", "Le design system est vérifié par 113 tests unitaires (Karma/Jasmine), par ses 186 stories Storybook rejouées sans erreur console, et par un contrôle visuel dans le navigateur.")

# ───────────────────────────── 3. Outils ─────────────────────────────
h1("3. Installer les outils sur votre poste")
p("À faire une seule fois par machine. Les commandes sont données pour macOS ; Windows : utilisez Git Bash ou WSL, le reste est identique.")
h2("3.1 Node.js et npm")
code("""
node -v      # doit afficher v20 ou plus récent (v22 recommandé)
npm -v
""")
p("Si Node n'est pas installé : installez la version LTS depuis nodejs.org, ou utilisez un gestionnaire de versions (nvm, fnm).")
h2("3.2 Git")
code("""
git --version
git config --global user.name  "Prénom Nom"
git config --global user.email "prenom.nom@socium.link"
""")
box("note", "Nom et email ne sont pas une authentification", "<font name='Courier'>user.name</font> et <font name='Courier'>user.email</font> ne sont que des <b>étiquettes</b> écrites dans chaque commit. Ils ne donnent aucun droit : c'est la clé SSH (ou le jeton) qui prouve votre identité à GitHub. Utilisez l'email de votre compte GitHub pour que vos commits vous soient attribués.")
h2("3.3 Visual Studio Code")
steps([
    "Installez VS Code depuis code.visualstudio.com.",
    "Ouvrez le dossier du projet : à l'ouverture, VS Code propose d'installer les extensions recommandées (<b>Angular Language Service</b>, <b>Claude Code</b>, <b>EditorConfig</b>) — acceptez.",
    "Optionnel : activez la commande <font name='Courier'>code</font> dans le terminal (palette de commandes : « Shell Command: Install 'code' command in PATH »).",
])
h2("3.4 Claude Code")
p("Claude Code est l'assistant qui lit le projet, écrit le code et le vérifie. Il faut un <b>compte Claude de l'entreprise</b> (demandez l'invitation à votre administrateur).")
code("""
# Installation (méthode recommandée par Anthropic)
curl -fsSL https://claude.ai/install.sh | bash
# ou : npm install -g @anthropic-ai/claude-code

claude --version        # vérifie l'installation
claude                  # premier lancement : connexion avec le compte de l'entreprise
""")
box("note", "Autres interfaces", "Claude Code existe aussi comme extension VS Code et dans l'application de bureau Claude (onglet Code). Toutes lisent les mêmes fichiers de configuration du projet (<font name='Courier'>CLAUDE.md</font>, <font name='Courier'>.claude/</font>) : le comportement est identique.")

# ───────────────────────────── 4. GitHub ─────────────────────────────
h1("4. Accès à GitHub entreprise")
h2("4.1 Prérequis : être membre de l'organisation")
p("Demandez à un propriétaire de l'organisation <b>Socium-Design</b> de vous inviter avec votre compte GitHub personnel, puis acceptez l'invitation reçue par email. Sans cela, le dépôt et le design system sont invisibles (erreurs « Repository not found »).")
h2("4.2 Clé SSH : s'identifier sans mot de passe")
steps([
    "Générez une clé : <font name='Courier'>ssh-keygen -t ed25519 -C \"prenom.nom@socium.link\"</font> (Entrée pour l'emplacement par défaut, choisissez une phrase secrète).",
    "Démarrez l'agent et ajoutez la clé : <font name='Courier'>eval \"$(ssh-agent -s)\" &amp;&amp; ssh-add ~/.ssh/id_ed25519</font>.",
    "Copiez la clé publique : <font name='Courier'>pbcopy &lt; ~/.ssh/id_ed25519.pub</font> (macOS).",
    "GitHub : <b>Settings, SSH and GPG keys, New SSH key</b>, collez la clé. Si l'organisation impose le SSO : <b>Configure SSO, Authorize</b> pour Socium-Design.",
    "Testez : <font name='Courier'>ssh -T git@github.com</font> doit répondre « Hi &lt;votre-pseudo&gt;! You've successfully authenticated ».",
])
box("warn", "Plusieurs comptes GitHub sur la même machine", "Si vous avez un compte personnel ET un compte pro, créez une clé par compte et un alias dans <font name='Courier'>~/.ssh/config</font> (par ex. <font name='Courier'>Host github.com-socium</font> avec <font name='Courier'>IdentityFile ~/.ssh/id_socium</font>), puis clonez avec <font name='Courier'>git@github.com-socium:Socium-Design/...</font>. Vérifiez toujours <font name='Courier'>git remote -v</font> : un mauvais remote pousse vers le mauvais dépôt.")

# ───────────────────────────── 5. Cloner + paquet ─────────────────────────────
h1("5. Cloner sirh_prototype et installer le design system")
h2("5.1 Cloner")
code("""
git clone git@github.com:Socium-Design/sirh_prototype.git
cd sirh_prototype
""")
h2("5.2 Authentification au registre privé (GitHub Packages)")
p("Le design system est un paquet <b>privé</b> : <font name='Courier'>@socium-design/angular-components</font>, hébergé sur GitHub Packages. Le dépôt contient déjà un fichier <font name='Courier'>.npmrc</font> qui dit à npm où le trouver (<i>sans aucun secret</i>). Il vous reste à fournir <b>votre</b> jeton personnel :")
steps([
    "GitHub : <b>Settings, Developer settings, Personal access tokens, Tokens (classic), Generate new token (classic)</b>.",
    "Cochez la permission <b>read:packages</b> (rien de plus). Donnez-lui une durée de vie raisonnable. Si SSO : <b>Configure SSO, Authorize</b> pour Socium-Design.",
    "Copiez le jeton (il ne sera plus affiché) et ajoutez-le dans votre fichier <b>personnel</b> <font name='Courier'>~/.npmrc</font> (dossier utilisateur, <b>hors</b> du dépôt) :",
])
code("""
//npm.pkg.github.com/:_authToken=ghp_XXXXXXXXXXXXXXXXXXXXXXXX
""")
code("""
chmod 600 ~/.npmrc        # seul vous pouvez le lire
""")
box("warn", "Sécurité", "Ne collez <b>jamais</b> un jeton dans le dépôt, dans un message de commit, une issue, ni dans une conversation avec Claude. S'il fuite : révoquez-le immédiatement dans GitHub et générez-en un nouveau.")
h2("5.3 Installer")
code("""
npm install
""")
p("npm télécharge Angular, le design system (<font name='Courier'>@socium-design/angular-components</font>) et ses dépendances. Vérification : <font name='Courier'>ls node_modules/@socium-design/angular-components</font> doit lister <font name='Courier'>styles.css</font>, <font name='Courier'>docs/</font>, etc.")
h2("5.4 Erreurs d'installation fréquentes")
table(
    ["Message", "Cause", "Correction"],
    [
        ["E401 Unauthorized / 401", "Jeton absent, expiré ou mal recopié.", "Revoir ~/.npmrc (une seule ligne, sans espace) ; régénérer le jeton."],
        ["E403 Forbidden", "Jeton sans read:packages, SSO non autorisé, ou pas membre de l'organisation.", "Ajouter la permission ; autoriser le SSO ; demander l'accès au dépôt."],
        ["E404 Not Found @socium-design/…", "Mauvais registre, ou paquet pas encore publié.", "Vérifier le fichier .npmrc du dépôt ; demander à l'administrateur si la version a été publiée."],
        ["Permission denied (publickey)", "Clé SSH non ajoutée à GitHub / à l'agent.", "Reprendre l'étape 4.2 ; tester ssh -T git@github.com."],
    ],
    [0.26, 0.37, 0.37],
)

# ───────────────────────────── 6. Lancer ─────────────────────────────
h1("6. Lancer le prototype")
code("""
npm start             # http://localhost:4200  (rechargement automatique)
npm run build         # build de production (dist/sirh-prototype/)
npm run test:ci       # tests en headless (npm test = mode watch dans Chrome)
""")
p("Ouvrez <b>http://localhost:4200</b> : vous voyez l'application complète — barre d'applications à gauche (AppSwitch), en-tête (entreprise, aide, langue, avatar) et menu latéral. Cliquez « Employés » dans le menu Workspace : c'est la <b>page de référence</b> (liste recherchable et paginée) qui sert de modèle.")
box("note", "Pages « bientôt disponible »", "Un item de menu ou un produit sans page affiche une page « Bientôt disponible » au lieu d'une erreur. Une page se rattache au menu dans un seul fichier : <font name='Courier'>src/app/core/navigation/navigation.map.ts</font>.")
h2("Structure du projet")
code("""
src/app/
  layout/                 shell applicatif (AppSwitch + en-tête + menu), branché sur le routeur
  core/navigation/        navigation.map.ts : item de menu <-> route (à compléter à chaque page)
  core/session/           utilisateur, entreprises, langues (mock)
  products/<produit>/modules/<module>/    une page = un module (page, models, services, tests)
  shared/pages/           pages communes (ex. « bientôt disponible »)
src/mocks/data/           données fictives partagées par tous les produits
docs/                     guidelines.md, design-system.md, ce guide
CLAUDE.md  .claude/       configuration de Claude Code pour le projet
""")

# ───────────────────────────── 7. Claude Code ─────────────────────────────
h1("7. Travailler avec Claude Code sur le projet")
h2("7.1 Ce qui est déjà configuré (rien à faire)")
table(
    ["Fichier", "Rôle"],
    [
        ["<font name='Courier'>CLAUDE.md</font>", "Les règles du projet que Claude relit à chaque session : style Angular, architecture Produit > Module > Fonctionnalité, usage obligatoire du design system, workflow « de la spec à la page », conventions de branches et de commits."],
        ["<font name='Courier'>docs/design-system.md</font>", "Quel template de page pour quel besoin, patrons de pages, pièges connus."],
        ["<font name='Courier'>.claude/commands/nouvelle-page.md</font>", "La commande <font name='Courier'>/nouvelle-page</font> qui déroule le workflow complet."],
        ["<font name='Courier'>.claude/settings.json</font>", "Permissions partagées : commandes sûres autorisées sans confirmation ; modification de node_modules interdite (le design system est en lecture seule)."],
        ["<font name='Courier'>.claude/launch.json</font>", "Lancement de l'aperçu du prototype (npm start, port 4200)."],
        ["<font name='Courier'>node_modules/@socium-design/…/docs/</font>", "Référence de tous les composants (générée depuis le code) que Claude consulte avant d'utiliser un composant."],
    ],
    [0.34, 0.66],
)
h2("7.2 Première session")
steps([
    "Dans VS Code, ouvrez le dossier <b>sirh_prototype</b> (ou dans un terminal : <font name='Courier'>cd sirh_prototype</font>).",
    "Lancez <font name='Courier'>claude</font> dans le dossier (ou ouvrez le panneau Claude Code de VS Code). Au premier lancement, acceptez de « faire confiance » au dossier.",
    "Vérifiez que Claude a chargé le projet : demandez-lui « Résume les règles de CLAUDE.md et où se trouve la référence du design system ».",
])
h2("7.3 Demander une page")
p("Donnez une <b>spec</b> et utilisez la commande :")
code("""
/nouvelle-page Module « Contrats » du produit Workspace : liste des contrats
(employé, type CDI/CDD, date de début, statut), recherche, pagination, bouton
« Ajouter un contrat ». Données fictives réalistes.
""")
p("Claude va : reformuler la spec, créer la branche <font name='Courier'>feature/workspace-contrats</font>, lire la référence des composants, écrire modèle + mock + service + page + route, brancher le menu, écrire un test, lancer le build et les tests, puis <b>ouvrir l'application et contrôler la page</b> avant de rendre compte (fichiers créés, éventuels GAP-DS, décisions à valider).")
h2("7.4 Écrire une bonne spec")
table(
    ["Rubrique", "À préciser", "Exemple"],
    [
        ["Où", "Produit et module", "Workspace > Contrats"],
        ["Type de page", "Liste, détail, formulaire, profil, accueil", "Liste (puis détail au clic)"],
        ["Données", "Champs, valeurs, volumes", "Employé, type CDI/CDD, début, fin, statut ; ~25 lignes"],
        ["Actions", "Boutons, filtres, navigation", "Ajouter, rechercher, ouvrir le détail"],
        ["États", "Vide, chargement, erreur", "Message « Aucun contrat » si la recherche ne trouve rien"],
        ["Maquette", "Lien Figma ou capture", "Lien vers la frame Figma"],
    ],
    [0.2, 0.36, 0.44],
)
box("warn", "Relire avant d'accepter", "Claude demande une confirmation avant d'exécuter certaines commandes ou de modifier des fichiers sensibles. Lisez ce qu'il propose. Vérifiez la page dans le navigateur vous-même : un build qui passe ne prouve pas que la page est conforme à la spec.")
h2("7.5 Quand le design system ne suffit pas : GAP-DS")
p("Si la spec demande quelque chose que le kit ne fait pas (composant, variante, prop, écart visuel), Claude doit le <b>signaler comme GAP-DS</b> et proposer un contournement honnête. Transmettez ces GAP-DS aux mainteneurs du design system (dépôt <font name='Courier'>design_system_angular</font>, issue GitHub) : ils sont corrigés à la source, jamais contournés par un faux composant.")

# ───────────────────────────── 8. Git workflow ─────────────────────────────
h1("8. Travailler à plusieurs sur le même dépôt")
h2("8.1 Le cycle d'une fonctionnalité")
code("""
git checkout main && git pull                 # partir d'un main à jour
git checkout -b feature/workspace-contrats    # feature/<produit>-<module>
# ... développement (avec Claude) ...
npm run build && npm run test:ci              # tout doit être vert
git add <fichiers>                            # préférer des fichiers nommés à « git add . »
git commit -m "Workspace > Contrats : liste des contrats"
git push -u origin feature/workspace-contrats
# puis ouvrir une Pull Request vers main sur GitHub
""")
bullets([
    "<b>Ne jamais pousser directement sur main</b> : tout passe par une Pull Request relue par un collègue.",
    "Messages de commit : <font name='Courier'>&lt;Produit&gt; &gt; &lt;Module&gt; : description courte</font>.",
    "Une branche = un module. Plus la branche est courte, moins il y a de conflits.",
])
h2("8.2 Éviter les conflits")
bullets([
    "Les fichiers <b>partagés</b> par tous : <font name='Courier'>navigation.map.ts</font>, les fichiers <font name='Courier'>*.routes.ts</font>, <font name='Courier'>src/mocks/data/</font>. Ils reçoivent de petites lignes ajoutées : récupérez souvent <font name='Courier'>main</font> (<font name='Courier'>git pull --rebase origin main</font>) pour résoudre tôt.",
    "<b>Mocks</b> : un jeu de données unique et cohérent. Avant de créer une donnée, regardez si elle existe déjà (par ex. les employés) ; ne dupliquez pas.",
    "En cas de conflit, ne choisissez pas « la mienne » à l'aveugle : gardez les deux ajouts. Demandez à Claude de résoudre en expliquant son choix, puis relancez build et tests.",
])

# ───────────────────────────── 9. Mainteneurs DS ─────────────────────────────
h1("9. Pour les mainteneurs du design system")
h2("9.1 Faire évoluer le design system")
steps([
    "Cloner <font name='Courier'>design_system_angular</font>, <font name='Courier'>cd packages/angular</font>, <font name='Courier'>npm install</font>.",
    "Modifier un composant ; vérifier dans Storybook (<font name='Courier'>npm run storybook</font>, port 6006) et lancer <font name='Courier'>npm test</font> (113 tests).",
    "Construire : <font name='Courier'>npm run build</font> (régénère la documentation des composants et la feuille de style).",
    "Passer la version dans <font name='Courier'>packages/angular/angular-components/package.json</font>.",
    "Créer le tag correspondant : <font name='Courier'>git tag v0.1.1 &amp;&amp; git push origin v0.1.1</font> — la CI (GitHub Actions) teste, construit et <b>publie</b> sur GitHub Packages.",
    "Dans sirh_prototype : <font name='Courier'>npm install @socium-design/angular-components@latest</font>, vérifier, et committer <font name='Courier'>package.json</font> + <font name='Courier'>package-lock.json</font>.",
])
h2("9.2 Tester un changement du design system avant de le publier")
code("""
cd design_system_angular/packages/angular && npm run build
npm pack ./dist/angular-components               # crée socium-design-angular-components-X.Y.Z.tgz
cd ../../../sirh_prototype
npm install --no-save ../design_system_angular/packages/angular/socium-design-angular-components-X.Y.Z.tgz
npm start
""")
box("note", "Pourquoi --no-save", "Cette installation locale n'est pas écrite dans package.json : on ne committe jamais un chemin local. Un simple <font name='Courier'>npm install</font> rétablit la version publiée.")
h2("9.3 Mise en route initiale du registre (une seule fois)")
steps([
    "Fusionner dans <font name='Courier'>main</font> du dépôt <b>design_system_angular</b> la préparation de la publication (renommage du paquet en <font name='Courier'>@socium-design/angular-components</font>, workflows GitHub Actions).",
    "Vérifier dans GitHub (Settings, Actions) que les workflows sont autorisés pour l'organisation.",
    "Pousser le premier tag : <font name='Courier'>git tag v0.1.0 &amp;&amp; git push origin v0.1.0</font>. Suivre l'exécution dans l'onglet Actions.",
    "Vérifier que le paquet apparaît dans l'onglet <b>Packages</b> de l'organisation, et que l'accès « lecture » est donné aux membres (ou rattaché au dépôt).",
    "Dans <b>sirh_prototype</b>, fusionner la branche <font name='Courier'>feature/socle-design-system</font> après avoir lancé <font name='Courier'>npm install</font> et committé le <font name='Courier'>package-lock.json</font> mis à jour.",
])
box("warn", "Tant que le paquet n'est pas publié", "<font name='Courier'>npm install</font> sur sirh_prototype échoue en E404 pour tout le monde. Ne fusionnez la branche du prototype qu'après la publication de la v0.1.0.")

h2("9.4 Déploiement Vercel (aperçus de Pull Request)")
p("Vercel installe les dépendances sur ses propres serveurs, <b>sans votre jeton personnel</b> : tant qu'on ne lui en donne pas un, le déploiement échoue à l'installation avec <font name='Courier'>E401 Unauthorized ... authentication token not provided</font> (c'est le seul effet visible : le build local passe).")
steps([
    "Créez un jeton GitHub (classic) avec la seule permission <b>read:packages</b>. Idéalement depuis un compte de service de l'organisation plutôt que le compte d'une personne : un jeton personnel cesse de fonctionner si la personne quitte l'organisation.",
    "Vercel : projet <b>sirh-prototype</b>, <b>Settings, Environment Variables</b>. Ajoutez une variable nommée <font name='Courier'>NPM_RC</font>, cochée pour Production, Preview et Development, dont la valeur est exactement ces deux lignes :",
])
code("""
@socium-design:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_XXXXXXXXXXXXXXXXXXXXXXXX
""")
steps([
    "Relancez le déploiement (Deployments, menu « ... », Redeploy) ; l'installation doit maintenant passer.",
])
box("warn", "Ne pas mettre le jeton dans le dépôt", "Ne remplacez pas cette méthode par une ligne <font name='Courier'>_authToken=${NPM_TOKEN}</font> dans le fichier <font name='Courier'>.npmrc</font> du dépôt : testé, elle écrase le jeton personnel de chaque développeur et casse leur <font name='Courier'>npm install</font> (E401) dès que la variable n'est pas définie sur leur machine.")

# ───────────────────────────── 10. Dépannage ─────────────────────────────
h1("10. Dépannage")
table(
    ["Symptôme", "Cause probable", "Solution"],
    [
        ["Une page s'affiche sans style (texte brut)", "styles.css du design system non chargée.", "Vérifier le tableau « styles » de angular.json (cibles build ET test) ; relancer npm start."],
        ["NG8002 : Can't bind to 'x' since it isn't a known property", "Composant non importé, ou nom de prop faux.", "Ajouter le composant à imports ; relire sa signature dans components.md."],
        ["Un élément projeté (icône, badge, actions) n'apparaît pas", "Marqueur de slot manquant, ou deux éléments projetés dans un même bloc @if.", "Ajouter l'attribut marqueur ; un seul élément par @if."],
        ["Le menu surligne le mauvais item / ne navigue pas", "Entrée absente de navigation.map.ts.", "Ajouter la ligne NAV_ROUTES de l'item."],
        ["Déploiement Vercel en erreur à l'installation (E401)", "Vercel n'a pas de jeton pour le paquet privé.", "Ajouter la variable NPM_RC dans Vercel (section 9.4), puis Redeploy."],
        ["Port 4200 déjà utilisé", "Un autre ng serve tourne.", "Fermer l'autre terminal, ou : npm start -- --port 4300."],
        ["Les tests ne démarrent pas (Chrome introuvable)", "Chrome non installé.", "Installer Google Chrome, ou définir CHROME_BIN."],
        ["Le build Storybook du design system plante en mémoire", "Heap Node trop petit.", "Utiliser les scripts npm du dépôt (ils fixent NODE_OPTIONS)."],
    ],
    [0.32, 0.30, 0.38],
)
h2("Lexique")
table(
    ["Terme", "Signification"],
    [
        ["Primitif / Composé / Template", "Niveaux du design system : brique de base / assemblage de briques / page complète."],
        ["Slot", "Emplacement de contenu projeté dans un composant, repéré par un attribut marqueur (ex. socCardIcon)."],
        ["GAP-DS", "Écart constaté du design system : besoin non couvert, à remonter aux mainteneurs."],
        ["Mock", "Donnée fictive partagée (src/mocks/data/), servie par un service qui simule une API."],
        ["Shell", "Cadre applicatif (AppSwitch + en-tête + menu) qui entoure chaque page."],
    ],
    [0.28, 0.72],
)
h2("Liens")
bullets([
    "Design system React (référence) : github.com/Socium-Design/design_system",
    "Design system Angular : github.com/Socium-Design/design_system_angular",
    "Prototype : github.com/Socium-Design/sirh_prototype",
])


def build():
    doc = Doc(str(OUT), title="SIRH Prototype — Guide d'installation et de prise en main", author="Socium Design", subject="Guide d'équipe")
    doc.multiBuild(S)
    print(f"PDF écrit : {OUT}")


if __name__ == "__main__":
    build()
