/* Cosa si può avere: i pezzi che il bambino costruisce dove vuole nel terreno suo, e gli edifici unici (una macchina per tipo, o la
   mongolfiera) che si mettono dove si vuole anche loro, uno solo per tipo. Dato puro: nessun disegno qui (i modelli stanno in scena3d/modelli.js). `liv` è il livello a cui si può comprare
   (dati/livelli.js lo legge da qui, mai un elenco a parte); `produttivo` dice che il suo prezzo si somma al salto di
   livello (le decorazioni no). Vedi docs/fattoria3d/regole.md e livelli.md. */

// `rincaro`: ogni copia (anche nel magazzino) costa di più, come i campi della fattoria di sempre
export const PEZZI = {
  campo:           { nome: 'Campo',           emoji: '🌾', w: 2, d: 2, prezzo: 20, rincaro: 8, categoria: 'campi', liv: 1, produttivo: true },
  recinto:         { nome: 'Recinto',         emoji: '🐑', w: 3, d: 3, prezzo: 45, rincaro: 0, categoria: 'animali', liv: 4, produttivo: true },
  pollaio:         { nome: 'Pollaio',         emoji: '🐔', w: 3, d: 2, prezzo: 55, rincaro: 0, categoria: 'animali', liv: 5, produttivo: true },
  stalla:          { nome: 'Stalla',          emoji: '🐄', w: 4, d: 3, prezzo: 90, rincaro: 0, categoria: 'animali', liv: 9, produttivo: true },
  bancarella:      { nome: 'Bancarella',      emoji: '🍎', w: 2, d: 1, prezzo: 15, rincaro: 0, categoria: 'edifici', liv: 2 },   // apre il banco degli ordini, come la bacheca (motore: bancoAperto)
  bacheca:         { nome: 'Bacheca',         emoji: '📋', w: 2, d: 1, prezzo: 12, rincaro: 0, categoria: 'edifici', liv: 2 },   // il pezzo del banco: i clienti appuntano qui gli ordini (ordini.md)
  aiuola:          { nome: 'Aiuola',          emoji: '🌷', w: 1, d: 1, prezzo: 6,  rincaro: 0, categoria: 'decori', liv: 2 },
  panchina:        { nome: 'Panchina',        emoji: '🪑', w: 2, d: 1, prezzo: 10, rincaro: 0, categoria: 'decori', liv: 6 },
  fontana:         { nome: 'Fontana',         emoji: '⛲', w: 2, d: 2, prezzo: 30, rincaro: 0, categoria: 'decori', liv: 8 },
  pozzo:           { nome: 'Pozzo',           emoji: '🪣', w: 1, d: 1, prezzo: 18, rincaro: 0, categoria: 'decori', liv: 9 },
  spaventapasseri: { nome: 'Spaventapasseri', emoji: '🧑‍🌾', w: 1, d: 1, prezzo: 12, rincaro: 0, categoria: 'decori', liv: 13 },
  passerella:      { nome: 'Passerella',      emoji: '🪵', w: 1, d: 3, prezzo: 8,  rincaro: 0, categoria: 'passaggi', liv: 3, calpestabile: true, suAcqua: true, alzato: 0.18 },   // calpestabili: non fermano il passo, contano come strada (regole.md)
  ponte:           { nome: 'Ponte',           emoji: '🌉', w: 3, d: 1, prezzo: 14, rincaro: 0, categoria: 'passaggi', liv: 5, calpestabile: true, suAcqua: true, alzato: [0.25, 0.36, 0.25] },   // la gobba: una quota per cella lungo il lato lungo
  stagno:          { nome: 'Stagno',          emoji: '🦆', w: 3, d: 3, prezzo: 35, rincaro: 0, categoria: 'decori', liv: 5, acqua: true },     // tutta acqua: non si cammina, solo un ponte ci sta sopra (docs/fattoria3d/laghi.md)
  laghetto:        { nome: 'Laghetto',        emoji: '🏞️', w: 5, d: 4, prezzo: 110, rincaro: 0, categoria: 'decori', liv: 11, acqua: true },
  molo:            { nome: 'Molo',            emoji: '🎣', w: 3, d: 1, prezzo: 12, rincaro: 0, categoria: 'passaggi', liv: 4, calpestabile: true, suAcqua: true, alzato: 0.14, molo: true },    // dalla riva sull'acqua: in punta si pesca (docs/fattoria3d/geografia-e-pesca.md)
  molo_v:          { nome: 'Molo girato',     emoji: '🪝', w: 1, d: 3, prezzo: 12, rincaro: 0, categoria: 'passaggi', liv: 4, calpestabile: true, suAcqua: true, alzato: 0.14, molo: true },    // lo stesso, per l'acqua che sta a nord o a sud
  porticciolo:     { nome: 'Porticciolo',     emoji: '⚓', w: 4, d: 3, prezzo: 90, rincaro: 0, categoria: 'edifici', liv: 9, suAcqua: true, riva: true, unico: true },       // capanna, pontili e barca: abilita la pesca in mare e rende di più (uno solo, sulla riva)
  tavolo:          { nome: 'Tavolo',          emoji: '🍽️', w: 3, d: 2, prezzo: 18, rincaro: 0, categoria: 'decori', liv: 4 },
  trattore:        { nome: 'Trattore',        emoji: '🚜', w: 2, d: 2, prezzo: 40, rincaro: 0, categoria: 'edifici', liv: 7 },     // si tocca e porta ai vicini (docs/fattoria3d/vicini.md)
}
/** Di quanto si alza chi cammina sulla cella (a, b) del pezzo (0 se non è calpestabile). `alzato` è un numero, o una quota per cella
    lungo il lato lungo (la gobba di un ponte). */
export function quotaDelPezzo(d, a, b) {
  if (!d.calpestabile) return 0
  return Array.isArray(d.alzato) ? d.alzato[d.w >= d.d ? a : b] || 0 : d.alzato
}
export const TIPI_DI_PEZZO = Object.keys(PEZZI)

/** Le schede del menu «Costruisci qui», nell'ordine in cui si vedono (la `categoria` di ogni pezzo e di ogni edificio unico è una di queste).
    `strumenti`: la scheda delle strade ha anche la strada e la gomma, che non sono pezzi. Vedi docs/fattoria3d/scena.md. */
export const CATEGORIE = {
  campi:    { nome: 'Campi',    emoji: '🌾' },
  animali:  { nome: 'Animali',  emoji: '🐑' },
  edifici:  { nome: 'Edifici',  emoji: '🏠' },
  decori:   { nome: 'Decori',   emoji: '🌷' },
  passaggi: { nome: 'Strade',   emoji: '🛣️', strumenti: true },
}

// Unici: uno per tipo, si costruiscono dal menu e si mettono dove si vuole nel terreno proprio (docs/fattoria3d/edifici-liberi.md). Niente
// `slot`: i posti di prima stanno in `POSTI_STORICI` di dati/mondo.js (servono solo a leggere un salvataggio vecchio). Pastificio (id
// `pasticceria`, come nei salvataggi). Sono tutti produttivi: ogni edificio è una macchina (dati/ricette.js) tranne la mongolfiera.
export const EDIFICI = {
  pasticceria: { nome: 'Pastificio', emoji: '🍝', art: 'il', w: 4, d: 3, prezzo: 80,  categoria: 'edifici', liv: 6 },
  mongolfiera: { nome: 'Mongolfiera', emoji: '🎈', art: 'la', w: 3, d: 3, prezzo: 100, categoria: 'edifici', liv: 10 },
  fienile:     { nome: 'Fienile',     emoji: '🌿', art: 'il', w: 3, d: 3, prezzo: 40,  categoria: 'edifici', liv: 2 },   // il mangime delle bestie (docs/fattoria3d/mangime-e-catena.md); il fienile di scena (FISSI) resta com'è
  mulino:      { nome: 'Mulino',      emoji: '🌬️', art: 'il', w: 3, d: 3, prezzo: 60,  categoria: 'edifici', liv: 3 },
  panificio:   { nome: 'Panificio',   emoji: '🥖', art: 'il', w: 3, d: 3, prezzo: 90,  categoria: 'edifici', liv: 7 },
  conserviera: { nome: 'Cucina',      emoji: '🍳', art: 'la', w: 3, d: 3, prezzo: 110, categoria: 'edifici', liv: 12 },
  gelateria:   { nome: 'Gelateria',   emoji: '🍦', art: 'la', w: 3, d: 3, prezzo: 140, categoria: 'edifici',  liv: 14 },
  caseificio:  { nome: 'Caseificio',  emoji: '🧀', art: 'il', w: 3, d: 3, prezzo: 120, categoria: 'edifici', liv: 11 },
  telaio:        { nome: 'Telaio',        emoji: '🧵', art: 'il', w: 3, d: 3, prezzo: 70,  categoria: 'edifici', liv: 8 },
  zuccherificio: { nome: 'Zuccherificio', emoji: '🧂', art: 'lo', w: 3, d: 3, prezzo: 130, categoria: 'edifici', liv: 13 },
  sartoria:      { nome: 'Sartoria',      emoji: '🧥', art: 'la', w: 3, d: 3, prezzo: 150, categoria: 'edifici', liv: 15 },
  tintoria:      { nome: 'Tintoria',      emoji: '🧴', art: 'la', w: 3, d: 3, prezzo: 160,  categoria: 'edifici', liv: 16 },
  friggitoria:   { nome: 'Friggitoria',   emoji: '🍟', art: 'la', w: 3, d: 3, prezzo: 170,  categoria: 'edifici', liv: 17 },     // nata dopo i posti liberi: il suo posto storico è solo per i controlli (`nuovo` in dati/mondo.js)
  sushi_bar:     { nome: 'Sushi bar',     emoji: '🍣', art: 'il', w: 3, d: 3, prezzo: 180,  categoria: 'edifici', liv: 18 },
}
export const TIPI_DI_EDIFICIO = Object.keys(EDIFICI)

export const eEdificio = tipo => !!EDIFICI[tipo]
export const misureDi = tipo => PEZZI[tipo] || EDIFICI[tipo] || null

/** Gli edifici che il livello ha aperto e non sono ancora in mappa (`posseduti`: { tipo: true } quando c'è), nell'ordine di livello: sono i
    soli che accendono il «!» (docs/fattoria3d/edifici-liberi.md). Le decorazioni non ci sono mai: gli EDIFICI sono tutte macchine. */
export function edificiDaCostruire(livello, posseduti = {}) {
  return Object.entries(EDIFICI).filter(([t, e]) => e.liv <= livello && !posseduti[t]).sort((a, b) => a[1].liv - b[1].liv).map(([t]) => t)
}

/** Cosa dice l'avviso quando si sale di livello e si apre un edificio: «il Panificio! Costruiscilo» (vuoto se non se ne apre nessuno). */
export function avvisoEdificiNuovi(livello) {
  const nuovi = Object.values(EDIFICI).filter(e => e.liv === livello)
  if (!nuovi.length) return ''
  return nuovi.map(e => `${e.art} ${e.nome}`).join(' e ') + '! ' + (nuovi.length > 1 ? 'Costruiscili' : 'Costruiscilo')
}

export function guastiDelCatalogo() {
  const g = []
  for (const [tipo, d] of [...Object.entries(PEZZI), ...Object.entries(EDIFICI)]) {
    if (!d.nome || !d.emoji) g.push(`${tipo}: manca nome o emoji`)
    if (EDIFICI[tipo] && !['il', 'lo', 'la'].includes(d.art)) g.push(`${tipo}: manca l'articolo (art)`)
    if (!(d.w >= 1 && d.d >= 1)) g.push(`${tipo}: misure impossibili`)
    if (!(d.prezzo > 0)) g.push(`${tipo}: prezzo non positivo`)
    if (!(Number.isInteger(d.liv) && d.liv >= 1)) g.push(`${tipo}: manca il livello`)
    if (!CATEGORIE[d.categoria]) g.push(`${tipo}: categoria sconosciuta (${d.categoria})`)
    if (d.calpestabile) {
      const q = [].concat(d.alzato), lungo = Math.max(d.w, d.d)
      if (q.length !== (Array.isArray(d.alzato) ? lungo : 1) || !q.every(x => x > 0 && x < 0.5)) g.push(`${tipo}: calpestabile senza una quota sensata (alzato)`)
    }
    if (d.acqua && (d.calpestabile || d.suAcqua || d.produttivo)) g.push(`${tipo}: un pezzo d'acqua è solo decorazione e non ci si cammina`)
    if (d.molo && !(d.calpestabile && d.suAcqua)) g.push(`${tipo}: un molo si cammina e sta sull'acqua`)
    if (d.riva && !d.suAcqua) g.push(`${tipo}: «riva» vuol dire che sta anche sull'acqua`)
    if (d.calpestabile && d.produttivo) g.push(`${tipo}: un pezzo calpestabile è solo decorazione`)
  }
  for (const [c, v] of Object.entries(CATEGORIE)) if (!v.strumenti && ![...Object.values(PEZZI), ...Object.values(EDIFICI)].some(d => d.categoria === c)) g.push(`${c}: categoria senza carte`)
  for (const t of TIPI_DI_PEZZO) if (EDIFICI[t]) g.push(`${t}: sia pezzo sia edificio`)
  for (const [tipo, e] of Object.entries(EDIFICI)) if (e.slot) g.push(`${tipo}: i posti fissi non esistono più (dati/mondo.js POSTI_STORICI)`)
  return g
}
