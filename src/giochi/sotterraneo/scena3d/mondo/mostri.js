// I mostri del mondo di sopra a schermo (docs/sotterraneo/mondo-aperto-mostri.md, «La scena»): dallo stato del motore
// (motore/aperta.js, `mostriVicini`) la lista delle figure da posare, ancorate come le persone (persone.js). Si vede solo chi sta
// dentro il cerchio di luce attorno all'eroe (SOPRA.vista) e dove la nebbia è già aperta; al bordo del cerchio sfuma. Chi dorme
// respira piano, chi è sveglio corre; il caporale e il signore della regione sono più grandi. Puro, senza three: unita/sotterraneo-mostri-sopra-scena.
import { MOSTRI } from '../../dati/mostri.js'
import { PEZZI } from '../../dati/atlante.js'
import { fotogrammaDi, quantiFotogrammi } from '../../dati/fotogrammi.js'
import { fattoreDelMostro } from '../../viste/campo.js'
import { SOPRA } from '../../dati/mondo-aperto-mostri.js'

export const PIU_GRANDE = { caporale: 1.15, signore: 1.4 }
export const ORLO = 1.5   // le ultime celle del cerchio, dove un mostro sfuma

// quanto si vede un mostro a `d` celle dall'eroe: pieno dentro il cerchio, sfuma nell'orlo, fuori niente
export function luceDelCerchio(d, raggio = SOPRA.vista) {
  if (!(d < raggio)) return 0
  if (d <= raggio - ORLO) return 1
  return (raggio - d) / ORLO
}

// la figura di un mostro a un istante `t` (secondi veri): il pezzo dell'atlante e la scala. `corre`: si sta muovendo adesso.
// I fotogrammi al secondo sono quelli delle discese (scena3d/cose.js): 8 di corsa, 4 il respiro di chi è sveglio, 1,5 chi dorme
export function figuraDiSopra(q, t, corre = false) {
  const scheda = MOSTRI[q.tipo] || {}
  const passi = !scheda.unaPosa && quantiFotogrammi(scheda.sprite, 'corsa') > 0
  const posa = corre && passi ? 'corsa' : 'fermo'
  const fr = Math.floor((t + (q.i % 7) * 0.37) * (corre ? 8 : q.sveglio ? 4 : 1.5))
  const pezzo = fotogrammaDi(scheda.sprite, posa, fr)
  const p = PEZZI[pezzo]
  const piu = q.signore ? PIU_GRANDE.signore : q.caporale ? PIU_GRANDE.caporale : 1
  return { pezzo, scala: fattoreDelMostro(q.tipo, p ? p[3] : 16, p ? p[2] : 0) * piu }
}

// Le figure da posare: `vicini` i mostri vivi entro il cerchio (mostriVicini), (x, z) l'eroe, `visto(x, z)` la nebbia, `salta` gli
// indici che disegna qualcun altro (chi sta nello scontro, sul palco), `memoria` una Map (indice → dove stava l'ultima volta) per
// sapere chi corre e da che parte guarda. Torna [{ i, pezzo, scala, x, z, alfa, specchio, sveglio, caporale, signore, nome }]
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
    const f = figuraDiSopra(q, t, corre)
    l.push({ i: q.i, pezzo: f.pezzo, scala: f.scala, x: q.fx, z: q.fy, alfa, specchio, sveglio: !!q.sveglio, caporale: !!q.caporale,
             signore: !!q.signore, nome: q.signore || q.caporale ? q.scheda.nome : null })
  }
  return l
}

// le cose rimaste per terra dopo uno scontro (stato.perTerra) dove si è già visto: il loro sprite, un poco sopra il prato
export function coseDaDisegnare(perTerra, { visto = () => true, cose }) {
  const l = []
  perTerra.forEach((c, i) => {
    const k = cose[c.cosa]
    if (!k || !k.sprite || !visto(c.x + 0.5, c.y + 0.5)) return
    l.push({ i, pezzo: k.sprite, x: c.x + 0.5, z: c.y + 0.5, rarita: k.rarita || null })
  })
  return l
}
