// Il gestore degli effetti 3D dello scontro (scritto a mano, accanto alle copie generate: docs/sotterraneo/mostri-3d.md). Gli effetti
// dei prototipi (lancio.js, mischia.js, aure.js) hanno le stesse chiavi degli effetti del gioco (dati/effetti.js): la famiglia (`via`)
// dice in quale gruppo cercarla. Qui si creano, si aggiornano col tempo della scena e si liberano; gli stati che restano addosso
// (stordito, avvelenato…) si tengono accesi per chi li porta finché ci sono. Se un effetto non c'è o si rompe, il racconto fa da sé.
import { Color, Vector3 } from 'three'
import { EFFETTI as LANCIO } from './lancio.js'
import { EFFETTI as MISCHIA } from './mischia.js'
import { EFFETTI as AURE, PREPARA } from './aure.js'

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
export const segnoDi = chiave => MISCHIA[chiave] || null
export const auraDi = chiave => (AURE[chiave] && AURE[chiave].via === 'su-me' ? AURE[chiave] : null)

// gli stati del gioco (viste/campo.js, statiDel) → gli stati 3D: il veleno di fuoco brucia, il gelo chiude nel ghiaccio
export function statoDi(x) {
  switch (x.chiave) {
    case 'veleno': return x.fuoco ? 'in-fiamme' : 'avvelenato'
    case 'debole': return x.gelo ? 'gelato' : 'fiacco'
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

const BIANCO = new Color(1, 1, 1)
let seme = 1

/** `scena`: dove si aggiungono; `renderer`, `camera`: per compilare le aure la prima volta (niente scatto al primo stato). */
export function creaGestore(scena, { renderer = null, camera = null } = {}) {
  const attivi = []                 // { def, fx, t, attesa, portatore, chiave }
  const stati = new Map()           // portatore → Map(chiave → voce)
  let preparato = false

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
      const v = { def, fx, t: 0, attesa: o.attesa || 0, portatore: o.portatore || null, chiave: o.chiave || null }
      attivi.push(v)
      return v
    } catch (e) {
      console.warn('effetti 3D: non parte', e)
      return null
    }
  }
  function libera(v) {
    const i = attivi.indexOf(v)
    if (i >= 0) attivi.splice(i, 1)
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
        if (!preparato && renderer && camera) { preparato = true; try { PREPARA(renderer, camera, { Scene: scena.constructor, Vector3, Color }) } catch { /* solo un anticipo */ } }
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
        try { vivo = v.fx.aggiorna(v.t, dt) !== false } catch (e) { console.warn('effetti 3D: si rompe', e); vivo = false }
        if (v.fx.finito || (v.def.durata !== Infinity && v.t > v.def.durata + 0.15)) vivo = false
        if (!vivo) libera(v)
      }
    },
    get quanti() { return attivi.length },
    chiavi() { return attivi.map(v => v.chiave || v.def.via) },
    svuota() { for (const v of [...attivi]) libera(v); stati.clear() },
  }
}

// il colore di ogni stato (gli stessi dell'arena di prova): lo stato si disegna da sé, la tinta lo accorda all'elemento
const STATO_TINTA = { stordito: COLORI.sacro, avvelenato: COLORI.veleno, 'in-fiamme': COLORI.fuoco, gelato: COLORI.gelo, sanguina: COLORI.fisico,
  bloccato: COLORI.veleno, 'senza-difesa': COLORI.fisico, fiacco: COLORI.fisico }
