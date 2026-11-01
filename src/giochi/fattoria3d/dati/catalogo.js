/* Cosa si può avere: i pezzi che il bambino costruisce dove vuole nel terreno suo, e gli edifici unici (una macchina per tipo, o la
   mongolfiera) che si mettono dove si vuole anche loro, uno solo per tipo. Dato puro: nessun disegno qui (i modelli stanno in scena3d/modelli.js).
   `prezzo`, `liv` (il livello a cui si può comprare) e il rincaro per copia (`cresce`, `rincaro`) sono quelli della fattoria di sempre: `da2d`
   li legge da dati/parita2d.js per ogni pezzo che là ha un equivalente (decisione dell'utente del 22/10/2026); i pochi pezzi solo 3D (bacheca,
   passerella, molo, porticciolo) dichiarano i loro numeri. dati/livelli.js legge `liv` da qui, mai un elenco a parte; `produttivo` dice che il
   suo prezzo si somma al salto di livello (le decorazioni no). Vedi docs/fattoria3d/regole.md e livelli.md. */
import { PEZZI_DEL_CORTILE, EDIFICIO_PENTOLONE } from './cortile.js'
import { PEZZI_DEL_CORTILE_2 } from './cortile2.js'
import { pezziDecori, SCHEDE_DECORI } from './decori.js'
import { EDIFICI_BOTTEGHE } from './botteghe.js'
import { prezzoDa2D, livelloDa2D, crescitaDa2D, livelloPerPrezzo, LIVELLO_PESCA } from './parita2d.js'

/** Prezzo, livello e rincaro di un pezzo, dalla 2D. `rincaro` è il passo per copia a prezzo pieno (13 per il campo da 22); il prezzo vero della copia n è `prezzoPezzo`. */
const da2d = (tipo, ripiego = {}) => {
  const prezzo = prezzoDa2D(tipo, ripiego.prezzo), cresce = crescitaDa2D(tipo)
  return { prezzo, rincaro: Math.round(prezzo * cresce), cresce, liv: livelloDa2D(tipo, ripiego.liv) }
}
/** Prezzo e livello di un edificio unico, dalla 2D (la 2D rincara le macchine a ogni copia, ma qui ce n'è una sola). */
const edificio2d = tipo => ({ prezzo: prezzoDa2D(tipo), liv: livelloDa2D(tipo) })
/** Una decorazione solo 3D: il suo prezzo, e il livello che la 2D le darebbe (la fila delle decorazioni è ordinata per prezzo). */
const decoroSolo3D = prezzo => ({ prezzo, rincaro: 0, cresce: 0, liv: livelloPerPrezzo(prezzo) })
/** Una festa solo 3D col livello scelto a mano (docs/fattoria3d/natale.md): le feste durano due mesi, quindi non seguono la fila dei prezzi dei decori, che metterebbe una ghirlanda da 14 monete al livello 50. */
const festaSolo3D = (prezzo, liv) => ({ prezzo, rincaro: 0, cresce: 0, liv })

export const PEZZI = {
  campo:           { nome: 'Campo',           emoji: '🌾', w: 2, d: 2, ...da2d('campo'), categoria: 'campi', produttivo: true },
  recinto:         { nome: 'Recinto',         emoji: '🐑', w: 3, d: 3, ...da2d('recinto'), categoria: 'animali', produttivo: true },
  pollaio:         { nome: 'Pollaio',         emoji: '🐔', w: 3, d: 2, ...da2d('pollaio'), categoria: 'animali', produttivo: true },
  stalla:          { nome: 'Stalla',          emoji: '🐄', w: 4, d: 3, ...da2d('stalla'), categoria: 'animali', produttivo: true },
  bancarella:      { nome: 'Bancarella',      emoji: '🍎', w: 2, d: 1, ...da2d('bancarella'), categoria: 'edifici' },   // apre il banco degli ordini, come la bacheca (motore: bancoAperto)
  bacheca:         { nome: 'Bacheca',         emoji: '📋', w: 2, d: 1, prezzo: 12, rincaro: 0, cresce: 0, categoria: 'edifici', liv: livelloDa2D('bancarella') },   // il pezzo del banco: i clienti appuntano qui gli ordini (ordini.md)
  aiuola:          { nome: 'Aiuola',          emoji: '🌷', w: 1, d: 1, ...da2d('aiuola'), categoria: 'decori' },
  panchina:        { nome: 'Panchina',        emoji: '🪑', w: 2, d: 1, ...da2d('panchina'), categoria: 'decori' },
  fontana:         { nome: 'Fontana',         emoji: '⛲', w: 2, d: 2, ...da2d('fontana'), categoria: 'decori' },
  pozzo:           { nome: 'Pozzo',           emoji: '🪣', w: 1, d: 1, ...da2d('pozzo'), categoria: 'decori' },
  spaventapasseri: { nome: 'Spaventapasseri', emoji: '🧑‍🌾', w: 1, d: 1, ...da2d('spaventapasseri'), categoria: 'decori' },
  passerella:      { nome: 'Passerella',      emoji: '🪵', w: 1, d: 3, ...decoroSolo3D(8), categoria: 'passaggi', calpestabile: true, suAcqua: true, alzato: 0.18 },   // calpestabili: non fermano il passo, contano come strada (regole.md)
  ponte:           { nome: 'Ponte',           emoji: '🌉', w: 3, d: 1, ...da2d('ponte'), categoria: 'passaggi', calpestabile: true, suAcqua: true, alzato: [0.25, 0.36, 0.25] },   // la gobba: una quota per cella lungo il lato lungo
  stagno:          { nome: 'Stagno',          emoji: '🦆', w: 3, d: 3, ...da2d('stagno'), categoria: 'decori', acqua: true },     // tutta acqua: non si cammina, solo un ponte ci sta sopra (docs/fattoria3d/laghi.md)
  laghetto:        { nome: 'Laghetto',        emoji: '🏞️', w: 5, d: 4, ...da2d('laghetto'), categoria: 'decori', acqua: true },
  molo:            { nome: 'Molo',            emoji: '🎣', w: 3, d: 1, prezzo: 12, rincaro: 0, cresce: 0, categoria: 'passaggi', liv: LIVELLO_PESCA, calpestabile: true, suAcqua: true, alzato: 0.14, molo: true },    // dalla riva sull'acqua: in punta si pesca (docs/fattoria3d/geografia-e-pesca.md)
  molo_v:          { nome: 'Molo girato',     emoji: '🪝', w: 1, d: 3, prezzo: 12, rincaro: 0, cresce: 0, categoria: 'passaggi', liv: LIVELLO_PESCA, calpestabile: true, suAcqua: true, alzato: 0.14, molo: true },    // lo stesso, per l'acqua che sta a nord o a sud
  porticciolo:     { nome: 'Porticciolo',     emoji: '⚓', w: 4, d: 3, prezzo: 90, rincaro: 0, cresce: 0, categoria: 'edifici', liv: LIVELLO_PESCA, suAcqua: true, riva: true, unico: true },       // capanna, pontili e barca: abilita la pesca in mare e rende di più (uno solo, sulla riva)
  tavolo:          { nome: 'Tavolo',          emoji: '🍽️', w: 3, d: 2, ...da2d('tavolo'), categoria: 'decori' },
  // le feste (docs/fattoria3d/stagioni.md): si offrono nel menu solo in stagione (`stagione` è una chiave di FINESTRE della fattoria di sempre); comprate restano
  zucca_intagliata: { nome: 'Zucca intagliata', emoji: '🎃', w: 1, d: 1, ...da2d('zucca_intagliata'), categoria: 'decori', stagione: 'halloween' },
  zucche_mucchio:  { nome: 'Due zucche',       emoji: '🎃', w: 2, d: 1, ...da2d('zucche_mucchio'), categoria: 'decori', stagione: 'halloween' },
  pupazzo_neve:    { nome: 'Pupazzo di neve',  emoji: '⛄', w: 1, d: 1, ...decoroSolo3D(8), categoria: 'feste', stagione: 'natale' },      // solo 3D: la 2D non l'ha
  // il Natale in più (docs/fattoria3d/natale.md): tre alberi grandi per i livelli alti, e le decorazioni di mappa; solo 3D, come il pupazzo
  albero_natale_alto:    { nome: 'Albero di Natale alto',    emoji: '🎄', w: 2, d: 2, ...festaSolo3D(45, 20), categoria: 'feste', stagione: 'natale' },
  albero_natale_grande:  { nome: 'Albero di Natale grande',  emoji: '🎄', w: 3, d: 3, ...festaSolo3D(90, 35), categoria: 'feste', stagione: 'natale' },
  albero_natale_gigante: { nome: 'Albero di Natale gigante', emoji: '🎄', w: 4, d: 4, ...festaSolo3D(180, 50), categoria: 'feste', stagione: 'natale' },
  bastoni_zucchero:      { nome: 'Bastoni di zucchero',      emoji: '🍭', w: 1, d: 1, ...festaSolo3D(6, 4), categoria: 'feste', stagione: 'natale' },
  bastoni_zucchero_fila: { nome: 'Fila di bastoni di zucchero', emoji: '🍭', w: 2, d: 1, ...festaSolo3D(12, 9), categoria: 'feste', stagione: 'natale' },
  pacchi_regalo:         { nome: 'Pacchi regalo',            emoji: '🎁', w: 1, d: 1, ...festaSolo3D(10, 7), categoria: 'feste', stagione: 'natale' },
  ghirlanda_natale:      { nome: 'Ghirlanda di Natale',      emoji: '🎀', w: 2, d: 1, ...festaSolo3D(14, 12), categoria: 'feste', stagione: 'natale' },
  renna_natale:          { nome: 'Renna',                    emoji: '🦌', w: 1, d: 1, ...festaSolo3D(18, 16), categoria: 'feste', stagione: 'natale' },
  slitta_natale:         { nome: 'Slitta con le renne',      emoji: '🛷', w: 1, d: 3, ...festaSolo3D(40, 28), categoria: 'feste', stagione: 'natale' },
  // i magazzini (docs/fattoria3d/magazzini.md): non si comprano dal menu, arrivano da soli al livello del silo e il secondo si costruisce dal loro
  // foglio, e si mettono dal menu (la carta c'è solo se ce n'è uno da mettere); `magazzino` è il silo di cui sono l'edificio. Il prezzo vero è quello dell'ingrandimento (dati/silos.js): questo serve solo ai controlli
  silo:            { nome: 'Silo del raccolto', emoji: '🌾', art: 'il', w: 2, d: 2, prezzo: 40, rincaro: 0, cresce: 0, liv: 1, categoria: 'edifici', magazzino: 'terra' },
  silo_bianco:     { nome: 'Silo della stalla', emoji: '🥛', art: 'il', w: 2, d: 2, prezzo: 40, rincaro: 0, cresce: 0, liv: 4, categoria: 'edifici', magazzino: 'stalla' },
  dispensa:        { nome: 'Dispensa',          emoji: '📦', art: 'la', w: 3, d: 2, prezzo: 40, rincaro: 0, cresce: 0, liv: 16, categoria: 'edifici', magazzino: 'bottega' },
  trattore:        { nome: 'Trattore',        emoji: '🚜', w: 2, d: 2, ...da2d('trattore'), categoria: 'edifici' },     // si tocca e porta ai vicini (docs/fattoria3d/vicini.md)
  ...pezziDecori(da2d),    // le decorazioni della 2D portate in 3D (giro G8): verde, recinti e cartelli, raccolto, case e lampioni, bestiole (dati/decori.js)
  ...PEZZI_DEL_CORTILE,    // stagno delle anatre, porcile, capre (giro G4): livelli e prezzi provvisori in dati/cortile.js
  ...PEZZI_DEL_CORTILE_2,  // conigliera, alpaca, asini, arnie (giro G5): livelli e prezzi della 2D (dati/cortile2.js)
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
  ...SCHEDE_DECORI,        // verde, recinti, raccolto, case, bestiole: schede nuove, una per famiglia della 2D (dati/decori.js)
  passaggi: { nome: 'Strade',   emoji: '🛣️', strumenti: true },
}

// Unici: uno per tipo, si costruiscono dal menu e si mettono dove si vuole nel terreno proprio (docs/fattoria3d/edifici-liberi.md). Niente
// `slot`: i posti di prima stanno in `POSTI_STORICI` di dati/mondo.js (servono solo a leggere un salvataggio vecchio). Pastificio (id
// `pasticceria`, come nei salvataggi). Sono tutti produttivi: ogni edificio è una macchina (dati/ricette.js) tranne la mongolfiera.
export const EDIFICI = {
  pasticceria: { nome: 'Pastificio', emoji: '🍝', art: 'il', w: 4, d: 3, ...edificio2d('pasticceria'), categoria: 'edifici' },
  mongolfiera: { nome: 'Mongolfiera', emoji: '🎈', art: 'la', w: 3, d: 3, ...edificio2d('mongolfiera'), categoria: 'edifici' },
  fienile:     { nome: 'Fienile',     emoji: '🌿', art: 'il', w: 3, d: 3, ...edificio2d('fienile'), categoria: 'edifici' },   // il mangime delle bestie (docs/fattoria3d/mangime-e-catena.md); il fienile di scena è stato tolto (D7): ce n'è uno solo, questo
  mulino:      { nome: 'Mulino',      emoji: '🌬️', art: 'il', w: 3, d: 3, ...edificio2d('mulino'), categoria: 'edifici' },
  panificio:   { nome: 'Panificio',   emoji: '🥖', art: 'il', w: 3, d: 3, ...edificio2d('panificio'), categoria: 'edifici' },
  conserviera: { nome: 'Cucina',      emoji: '🍳', art: 'la', w: 3, d: 3, ...edificio2d('conserviera'), categoria: 'edifici' },
  gelateria:   { nome: 'Gelateria',   emoji: '🍦', art: 'la', w: 3, d: 3, ...edificio2d('gelateria'), categoria: 'edifici' },
  caseificio:  { nome: 'Caseificio',  emoji: '🧀', art: 'il', w: 3, d: 3, ...edificio2d('caseificio'), categoria: 'edifici' },
  telaio:        { nome: 'Telaio',        emoji: '🧵', art: 'il', w: 3, d: 3, ...edificio2d('telaio'), categoria: 'edifici' },
  zuccherificio: { nome: 'Zuccherificio', emoji: '🧂', art: 'lo', w: 3, d: 3, ...edificio2d('zuccherificio'), categoria: 'edifici' },
  sartoria:      { nome: 'Sartoria',      emoji: '🧥', art: 'la', w: 3, d: 3, ...edificio2d('sartoria'), categoria: 'edifici' },
  tintoria:      { nome: 'Tintoria',      emoji: '🧴', art: 'la', w: 3, d: 3, ...edificio2d('tintoria'), categoria: 'edifici' },
  friggitoria:   { nome: 'Friggitoria',   emoji: '🍟', art: 'la', w: 3, d: 3, ...edificio2d('friggitoria'), categoria: 'edifici' },     // nata dopo i posti liberi: il suo posto storico è solo per i controlli (`nuovo` in dati/mondo.js)
  sushi_bar:     { nome: 'Sushi bar',     emoji: '🍣', art: 'il', w: 3, d: 3, ...edificio2d('sushi_bar'), categoria: 'edifici' },
  pentolone:     EDIFICIO_PENTOLONE,      // la 14ª macchina della 2D (giro G4): liv e prezzo provvisori in dati/cortile.js
  ...EDIFICI_BOTTEGHE,     // le quattro botteghe del paese (giro G7): non lavorano, chiedono; prezzo e livello della 2D (dati/botteghe.js)
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
  const nuovi = [...Object.values(EDIFICI), ...Object.values(PEZZI).filter(p => p.magazzino && p.liv > 1)].filter(e => e.liv === livello)      // anche un magazzino che arriva (il primo silo c'è da subito)
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
    if ((d.soloAcqua || d.anfibio) && !d.suAcqua) g.push(`${tipo}: «soloAcqua» e «anfibio» sono pezzi che stanno anche sull'acqua (suAcqua)`)
    if (d.molo && !(d.calpestabile && d.suAcqua)) g.push(`${tipo}: un molo si cammina e sta sull'acqua`)
    if (d.riva && !d.suAcqua) g.push(`${tipo}: «riva» vuol dire che sta anche sull'acqua`)
    if (d.calpestabile && d.produttivo) g.push(`${tipo}: un pezzo calpestabile è solo decorazione`)
  }
  for (const [c, v] of Object.entries(CATEGORIE)) if (!v.strumenti && ![...Object.values(PEZZI), ...Object.values(EDIFICI)].some(d => d.categoria === c)) g.push(`${c}: categoria senza carte`)
  for (const t of TIPI_DI_PEZZO) if (EDIFICI[t]) g.push(`${t}: sia pezzo sia edificio`)
  for (const [tipo, e] of Object.entries(EDIFICI)) if (e.slot) g.push(`${tipo}: i posti fissi non esistono più (dati/mondo.js POSTI_STORICI)`)
  return g
}
