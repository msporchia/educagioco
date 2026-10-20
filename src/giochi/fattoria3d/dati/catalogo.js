/* Cosa si può avere: i pezzi che il bambino costruisce dove vuole nel terreno suo, e gli edifici unici che hanno un posto
   fisso. Dato puro: nessun disegno qui (i modelli stanno in scena3d/modelli.js). `liv` è il livello a cui si può comprare
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
  passerella:      { nome: 'Passerella',      emoji: '🪵', w: 1, d: 3, prezzo: 8,  rincaro: 0, categoria: 'passaggi', liv: 3, calpestabile: true, alzato: 0.18 },   // calpestabili: non fermano il passo, contano come strada (regole.md)
  ponte:           { nome: 'Ponte',           emoji: '🌉', w: 3, d: 1, prezzo: 14, rincaro: 0, categoria: 'passaggi', liv: 5, calpestabile: true, alzato: [0.25, 0.36, 0.25] },   // la gobba: una quota per cella lungo il lato lungo
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

// Unici: uno per tipo, nel posto che dice `slot` (angolo in alto a sinistra, davanti verso +z). Si vedono come fantasmi
// finché non si comprano. Pastificio (id `pasticceria`, come nei salvataggi) e mongolfiera stanno dentro il quadrato di partenza; gli altri in lotti accanto, da
// comprare prima (motivo `lotto-non-tuo`). Sono tutti produttivi: ogni edificio è una macchina (dati/ricette.js) tranne la mongolfiera.
export const EDIFICI = {
  pasticceria: { nome: 'Pastificio', emoji: '🍝', w: 4, d: 3, prezzo: 80,  slot: { i: -6, j: -4 }, categoria: 'edifici', liv: 6 },
  mongolfiera: { nome: 'Mongolfiera', emoji: '🎈', w: 3, d: 3, prezzo: 100, slot: { i: 2,  j: -4 }, categoria: 'edifici', liv: 10 },
  mulino:      { nome: 'Mulino',      emoji: '🌬️', w: 3, d: 3, prezzo: 60,  slot: { i: -2, j: -7 }, categoria: 'edifici', liv: 3 },
  panificio:   { nome: 'Panificio',   emoji: '🥖', w: 3, d: 3, prezzo: 90,  slot: { i: -5, j: -7 }, categoria: 'edifici', liv: 7 },
  conserviera: { nome: 'Cucina',      emoji: '🍳', w: 3, d: 3, prezzo: 110, slot: { i: 2,  j: -7 }, categoria: 'edifici', liv: 12 },
  gelateria:   { nome: 'Gelateria',   emoji: '🍦', w: 3, d: 3, prezzo: 140, slot: { i: -9, j: 0 }, categoria: 'edifici',  liv: 14 },
  caseificio:  { nome: 'Caseificio',  emoji: '🧀', w: 3, d: 3, prezzo: 120, slot: { i: 6,  j: -3 }, categoria: 'edifici', liv: 11 },
  telaio:        { nome: 'Telaio',        emoji: '🧵', w: 3, d: 3, prezzo: 70,  slot: { i: -9, j: -4 }, categoria: 'edifici', liv: 8 },
  zuccherificio: { nome: 'Zuccherificio', emoji: '🧂', w: 3, d: 3, prezzo: 130, slot: { i: 6,  j: 4 },  categoria: 'edifici', liv: 13 },
  sartoria:      { nome: 'Sartoria',      emoji: '🧥', w: 3, d: 3, prezzo: 150, slot: { i: 6,  j: 0 },  categoria: 'edifici', liv: 15 },
  tintoria:      { nome: 'Tintoria',      emoji: '🧴', w: 3, d: 3, prezzo: 160, slot: { i: -9, j: 4 },  categoria: 'edifici', liv: 16 },
}
export const TIPI_DI_EDIFICIO = Object.keys(EDIFICI)

export const eEdificio = tipo => !!EDIFICI[tipo]
export const misureDi = tipo => PEZZI[tipo] || EDIFICI[tipo] || null

export function guastiDelCatalogo() {
  const g = []
  for (const [tipo, d] of [...Object.entries(PEZZI), ...Object.entries(EDIFICI)]) {
    if (!d.nome || !d.emoji) g.push(`${tipo}: manca nome o emoji`)
    if (!(d.w >= 1 && d.d >= 1)) g.push(`${tipo}: misure impossibili`)
    if (!(d.prezzo > 0)) g.push(`${tipo}: prezzo non positivo`)
    if (!(Number.isInteger(d.liv) && d.liv >= 1)) g.push(`${tipo}: manca il livello`)
    if (!CATEGORIE[d.categoria]) g.push(`${tipo}: categoria sconosciuta (${d.categoria})`)
    if (d.calpestabile) {
      const q = [].concat(d.alzato), lungo = Math.max(d.w, d.d)
      if (q.length !== (Array.isArray(d.alzato) ? lungo : 1) || !q.every(x => x > 0 && x < 0.5)) g.push(`${tipo}: calpestabile senza una quota sensata (alzato)`)
    }
    if (d.calpestabile && (d.produttivo || d.slot)) g.push(`${tipo}: un pezzo calpestabile è solo decorazione`)
  }
  for (const [c, v] of Object.entries(CATEGORIE)) if (!v.strumenti && ![...Object.values(PEZZI), ...Object.values(EDIFICI)].some(d => d.categoria === c)) g.push(`${c}: categoria senza carte`)
  for (const t of TIPI_DI_PEZZO) if (EDIFICI[t]) g.push(`${t}: sia pezzo sia edificio`)
  for (const [tipo, e] of Object.entries(EDIFICI)) {
    if (!e.slot || !Number.isInteger(e.slot.i) || !Number.isInteger(e.slot.j)) g.push(`${tipo}: manca il posto`)
  }
  // i posti non si sovrappongono
  const t = Object.entries(EDIFICI)
  for (let a = 0; a < t.length; a++) for (let b = a + 1; b < t.length; b++) {
    const [ka, x] = t[a], [kb, y] = t[b]
    if (x.slot && y.slot && x.slot.i < y.slot.i + y.w && y.slot.i < x.slot.i + x.w && x.slot.j < y.slot.j + y.d && y.slot.j < x.slot.j + x.d)
      g.push(`${ka} e ${kb}: i posti si sovrappongono`)
  }
  return g
}
