import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "fr";
export type TranslationKey =
  | "appName"
  | "newGame"
  | "gameName"
  | "gameNamePlaceholder"
  | "optional"
  | "startingScore"
  | "startingScoreHint"
  | "presets"
  | "presetCustom"
  | "players"
  | "whoIsPlaying"
  | "addPlayer"
  | "startGame"
  | "playerNumber"
  | "playerName"
  | "removePlayer"
  | "colorForPlayer"
  | "setupTagline"
  | "undo"
  | "redo"
  | "savedGames"
  | "history"
  | "moves"
  | "noMoves"
  | "movesPlaceholder"
  | "edit"
  | "delete"
  | "save"
  | "cancel"
  | "newDelta"
  | "customDelta"
  | "addPoint"
  | "removePoint"
  | "quickScoreChange"
  | "flipPlayer"
  | "resume"
  | "untitledGame"
  | "noSavedGames"
  | "viewSavedGames"
  | "export"
  | "import"
  | "back"
  | "close"
  | "home"
  | "menu"
  | "closeMenu"
  | "fullscreen"
  | "exitFullscreen"
  | "language"
  | "newGameMenuItem"
  | "swapPlayers"
  | "addPlayerMenuItem"
  | "setScore"
  | "install"
  | "dismissInstall"
  | "update"
  | "updating"
  | "importError"
  | "genericImportError"
  | "removeHistoryEntry"
  | "editHistoryDelta"
  | "playerNameLabel"
  | "setPlayerColor"
  | "playerCardRegion"
  | "closeHistory"
  | "flipHistory"
  | "whoStarts"
  | "chwatziTagline"
  | "pickRandomly"
  | "selectedPlayer"
  | "continue"
  | "determineWhoStarts"
  | "modeRoulette"
  | "modeMultitouch"
  | "pickSingle"
  | "pickOrder"
  | "multitouchInstructions"
  | "multitouchSingleHint"
  | "multitouchOrderHint"
  | "multitouchWaiting"
  | "multitouchHold"
  | "playOrder"
  | "tryAgain"
  | "startNewGame"
  | "startChwatzi"
  | "or"
  | "errorTitle"
  | "errorMessage"
  | "errorUnknown"
  | "errorReload";

const translations: Record<Lang, Record<TranslationKey, string>> = {
  en: {
    appName: "KeepScore",
    newGame: "New game",
    gameName: "Game name",
    gameNamePlaceholder: "Friday night",
    optional: "Optional",
    startingScore: "Starting score",
    startingScoreHint: "Default 0",
    presets: "PRESETS",
    presetCustom: "Custom",
    players: "PLAYERS",
    whoIsPlaying: "Who's playing?",
    addPlayer: "+ Add player",
    startGame: "Start game",
    playerNumber: "Player",
    playerName: "name",
    removePlayer: "Remove player",
    colorForPlayer: "Color for player",
    setupTagline: "Set up your players, then let the score battle begin.",
    undo: "Undo",
    redo: "Redo",
    savedGames: "Saved games",
    history: "History",
    moves: "moves",
    noMoves: "No moves yet.",
    movesPlaceholder: "Score changes will appear here.",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    newDelta: "New score delta",
    customDelta: "Custom",
    addPoint: "Add one point to",
    removePoint: "Remove one point from",
    quickScoreChange: "Quick score change for",
    flipPlayer: "Flip player card",
    resume: "Resume",
    untitledGame: "Untitled game",
    noSavedGames: "No saved games yet.",
    viewSavedGames: "View saved games",
    export: "Export",
    import: "Import",
    back: "Back",
    close: "Close",
    home: "Home",
    menu: "Open menu",
    closeMenu: "Close",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    language: "Language",
    newGameMenuItem: "New game",
    install: "Install app",
    dismissInstall: "Dismiss install prompt",
    update: "Update app",
    updating: "Updating…",
    importError: "The selected file is not a valid KeepScore export.",
    genericImportError: "Unable to import this file.",
    swapPlayers: "Swap player positions",
    addPlayerMenuItem: "Add player",
    setScore: "Set score",
    removeHistoryEntry: "Remove this entry",
    editHistoryDelta: "New score delta",
    playerNameLabel: "name",
    setPlayerColor: "Set color",
    playerCardRegion: "Player card",
    closeHistory: "Close history",
    flipHistory: "Flip history",
    whoStarts: "Who's starting?",
    chwatziTagline: "Pick a player at random to start the game.",
    pickRandomly: "Pick randomly",
    selectedPlayer: "Starting player",
    continue: "Continue",
    determineWhoStarts: "Determine who starts",
    modeRoulette: "Roulette",
    modeMultitouch: "Fingers",
    pickSingle: "One player",
    pickOrder: "Full order",
    multitouchInstructions: "Everyone place a finger on the screen",
    multitouchSingleHint: "The app will randomly pick who starts.",
    multitouchOrderHint: "The app will randomly set the play order.",
    multitouchWaiting: "Waiting for more fingers...",
    multitouchHold: "Hold... selecting!",
    playOrder: "Play order",
    tryAgain: "Try again",
    startNewGame: "Start a new game",
    startChwatzi: "Pick a random starter",
    or: "or",
    errorTitle: "Something went wrong",
    errorMessage:
      "An unexpected error occurred. Your scores are saved — you can safely return home.",
    errorUnknown: "Unknown error",
    errorReload: "Reload",
  },
  fr: {
    appName: "KeepScore",
    newGame: "Nouvelle partie",
    gameName: "Nom de la partie",
    gameNamePlaceholder: "Vendredi soir",
    optional: "Facultatif",
    startingScore: "Score de depart",
    startingScoreHint: "Defaut : 0",
    presets: "PREREGLAGES",
    presetCustom: "Personnalise",
    players: "JOUEURS",
    whoIsPlaying: "Qui joue ?",
    addPlayer: "+ Ajouter un joueur",
    startGame: "Lancer la partie",
    playerNumber: "Joueur",
    playerName: "nom",
    removePlayer: "Retirer le joueur",
    colorForPlayer: "Couleur du joueur",
    setupTagline:
      "Configurez vos joueurs, puis que la bataille des scores commence.",
    undo: "Annuler",
    redo: "Retablir",
    savedGames: "Parties sauvegardees",
    history: "Historique",
    moves: "coups",
    noMoves: "Aucun mouvement pour le moment.",
    movesPlaceholder: "Les changements de score apparaitront ici.",
    edit: "Modifier",
    delete: "Supprimer",
    save: "Valider",
    cancel: "Annuler",
    newDelta: "Nouveau delta de score",
    customDelta: "Personnalise",
    addPoint: "Ajouter un point a",
    removePoint: "Retirer un point a",
    quickScoreChange: "Changement rapide pour",
    flipPlayer: "Retourner la carte du joueur",
    resume: "Reprendre",
    untitledGame: "Partie sans nom",
    noSavedGames: "Aucune partie sauvegardee.",
    viewSavedGames: "Voir les parties sauvegardees",
    export: "Exporter",
    import: "Importer",
    back: "Retour",
    close: "Fermer",
    home: "Accueil",
    menu: "Ouvrir le menu",
    closeMenu: "Fermer",
    fullscreen: "Plein ecran",
    exitFullscreen: "Quitter le plein ecran",
    language: "Langue",
    newGameMenuItem: "Nouvelle partie",
    install: "Installer l app",
    dismissInstall: "Masquer la suggestion d installation",
    update: "Mettre a jour",
    updating: "Mise a jour…",
    importError: "Le fichier selectionne n est pas un export KeepScore valide.",
    genericImportError: "Impossible d importer ce fichier.",
    swapPlayers: "Echanger la position des joueurs",
    addPlayerMenuItem: "Ajouter un joueur",
    setScore: "Definir le score",
    removeHistoryEntry: "Supprimer cette entree",
    editHistoryDelta: "Nouveau delta de score",
    playerNameLabel: "nom",
    setPlayerColor: "Definir la couleur",
    playerCardRegion: "Carte du joueur",
    closeHistory: "Fermer l historique",
    flipHistory: "Retourner l historique",
    whoStarts: "Qui commence ?",
    chwatziTagline: "Tirez au sort pour designer le joueur qui commence.",
    pickRandomly: "Tirer au sort",
    selectedPlayer: "Joueur selectionne",
    continue: "Continuer",
    determineWhoStarts: "Determiner qui commence",
    modeRoulette: "Roulette",
    modeMultitouch: "Doigts",
    pickSingle: "Un joueur",
    pickOrder: "Ordre complet",
    multitouchInstructions: "Chacun pose un doigt sur l ecran",
    multitouchSingleHint: "L appli tirera au sort qui commence.",
    multitouchOrderHint: "L appli definira l ordre de jeu au hasard.",
    multitouchWaiting: "En attente de plus de doigts...",
    multitouchHold: "Maintenez... selection !",
    playOrder: "Ordre de jeu",
    tryAgain: "Reessayer",
    startNewGame: "Demarrer une nouvelle partie",
    startChwatzi: "Lancer Chwatzi",
    or: "ou",
    errorTitle: "Une erreur est survenue",
    errorMessage:
      "Une erreur inattendue s est produite. Vos scores sont sauvegardes — vous pouvez revenir a l accueil sans risque.",
    errorUnknown: "Erreur inconnue",
    errorReload: "Recharger",
  },
};

const STORAGE_KEY = "keepscore-lang";

export function getInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "fr" || stored === "en") return stored;
  return navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

type I18n = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18n>({
  lang: "en",
  setLang: () => {},
  t: (key) => translations.en[key],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);
  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang: (next) => {
        setLangState(next);
        localStorage.setItem(STORAGE_KEY, next);
      },
      t: (key) => translations[lang][key] ?? translations.en[key],
    }),
    [lang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  return useContext(I18nContext);
}

export function useDocumentLang(): void {
  const { lang } = useI18n();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
}
