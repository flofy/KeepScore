import { useState } from "react";
import { createGame } from "../domain/game/gameFactory";
import { PLAYER_COLORS, colorForIndex } from "../domain/game/colors";
import { GAME_PRESETS } from "../domain/game/presets";
import type { Game } from "../domain/game/types";
import { useI18n } from "./i18n";

type Props = {
  onCreate: (game: Game) => void;
  onBack?: () => void;
  onDetermineStartingPlayer?: (game: Game) => void;
  suggestedPlayerNames?: string[];
};

export function GameSetup({
  onCreate,
  onBack,
  onDetermineStartingPlayer,
  suggestedPlayerNames = [],
}: Props) {
  const { t } = useI18n();
  const [names, setNames] = useState(["", ""]);
  const [colors, setColors] = useState<string[]>(() =>
    [0, 1].map((index) => colorForIndex(index)),
  );
  const [gameName, setGameName] = useState("");
  const [startingScore, setStartingScore] = useState("0");
  const [presetId, setPresetId] = useState("default");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");

  function playerName(index: number) {
    return names[index].trim() || `${t("playerNumber")} ${index + 1}`;
  }

  function updateName(index: number, value: string) {
    setNames((current) => current.map((name, i) => (i === index ? value : name)));
  }
  function addPlayer() {
    setNames((current) => [...current, ""]);
    setColors((current) => [...current, colorForIndex(current.length)]);
  }
  function removePlayer(index: number) {
    if (names.length <= 1) return;
    setNames((current) => current.filter((_, i) => i !== index));
    setColors((current) => current.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  }
  function setColor(index: number, color: string) {
    setColors((current) => current.map((value, i) => (i === index ? color : value)));
  }
  function openEditor(index: number) {
    setEditingIndex(index);
    setDraftName(names[index]);
  }
  function saveEditor() {
    if (editingIndex === null) return;
    updateName(editingIndex, draftName);
    setEditingIndex(null);
  }
  function selectPreset(id: string) {
    const preset = GAME_PRESETS.find((candidate) => candidate.id === id);
    if (!preset) return;
    setPresetId(id);
    setStartingScore(String(preset.startingScore));
    if (preset.id !== "default" && !gameName.trim()) setGameName(preset.name);
  }
  function createConfiguredGame(): Game {
    const parsedStartingScore = Number(startingScore);
    const safeStartingScore = Number.isFinite(parsedStartingScore) ? Math.trunc(parsedStartingScore) : 0;
    const playerNames = names.map((name, index) => name.trim() || `${t("playerNumber")} ${index + 1}`);
    return createGame(
      playerNames,
      gameName.trim(),
      safeStartingScore,
      colors,
      undefined,
      presetId || undefined,
    );
  }
  function startGame() {
    onCreate(createConfiguredGame());
  }
  function determineStartingPlayer() {
    const game = createConfiguredGame();
    if (onDetermineStartingPlayer) onDetermineStartingPlayer(game);
    else onCreate(game);
  }

  return (
    <main className="setup">
      <div className="setup-card">
        {onBack && <button className="back-button" type="button" onClick={onBack} aria-label={t("back")}>←</button>}
        <header className="setup-header">
          <p className="eyebrow">KEEP SCORE</p>
          <h1>{t("newGame")}</h1>
          <p className="muted">{t("setupTagline")}</p>
        </header>
        <section className="setup-section">
          <label className="field-label" htmlFor="game-name">
            <span>{t("gameName")}</span><span className="optional">{t("optional")}</span>
          </label>
          <input id="game-name" className="setup-input" value={gameName} onChange={(event) => setGameName(event.target.value)} placeholder={t("gameNamePlaceholder")} />
        </section>
        <section className="setup-section">
          <label className="field-label" htmlFor="starting-score">
            <span>{t("startingScore")}</span><span className="optional">{t("startingScoreHint")}</span>
          </label>
          <input id="starting-score" className="setup-input" type="number" inputMode="numeric" value={startingScore} onFocus={(event) => event.currentTarget.select()} onChange={(event) => { setStartingScore(event.target.value); setPresetId(""); }} placeholder="0" />
        </section>
        <section className="setup-section">
          <p className="field-kicker">{t("presets")}</p>
          <div className="preset-row" role="radiogroup" aria-label={t("presets")}>
            {GAME_PRESETS.map((preset) => (
              <button key={preset.id} type="button" role="radio" aria-checked={presetId === preset.id} className={presetId === preset.id ? "preset-chip selected" : "preset-chip"} onClick={() => selectPreset(preset.id)}>
                <span className="preset-emoji" aria-hidden="true">{preset.emoji}</span>
                <span className="preset-name">{preset.id === "custom" ? t("presetCustom") : preset.name}</span>
                <span className="preset-score">{preset.startingScore}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="setup-section">
          <div className="section-heading">
            <div><p className="field-kicker">{t("players")}</p><h2>{t("whoIsPlaying")}</h2></div>
            <span className="player-count">{names.length}</span>
          </div>
          <div className="player-list">
            {names.map((name, index) => (
              <div className="player-editor player-editor-summary" key={index}>
                <span className="player-number" style={{ borderBottom: `3px solid ${colors[index]}` }}>{index + 1}</span>
                <div className="player-summary">
                  <span className="player-summary-name">{playerName(index)}</span>
                  <span className="player-summary-color"><span style={{ background: colors[index] }} />{t("playerNumber")} {index + 1}</span>
                </div>
                <button className="player-edit-button" type="button" onClick={() => openEditor(index)} aria-label={t("editPlayer") + " " + (index + 1)}>
                  <span aria-hidden="true">✎</span>{t("edit")}
                </button>
                <button className="icon-button" type="button" onClick={() => removePlayer(index)} disabled={names.length <= 1} aria-label={t("removePlayer") + " " + (index + 1)}>×</button>
              </div>
            ))}
          </div>
          <datalist id="saved-player-name-suggestions">
            {suggestedPlayerNames.map((name) => <option key={name} value={name} />)}
          </datalist>
          {suggestedPlayerNames.length > 0 && <p className="player-suggestions-hint">{t("savedPlayerSuggestions")}</p>}
          <button className="add-player-button" type="button" onClick={addPlayer}>{t("addPlayer")}</button>
        </section>
        <button className="primary-button" type="button" onClick={startGame}>{t("startGame")} <span>→</span></button>
        {onDetermineStartingPlayer && names.length > 1 && <button className="secondary-button determine-starter-button" type="button" onClick={determineStartingPlayer} style={{ marginTop: 8 }}>🎲 {t("determineWhoStarts")}</button>}
      </div>
      {editingIndex !== null && (
        <div className="player-edit-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingIndex(null); }}>
          <section className="player-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="player-edit-title">
            <header className="player-edit-dialog-header">
              <div><p className="field-kicker">{t("playerNumber")} {editingIndex + 1}</p><h2 id="player-edit-title">{t("editPlayer")}</h2></div>
              <button className="icon-button" type="button" onClick={() => setEditingIndex(null)} aria-label={t("close")}>✕</button>
            </header>
            <label className="field-label" htmlFor="edit-player-name">{t("playerName")}</label>
            <input id="edit-player-name" className="setup-input" autoFocus list="saved-player-name-suggestions" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder={`${t("playerNumber")} ${editingIndex + 1}`} />
            {suggestedPlayerNames.length > 0 && (
              <div className="player-name-suggestions">
                <p className="field-kicker">{t("savedPlayerSuggestions")}</p>
                <div>{suggestedPlayerNames.map((name) => <button type="button" key={name} onClick={() => setDraftName(name)}>{name}</button>)}</div>
              </div>
            )}
            <p className="field-label player-color-label">{t("colorForPlayer")}</p>
            <div className="color-row player-edit-colors" role="radiogroup" aria-label={t("colorForPlayer")}>
              {PLAYER_COLORS.map((color) => <button key={color} type="button" role="radio" aria-checked={colors[editingIndex] === color} className={colors[editingIndex] === color ? "color-dot selected" : "color-dot"} style={{ background: color }} onClick={() => setColor(editingIndex, color)} aria-label={t("setPlayerColor") + " " + color} />)}
            </div>
            <footer className="player-edit-actions">
              <button className="secondary-button" type="button" onClick={() => setEditingIndex(null)}>{t("cancel")}</button>
              <button className="primary-button" type="button" onClick={saveEditor}>{t("save")}</button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
