/**
 * CoC7 – Suivi de Chance du groupe (version générique)
 * Ajoute un bouton dans les contrôles de scène (barre gauche) qui ouvre
 * une fenêtre listant la Chance de tous les investigateurs joueurs,
 * regroupés par époque canonique CoC7 (Gaslight / Classique / Pulp /
 * Moderne), assignée manuellement par le Gardien.
 */

const MODULE_ID = "coc7_trackerluck";

/* Ancien id utilisé par une version personnalisée antérieure de ce module :
 * conservé uniquement en secours pour ne pas perdre une éventuelle
 * affectation d'époque déjà faite avec cette version. */
const LEGACY_ERA_FLAG_MODULE = "coc7-luck-tracker";
const ERA_FLAG_KEY = "era";

/* Époques canoniques du corpus CoC7 (livre de base + suppléments officiels) */
const ERA_DEFS = [
  { key: "gaslight", label: "COC7LUCK.EraGaslight", sub: "1890s" },
  { key: "classic", label: "COC7LUCK.EraClassic", sub: "1920s" },
  { key: "pulp", label: "COC7LUCK.EraPulp", sub: "1930s" },
  { key: "modern", label: "COC7LUCK.EraModern", sub: null },
  { key: "unassigned", label: "COC7LUCK.EraUnassigned", sub: null }
];

/* ------------------------------------------------------------------ */
/*  Lecture de la valeur de Chance sur une fiche d'acteur              */
/* ------------------------------------------------------------------ */
/**
 * Le système CoC7 range les attributs dérivés (PV, Points de Magie,
 * Santé Mentale, Chance) sous system.attribs.<clef>.value.
 * On tente plusieurs clefs/emplacements connus par prudence, au cas où
 * une version différente du système rangerait la donnée ailleurs.
 */
function getLuckValue(actor) {
  const sys = actor?.system ?? {};
  const candidates = [
    sys?.attribs?.lck?.value,
    sys?.attribs?.luck?.value,
    sys?.characteristics?.lck?.value,
    sys?.characteristics?.luck?.value
  ];
  const value = candidates.find((v) => typeof v === "number" && !Number.isNaN(v));
  return typeof value === "number" ? value : null;
}

function getActorEra(docActor) {
  const own = docActor.getFlag(MODULE_ID, ERA_FLAG_KEY);
  if (own) return own;
  const legacy = docActor.getFlag(LEGACY_ERA_FLAG_MODULE, ERA_FLAG_KEY);
  return legacy ?? "unassigned";
}

/**
 * Récupère les personnages joueurs (type "character" possédé par un joueur),
 * avec leur époque assignée ("unassigned" par défaut).
 */
function getTrackedActors() {
  return game.actors
    .filter((docActor) => docActor.type === "character" && docActor.hasPlayerOwner)
    .map((docActor) => {
      const luck = getLuckValue(docActor);
      const era = getActorEra(docActor);
      return {
        id: docActor.id,
        name: docActor.name,
        img: docActor.img || "icons/svg/mystery-man.svg",
        luck,
        luckDisplay: luck === null ? "—" : String(luck),
        era: ERA_DEFS.some((d) => d.key === era) ? era : "unassigned"
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/* ------------------------------------------------------------------ */
/*  Fenêtre d'affichage (ApplicationV2)                                */
/* ------------------------------------------------------------------ */
class LuckTrackerApp extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: "coc7-luck-tracker-app",
    tag: "div",
    window: {
      title: "COC7LUCK.WindowTitle",
      icon: "fa-solid fa-clover",
      resizable: true
    },
    position: { width: 380, height: "auto" },
    actions: {
      refresh: LuckTrackerApp.onRefresh
    }
  };

  static PARTS = {
    content: { template: `modules/${MODULE_ID}/templates/luck-tracker.hbs` }
  };

  /** @override */
  async _prepareContext(_options) {
    const rawActors = getTrackedActors();

    const groupsMap = new Map(ERA_DEFS.map((d) => [d.key, []]));
    for (const a of rawActors) {
      groupsMap.get(a.era).push(a);
    }

    const groups = ERA_DEFS.map((def) => {
      const actors = groupsMap.get(def.key) ?? [];
      const numeric = actors.map((a) => a.luck).filter((v) => typeof v === "number");
      const lowest = numeric.length ? Math.min(...numeric) : null;

      return {
        key: def.key,
        cssKey: `era-${def.key}`,
        label: def.label,
        sub: def.sub,
        lowestDisplay: lowest === null ? "—" : String(lowest),
        actors: actors.map((a) => ({
          ...a,
          isLowest: a.luck !== null && a.luck === lowest,
          eraOptions: ERA_DEFS.map((d) => ({
            key: d.key,
            label: d.label,
            selected: d.key === a.era
          }))
        }))
      };
    }).filter((g) => g.actors.length > 0);

    return {
      groups,
      hasActors: rawActors.length > 0
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelectorAll(".coc7-era-select").forEach((select) => {
      select.addEventListener("change", async (event) => {
        const target = event.currentTarget;
        const actorId = target.dataset.actorId;
        const era = target.value;
        const docActor = game.actors.get(actorId);
        if (!docActor) return;
        if (era === "unassigned") await docActor.unsetFlag(MODULE_ID, ERA_FLAG_KEY);
        else await docActor.setFlag(MODULE_ID, ERA_FLAG_KEY, era);
        // Le hook updateActor rafraîchit automatiquement la fenêtre.
      });
    });
  }

  static onRefresh(_event, _target) {
    this.render();
  }
}

/* ------------------------------------------------------------------ */
/*  Instance unique + bascule ouverture/fermeture                      */
/* ------------------------------------------------------------------ */
let appInstance = null;

function toggleLuckTracker() {
  if (appInstance?.rendered) {
    appInstance.close();
    return;
  }
  appInstance = new LuckTrackerApp();
  appInstance.render({ force: true });
}

/* ------------------------------------------------------------------ */
/*  Rafraîchissement automatique quand une fiche change                */
/* ------------------------------------------------------------------ */
Hooks.on("updateActor", (actor) => {
  if (appInstance?.rendered && actor.type === "character") appInstance.render();
});
Hooks.on("createActor", (actor) => {
  if (appInstance?.rendered && actor.type === "character") appInstance.render();
});
Hooks.on("deleteActor", (actor) => {
  if (appInstance?.rendered && actor.type === "character") appInstance.render();
});

/* ------------------------------------------------------------------ */
/*  Bouton dans la barre de contrôles de scène (barre latérale gauche) */
/* ------------------------------------------------------------------ */
Hooks.on("getSceneControlButtons", (controls) => {
  const tokenControl = controls.tokens;
  if (!tokenControl?.tools) return;

  tokenControl.tools.luckTracker = {
    name: "luckTracker",
    title: "COC7LUCK.ButtonTitle",
    icon: "fa-solid fa-clover",
    order: Object.keys(tokenControl.tools).length,
    button: true,
    visible: game.user.isGM,
    onChange: () => toggleLuckTracker()
  };
});
