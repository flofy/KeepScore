import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Lang = 'en' | 'fr'
export type TranslationKey =
  | 'appName' | 'newGame' | 'gameName' | 'gameNamePlaceholder' | 'optional' | 'startingScore' | 'startingScoreHint'
  | 'presets' | 'presetCustom'
  | 'players' | 'whoIsPlaying' | 'addPlayer' | 'startGame' | 'playerNumber' | 'playerName'
  | 'removePlayer' | 'colorForPlayer' | 'setupTagline'
  | 'undo' | 'redo' | 'savedGames' | 'history' | 'moves' | 'noMoves' | 'movesPlaceholder'
  | 'edit' | 'delete' | 'save' | 'cancel' | 'newDelta'
  | 'addPoint' | 'removePoint' | 'quickScoreChange' | 'flippedToggle'
  | 'resume' | 'untitledGame' | 'noSavedGames' | 'export' | 'import' | 'back'
  | 'menu' | 'closeMenu' | 'fullscreen' | 'exitFullscreen' | 'language' | 'newGameMenuItem'
  | 'swapPlayers'
  | 'install' | 'importError' | 'genericImportError'
  | 'removeHistoryEntry' | 'editHistoryDelta' | 'playerNameLabel' | 'setPlayerColor' | 'playerCardRegion'

const translations: Record<Lang, Record<TranslationKey, string>> = {
  en: {
    appName: 'KeepScore', newGame: 'New game', gameName: 'Game name', gameNamePlaceholder: 'Friday night', optional: 'Optional',
    startingScore: 'Starting score', startingScoreHint: 'Default 0',
    presets: 'PRESETS', presetCustom: 'Custom',
    players: 'PLAYERS', whoIsPlaying: "Who's playing?", addPlayer: '+ Add player', startGame: 'Start game',
    playerNumber: 'Player', playerName: 'name', removePlayer: 'Remove player', colorForPlayer: 'Color for player',
    setupTagline: 'Set up your players, then let the score battle begin.',
    undo: 'Undo', redo: 'Redo', savedGames: 'Saved games', history: 'History', moves: 'moves',
    noMoves: 'No moves yet.', movesPlaceholder: 'Score changes will appear here.',
    edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel', newDelta: 'New score delta',
    addPoint: 'Add one point to', removePoint: 'Remove one point from', quickScoreChange: 'Quick score change for',
    flippedToggle: 'Toggle flipped score for the top player',
    resume: 'Resume', untitledGame: 'Untitled game', noSavedGames: 'No saved games yet.',
    export: 'Export', import: 'Import', back: 'Back',
    menu: 'Open menu', closeMenu: '✕ Close', fullscreen: '⤢ Fullscreen', exitFullscreen: '⤢ Exit fullscreen',
    language: '🌐 Français', newGameMenuItem: '➕ New game',
    install: 'Install app', importError: 'The selected file is not a valid KeepScore export.', genericImportError: 'Unable to import this file.',
    swapPlayers: 'Swap player positions',
    removeHistoryEntry: 'Remove this entry', editHistoryDelta: 'New score delta', playerNameLabel: 'name',
    setPlayerColor: 'Set color', playerCardRegion: 'Player card',
  },
  fr: {
    appName: 'KeepScore', newGame: 'Nouvelle partie', gameName: 'Nom de la partie', gameNamePlaceholder: 'Vendredi soir', optional: 'Facultatif',
    startingScore: 'Score de départ', startingScoreHint: 'Défaut : 0',
    presets: 'PRÉRÉGLAGES', presetCustom: 'Personnalisé',
    players: 'JOUEURS', whoIsPlaying: 'Qui joue ?', addPlayer: '+ Ajouter un joueur', startGame: 'Lancer la partie',
    playerNumber: 'Joueur', playerName: 'nom', removePlayer: 'Retirer le joueur', colorForPlayer: 'Couleur du joueur',
    setupTagline: 'Configurez vos joueurs, puis que la bataille des scores commence.',
    undo: 'Annuler', redo: 'Rétablir', savedGames: 'Parties sauvegardées', history: 'Historique', moves: 'coups',
    noMoves: 'Aucun mouvement pour le moment.', movesPlaceholder: 'Les changements de score apparaîtront ici.',
    edit: 'Modifier', delete: 'Supprimer', save: 'Valider', cancel: 'Annuler', newDelta: 'Nouveau delta de score',
    addPoint: 'Ajouter un point à', removePoint: 'Retirer un point à', quickScoreChange: 'Changement rapide pour',
    flippedToggle: 'Pivoter le score du joueur du haut',
    resume: 'Reprendre', untitledGame: 'Partie sans nom', noSavedGames: 'Aucune partie sauvegardée.',
    export: 'Exporter', import: 'Importer', back: 'Retour',
    menu: 'Ouvrir le menu', closeMenu: '✕ Fermer', fullscreen: '⤢ Plein écran', exitFullscreen: '⤢ Quitter le plein écran',
    language: '🌐 English', newGameMenuItem: '➕ Nouvelle partie',
    install: "Installer l'app", importError: "Le fichier sélectionné n'est pas un export KeepScore valide.", genericImportError: "Impossible d'importer ce fichier.",
    swapPlayers: 'Échanger la position des joueurs',
    removeHistoryEntry: 'Supprimer cette entrée', editHistoryDelta: 'Nouveau delta de score', playerNameLabel: 'nom',
    setPlayerColor: 'Définir la couleur', playerCardRegion: 'Carte du joueur',
  },
}

const STORAGE_KEY = 'keepscore-lang'

export function getInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'fr' || stored === 'en') return stored
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

type I18n = { lang: Lang; setLang: (lang: Lang) => void; t: (key: TranslationKey) => string }

const I18nContext = createContext<I18n>({ lang: 'en', setLang: () => {}, t: (key) => translations.en[key] })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang)
  const value = useMemo<I18n>(() => ({
    lang,
    setLang: (next) => { setLangState(next); localStorage.setItem(STORAGE_KEY, next) },
    t: (key) => translations[lang][key] ?? translations.en[key],
  }), [lang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  return useContext(I18nContext)
}

export function useDocumentLang(): void {
  const { lang } = useI18n()
  useEffect(() => { document.documentElement.lang = lang }, [lang])
}
