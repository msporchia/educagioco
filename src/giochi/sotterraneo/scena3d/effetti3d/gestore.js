// Il gestore degli effetti 3D dello scontro (scritto a mano, accanto alle copie generate: docs/sotterraneo/mostri-3d.md). Gli effetti
// dei prototipi (lancio.js, mischia.js, aure.js) hanno le stesse chiavi degli effetti del gioco (dati/effetti.js): la famiglia (`via`)
// dice in quale gruppo cercarla. Qui si creano, si aggiornano col tempo della scena e si liberano; gli stati che restano addosso
// (stordito, avvelenato…) si tengono accesi per chi li porta finché ci sono. Se un effetto non c'è o si rompe, il racconto fa da sé.
import { Color, Vector3, DoubleSide, AdditiveBlending } from 'three'
import { EFFETTI as LANCIO } from './lancio.js'
import { EFFETTI as MISCHIA } from './mischia.js'
import { EFFETTI as AURE } from './aure.js'
import { schedaDi, effettoDi as effettoNodo, effettoDelColpo, aureDelNodo, statiDelNodo } from '../../dati/effetti.js'
import { NODI } from '../../dati/abilita.js'

const GRUPPO_DELLA_VIA = {
  vicino: MISCHIA, attorno: MISCHIA, terra: MISCHIA, onda: MISCHIA, segno: MISCHIA,
  lancio: LANCIO, fascio: LANCIO, catena: LANCIO, cielo: LANCIO,
  'su-chi': AURE, 'su-me': AURE, stato: AURE,
}
/** L'effetto 3D di una chiave del gioco, cercato nel gruppo della sua famiglia (le chiavi doppie, come `luce` e `nube`, stanno in due). */
export function effettoDi(chiave, via = null) {
  const g = via && GRUPPO_DELLA_VIA[via]
  if (g && g[chiave]) return g[chiave]
  return LANCIO[chiave] || MISCHIA[chiave] || AURE[chiave] || null
}
// il segno `arco` (la spazzata) nei prototipi è l'effetto intero della spazzata
export const segnoDi = chiave => MISCHIA[chiave] || (chiave === 'arco' ? MISCHIA.spazzata : null) || null
export const auraDi = chiave => (AURE[chiave] && AURE[chiave].via === 'su-me' ? AURE[chiave] : null)

// gli stati del gioco (viste/campo.js, statiDel) → gli stati 3D: il veleno di fuoco brucia, il gelo chiude nel ghiaccio
export function statoDi(x) {
  switch (x.chiave) {
    case 'veleno': return x.fuoco ? 'in-fiamme' : 'avvelenato'
    case 'debole': return x.gelo ? 'gelato' : x.da === 'radici' ? 'bloccato' : 'fiacco'   // i Rovi: le radici ai piedi per tutti i turni
    case 'fermo': return x.gelo ? 'gelato' : 'stordito'
    case 'sanguina': return 'sanguina'
    case 'esposto': return 'bloccato'
    case 'rotto': return 'senza-difesa'
    default: return null
  }
}

// i colori degli elementi per i colpi dei mostri (gli stessi dell'arena di prova, poc/arena-3d/dati.js)
export const COLORI = { fisico: 0xb9c2d4, fuoco: 0xe8742f, gelo: 0x58b4e6, fulmine: 0xb98af0, veleno: 0x7cc94a, sacro: 0xffe08a }
// quando un mostro colpisce da vicino, il segno che compare sull'eroe (attacco.tipo del modello)
export const SEGNO_COLPO = {
  'colpo-arma': 'taglio', morso: 'colpo', zampata: 'croce', schianto: 'urto', carica: 'urto', pungiglione: 'affondo', becco: 'affondo',
  beccata: 'affondo', 'volo-radente': 'spazzata', tocco: 'scintilla', ala: 'spazzata', coda: 'spazzata', artiglio: 'croce', graffio: 'croce',
  falciata: 'spazzata', fendente: 'taglio', clavata: 'urto', frustata: 'spazzata', affondo: 'affondo', 'carica-di-corna': 'urto',
  'ascia-a-due-lame': 'croce', 'schianto-a-due-pugni': 'urto',
}
// il proiettile del modello (attacco.proiettile.tipo) → l'effetto che vola dall'origine all'eroe; `su`: nasce addosso all'eroe;
// il soffio del drago lo disegna il drago stesso
export const PROIETTILE = {
  freccia: { chiave: 'freccia', elem: 'fisico' }, spore: { chiave: 'nube', su: true, elem: 'veleno' },
  ragnatela: { chiave: 'scheggia', tinta: 0xd5d9de }, veleno: { chiave: 'freccia-veleno', elem: 'veleno' }, sputo: { chiave: 'palla', elem: 'veleno' },
  onda: { chiave: 'onda', tinta: 0xbfd4ff }, sasso: { chiave: 'massi', elem: 'fisico' }, masso: { chiave: 'massi', elem: 'fisico' },
  fuoco: { chiave: 'palla', elem: 'fuoco' }, fiamma: { chiave: 'palla', elem: 'fuoco' }, braci: { chiave: 'brace', elem: 'fuoco' },
  fulmine: { chiave: 'fulmine', elem: 'fulmine' }, raggio: { chiave: 'fascio', elem: 'fulmine' }, teschio: { chiave: 'palla', tinta: 0x7cffb0 },
  luce: { chiave: 'luce', elem: 'sacro' },
}

// Gli effetti che una discesa può chiedere, per scaldarne gli shader in anticipo (docs/sotterraneo/prestazioni-3d.md, «Shader e prima
// apparizione»): tutti e sessanta sarebbero ~30 programmi in più, quasi tutti mai usati. Quelli dell'eroe vengono dalle abilità imparate
// (`albero`: id → grado, dati/abilita.js) e dall'arma in mano (`famiglia`: il colpo solito e i nodi senza arma); quelli dei mostri dalle
// loro mosse (`mosse`: dati/mosse.js, la cura e gli incantesimi), dal segno del colpo e dal proiettile dei modelli (`attacchi`:
// `userData.attacco`). Uno che manca si compila al primo uso, come prima.
export function effettiPrevisti({ albero = {}, famiglia = null, attacchi = [], mosse = [] } = {}) {
  const defs = new Set()
  const metti = d => { if (d) defs.add(d) }
  const daChiave = k => {
    const sc = schedaDi(k)
    metti(effettoDi(k, sc.via)); metti(segnoDi(sc.segno)); metti(segnoDi(sc.corpo)); metti(auraDi(sc.corpo === 'colonna' ? 'preghiera' : sc.corpo))
  }
  daChiave(effettoDelColpo(famiglia))
  for (const id of Object.keys(albero || {})) {
    const nodo = NODI[id]
    if (!nodo) continue
    daChiave(effettoNodo(nodo, famiglia))
    for (const c of aureDelNodo(nodo)) metti(auraDi(c === 'colonna' ? 'preghiera' : c))
    for (const x of statiDelNodo(nodo)) {
      const k = statoDi({ chiave: x, fuoco: nodo.elemento === 'fuoco', gelo: nodo.elemento === 'gelo', da: nodo.effetto === 'radici' ? 'radici' : null })
      if (k) metti(AURE[k])
    }
  }
  for (const m of mosse) {
    if (m.tipo === 'cura') metti(auraDi('cura'))
    else if (m.tipo === 'incantesimo') metti(effettoDi(m.effetto || 'dardo', 'lancio'))
  }
  for (const a of attacchi) {
    if (!a) continue
    metti(segnoDi(SEGNO_COLPO[a.tipo] || 'colpo'))
    const P = a.proiettile && PROIETTILE[a.proiettile.tipo]
    if (P) metti(effettoDi(P.chiave))
  }
  return [...defs]
}

const BIANCO = new Color(1, 1, 1)
const TIENI = () => {}
let seme = 1

// Un materiale trasparente a due facce three lo disegna due volte, dietro e poi davanti, con due programmi (docs/sotterraneo/prestazioni-3d.md,
// «Shader e prima apparizione»). In somma di luce e senza scrivere la profondità l'ordine non cambia niente: una passata sola, un
// programma e una chiamata in meno. Anche per chi nasce strada facendo (si guarda a ogni passo).
const fatti = new WeakSet()
export function unaPassata(g) {
  g.traverse(o => {
    if (!o.material) return
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (fatti.has(m)) continue
      fatti.add(m)
      if (m.transparent && m.side === DoubleSide && m.blending === AdditiveBlending && m.depthWrite === false) m.forceSinglePass = true
    }
  })
}

/** `scena`: dove si aggiungono; `renderer`, `camera`: per chiedere gli shader in anticipo (`riscaldamento`). */
export function creaGestore(scena, { renderer = null, camera = null } = {}) {
  const attivi = []                 // { def, fx, t, attesa, portatore, chiave }
  const stati = new Map()           // portatore → Map(chiave → voce)
  const scaldati = new Set()        // gli effetti già passati dal riscaldamento

  function nuovo(def, o) {
    const tinta = o.tinta instanceof Color ? o.tinta.clone() : new Color(o.tinta ?? COLORI[o.elem] ?? COLORI.fisico)
    const ctx = { da: o.da.clone(), a: o.a.clone(), tinta, tinta2: tinta.clone().lerp(BIANCO, 0.45), seme: (seme = (seme * 7 + 13) % 997) + 1,
                  altri: (o.altri || []).map(v => v.clone()), scala: o.scala ?? 1 }
    try {
      const fx = def.crea(ctx)
      if (!fx || !fx.gruppo) return null
      scena.add(fx.gruppo)
      fx.gruppo.visible = !(o.attesa > 0)
      fx.aggiorna(0, 0)
      unaPassata(fx.gruppo)
      const v = { def, fx, t: 0, attesa: o.attesa || 0, portatore: o.portatore || null, chiave: o.chiave || null }
      attivi.push(v)
      return v
    } catch (e) {
      console.warn('effetti 3D: non parte', e)
      return null
    }
  }
  // i materiali non si buttano (vedi sotto): il loro programma resta in serbo per il prossimo effetto con lo stesso codice
  const tieni = g => g.traverse(o => { if (o.material) for (const m of [o.material].flat()) m.dispose = TIENI })
  function libera(v) {
    const i = attivi.indexOf(v)
    if (i >= 0) attivi.splice(i, 1)
    // i materiali non si buttano: buttato l'ultimo, three libera il suo programma e il colpo dopo lo ricompila (sul telefono 50-300 ms
    // l'uno, a ogni attacco: docs/sotterraneo/limiti-3d.md). Senza `dispose` il programma resta in serbo; il materiale lo prende il GC
    try { tieni(v.fx.gruppo) } catch { /* già via */ }
    try { v.fx.libera() } catch { /* già via */ }
    scena.remove(v.fx.gruppo)
    if (v.portatore) { const m = stati.get(v.portatore); if (m && m.get(v.chiave) === v) m.delete(v.chiave) }
  }

  return {
    /** Lancia `def` (da effettoDi). `o`: { da, a, altri, tinta | elem, scala, attesa (s prima di partire) }. Torna la voce o null. */
    lancia(def, o) { return def ? nuovo(def, o) : null },
    /**
     * Gli stati addosso a `chi` (lo stato di disegno di un mostro): `chiavi` quelli che deve avere adesso; `dove()` → { piedi, alto }.
     * Quelli nuovi si accendono, quelli che non ci sono più si spengono sfumando. Scrive su `chi` la tinta del corpo (`tinta3d`, `forzaTinta3d`).
     */
    tieniStati(chi, chiavi, dove) {
      let m = stati.get(chi)
      if (!m && !chiavi.length) { chi.forzaTinta3d = 0; return }
      if (!m) stati.set(chi, m = new Map())
      for (const [k, v] of m) if (!chiavi.includes(k) && !v.spento) { v.spento = true; try { v.fx.spegni && v.fx.spegni() } catch { libera(v) } }
      for (const k of chiavi) {
        if (m.has(k) && !m.get(k).spento) continue
        const { piedi, alto } = dove()
        const v = nuovo(AURE[k], { da: piedi, a: piedi, elem: 'fisico', tinta: AURE[k] && STATO_TINTA[k], scala: Math.max(0.8, alto), portatore: chi, chiave: k })
        if (v) m.set(k, v)
      }
      let tinta = null, forza = 0
      for (const v of m.values()) if (v.fx.tintaCorpo && v.fx.forzaTinta > forza) { tinta = v.fx.tintaCorpo; forza = v.fx.forzaTinta }
      chi.tinta3d = tinta; chi.forzaTinta3d = forza
    },
    /** Spegne gli stati di tutti (lo scontro è finito) o di uno (è caduto). */
    spegniStati(chi = null) {
      for (const [p, m] of stati) {
        if (chi && p !== chi) continue
        for (const v of m.values()) if (!v.spento) { v.spento = true; try { v.fx.spegni && v.fx.spegni() } catch { libera(v) } }
        p.forzaTinta3d = 0
      }
    },
    /** Un passo: `dt` il tempo della scena (fermo nel fermo-immagine). */
    aggiorna(dt) {
      for (let i = attivi.length - 1; i >= 0; i--) {
        const v = attivi[i]
        if (v.attesa > 0) { v.attesa -= dt; if (v.attesa > 0) continue; v.fx.gruppo.visible = true }
        v.t += dt
        let vivo = true
        try { vivo = v.fx.aggiorna(v.t, dt) !== false; unaPassata(v.fx.gruppo) } catch (e) { console.warn('effetti 3D: si rompe', e); vivo = false }
        if (v.fx.finito || (v.def.durata !== Infinity && v.t > v.def.durata + 0.15)) vivo = false
        if (!vivo) libera(v)
      }
    },
    /**
     * Il riscaldamento (docs/sotterraneo/prestazioni-3d.md, «Shader e prima apparizione»): per gli effetti `defs` (effettiPrevisti) non
     * ancora scaldati, una funzione per effetto, che lo crea fuori
     * dalla scena, ne chiede gli shader con le luci della scena (`compile` non aspetta: il telefono li compila mentre si esplora, e il
     * primo colpo li trova pronti) e lo libera tenendo i programmi. Prima le aure si compilavano in una scena senza luci, e si buttavano.
     * `compila(oggetto)`: come lo vuole chi disegna (il passaggio finale disegna in una texture); di difetto `compile` con le luci della scena.
     * Con `passi(oggetto)` (coda-shader.js, passiDi) ogni funzione torna i passi dell'effetto, uno per programma, e la liberazione in coda.
     */
    riscaldamento(defs, compila = o => renderer.compile(o, camera, scena), passi = null) {
      if (!renderer || !camera) return []
      return defs.filter(d => !scaldati.has(d)).map(def => () => {
        scaldati.add(def)
        const tinta = new Color(COLORI.fuoco)
        const fx = def.crea({ da: new Vector3(0, 0, 0), a: new Vector3(1.5, 0, 0), tinta, tinta2: tinta.clone().lerp(BIANCO, 0.45), seme: 1,
                              altri: [new Vector3(2, 0, 1), new Vector3(1, 0, -1)], scala: 1 })
        if (!fx || !fx.gruppo) return
        const via = () => { try { tieni(fx.gruppo) } finally { fx.libera() } }
        try {
          const fino = Number.isFinite(def.durata) ? def.durata : 1
          for (const t of [0, 0.15, Math.min(0.3, fino * 0.5), fino * 0.5]) fx.aggiorna(t, 0.016)   // quello che nasce strada facendo
          unaPassata(fx.gruppo)
          if (passi) return [...passi(fx.gruppo), via]
          compila(fx.gruppo)
        } catch (e) { via(); if (passi) return; throw e }
        via()
      })
    },
    get quanti() { return attivi.length },
    chiavi() { return attivi.map(v => v.chiave || v.def.via) },
    svuota() { for (const v of [...attivi]) libera(v); stati.clear() },
  }
}

// il colore di ogni stato (gli stessi dell'arena di prova): lo stato si disegna da sé, la tinta lo accorda all'elemento
const STATO_TINTA = { stordito: COLORI.sacro, avvelenato: COLORI.veleno, 'in-fiamme': COLORI.fuoco, gelato: COLORI.gelo, sanguina: COLORI.fisico,
  bloccato: COLORI.veleno, 'senza-difesa': COLORI.fisico, fiacco: COLORI.fisico }
