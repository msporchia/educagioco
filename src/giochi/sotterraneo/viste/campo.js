// Lo scontro com'è per chi lo guarda (docs/sotterraneo/scontro.md, «La vista»): dal foglio della corsa i dati che
// `Scontro.vue` disegna, e come stanno disposti i mostri in campo. Funzioni pure, nessuno stato: la corsa non sa niente
// di righe e di colonne, e la vista non calcola un numero.
import { MOSTRI } from '../dati/mostri.js'
import { ELEMENTI, STATI } from '../dati/elementi.js'
import { SCENARI, SCENARIO, pezzoAndante } from '../dati/tessere.js'

// «2 turni»: una risposta è un turno (le righe dell'albero parlano così, dati/abilita.js)
export const turniDi = n => `${n} ${n === 1 ? 'turno' : 'turni'}`

// Cosa ha addosso un mostro (veleno, gelo, radici, stordimento, difesa spezzata): `t` sono i turni che restano, `dice` la riga
// intera (il `title` della pastiglia). Sul campo ogni stato è un glifo col suo numero; il testo lungo non entra in sei caselle
export function statiDel(m) {
  const st = m.stati || {}
  return [
    st.veleno && st.veleno.scambi > 0 ? { chiave: 'veleno', fuoco: !!st.veleno.fuoco, glifo: st.veleno.fuoco ? 'fiamma' : 'veleno', t: st.veleno.scambi, n: `${st.veleno.quanto} di danno · ${turniDi(st.veleno.scambi)}`, dice: `subisce ${st.veleno.quanto} di danno a ogni turno` } : null,
    st.debole > 0 ? { chiave: 'debole', gelo: !!st.gelo, glifo: st.gelo ? 'fiocco' : 'fiacco', t: st.debole, n: `fa metà danno · ${turniDi(st.debole)}`, dice: st.gelo ? 'gelato: i suoi colpi fanno la metà del danno' : 'i suoi colpi fanno la metà del danno' } : null,
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
  const glifo = { veleno: fuoco ? 'fiamma' : 'veleno', debole: gelo ? 'fiocco' : 'fiacco', sanguina: 'sangue', esposto: 'radici',
                  fermo: gelo ? 'fiocco' : 'stelle', rotto: 'scudo-rotto' }[chiave]
  return { chiave, fuoco, gelo, glifo, t: 0, n: '', dice: '' }
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

// e cosa protegge l'eroe in questo scontro (scudo, parato…): le pastiglie col testo, una per effetto
export function statiMiei(io) {
  return [
    io.parato > 0 ? { chiave: 'parato', glifo: 'scudo', dice: `protetto dai danni · ${turniDi(io.parato)}` } : null,
    io.scudo > 0 ? { chiave: 'scudo', glifo: 'sfera', dice: `barriera: para ${io.scudo} danni` } : null,
    io.intoccabile > 0 ? { chiave: 'intoccabile', glifo: 'montagna', dice: `invulnerabile · ${turniDi(io.intoccabile)}` } : null,
    io.specchio ? { chiave: 'specchio', glifo: 'specchio', dice: 'il prossimo colpo torna al mostro' } : null,
    io.linfa && io.linfa.scambi > 0 ? { chiave: 'linfa', glifo: 'germoglio', dice: `guarisci di ${io.linfa.quanto} · ${turniDi(io.linfa.scambi)}` } : null,
  ].filter(Boolean)
}

// Come stanno i mostri sul palco. Una griglia a sei colonne, ogni mostro ne prende due: così una fila da tre, da due e da uno
// si centrano da sole. Fino a tre mostri una fila sola (più grandi), da quattro due file (2+2, 3+2, 3+3, nell'ordine dei
// posti: la prima fila poi la seconda). Il mostro grosso sta al centro e occupa le due file, con gli altri ai lati: a destra e
// a sinistra, prima in basso, dalla parte dell'eroe. Le file a schermo non sono regole: davanti o dietro non conta.
// `campo`: [{ grosso }] nell'ordine dei posti. Torna { file, grande, celle: [{ col, riga, file }] } (`celle` per posto)
export function disponi(campo) {
  const n = campo.length
  const g = campo.findIndex(x => x.grosso)
  if (g >= 0) {
    const lati = [[1, 2], [5, 2], [1, 1], [5, 1]]   // sinistra in basso, destra in basso, sinistra in alto, destra in alto
    let k = 0
    return { file: 2, grande: g, celle: campo.map((x, i) => (i === g ? { col: 3, riga: 1, file: 2 } : (([col, riga]) => ({ col, riga, file: 1 }))(lati[k++ % lati.length]))) }
  }
  const file = n <= 3 ? [n] : n === 4 ? [2, 2] : n === 5 ? [3, 2] : [3, 3]
  const celle = []
  file.forEach((k, r) => { for (let j = 0; j < k; j++) celle.push({ col: 4 - k + 2 * j, riga: r + 1, file: 1 }) })
  return { file: file.length, grande: -1, celle }
}

// il fondale del duello: la parete e il pavimento dello scenario in cui si combatte (viste/Palco.vue)
export function palcoDi(c) {
  const sc = SCENARI[c.scenario] || SCENARI[SCENARIO]
  return { pavimento: sc.pavimento.stanza, faccia: sc.faccia, roccia: sc.colori && sc.colori.roccia }
}

// Tutto quello che `Scontro.vue` legge, rifatto a ogni cambio. I mostri sono dati semplici nell'ordine dei posti (l'indice `i` è
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
      sprite: scheda.sprite ? pezzoAndante(scheda.sprite, 'fermo', 0) : null, em: m.em,   // la stessa faccia del campo
      ossa: Math.max(0, m.ossa), ossaMax: m.ossaMax, morto: !!m.morto,
      stati: m.morto ? [] : statiDel(m),
      colpisce: mi ? mi.colpisce : 0, salta: !!(mi && mi.salta),
      bersaglio: f.chi === m, colpito: colpiti.has(m) ? colpiti.get(m) : 0, segni: m.morto ? [] : segni.get(m) || [],
    }
  })
  const indice = x => f.campo.indexOf(x)
  return {
    mostri,
    posti: disponi(mostri),
    turni: (f.turni || []).map(t => (t.chi === 'eroe' ? { chi: 'eroe', salta: false } : { chi: indice(t.chi), salta: !!t.salta })),
    apertura: { agguato: !!f.agguato, sorpresa: !!f.sorpresa, mostri: f.campo.length },
    palco: palcoDi(c),
    eroe: { sprite: c.io.sprite ? pezzoAndante(c.io.sprite, 'fermo', 0) : null, em: c.io.em, vita: c.vita, vitaMax: c.vitaMax },
    mie: statiMiei(f.io || {}),
  }
}
