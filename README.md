# CoC7 – Suivi de Chance du groupe

Module pour Foundry VTT (V13/V14) + système **CoC7** (Call of Cthulhu 7e
édition, non officiel).

## Ce qu'il fait

Ajoute un bouton (icône trèfle 🍀) dans la barre de contrôles à gauche de
l'écran, dans le groupe **Jeton**. Un clic ouvre/ferme une fenêtre qui
liste tous les personnages joueurs avec leur valeur de **Chance**
actuelle, et met en évidence en doré la (ou les) valeur(s) la(les) plus
basse(s) du groupe — celle utilisée par défaut pour les jets de Chance
collectifs.

La fenêtre se rafraîchit **automatiquement** dès qu'une fiche de
personnage est modifiée (Chance dépensée, récupérée, etc.), pas besoin
de la rouvrir.

Par défaut le bouton n'est visible que pour le Gardien (`game.user.isGM`).

### Regroupement par époque

Chaque ligne a un petit menu déroulant **Époque** à droite, avec les
quatre grandes époques du corpus CoC7 :

- **Gaslight** (1890s) — *Cthulhu by Gaslight*
- **Classique** (1920s) — livre de base
- **Pulp** (1930s) — *Pulp Cthulhu*
- **Moderne** — époque contemporaine, livre de base

Les personnages sont automatiquement regroupés dans des sections
séparées, chacune avec sa propre valeur "la plus basse" — pratique pour
les campagnes multi-époques ou les tables qui alternent plusieurs
casts. Le choix est mémorisé sur la fiche du personnage (un flag), donc
rien à refaire d'une session à l'autre. Un personnage non assigné
apparaît dans une section "Non assigné" par défaut.

## Installation

**Depuis Foundry :** Package Browser → onglet **Modules** → colle cette
URL de manifeste puis clique **Installer** :

```
https://github.com/magisterphamtom/coc7_trackerluck/releases/latest/download/module.json
```

**Manuellement :**

1. Décompressez le dossier `coc7_trackerluck` dans le répertoire des
   modules de votre installation Foundry :
   `[DonnéesFoundry]/Data/modules/coc7_trackerluck`
2. Dans **Configuration du monde → Gérer les modules**, cochez
   **CoC7 – Suivi de Chance du groupe**, puis sauvegardez.
3. Le bouton trèfle apparaît dans le groupe d'outils "Jeton" de la barre
   de contrôles, à gauche du canevas.

## Si la valeur de Chance ne s'affiche pas (« — »)

Le module va chercher la valeur dans `system.attribs.lck.value` (c'est
l'emplacement standard du système CoC7 officiel). Si votre version du
système range la Chance ailleurs, ouvrez la console du navigateur (F12)
et tapez :

```js
game.actors.contents.find(a => a.type === "character").system
```

Repérez le chemin exact vers la valeur de Chance, puis ouvrez une issue
sur le dépôt (ou ajoutez-le vous-même à la liste `candidates` de la
fonction `getLuckValue` dans `scripts/luck-tracker.js`).

## Personnalisation rapide

- **Rendre le bouton visible aux joueurs aussi** : dans
  `scripts/luck-tracker.js`, repérez la ligne `visible: game.user.isGM,`
  et remplacez-la par `visible: true,`.
- **Renommer/adapter les époques** à votre propre campagne : modifiez le
  tableau `ERA_DEFS` en tête de `scripts/luck-tracker.js`, ainsi que les
  clefs `COC7LUCK.Era*` correspondantes dans `lang/fr.json` et
  `lang/en.json`.
- **Couleurs** : variables CSS en tête de `styles/luck-tracker.css`.

## Publier une nouvelle version (release)

Le dépôt contient un workflow GitHub Actions
(`.github/workflows/release.yml`) qui construit et publie automatiquement
`module.zip` à chaque tag de version :

1. Mets à jour `"version"` dans `module.json` (ex. `1.1.0`).
2. Commit, puis :
   ```
   git tag v1.1.0
   git push origin v1.1.0
   ```
3. Le workflow crée une Release GitHub avec `module.zip` et `module.json`
   attachés — les URLs `manifest`/`download` du manifeste restent
   stables et pointent toujours vers la dernière version.

Le tag (`v1.1.0`) et la version dans `module.json` (`1.1.0`) doivent
correspondre exactement, sinon le workflow échoue volontairement pour
éviter une release incohérente.

## Licence

[MIT](LICENSE) — libre de réutilisation, modification et redistribution,
avec attribution.
