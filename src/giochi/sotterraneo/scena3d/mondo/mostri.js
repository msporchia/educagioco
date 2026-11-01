// I mostri del mondo di sopra a schermo (docs/sotterraneo/mondo-aperto-mostri.md, «La scena»): dallo stato del motore
// (motore/aperta.js, `mostriVicini`) la lista delle figure da posare, ancorate come le persone (persone.js). Si vede solo chi sta
// dentro il cerchio di luce attorno all'eroe (SOPRA.vista) e dove la nebbia è già aperta; al bordo del cerchio sfuma. Ognuno si vede
// col modello o con la sua sagoma (persone.js); il caporale e il signore della regione sono più grandi. Puro, senza three:
// unita/sotterraneo-mostri-sopra-scena.
import { haModelloPerTerra } from '../per-terra-pura.js'
import { ALTO_DELLA_SPECIE, GRANDEZZA_DELLA_SPECIE } from '../../dati/altezze.js'
import { SOPRA } from '../../dati/mondo-aperto-mostri.js'

export const PIU_GRANDE = { caporale: 1.15, signore: 1.4 }
export const ORLO = 1.5   // le ultime celle del cerchio, dove un mostro sfuma

// quanto si vede un mostro a `d` celle dall'eroe: pieno dentro il cerchio, sfuma nell'orlo, fuori niente
export function luceDelCerchio(d, raggio = SOPRA.vista) {
  if (!(d < raggio)) return 0
  if (d <= raggio - ORLO) return 1
  return (raggio - d) / ORLO
}

// la misura di un mostro di sopra (dati/altezze.js): `alto` il suo posto in celle (prima dell'allungo della vista), `scala` la grandezza
// per la macchia d'ombra; il caporale e il signore più grandi
export function figuraDiSopra(q) {
  const piu = q.signore ? PIU_GRANDE.signore : q.caporale ? PIU_GRANDE.caporale : 1
  return { alto: (ALTO_DELLA_SPECIE[q.tipo] || 1) * piu, scala: (GRANDEZZA_DELLA_SPECIE[q.tipo] || 1) * piu }
}

// Le figure da posare: `vicini` i mostri vivi entro il cerchio (mostriVicini), (x, z) l'eroe, `visto(x, z)` la nebbia, `salta` gli
// indici che disegna qualcun altro (chi sta nello scontro, sul palco), `memoria` una Map (indice → dove stava l'ultima volta) per
// sapere chi corre e da che parte guarda. Torna [{ i, tipo, grado, alto, scala, x, z, alfa, specchio, sveglio, caporale, signore, nome }]
export function mostriDaDisegnare(vicini, { x, z, t, visto = () => true, salta = null, memoria = null, raggio = SOPRA.vista }) {
  const l = []
  for (const q of vicini) {
    if (q.morto || (salta && salta.has(q.i)) || !visto(q.fx, q.fy)) continue
    const alfa = luceDelCerchio(Math.hypot(q.fx - x, q.fy - z), raggio)
    if (alfa <= 0) continue
    const prima = memoria && memoria.get(q.i)
    const dx = prima ? q.fx - prima.x : 0, dz = prima ? q.fy - prima.z : 0
    const corre = Math.hypot(dx, dz) > 0.002
    // da che parte guarda: dove va; fermo, dove guardava (sveglio: verso l'eroe)
    const specchio = Math.abs(dx) > 0.002 ? dx < 0 : prima && prima.specchio != null ? (q.sveglio ? x < q.fx : prima.specchio) : x < q.fx
    if (memoria) memoria.set(q.i, { x: q.fx, z: q.fy, specchio })
    const f = figuraDiSopra(q)
    l.push({ i: q.i, tipo: q.tipo, grado: q.grado, alto: f.alto, scala: f.scala, corre, x: q.fx, z: q.fy, alfa, specchio, sveglio: !!q.sveglio, caporale: !!q.caporale,
             signore: !!q.signore, nome: q.signore || q.caporale ? q.scheda.nome : null })
  }
  return l
}

// le cose rimaste per terra dopo uno scontro (stato.perTerra) dove si è già visto: un poco sopra il prato, col modello (persone.js,
// roba-per-terra.js) o lo sprite di chi non ce l'ha; `r` è la cosa dello stato, che resta la stessa da un fotogramma all'altro
export function coseDaDisegnare(perTerra, { visto = () => true, cose }) {
  const l = []
  perTerra.forEach((c, i) => {
    const k = cose[c.cosa]
    if (!k || !(k.sprite || haModelloPerTerra(c.cosa)) || !visto(c.x + 0.5, c.y + 0.5)) return
    l.push({ i, r: c, cosa: c.cosa, pezzo: k.sprite, x: c.x + 0.5, z: c.y + 0.5, rarita: k.rarita || null })
  })
  return l
}
