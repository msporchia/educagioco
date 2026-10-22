/* Come si dice un tempo a un bambino: i tempi della fattoria 3D sono quelli della 2D, in minuti veri (un campo di grano ci mette 5 minuti, un uovo 8),
   quindi «320s» non si legge più. Sotto il minuto i secondi, poi i minuti (arrotondati per eccesso: «fra 154 secondi» non si dice), poi le ore. */

/** `ms` → «45 s», «5 min», «1 h 20 min». Un tempo non finito o negativo diventa «0 s». */
export function tempoBreve(ms) {
  const s = Math.max(0, Math.ceil((Number.isFinite(ms) ? ms : 0) / 1000))
  if (s < 60) return s + ' s'
  const m = Math.ceil(s / 60)
  if (m < 60) return m + ' min'
  const h = Math.floor(m / 60), r = m % 60
  return r ? `${h} h ${r} min` : `${h} h`
}
