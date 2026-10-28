// I numeri del sotterraneo in 3D: telecamera, luce, misure dei pezzi. Il perché di ognuno sta in
// docs/sotterraneo/grafica-3d.md (i valori vengono dal prototipo approvato, poc/sotterraneo-luce.md). Dato puro.

// la telecamera: non si dà la distanza ma quanto si vuole vedere (almeno `celle` in largo e in profondo attorno
// all'eroe); la distanza viene dalla forma dello schermo. Provati 55°/~6 celle e 43°/~8 celle: troppo addosso
export const CAMERA = {
  inclinazione: 52,      // gradi sotto l'orizzonte
  inclinazioneScontro: 36,   // nello scontro la telecamera si abbassa: non si va in giro, si guarda un combattimento (più di lato, i modelli 3D si vedono in figura)
  fov: 34,               // apertura verticale
  celle: 15,             // quante celle si vedono almeno, in largo e in profondo
  celleScontro: 9.5,     // nello scontro la telecamera si avvicina
  guarda: 0.35,          // il punto guardato: poco sopra il pavimento
  zoomMin: 0.7, zoomMax: 1.4,   // il pizzico e la rotella
  // la distanza si arrotonda perché un pixel dello sprite stia su un numero intero di pixel dello schermo (nitido, uguale per
  // tutti); `pixelMassimo`: mai più di tanti pixel dello schermo per pixel dello sprite (più vicino sono macchie)
  pixelMassimo: 5,
}

// la luce: senza questi minimi il primo giro era troppo tetro
export const LUCE = {
  esposizione: 1.4,
  ambiente: 2.6,         // l'emisferica, solo dentro quello che si vede (la maschera spegne il resto)
  minimoFigure: 0.32,    // le figure non scendono mai sotto questa frazione del loro colore
  rim: 0.55,             // il contorno caldo che stacca le figure dal fondo
  // nello scontro, da vicino, la normal map finta e il contorno sporcano i colori e ammorbidiscono i bordi: si spengono quasi
  nitidoScontro: { rim: 0.12, rilievo: 0.25, minimo: 0.55 },
  alone: 9, cono: 40,    // la luce dell'eroe: l'alone corto senza ombre e il cono che le fa
  // con la torcia accesa (in proporzione agli sgoccioli): quanto crescono alone e cono, quanto si allungano (celle) e si aprono
  // (radianti), la luce che rimbalza dal pavimento e il chiarore caldo per terra (docs/sotterraneo/grafica-3d.md)
  torcia: { alone: 0.35, cono: 0.5, lungoAlone: 5, lungoCono: 9, apre: 0.3, rimbalzo: 2.5, chiarore: 0.07,
    semplice: { avanti: 1.2, forza: 2.5 } },   // la torcia semplice (fascia bassa): l'alone dei personaggi, quante celle avanti e quante volte più forte
  ombra: 0.75,           // le ombre non sono mai nere
  palco: 5,              // la luce calda dello scontro; senza (fascia bassa) l'emisferica cresce di tanto
  palcoAmbiente: 0.35,
}

export const ALTO_MURO = 1.25
export const PARAPETTO = 0.32       // un muro con il pavimento a nord sta fra la telecamera e la stanza: basso
// le figure stanno ritte, e la vista dall'alto (52°) le schiaccia di cos 52°: le si allunga di 1/cos, così il pixel dello sprite
// a schermo è quadrato (con 1,3 era alto 0,8 della larghezza: le righe venivano di altezze diverse)
export let ALLUNGA = 1 / Math.cos(52 * Math.PI / 180)
// la telecamera dello scontro si abbassa: gli sprite si allungano di 1/cos dell'inclinazione di adesso (un binding vivo, chi lo importa lo legge aggiornato)
export function impostaInclinazione(gradi) { ALLUNGA = 1 / Math.cos(gradi * Math.PI / 180) }
export const PIXEL_CELLA = 16       // i pixel di sprite in una cella (dati/mondo.js, T)

export const N_FUOCHI = 6           // le luci delle torce, dei bracieri, della fonte e del portale: una riserva fissa
export const MAX_LUCI = 8           // quelle che nebbia, polvere e acqua sommano a mano
export const FETTE = 5, POLVERE = 450, SCINTILLE = 1500
export const FIGURE_MAX = 700       // le figure dell'atlante in scena nello stesso fotogramma
export const ALONI_MAX = 96         // i chiarori per terra (rarità, missione, chiave, scala che sale)
// con la luce per vertice pavimento, muri e colonne si dividono perché la luce interpolata resti liscia: il pavimento in n×n quadrati
// per cella, ogni triangolo dei muri e delle colonne in quattro (docs/sotterraneo/appiattimento-3d.md, «Nel gioco»)
export const SUDDIVIDI = { pavimento: 3, muri: 4, colonne: 4 }

import { profilo } from '../../../store/qualita.js'

// il pixel ratio si adatta: parte da `max`, scende a passi se un fotogramma costa più di `lento` ms, risale piano sotto `svelto`
export const DPR = { max: 1.5, min: 0.6, lento: 26, svelto: 15 }   // `max` è quello della fascia alta: le altre lo abbassano (store/qualita.js)

// Il punto unico dove si spegne un pezzo (docs/sotterraneo/grafica-3d.md, «Quanto costa»): oggi tutto acceso, una qualità
// sola. Un domani un telefono che non regge si aggiusta qui, senza cercare i pezzi nei file
export const ACCESI = {
  ombre: true,       // l'ombra del cono (una passata sola)
  ombraMappa: 1024,  // il lato della sua mappa
  ombraOgni: 1,      // ogni quanti fotogrammi si ridisegna (2: a fotogrammi alterni)
  nebbia: true, polvere: true, scintille: true, fiamme: true,
  ottaveNebbia: 4,   // gli strati di rumore di ogni pixel di nebbia
  quanteScintille: 1,   // quante delle scintille chieste partono davvero (0,5: una su due)
  acqua: true,       // lo shader dell'acqua (fontana e pozze); spento resta un piano scuro
  post: true,        // il passaggio finale (vignetta, colore, grana, scossa); spento si disegna dritto sullo schermo
  botti: true,       // le botti di decoro
  arredo: true,      // l'arredo modellato del paesaggio (scena3d/arredo3d.js)
  // le luci puntiformi: ognuna costa a ogni pixel di ogni materiale anche spenta (three le conta tutte), quindi si tolgono dalla scena
  fuochi: N_FUOCHI,  // quante luci della riserva dei fuochi
  lampi: true,       // spento: lampo e magia sono una luce sola, e il rimbalzo della torcia non c'è
  palco: true,       // la luce calda dello scontro; spenta, la schiarita la fa l'emisferica
  mostri3d: 12,      // quanti mostri al più col modello 3D nello stesso fotogramma (i più vicini); gli altri restano sprite, 0 tutti
  effetti3d: true,   // gli effetti 3D delle abilità, degli attacchi e degli stati (effetti3d/); spenti restano scintille e luci
  // per le misure (docs/sotterraneo/limiti-3d.md): nessuna fascia li spegne
  aloni: true,       // gli aloni della rarità sulla roba 3D (roba3d/aloni.js: un Points per pezzo, in somma di luce)
  saldatura: true,   // le mesh ferme dei mostri e dell'eroe 3D saldate in una (salda3d.js); spenta, una chiamata per mesh
  pelle: true,       // dopo la saldatura, il resto in una SkinnedMesh per materiale (salda3d.js, pelle); spenta, come prima
  ritaglio: true,    // pavimento e pareti solo nei blocchi che la telecamera tocca (ritaglio.js); spento, tutto il piano a ogni fotogramma
  ombreMorbide: true,   // le macchie d'ombra sotto le figure del mondo di sopra (mondo/persone.js)
  chiarori: true,    // i chiarori per terra delle discese (rarità, missione, chiave, capi: segni.js, creaAloni)
  riscaldamento: true,   // gli shader del piano e del mondo chiesti prima che servano (indice.js scaldaPiano, mondo/indice.js); spento: al primo uso
  // spento: si fa come se KHR_parallel_shader_compile non ci fosse (il Redmi Note 7), per provare sul computer l'entrata a passi (indice.js)
  parallelo: true,
  // le semplificazioni della fascia bassa (docs/core/vecchio-telefono-elementi.md, «Le leve»): spente, la versione semplice
  rilievo: true,     // le normal map e le trame di ruvidezza di pavimento, pareti, colonne e terreno di sopra; spento: trame piatte
  nebbiaFitta: true, // le fette di nebbia della fascia; spenta: una fetta sola
  quantaPolvere: 1,  // quanta della polvere che fluttua nella luce (0,4: due granelli su cinque)
  // al contrario degli altri, acceso è la versione semplice (la bassa lo accende con `lucePerVertice:1`, `&spegni=lucePerVertice` lo toglie):
  // il piano somma le luci per vertice e non per pixel, la nebbia è un termine per vertice al posto della fetta (scena3d/luce-vertice.js)
  lucePerVertice: false,
  // come sopra, acceso è il semplice (la bassa: `terrenoSemplice:1`): pavimento e pareti senza trame, rilievo né rumore per pixel; il colore
  // medio della trama, la tinta per cella e le macchie messi una volta nei vertici (terreno.js). La scala del 27/10 dava al fondo +20 ms
  terrenoSemplice: false,
  // allo stesso modo (la bassa): colonne e arredo col colore medio delle trame (maschera.js), le armi in mano fuse in un pezzo (roba3d.js, `appiattisci`)
  arredoSemplice: false,
  armiSemplici: false,
  // e la torcia (la bassa: `torciaSemplice:1`): ai personaggi solo l'alone, spostato avanti e più forte; il cono resta al piano (luci.js)
  torciaSemplice: false,
  // gli elementi della scena (grafica/elementi3d.js): spento non si disegna, senza buttarlo né cambiare il gioco. Solo per misurare chi
  // pesa (`&spegni=pavimento`); anche arredo, fiamme, fuochi, palco, nebbia, effetti3d e chiarori qui sopra fanno da elemento. `resto`: quello
  // senza nome (l'emisferica, una cosa dimenticata), così la scena «tutto spento» è vuota davvero
  pavimento: true, pareteLontana: true, pareteVicina: true, colonne: true, torcia: true, lampo: true, particelle: true, figure: true, eroe: true, mostri: true, resto: true,
  terreno: true, mare: true, natura: true, case: true, cielo: true, sole: true, velo: true, vita: true, scia: true, persone: true,
}
// gli elementi delle discese e del mondo di sopra, nell'ordine della tabella (docs/core/vecchio-telefono-elementi.md)
export const ELEMENTI_DISCESE = ['pavimento', 'pareteLontana', 'pareteVicina', 'colonne', 'arredo', 'fiamme', 'torcia', 'fuochi', 'lampo', 'palco',
  'nebbia', 'particelle', 'effetti3d', 'chiarori', 'figure', 'eroe', 'mostri', 'resto']
export const ELEMENTI_SOPRA = ['terreno', 'mare', 'natura', 'case', 'cielo', 'sole', 'velo', 'vita', 'scia', 'persone', 'eroe', 'mostri', 'resto']
/** Se l'elemento `k` si disegna (`fuochi` è un numero: 0 è spento). */
export const elementoAcceso = k => ACCESI[k] !== false && ACCESI[k] !== 0
// gli elementi che sono anche leve della fascia: spenti alla nascita, il piano non li crea (piano.js, luci.js, indice.js)
export const LEVE_ELEMENTI = ['arredo', 'fiamme', 'fuochi', 'palco', 'nebbia', 'effetti3d', 'chiarori']

// La fascia grafica del telefono (store/qualita.js) decide quali pezzi di ACCESI restano: si riparte dai valori scritti sopra
// (il cheat `&spegni=` e una fascia precedente non si accumulano), poi si spegne quello della fascia e quello chiesto a mano.
// `riaccendi`: i pezzi che tornano come scritti sopra anche se la fascia li spegne (`&riaccendi=ombre`: la fascia di prima, per confronto)
const ORIGINALI = { ...ACCESI }
export function applicaFascia(spegniAMano = [], riaccendi = []) {
  Object.assign(ACCESI, ORIGINALI)
  // `fuochi:2` mette un numero, il nome solo spegne
  for (const v of [...profilo('sotterraneo').spegni, ...spegniAMano]) {
    const [k, n] = String(v).split(':')
    if (k in ACCESI) ACCESI[k] = n != null && n !== '' && !Number.isNaN(Number(n)) ? Number(n) : (typeof ORIGINALI[k] === 'number' ? 0 : false)
  }
  for (const v of riaccendi) { const k = String(v).split(':')[0]; if (k in ACCESI && !spegniAMano.some(s => String(s).split(':')[0] === k)) ACCESI[k] = ORIGINALI[k] }
}

// lo scontro: quanto agio vogliono i combattenti dai muri e dalle cose posate, e i posti dei mostri attorno al centro
export const AGIO = 1.2
// le figure ritte sono alte una cella e mezza: a meno di 1,2 celle in profondità una copre l'altra (con 0,85 i tre stavano in pila)
export const POSTI = [[1.0, 0], [1.9, -1.25], [2.0, 1.25], [3.0, 0], [2.9, -2.5], [3.0, 2.5], [4.0, -1.25]]
export const MARGINE_DITO = 44      // px: una cosa si prende anche toccandole vicino
