/* Il ponte con la fattoria di sempre: la 3D non ha numeri suoi dove la 2D ne ha uno. Qui, in un punto solo, si legge dai dati 2D
   (src/giochi/fattoria/dati/) tutto quello che la 3D riusa tale e quale: i prezzi, il livello a cui arriva ogni cosa, i tempi in
   minuti, il costo di un gesto, gli scomparti dei silos. Chi scrive un pezzo, una coltura o una ricetta 3D dice solo CHI è nella 2D
   (le tabelle `VOCE`, `COLTURA`) e prende il resto da qui. Decisione dell'utente del 22/10/2026 (docs/fattoria3d/parita/decisioni.md,
   «Regola generale»). Foglia: importa solo dati 2D, mai la 3D. Vedi docs/fattoria3d/livelli.md. */
import { PER_ID as VOCI_2D, prezzoDellaVoce, CATALOGO as CATALOGO_2D, CATEGORIE as CATEGORIE_2D } from '../../fattoria/dati/catalogo.js'
import { PER_COLTURA as COLTURE_2D, PER_RICETTA as RICETTE_2D, PRODOTTI as PRODOTTI_2D, SCOMPARTO_BASE, SCOMPARTO_PIU, costoIngrandimento, MINUTO } from '../../fattoria/dati/coltivazioni.js'
import { livelloDellaVoce, livelloDellaRicetta as livelloRicetta2D, ULTIMO as ULTIMO_2D, sogliaDi as sogliaDi2D, SOGLIA_A, SOGLIA_B, ALLUNGA, zonaDi, PRIMO_DECORO, DECORI_PER_LIVELLO } from '../../fattoria/dati/livelli.js'
import { ANIMALI as ANIMALI_2D } from '../../fattoria/dati/animali.js'
import { RIPOSO_MIN } from '../../fattoria/dati/mercato.js'
import { CIELO_VUOTO_MIN } from '../../fattoria/dati/mongolfiera.js'
import { PIAZZOLE_INIZIALI, PREZZO_PIAZZOLA, RINCARO, CELLE } from '../../fattoria/dati/mondo.js'

export { CIELO_VUOTO_MIN, MINUTO, SCOMPARTO_BASE, SCOMPARTO_PIU, costoIngrandimento, ULTIMO_2D, sogliaDi2D, SOGLIA_A, SOGLIA_B, ALLUNGA, ANIMALI_2D, RIPOSO_MIN, PIAZZOLE_INIZIALI, PREZZO_PIAZZOLA, RINCARO, CELLE, PRODOTTI_2D }

/** Chi è nella 2D: l'id 3D di un pezzo o di un edificio → l'id della voce del catalogo 2D. Quello che manca non ha un equivalente (è solo 3D). */
export const VOCE = {
  campo: 'orto', recinto: 'ovile', pollaio: 'pollaio', stalla: 'stalla', bancarella: 'mercato', trattore: 'carretto_mercato',
  aiuola: 'boccio', panchina: 'panchina', fontana: 'fontana', pozzo: 'pozzo', spaventapasseri: 'spaventapasseri', tavolo: 'tavolo',
  stagno: 'stagno', laghetto: 'laghetto', ponte: 'ponte',
  zucca_intagliata: 'zucca_intagliata', zucche_mucchio: 'zucche_mucchio',
  pasticceria: 'pastificio', conserviera: 'cucina', mongolfiera: 'mongolfiera', fienile: 'fienile', mulino: 'mulino', panificio: 'panificio',
  caseificio: 'caseificio', gelateria: 'gelateria', telaio: 'telaio', zuccherificio: 'zuccherificio', sartoria: 'sartoria', tintoria: 'tintoria',
  friggitoria: 'friggitoria', sushi_bar: 'sushi_bar', pentolone: 'pentolone',
  anatre: 'stagno_anatre', porcile: 'porcile', capre: 'recinto_capre',
  conigliera: 'conigliera', alpaca: 'recinto_alpaca', asini: 'recinto_asini', arnie: 'arnie',      // giro G5 (dati/cortile2.js); la peschiera non c'è: la pesca ne prende il posto (LIVELLO_PESCA)
  bottega_pasticceria: 'pasticceria', bottega_osteria: 'osteria', bottega_mensa: 'mensa', bottega_merceria: 'merceria',      // le botteghe del paese (giro G7)
}

/** Le decorazioni portate in 3D (giro G8): le famiglie della 2D che hanno un disegno 3D, e i loro id. Lo stesso id che in 2D (gli id dei contenuti non
    si rinominano); le uniche eccezioni sono id già presi in 3D: il «Recinto» di legno (`recinto` è quello delle pecore: qui `recinto_legno`) e pane, torta, marmellata e latte (sono merci e ricette: qui col suffisso `_decoro`). Lo
    spaventapasseri c'era già come pezzo (sta sotto «decori»). Prezzo e livello arrivano da `VOCE` come per ogni altro pezzo. docs/fattoria3d/decorazioni.md. */
export const FAMIGLIE_DECORI = ['verde', 'recinti', 'raccolto', 'case', 'bestiole']
const ID_3D_DEL_DECORO = { recinto: 'recinto_legno', pane: 'pane_decoro', torta: 'torta_decoro', marmellata: 'marmellata_decoro', latte: 'latte_decoro' }
const GIA_PEZZO = new Set(['spaventapasseri'])
/** id 3D → id 2D, per ogni decorazione delle famiglie portate (compresi i cartelli delle colture e i lampioni). */
export const VOCE_DECORI = Object.fromEntries(CATEGORIE_2D.filter(c => FAMIGLIE_DECORI.includes(c.chiave))
  .flatMap(c => c.voci.filter(v => !GIA_PEZZO.has(v.id)).map(v => [ID_3D_DEL_DECORO[v.id] || v.id, v.id])))
/** Le famiglie della 2D: id 3D → famiglia (verde, recinti, …). */
export const FAMIGLIA_DEL_DECORO = Object.fromEntries(CATEGORIE_2D.filter(c => FAMIGLIE_DECORI.includes(c.chiave))
  .flatMap(c => c.voci.filter(v => !GIA_PEZZO.has(v.id)).map(v => [ID_3D_DEL_DECORO[v.id] || v.id, c.chiave])))
Object.assign(VOCE, VOCE_DECORI)

/** Le colture: id 3D (singolare) → id 2D. */
export const COLTURA = {
  grano: 'grano', carota: 'carote', mais: 'mais', pomodoro: 'pomodori', patata: 'patate', zucca: 'zucche', cavolfiore: 'cavolfiori',
  cipolla: 'cipolle', aglio: 'aglio', fragola: 'fragole', barbabietola: 'barbabietola', peperone: 'peperoni', melanzana: 'melanzane',
  lavanda: 'lavanda', riso: 'riso', erba: 'erba',
}

/** Il recinto 3D → la ricetta 2D che fa il suo prodotto (le bestie sono ricette nella 2D: uova, latte, lana…). */
export const RICETTA_DELLA_BESTIA = {
  pollaio: 'uova', stalla: 'latte', recinto: 'lana', anatre: 'uova_anatra', porcile: 'tartufi' /* la ricetta 2D: in 3D il suo prodotto è `pancetta` (dati/cortile.js) */, capre: 'latte_capra',
  conigliera: 'lana_angora', alpaca: 'lana_alpaca', asini: 'concime', arnie: 'miele',      // giro G5
}

/** La peschiera della 2D: il pesce arriva da lì. La pesca della 3D (molo, porticciolo) ne prende il posto, allo stesso livello. */
export const PESCHIERA_2D = VOCI_2D.peschiera
export const LIVELLO_PESCA = livelloDellaVoce(PESCHIERA_2D)

export const voce2d = tipo => VOCI_2D[VOCE[tipo]] || null
export const coltura2d = k => COLTURE_2D[COLTURA[k]] || null
export const ricetta2d = id => RICETTE_2D[id] || null
export const bestia2d = tipo => RICETTE_2D[RICETTA_DELLA_BESTIA[tipo]] || null

/** La fila delle decorazioni della 2D ordinata per prezzo: dice a che livello arriva una decorazione di quel prezzo. */
const FILA_PREZZI = CATALOGO_2D
  .filter(v => !v.liv && !v.stagione && !v.fiera && zonaDi(v.id) === 'bello')
  .map(v => v.prezzo).sort((a, b) => a - b)
/** Il livello a cui la 2D metterebbe una decorazione di questo prezzo (per le decorazioni solo 3D, come la passerella: stessa regola, «più cara, più tardi»). */
export function livelloPerPrezzo(prezzo) {
  const prima = FILA_PREZZI.filter(p => p < prezzo).length
  return PRIMO_DECORO + Math.floor(prima / DECORI_PER_LIVELLO)
}

/** Il prezzo base di un pezzo 3D (quello della voce 2D), o `ripiego` se non ha un equivalente. */
export const prezzoDa2D = (tipo, ripiego) => (voce2d(tipo) ? voce2d(tipo).prezzo : ripiego)
/** Il livello a cui arriva (quello della voce 2D), o `ripiego`. */
export const livelloDa2D = (tipo, ripiego) => (voce2d(tipo) ? livelloDellaVoce(voce2d(tipo)) : ripiego)
/** Di quanto rincara a ogni copia (frazione del prezzo base), 0 se non rincara. */
export const crescitaDa2D = tipo => (voce2d(tipo) && voce2d(tipo).cresce) || 0
/** Il prezzo della copia numero `quante` (le già avute, in mappa e nel magazzino): la formula della 2D. */
export const prezzoDellaCopia = (tipo, quante = 0) => prezzoDellaVoce(voce2d(tipo), quante)

/** Il livello di una ricetta, calcolato dalla 2D (la macchina, la ricetta e i suoi ingredienti: la 2D conta già tutto). */
export const livelloRicetta = id => (RICETTE_2D[id] ? livelloRicetta2D(RICETTE_2D[id]) : null)

/** I numeri di una ricetta come li ha la 2D (stesso id): `ms` i minuti in millisecondi, `liv` quando si fa per davvero, `costo` 🪙 per avviarla. */
export function numeriRicetta(id) {
  const r = RICETTE_2D[id]
  if (!r) throw new Error(`parita2d: la ricetta «${id}» non esiste nella 2D`)
  return { ms: msDaMinuti(r.minuti), liv: livelloRicetta2D(r), costo: r.costo || 0 }
}

/** Un tempo della 2D in millisecondi. */
export const msDaMinuti = minuti => Math.round(minuti * MINUTO)

/** Il silo (famiglia di scomparti) di una merce 3D: 'terra' (raccolti), 'stalla' (bestie e mangimi), 'bottega' (la dispensa), o null. */
export function siloDelProdotto2D(id2d) { const p = PRODOTTI_2D[id2d]; return p ? p.silo : null }

/** Gli scomparti: quanti pezzi di una merce tiene un silo ingrandito `n` volte (8, poi +2 a ogni ingrandimento, per tutte le merci insieme). */
export const postiPerMerce = n => SCOMPARTO_BASE + SCOMPARTO_PIU * Math.max(0, n | 0)

/** Il costo dell'ingrandimento numero `n + 1` (la 2D: `40 + 130·ln(1+n)`, a cinque). */
export const costoDelPassoDelSilo = n => costoIngrandimento(n)

/** I numeri «a livello» solo 3D (compagni, abiti, vicini, i posti del banco, i pezzi grandi della mongolfiera) erano scritti sulla scala vecchia, che finiva al 18:
    sulla scala della 2D (70 livelli) stanno nello stesso punto del percorso. Un livello 1 resta 1. */
export const ULTIMO_DELLA_SCALA_VECCHIA = 18
export const sullaScalaDellaDueD = l => (l | 0) <= 1 ? 1 : 1 + Math.round(((l | 0) - 1) * (ULTIMO_2D - 1) / (ULTIMO_DELLA_SCALA_VECCHIA - 1))
