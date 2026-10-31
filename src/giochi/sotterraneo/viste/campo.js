// Lo scontro com'è per chi lo guarda (docs/sotterraneo/scontro.md, «La vista»): dal foglio della corsa i dati che
// la vista dello scontro disegna, e come stanno disposti i mostri in campo. Funzioni pure, nessuno stato: la corsa non sa niente
// di righe e di colonne, e la vista non calcola un numero.
import { MOSTRI } from '../dati/mostri.js'
import { ELEMENTI, STATI } from '../dati/elementi.js'
import { pezzoAndante } from '../dati/tessere.js'
import { fotogrammaDi, quantiFotogrammi } from '../dati/fotogrammi.js'
import { coloreDelGrado, etichettaDi } from '../dati/varianti.js'
import { NODI, RAMI } from '../dati/abilita.js'

// «2 turni»: una risposta è un turno (le righe dell'albero parlano così, dati/abilita.js)
export const turniDi = n => `${n} ${n === 1 ? 'turno' : 'turni'}`

// Cosa ha addosso un mostro (veleno, gelo, radici, stordimento, difesa spezzata): `t` sono i turni che restano, `dice` la riga
// intera (il `title` della pastiglia). Sul campo ogni stato è un glifo col suo numero; il testo lungo non entra in sei caselle
export function statiDel(m) {
  const st = m.stati || {}
  return [
    st.veleno && st.veleno.scambi > 0 ? { chiave: 'veleno', fuoco: !!st.veleno.fuoco, glifo: st.veleno.fuoco ? 'fiamma' : 'veleno', t: st.veleno.scambi, n: `${st.veleno.quanto} di danno · ${turniDi(st.veleno.scambi)}`, dice: `subisce ${st.veleno.quanto} di danno a ogni turno` } : null,
    st.debole > 0 ? { chiave: 'debole', gelo: !!st.gelo, da: st.gelo ? null : st.deboleDa || null, glifo: st.gelo ? 'fiocco' : st.deboleDa === 'radici' ? 'radici' : 'fiacco', t: st.debole, n: `fa metà danno · ${turniDi(st.debole)}`, dice: st.gelo ? 'gelato: i suoi colpi fanno la metà del danno' : 'i suoi colpi fanno la metà del danno' } : null,
    st.sanguina && st.sanguina.scambi > 0 ? { chiave: 'sanguina', glifo: 'sangue', t: st.sanguina.scambi, n: `${st.sanguina.quanto * st.sanguina.pile} di danno · ${turniDi(st.sanguina.scambi)}`, dice: `sanguina: ${st.sanguina.quanto * st.sanguina.pile} di danno a ogni turno` } : null,
    st.esposto && st.esposto.scambi > 0 ? { chiave: 'esposto', glifo: 'radici', t: st.esposto.scambi, n: `+${st.esposto.piu}% danno · ${turniDi(st.esposto.scambi)}`, dice: 'bloccato: subisce più danno' } : null,
    st.fermo > 0 ? { chiave: 'fermo', gelo: !!st.gelo, glifo: st.gelo ? 'fiocco' : 'stelle', t: st.fermo, n: `stordito · ${turniDi(st.fermo)}`, dice: st.gelo ? 'chiuso nel ghiaccio: non può attaccare' : 'stordito: non può attaccare' } : null,
    st.rotto && m.dif ? { chiave: 'rotto', glifo: 'scudo-rotto', t: 0, n: 'difesa spezzata', dice: 'senza difesa fino a fine scontro' } : null,
  ].filter(Boolean)
}

// Uno stato che il racconto posa sul mostro nel momento in cui l'abilità lo prende, prima che la vista torni alla verità (che ha
// già contato i turni dei mostri: un colpo che stordisce per uno ha già fatto saltare il turno). `m`: il mostro, per i turni che
// restano se ci sono ancora; `nodo`: l'abilità, per sapere se è fiamma o gelo
export function statoNuovo(chiave, m, nodo) {
  const vero = statiDel(m).find(x => x.chiave === chiave)
  if (vero) return vero
  const fuoco = chiave === 'veleno' && !!nodo && nodo.elemento === 'fuoco'
  const gelo = (chiave === 'debole' || chiave === 'fermo') && !!nodo && nodo.elemento === 'gelo'
  const da = chiave === 'debole' && !gelo && !!nodo && nodo.effetto === 'radici' ? 'radici' : null
  const glifo = { veleno: fuoco ? 'fiamma' : 'veleno', debole: gelo ? 'fiocco' : da ? 'radici' : 'fiacco', sanguina: 'sangue', esposto: 'radici',
                  fermo: gelo ? 'fiocco' : 'stelle', rotto: 'scudo-rotto' }[chiave]
  return { chiave, fuoco, gelo, da, glifo, t: 0, n: '', dice: '' }
}

// I segni di chi resiste, teme o è immune a quello che sta per arrivare (`foglio.colpiti[i]` con `elemento`, `effetto`,
// `rifiutati`, docs/sotterraneo/scontro-interfaccia.md): un piccolo segno sopra il mostro, prima di rispondere. `dice` va nel
// `title`, in parole di gioco
export function segniDel(colpito) {
  if (!colpito) return []
  const s = []
  const e = colpito.elemento && ELEMENTI[colpito.elemento]
  if (e && colpito.effetto === 'resiste') s.push({ tipo: 'resiste', glifo: e.glifo, tinta: e.tinta, dice: `resiste ${e.a}` })
  if (e && colpito.effetto === 'teme') s.push({ tipo: 'teme', glifo: e.glifo, tinta: e.tinta, dice: `teme ${e.il}` })
  for (const r of colpito.rifiutati || []) if (STATI[r]) s.push({ tipo: 'immune', glifo: STATI[r].glifo, tinta: '#c8c8d4', dice: STATI[r].non })
  return s
}

// Gli incanti preparati dal campo e ancora addosso (motore/preparati.js), come li vede la barra e la fila dei turni: l'icona del suo ramo
// e i passi che restano, che scendono camminando e, nello scontro, di PASSI_PER_TURNO a turno. `c`: la corsa
export function incantiAddosso(c) {
  return (c.preparati || []).map(p => {
    const nodo = NODI[p.id], ramo = (RAMI[nodo.classe] || []).find(r => r.chiave === nodo.ramo)
    return { id: p.id, nome: nodo.nome, glifo: nodo.glifo, tinta: ramo ? ramo.tinta : '#ffd23f', passi: Math.ceil(p.passi), dura: c.passiDi(nodo) }
  })
}

// Quello che protegge l'eroe da un incanto preparato dal campo (motore/preparati.js), nella forma delle pastiglie dello scontro: la
// stessa chiave dell'effetto (la vista li disegna uguali) e in fondo i passi che restano. Il debole di Rovi e del Grido parte con lo
// scontro e sta già sui mostri
function statiDeiPreparati(c) {
  return (c.preparati || []).map(p => {
    const nodo = NODI[p.id], passi = Math.ceil(p.passi)
    const chiave = nodo.intoccabile != null ? 'intoccabile' : nodo.specchio != null ? 'specchio' : nodo.scudo != null ? 'scudo' : nodo.parato != null ? 'parato' : nodo.linfa != null ? 'linfa' : null
    if (!chiave) return null
    const glifo = { intoccabile: 'montagna', specchio: 'specchio', scudo: 'sfera', parato: 'scudo', linfa: 'germoglio' }[chiave]
    const dice = { intoccabile: 'invulnerabile', specchio: 'il prossimo colpo torna al mostro', scudo: `barriera: para ${p.assorbe} danni`, parato: 'protetto dai danni',
                   linfa: `guarisci di ${Math.max(1, Math.round(c.vitaMax / 10))} a turno · ${turniDi(p.tick)}` }[chiave]
    return { chiave, glifo, dice: `${dice} · ${passi} passi`, passi, preparato: p.id }
  }).filter(Boolean)
}

// e cosa protegge l'eroe in questo scontro (scudo, parato…): le pastiglie col testo, una per effetto, prima quelle dello scontro e poi
// gli incanti preparati addosso (`c`: la corsa)
export function statiMiei(io, c = null) {
  const dello = [
    io.parato > 0 ? { chiave: 'parato', glifo: 'scudo', dice: `protetto dai danni · ${turniDi(io.parato)}` } : null,
    io.scudo > 0 ? { chiave: 'scudo', glifo: 'sfera', dice: `barriera: para ${io.scudo} danni` } : null,
    io.intoccabile > 0 ? { chiave: 'intoccabile', glifo: 'montagna', dice: `invulnerabile · ${turniDi(io.intoccabile)}` } : null,
    io.specchio ? { chiave: 'specchio', glifo: 'specchio', dice: 'il prossimo colpo torna al mostro' } : null,
    io.gelato > 0 ? { chiave: 'gelato', glifo: 'fiocco', dice: 'gelato dall\'incantesimo: il tuo prossimo colpo fa metà danno' } : null,
    io.linfa && io.linfa.scambi > 0 ? { chiave: 'linfa', glifo: 'germoglio', dice: `guarisci di ${io.linfa.quanto} · ${turniDi(io.linfa.scambi)}` } : null,
  ].filter(Boolean)
  const visti = new Set(dello.map(x => x.chiave))
  return [...dello, ...(c ? statiDeiPreparati(c) : []).filter(x => !visti.has(x.chiave))]
}

// Le celle di una griglia a sei colonne (ognuno ne prende due): oggi dicono quanti ne stanno «in fila» (fino a tre una fila, da quattro
// due: l'altezza del palco) e chi è il grosso (al centro, su due file). Dove stanno davvero le figure lo dice `piazza`, più sotto.
// `campo`: [{ grosso }] nell'ordine dei posti. Torna { file, grande, celle: [{ col, riga, file }] } (`celle` per posto)
export function disponi(campo) {
  const n = campo.length
  const g = campo.findIndex(x => x.grosso)
  if (g >= 0) {
    const lati = [[1, 2], [5, 2], [1, 1], [5, 1]]   // sinistra in basso, destra in basso, sinistra in alto, destra in alto
    let k = 0
    return { file: 2, grande: g, celle: campo.map((x, i) => (i === g ? { col: 3, riga: 1, file: 2 } : (([col, riga]) => ({ col, riga, file: 1 }))(lati[k++ % lati.length]))) }
  }
  const file = n <= 3 ? [n] : n === 4 ? [2, 2] : n === 5 ? [3, 2] : n === 6 ? [3, 3] : [4, 3]
  const celle = []
  file.forEach((k, r) => { for (let j = 0; j < k; j++) celle.push({ col: 4 - k + 2 * j, riga: r + 1, file: 1 }) })
  return { file: file.length, grande: -1, celle }
}

// ── Dove stanno le figure sul palco (docs/sotterraneo/scontro-interfaccia.md, «Il palco») ──
// Il palco è un pezzo di stanza: un zoccolo di parete in cima e il pavimento che riempie il resto, con le figure in piedi sul
// pavimento. I mostri non stanno in file ma in COLONNE verticali sul lato destro (come i nemici dei Final Fantasy): la colonna
// più vicina all'eroe è davanti, dentro una colonna i mostri sono uno sopra l'altro e sfalsati a scaletta. Ogni posto ha un
// punto (u, v): u da 0 (vicino all'eroe) a 1 (in fondo a destra), v da 0 (lontano, in alto sul pavimento) a 1 (vicino, in
// basso). I posti restano quelli del motore; i consecutivi stanno nella stessa colonna o in colonne accanto, così i «vicini»
// del motore lo sono anche nel disegno.
export const SCALA_PALCO = 2         // pixel di schermo per pixel di foglio delle piastrelle del pavimento
// le figure un quinto più piccole delle piastrelle: c'è più pavimento attorno e la stanza sembra meno affollata (l'utente, 12 ottobre)
export const SCALA_FIGURE = 1.6
// niente parete in cima: «non aggiunge valore e spreca spazio verticale» (l'utente, 12 ottobre); tutto il palco è pavimento
export const ZOCCOLO = 0
export const ALTO_PALCO = { 1: 264, 2: 316 }
const PIEDI_SOTTO = 26               // sotto i piedi del più avanti: la barra della vita e un po' di pavimento
const PIEDI_SOPRA = 50               // i piedi del più lontano stanno almeno qui sotto il bordo alto: ci sta la figura
// i punti stanno lontani quanto serve perché la barra di uno non cada sull'altro: due vicini di colonna sono distanti in v, due di
// colonne accanto o lo sono in u o lo sono in v
const SLOT = {
  1: [[.5, .55]],
  2: [[.4, .3], [.6, .8]],
  3: [[.2, .2], [.28, .8], [.74, .5]],
  4: [[.2, .15], [.28, .8], [.76, .4], [.68, .96]],
  5: [[.08, .1], [.14, .6], [.5, .32], [.44, .97], [.9, .58]],
  6: [[.08, .08], [.14, .55], [.5, .28], [.44, .97], [.82, .68], [.9, .14]],
  // sette: due, tre e due in tre colonne (il tetto di uno scontro, docs/sotterraneo/scontro.md)
  7: [[.04, .1], [.1, .62], [.46, .06], [.54, .5], [.46, .98], [.92, .74], [.9, .2]],
}
// il grosso al centro e più avanti, gli altri ai lati e fra le sue gambe: prima a sinistra e a destra davanti, poi dietro
const SLOT_GROSSO = { grosso: [.5, .76], altri: [[.08, .62], [.92, .7], [.1, .1], [.9, .14], [.5, .04], [.28, .3]] }
// un numero stabile per ogni posto, mai a caso a ogni render: i piccoli scarti non devono ballare
const sfasa = (i, k) => (((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1) + 1) % 1 * 2 - 1   // fra -1 e 1

// `posti`: l'uscita di `disponi`; `campo`: [{ grosso }]; `larg`: la larghezza del palco. Torna { alto, eroe: {x, y}, compagno: {x, y},
// mostri: [{ x, y, prof, z }] } (x, y sono i piedi, in px dal bordo alto a sinistra del palco; `prof` 1 davanti, meno lontano)
export function piazza(posti, campo, larg) {
  const alto = ALTO_PALCO[posti.file] || ALTO_PALCO[1]
  const stretto = larg < 340   // a 320 px l'eroe sta un po' più a sinistra e le colonne si allargano
  const xa = stretto ? 88 : 104, xb = Math.max(xa + 40, larg - 48 - 22)
  const ya = ZOCCOLO + PIEDI_SOPRA, yb = alto - PIEDI_SOTTO
  const punto = (u, v, i) => {
    const uu = Math.max(0, Math.min(1, u + sfasa(i, 1) * 0.02)), vv = Math.max(0, Math.min(1, v + sfasa(i, 2) * 0.025))
    return { x: Math.round(xa + uu * (xb - xa)), y: Math.round(ya + vv * (yb - ya)), prof: vv < 0.4 ? 0.875 : 1 }
  }
  let altri = 0
  const n = campo.length
  const mostri = campo.map((m, i) => {
    const uv = posti.grande >= 0
      ? (i === posti.grande ? SLOT_GROSSO.grosso : SLOT_GROSSO.altri[Math.min(altri++, SLOT_GROSSO.altri.length - 1)])
      : (SLOT[Math.min(n, 7)] || SLOT[7])[i % 7]
    const p = punto(uv[0], uv[1], i)
    if (i === posti.grande) p.prof = 1
    return { ...p, z: p.y * 10 + Math.round((1 - uv[0]) * 8) }
  })
  // l'eroe a sinistra, a metà del pavimento: il compagno non c'è ancora (l'utente, 13 ottobre: «mettilo al centro»); quando ci sarà
  // la formazione cambia, l'eroe un po' sopra e il compagno sfalsato sotto, in diagonale (come la fila del gruppo nei Final Fantasy)
  const ey = Math.round(ya + (yb - ya) * 0.55)
  return { alto, eroe: { x: stretto ? 34 : 40, y: ey }, compagno: { x: stretto ? 52 : 60, y: ey + 58 }, mostri }
}

// Tutto quello che la vista dello scontro legge, rifatto a ogni cambio. I mostri sono dati semplici nell'ordine dei posti (l'indice `i` è
// quello di `foglio.campo`: la vista lo rimanda a `scegliBersaglio`); la corsa resta di chi la gioca
export function vistaDelloScontro(c) {
  const f = c.foglio
  if (!f || f.che !== 'scontro') return null
  const colpiti = new Map((f.colpiti || []).map(x => [x.chi, x.fattore]))
  const segni = new Map((f.colpiti || []).map(x => [x.chi, segniDel(x)]))
  const minaccia = new Map((f.minaccia || []).map(x => [x.chi, x]))
  const mostri = f.campo.map((m, i) => {
    const scheda = MOSTRI[m.tipo] || {}
    const mi = minaccia.get(m)
    return {
      i, nome: m.nome, tipo: m.tipo, chiave: !!m.chiave, grosso: m.grosso || null,
      // chi ha i passi guarda l'eroe di profilo (la posa di lato, ferma); gli altri respirano (docs/sotterraneo/scontro-interfaccia.md)
      sprite: scheda.sprite ? fotogrammaDi(scheda.sprite, !scheda.unaPosa && quantiFotogrammi(scheda.sprite, 'corsa') ? 'corsa' : 'fermo', 0) : null, em: m.em,
      // la variante armata e il suo grado: il nome senza articolo nel colore della rarità, l'arma in pugno, l'alone
      etichetta: etichettaDi(m.nome), grado: m.grado && m.grado !== 'comune' ? m.grado : null, colore: coloreDelGrado(m.grado), arma: m.arma || null, variante: m.variante || null,
      ossa: Math.max(0, m.ossa), ossaMax: m.ossaMax, morto: !!m.morto,
      stati: m.morto ? [] : statiDel(m),
      colpisce: mi ? mi.colpisce : 0, salta: !!(mi && mi.salta),
      // la mossa che farà al suo turno, se ne ha più d'una (dati/mosse.js): l'annuncio sopra la testa
      mossa: (mi && mi.mossa) || null, rinforzato: !!(mi && mi.rinforzato),
      bersaglio: f.chi === m, colpito: colpiti.has(m) ? colpiti.get(m) : 0, segni: m.morto ? [] : segni.get(m) || [],
    }
  })
  const indice = x => f.campo.indexOf(x)
  return {
    mostri,
    posti: disponi(mostri),
    turni: (f.turni || []).map(t => (t.chi === 'eroe' ? { chi: 'eroe', salta: false } : { chi: indice(t.chi), salta: !!t.salta })),
    apertura: { agguato: !!f.agguato, sorpresa: !!f.sorpresa, mostri: f.campo.length },
    eroe: { sprite: c.io.sprite ? pezzoAndante(c.io.sprite, 'fermo', 0) : null, em: c.io.em, vita: c.vita, vitaMax: c.vitaMax,
            // chi è e cosa ha in mano e addosso: per il ritratto 3D della fila dei turni (viste/anteprima3d.js)
            chi: c.io.sprite || null, mano: c.mano || null, mancina: c.mancina || null, corpo: c.corpo || null },
    mie: statiMiei(f.io || {}, c),
    incanti: incantiAddosso(c),
  }
}

// quanto è alto un mostro dei fogli dipinti nello scontro, rispetto all'eroe: dipinti, il ratto viene alto quasi quanto il
// cavaliere (l'utente, 12 ottobre: «grotteschi, vanno proporzionati»). Goblin, scheletro, orco e gigante vengono dallo
// stesso set dell'eroe (0x72), già in proporzione con lui: stanno alla sua scala e qui non ci sono
export const TAGLIA = {
  ratto: 0.55, pipistrello: 0.5, melma: 0.6, vespa: 0.6, fungo: 0.6, granchio: 0.55, serpente: 0.55,
  lupo: 0.7, fantasma: 0.8, golem: 1.1, troll: 1.15,
  // il bestiario per ambientazione (docs/sotterraneo/mostri.md): un piranha piccolo, un ent e un drago più grandi dell'eroe
  scheletro: 1.05, zombie: 1.0, 'scheletro-scudo': 1.0, mummia: 0.95, ghoul: 1.0, mietitore: 1.15,
  diavoletto: 0.6, 'spirito-fuoco': 0.8, 'golem-magma': 1.15, 'golem-pietra': 1.15, 'golem-muschio': 1.2, 'golem-ghiaccio': 1.15, 'golem-lava': 1.25,
  ragno: 0.5, pianta: 0.75, 'melma-rosa': 0.6, 'melma-viola': 0.6, 'mostro-verde': 1.2, 'mostro-viola': 1.0,
  piranha: 0.55, polpo: 0.7, 'fantasma-azzurro': 0.8, tartaruga: 0.65, cinghiale: 0.65, ent: 1.4,
  scorpione: 0.6, 'spirito-elettrico': 0.8, 'pipistrello-occhio': 0.55, ombra: 0.8, 'teschio-azzurro': 0.7,
  draghetto: 0.7, occhio: 0.6, grifone: 1.2, drago: 1.9,
}
export const ALTO_EROE = 28   // i pixel dello sprite dell'eroe, la misura di tutti
// lo stesso sul campo, dove ogni sprite sta alla scala dell'eroe: di quante volte va ingrandito o rimpicciolito perché il mostro sia alto
// TAGLIA volte l'eroe (a quarti, fra mezzo e uno e mezzo); chi non è in TAGLIA (goblin, orco, gigante: del set dell'eroe) resta com'è.
// Un ingrandimento non lo fa più largo di LARGO_SUL_CAMPO pixel (le caselle sono di 16: un golem di lava largo il doppio c'è già), e chi è
// già più largo non si rimpicciolisce: il campo mostra le bestie piccole più piccole, non le grosse più piccole
export const LARGO_SUL_CAMPO = 44
export const fattoreDelMostro = (tipo, altoSprite, largoSprite = 0) => {
  if (TAGLIA[tipo] == null) return 1
  const f = Math.max(0.5, Math.min(1.5, Math.round(ALTO_EROE * TAGLIA[tipo] / Math.max(1, altoSprite) * 4) / 4))
  if (f <= 1 || !largoSprite) return f
  return Math.max(1, Math.floor(Math.min(f, LARGO_SUL_CAMPO / largoSprite) * 4) / 4)
}
// la scala di un mostro alla scala `s` dell'eroe: alto TAGLIA volte l'eroe, a quarti (i pixel restano quasi interi)
export const scalaDelMostro = (tipo, altoSprite, s) => (TAGLIA[tipo] == null ? s
  : Math.max(1, Math.round(s * ALTO_EROE * TAGLIA[tipo] / Math.max(1, altoSprite) * 4) / 4))

