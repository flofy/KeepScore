import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./akropolis-recognition.css";

type TileKind = "habitations" | "marches" | "casernes" | "temples" | "jardins" | "place" | "unknown";
type Mark = { id: number; x: number; y: number; kind: TileKind };

const kinds: { value: TileKind; label: string; color: string }[] = [
  { value: "habitations", label: "Habitations", color: "#e85b43" },
  { value: "marches", label: "Marchés", color: "#7b62c8" },
  { value: "casernes", label: "Casernes", color: "#4c91df" },
  { value: "temples", label: "Temples", color: "#e4bd32" },
  { value: "jardins", label: "Jardins", color: "#54a85a" },
  { value: "place", label: "Place", color: "#f4f0df" },
  { value: "unknown", label: "À vérifier", color: "#777" },
];

export function AkropolisRecognitionScreen() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [selectedKind, setSelectedKind] = useState<TileKind>("unknown");
  const [contrast, setContrast] = useState(110);
  const [brightness, setBrightness] = useState(100);

  function loadImage(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const nextUrl = URL.createObjectURL(file);
    setImageUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return nextUrl;
    });
    setImageName(file.name);
    setMarks([]);
  }

  function addMark(event: React.MouseEvent<HTMLDivElement>) {
    if (!imageUrl) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setMarks((previous) => [...previous, { id: Date.now(), x, y, kind: selectedKind }]);
  }

  function updateMark(id: number, kind: TileKind) {
    setMarks((previous) => previous.map((mark) => mark.id === id ? { ...mark, kind } : mark));
  }

  function removeLastMark() {
    setMarks((previous) => previous.slice(0, -1));
  }

  return (
    <main className="akropolis-recognition">
      <header className="akropolis-recognition__header">
        <button type="button" className="akropolis-recognition__back" onClick={() => navigate(-1)} aria-label="Retour">←</button>
        <div>
          <p className="akropolis-recognition__eyebrow">KEEPSCORE · LABORATOIRE</p>
          <h1>Reconnaissance Akropolis</h1>
          <p>Importe une photo, puis annote les tuiles pour préparer la reconnaissance automatique.</p>
        </div>
      </header>

      <section className="akropolis-recognition__panel" aria-labelledby="photo-title">
        <div className="akropolis-recognition__section-heading">
          <div><span className="akropolis-recognition__step">01</span><h2 id="photo-title">Photo du plateau</h2></div>
          <span className="akropolis-recognition__badge">Prototype</span>
        </div>
        <input ref={inputRef} className="akropolis-recognition__file-input" type="file" accept="image/*" capture="environment" onChange={(event) => loadImage(event.currentTarget.files?.[0])} />
        <button className="akropolis-recognition__upload" type="button" onClick={() => inputRef.current?.click()}>
          <span aria-hidden="true">＋</span>{imageUrl ? "Choisir une autre photo" : "Prendre une photo ou importer une image"}
        </button>
        {!imageUrl ? (
          <div className="akropolis-recognition__empty">
            <div className="akropolis-recognition__hex-art" aria-hidden="true">⬡</div>
            <strong>Ton plateau, vu d’en haut</strong>
            <p>Pour de meilleurs résultats, cadre toute la ville et évite les ombres fortes.</p>
          </div>
        ) : (
          <>
            <div className="akropolis-recognition__image-tools">
              <span title={imageName}>{imageName}</span>
              <button type="button" onClick={() => { setImageUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return ""; }); setImageName(""); setMarks([]); }}>Retirer</button>
            </div>
            <div className="akropolis-recognition__image-stage" onClick={addMark} role="group" aria-label="Photo du plateau. Touchez une tuile pour ajouter une annotation.">
              <img src={imageUrl} alt="Photo importée du plateau Akropolis" style={{ filter: `contrast(${contrast}%) brightness(${brightness}%)` }} />
              {marks.map((mark, index) => {
                const kind = kinds.find((item) => item.value === mark.kind) ?? kinds[kinds.length - 1];
                return <button key={mark.id} className="akropolis-recognition__mark" style={{ left: `${mark.x}%`, top: `${mark.y}%`, backgroundColor: kind.color }} type="button" title={kind.label} aria-label={`Annotation ${index + 1} : ${kind.label}. Cliquer pour supprimer.`} onClick={(event) => { event.stopPropagation(); setMarks((previous) => previous.filter((item) => item.id !== mark.id)); }}><span>{index + 1}</span></button>;
              })}
            </div>
            <p className="akropolis-recognition__hint">Choisis un type de tuile puis touche la photo pour placer une annotation. Touche une annotation pour la supprimer.</p>
            <div className="akropolis-recognition__adjustments">
              <label>Contraste <output>{contrast}%</output><input type="range" min="70" max="160" value={contrast} onChange={(event) => setContrast(Number(event.target.value))} /></label>
              <label>Luminosité <output>{brightness}%</output><input type="range" min="70" max="140" value={brightness} onChange={(event) => setBrightness(Number(event.target.value))} /></label>
            </div>
          </>
        )}
      </section>

      <section className="akropolis-recognition__panel" aria-labelledby="tiles-title">
        <div className="akropolis-recognition__section-heading">
          <div><span className="akropolis-recognition__step">02</span><h2 id="tiles-title">Annotations de référence</h2></div>
          <span className="akropolis-recognition__count">{marks.length} tuile{marks.length > 1 ? "s" : ""}</span>
        </div>
        <p className="akropolis-recognition__hint">Cette première version constitue un jeu de référence pour tester la vision par ordinateur. Les tuiles ne sont pas encore détectées automatiquement.</p>
        <div className="akropolis-recognition__kind-picker" role="group" aria-label="Type de tuile à annoter">
          {kinds.map((kind) => <button key={kind.value} type="button" aria-pressed={selectedKind === kind.value} className={selectedKind === kind.value ? "is-selected" : ""} onClick={() => setSelectedKind(kind.value)}><span style={{ backgroundColor: kind.color }} />{kind.label}</button>)}
        </div>
        {marks.length > 0 && <div className="akropolis-recognition__mark-list">{marks.map((mark, index) => <label key={mark.id}><span>Tuile {index + 1}</span><select value={mark.kind} onChange={(event) => updateMark(mark.id, event.target.value as TileKind)}>{kinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></label>)}</div>}
        <div className="akropolis-recognition__footer">
          <button type="button" className="akropolis-recognition__secondary" onClick={removeLastMark} disabled={marks.length === 0}>Annuler la dernière</button>
          <button type="button" className="akropolis-recognition__secondary" onClick={() => { setMarks([]); setContrast(110); setBrightness(100); }} disabled={marks.length === 0 && contrast === 110 && brightness === 100}>Réinitialiser</button>
        </div>
      </section>
      <p className="akropolis-recognition__disclaimer">Aucune photo n’est envoyée à un serveur : l’image reste dans cette session du navigateur.</p>
    </main>
  );
}
