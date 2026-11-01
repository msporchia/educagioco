/* I posti dove i compagni si fermano a dormire: la panchina, il ceppo, la cassa, la sedia (i gatti salgono con un salto) e la cuccia
   (Watson ci si corica accanto). Dato puro e scelte pure, senza three: `scena3d/compagni.js` muove i corpi. Un posto ha **un solo
   occupante**: chi ci sta sopra, chi ci sta andando e chi l'ha prenotato contano tutti, e chi arriva dopo ne sceglie un altro.
   Vedi docs/fattoria3d/compagni.md «I posti». */

/** `quota`: l'altezza della seduta (m); `dir`: dove guarda chi dorme; `per`: chi lo usa; `accanto`: non si sale, ci si corica nella cella di fronte. */
export const POSTI = {
  panchina: { quota: 0.45, dir: Math.PI / 2, per: ['gatto'] },
  ceppo:    { quota: 0.42, dir: 2.4, per: ['gatto'] },
  cassa:    { quota: 0.5, dir: 0.6, per: ['gatto'] },
  sedia:    { quota: 0.47, dir: 0, per: ['gatto'] },
  cuccia:   { quota: 0, dir: Math.PI, per: ['cane'], accanto: true },
}

/** Le cose del terreno che sono un posto per questa specie. */
export const postiPer = (tipo, cose) => cose.filter(k => POSTI[k.tipo] && POSTI[k.tipo].per.includes(tipo))

/** Chi occupa una cosa: sopra (`sopra.id`) o in cammino verso (`poi.posto.id`). Ogni compagno ha al massimo un posto. */
export const occupanti = (compagni, cosaId, tranne = null) =>
  compagni.filter(c => c !== tranne && (c.sopra?.id === cosaId || c.poi?.posto?.id === cosaId))
export const postoLibero = (compagni, cosaId, tranne = null) => occupanti(compagni, cosaId, tranne).length === 0

/** I posti che `chi` può prendere adesso: per la sua specie e non occupati da altri. */
export const postiLiberi = (compagni, cose, chi) => postiPer(chi.tipo, cose).filter(k => postoLibero(compagni, k.id, chi))

/** Un posto a caso fra quelli liberi, o null. */
export function scegliPosto(compagni, cose, chi, rnd = Math.random) {
  const l = postiLiberi(compagni, cose, chi)
  return l.length ? l[Math.min(l.length - 1, Math.floor(rnd() * l.length))] : null
}
