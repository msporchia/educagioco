// Il log di chi pesa, un elemento alla volta (docs/core/vecchio-telefono-elementi.md): per ogni scena la TABELLA (ogni elemento quanto
// aggiunge da solo e quanto toglie dalla scena intera, in ms col js e la gpu, le chiamate, i triangoli, gli shader nuovi) in ordine dal
// più caro, e la LETTURA (i cinque più cari, se il costo è del JS o della GPU, la semplificazione di ognuno, quanto tolgono le leve).
// I ms sono quelli tolto il calore (`corretta`). Le scene hanno `el`: { scena, modo: zero|base|solo|tutto|via|com-era|semplice, k, rif }.
import { SCENE_ELEMENTI, SEMPLICE } from './veri/elementi-dati.js'

const t1d = x => Math.round(x * 10) / 10
const segnato = x => `${x >= 0 ? '+' : ''}${t1d(x)}`
const ok = r => r && !r.errore && !r.salta && r.ms != null

/** La differenza fra due scene: ms, js, gpu, chiamate, migliaia di triangoli. */
const meno = (a, b) => ({ ms: t1d(a.ms - b.ms), js: t1d((a.js ?? 0) - (b.js ?? 0)), gpu: t1d((a.gpu ?? 0) - (b.gpu ?? 0)),
                          ch: (a.ch ?? 0) - (b.ch ?? 0), kt: Math.round(((a.tri ?? 0) - (b.tri ?? 0)) / 1000) })
/** Di chi è un costo: della GPU (pixel, luci, ombre) o del JS (chiamate, codice). */
export const diChi = d => { const t = Math.abs(d.js) + Math.abs(d.gpu); return t < 0.3 ? '' : d.gpu >= 0.6 * t ? 'GPU' : d.js >= 0.6 * t ? 'JS' : 'JS e GPU' }

/**
 * Le righe di ogni elemento di una scena, dalla più cara: { k, solo, via, sh, costo }. `ris`: i risultati già corretti dal calore.
 * `costo` è il più grande fra quanto aggiunge da solo e quanto toglie: un elemento può costare poco da solo e molto nella scena
 * (le luci per ogni superficie) o il contrario.
 */
export function righeElementi(ris, sc) {
  const di = ris.filter(r => r.el && r.el.scena === sc && ok(r)), id = x => di.find(r => r.id === x)
  const tutto = di.find(r => r.el.modo === 'tutto'), zero = di.find(r => r.el.modo === 'zero')
  const ks = [...new Set(di.filter(r => r.el.k).map(r => r.el.k))]
  const righe = ks.map(k => {
    const s = di.find(r => r.el.modo !== 'via' && r.el.k === k), base = s && (id(s.el.rif) || (s.el.rif ? null : zero))
    const v = di.find(r => r.el.modo === 'via' && r.el.k === k)
    const solo = s && base ? meno(s, base) : null, via = v && tutto ? meno(tutto, v) : null
    return { k, solo, via, sh: s ? s.nuovi || 0 : 0, costo: Math.max(solo ? solo.ms : -1e9, via ? via.ms : -1e9) }
  })
  return { tutto, zero, righe: righe.sort((a, b) => b.costo - a.costo) }
}

const pezzo = d => `${segnato(d.ms)} (js ${segnato(d.js)} gpu ${segnato(d.gpu)})`
const misura = r => `${r.ms} ms (js ${r.js ?? '?'} gpu ${r.gpu ?? '?'}), ${r.ch ?? '?'} ch ${Math.round((r.tri ?? 0) / 1000)} kt`

/** La TABELLA di tutte le scene misurate; `ris` corretti dal calore, `crudi` per i guasti. */
export function tabellaElementi(ris, crudi = ris) {
  const out = []
  for (const [sc, d] of Object.entries(SCENE_ELEMENTI)) {
    const { tutto, zero, righe } = righeElementi(ris, sc)
    if (!righe.length && !tutto) continue
    out.push(`[elementi ${sc}] ${d.nome}`)
    if (zero) out.push(`  tutto spento ${misura(zero)}`)
    if (tutto) out.push(`  scena intera ${misura(tutto)}`)
    for (const r of righe) {
      const a = r.solo ? `${pezzo(r.solo)} da solo, ${segnato(r.solo.ch)}ch ${segnato(r.solo.kt)}kt${r.sh ? ` +${r.sh}sh` : ''}` : 'da solo ?'
      out.push(`  ${r.k}: ${a} / ${r.via ? `${segnato(-r.via.ms)} tolto (js ${segnato(-r.via.js)} gpu ${segnato(-r.via.gpu)})` : 'tolto ?'}`)
    }
    const no = crudi.filter(r => r.el && r.el.scena === sc && r.errore)
    if (no.length) out.push(`  non reggono: ${no.map(r => r.id).join(', ')}`)
  }
  return out
}

/** La LETTURA: per scena i cinque più cari col loro collo e la semplificazione, il fondo, e le leve. */
export function letturaElementi(ris) {
  const out = []
  for (const [sc, d] of Object.entries(SCENE_ELEMENTI)) {
    const { tutto, zero, righe } = righeElementi(ris, sc)
    if (!righe.length) continue
    const cari = righe.slice(0, 5).map(r => {
      const parti = [r.via ? `${segnato(-r.via.ms)} tolto` : '', r.solo ? `${segnato(r.solo.ms)} da solo` : ''].filter(Boolean).join(', ')
      const chi = diChi(r.via && r.via.ms >= (r.solo ? r.solo.ms : -1e9) ? r.via : r.solo || r.via)
      return `${r.k} (${parti}${chi ? ', ' + chi : ''})`
    })
    let riga = `CHI PESA nel ${d.nome}: ${cari.join(', ')}.`
    if (tutto && zero) {
      const g = meno(tutto, zero)
      riga += ` Tutto spento ${zero.ms} ms (js ${zero.js}: il giro del gioco senza disegnare), la scena intera ${tutto.ms}: i disegni ne aggiungono ${segnato(g.ms)}, ${diChi(g) || 'niente'}.`
      const somma = t1d(righe.reduce((n, r) => n + Math.max(0, r.solo ? r.solo.ms : 0), 0))
      if (g.ms > 4 && somma < 0.6 * g.ms) riga += ` Da soli sommano ${somma} ms: il resto sta negli incroci (luci per ogni superficie, ombre su tutto).`
    }
    out.push(riga)
    out.push(`SEMPLIFICARE (${sc}): ` + righe.slice(0, 5).map(r => `${r.k} → ${SEMPLICE[r.k] || '?'}`).join('; ') + '.')
    const ce = ris.find(r => r.el && r.el.scena === sc && r.el.modo === 'com-era' && ok(r)), se = ris.find(r => r.el && r.el.scena === sc && r.el.modo === 'semplice' && ok(r))
    if (ce && se) {
      const g = meno(ce, se)
      const lv = d.leve || {}, quali = lv.spegni ? lv.spegni.join(' ') : Object.entries(lv.qualita || {}).map(([k, x]) => `${k}:${x}`).join(' ')
      out.push(`LEVE (${sc}, ${quali}): com'è ${ce.ms} ms (p95 ${ce.p95}), semplificata ${se.ms} (p95 ${se.p95}): ` +
        (g.ms > Math.max(1, 0.05 * ce.ms) ? `tolgono ${t1d(g.ms)} ms (js ${segnato(-g.js)} gpu ${segnato(-g.gpu)}).` : `non tolgono niente che si veda (${segnato(-g.ms)} ms, nel rumore).`))
    }
  }
  return out
}
