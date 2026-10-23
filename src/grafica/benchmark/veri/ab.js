// L'A/B della verifica compatta (docs/core/vecchio-telefono-veri.md, «L'A/B»): la stessa scena (1 mostro con gli effetti) in varianti, ripetuta
// in giri alternati (A B C D E, A B C D E, …) perché il calore non si scambi per il merito di una leva. Dato puro, senza three: lo usano
// `veri.js` (le tappe, e la variante E che si sceglie dai giri già fatti) e `log-veri.js` (la LETTURA).
export const GIRI_AB = 3
export const BERSAGLIO = { ms: 33, js: 25, gpu: 28 }   // il fotogramma, e la sua parte di JS e di GPU, a cui si vuole arrivare

/** L'id della scena della variante `k` ('a'…'e') nel giro `r` (1…): la prima A è `sot-1`, quella che ha il riferimento della misura vera. */
export const idAB = (k, r) => (k === 'a' && r === 1 ? 'sot-1' : `ver-${k}${r}`)

/**
 * Le varianti. A: com'è oggi (fascia bassa). B: le semplificazioni riaccese (come `&riaccendi=`). C: senza rilievo. D: senza pelle. E: tutte
 * le leve buone insieme, scelte sui giri già fatti (`leveBuone`). Qui va anche `lucePerVertice` (`spegni: ['lucePerVertice']`), da un'altra
 * mano: una variante in più in questa lista e una voce in `LEVE` sotto.
 */
export const VARIANTI = [
  { k: 'a', nome: 'A: com\'è oggi (fascia semplificata)', opz: {} },
  { k: 'b', nome: 'B: semplificazioni riaccese (ombre, nebbiaFitta, quantaPolvere)', opz: { riaccendi: ['ombre', 'nebbiaFitta', 'quantaPolvere'] } },
  { k: 'c', nome: 'C: senza rilievo (niente normal map)', opz: { spegni: ['rilievo'] } },
  { k: 'd', nome: 'D: senza pelle', opz: { spegni: ['pelle'] } },
  { k: 'e', nome: 'E: tutte le leve buone insieme', opz: null },   // `opz` si decide quando tocca (veri.js)
]

const mediana = v => { const o = v.slice().sort((a, b) => a - b); return o.length ? o[Math.floor(o.length / 2)] : 0 }
const t1 = x => Math.round(x * 10) / 10
const buona = r => r && !r.errore && !r.salta && r.ms != null

/** Le differenze (variante − A) giro per giro, solo dove ci sono tutte e due; per ms, js e gpu: { med, min, max, d (la dispersione: max − min), n }. */
export function differenze(ris, k) {
  const per = (campo) => {
    const v = []
    for (let r = 1; r <= GIRI_AB; r++) {
      const a = ris.find(x => x.id === idAB('a', r)), x = ris.find(y => y.id === idAB(k, r))
      if (buona(a) && buona(x) && a[campo] != null && x[campo] != null) v.push(x[campo] - a[campo])
    }
    return v.length ? { med: t1(mediana(v)), min: t1(Math.min(...v)), max: t1(Math.max(...v)), d: t1(Math.max(...v) - Math.min(...v)), n: v.length } : null
  }
  const ms = per('ms')
  return ms ? { ms, js: per('js'), gpu: per('gpu') } : null
}

/** La media delle A misurate (la scena di oggi) e quanto balla da un giro all'altro. */
export function oggi(ris) {
  const l = []
  for (let r = 1; r <= GIRI_AB; r++) { const a = ris.find(x => x.id === idAB('a', r)); if (buona(a)) l.push(a) }
  if (!l.length) return null
  const m = c => t1(mediana(l.map(x => x[c] ?? 0)))
  return { ms: m('ms'), p95: m('p95'), js: m('js'), gpu: m('gpu'), min: t1(Math.min(...l.map(x => x.ms))), max: t1(Math.max(...l.map(x => x.ms))), n: l.length }
}

/** Una differenza è significativa se la mediana supera la dispersione (con una sola misura non si sa). */
export const significativa = s => !!s && s.n >= 2 && Math.abs(s.med) > s.d

/**
 * Le leve che si possono applicare (togliere da oggi) con quanto tolgono: `c` = spegnere il rilievo (A − C), `d` = spegnere la pelle (A − D).
 * `solo` chiede la sola mediana positiva (per scegliere E sui primi giri); altrimenti vuole la differenza significativa.
 */
export function leveDa(ris, solo = false) {
  const buone = []
  const c = differenze(ris, 'c'), d = differenze(ris, 'd')
  const ok = s => (solo ? s && s.med < 0 : significativa(s) && s.med < 0)
  if (ok(c && c.ms)) buone.push({ k: 'c', spegni: 'rilievo', nome: 'spegnere il rilievo', ms: -c.ms.med, js: c.js ? -c.js.med : null, gpu: c.gpu ? -c.gpu.med : null })
  if (ok(d && d.ms)) buone.push({ k: 'd', spegni: 'pelle', nome: 'spegnere la pelle', ms: -d.ms.med, js: d.js ? -d.js.med : null, gpu: d.gpu ? -d.gpu.med : null })
  return buone.sort((x, y) => y.ms - x.ms)
}

/** Le opzioni della variante E: spegnere le leve che dai giri già fatti tolgono ms. */
export const opzE = ris => ({ spegni: leveDa(ris, true).map(l => l.spegni) })
