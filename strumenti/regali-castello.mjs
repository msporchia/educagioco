/* ═══════════════════════════════════════════════════════════════════
   QUANTO SPOSTANO I REGALI, DAVVERO

   I regali della partita libera (`REGALI` in `data/castello.js`)
   restano per sempre e si riprendono senza tetto: un bambino che gioca
   spesso ne accumula decine. Dimensionarli a occhio vuol dire
   sbagliarli nei due versi — gradini che sulla carta sembrano enormi
   (+30%) e al muro non spostano un'ondata, o gradini piccoli che dopo
   cento partite fanno la difesa immortale. Qui lo si misura: il
   giocatore modello (`PROFILI.misura` di `simula-castello.mjs`) gioca
   ogni libera fino alla sconfitta con N gradi già in tasca, e si legge
   a che ondata cede.

   ── come li prende un bambino ──
   Non spalmati in ordine di catalogo: **dal giro delle carte**. Il
   regalo numero `k` si sceglie fra le tre di `regaliOfferti(k)`, e il
   bambino finto prende a turno la prima, la seconda, la terza
   (`sceltaDelBambino`). È il modo più vicino al vero senza inventarsi
   dei gusti: ogni voce passa, nessuna domina, e anche il veleno — che
   al giocatore modello non serve, perché i rami non li sceglie — ogni
   tanto viene preso, come lo prenderebbe chi non ha letto la carta.
   Durante la partita continua dallo stesso punto del giro: con N gradi
   in tasca, il primo regalo della partita è il numero N.

   Il giocatore modello non sbaglia conti, quindi il seme non cambia
   niente: una partita per libera e per N basta.

   Uso:
     node strumenti/regali-castello.mjs                  # 0 10 20 35 50 100
     node strumenti/regali-castello.mjs 0,50,200,400     # altri gradi
     node strumenti/regali-castello.mjs --soli 40        # 40 gradi su una voce sola
   ═══════════════════════════════════════════════════════════════════ */
import { LIBERE, REGALI, QUANTE_CARTE, regaliOfferti } from '../src/data/castello.js'
import { gioca, PROFILI } from './simula-castello.mjs'

/* il regalo numero `k` (da zero) che sceglierebbe il bambino */
export const sceltaDelBambino = k => regaliOfferti(k)[k % QUANTE_CARTE].id

/* i primi `n` regali presi a quel modo, come `{ id: quanti }` */
export function presiDaBambino(n) {
  const o = {}
  for (let k = 0; k < n; k++) { const id = sceltaDelBambino(k); o[id] = (o[id] || 0) + 1 }
  return o
}

/* Fin dove arriva la libera con quei regali in tasca. `attesa: 1` toglie
   solo il tempo morto fra un'ondata e l'altra (il metro non la chiama
   mai): con cento regali, trenta secondi per quaranta ondate si
   mangiavano l'ora che il simulatore concede, e la partita finiva per
   orologio invece che per difesa. `soli` mette tutti i gradi, e quelli
   presi in partita, su una voce sola. */
export function finoDove(libera, n, { soli = null } = {}) {
  const regali = soli ? { [soli]: n } : presiDaBambino(n)
  const sceglie = soli ? () => soli : i => sceltaDelBambino(n + i)
  const r = gioca({ ...libera, attesa: 1 }, { ...PROFILI.misura, regali, sceglie })
  return { onda: r.onda, esito: r.esito, presi: r.regali }
}

/* quanti gradi di una voce servono a raddoppiare quello che tocca: i
   gradi dello stesso regalo si **sommano** (+5%, +10%, +15%…), quindi
   è 1 ÷ il passo di un grado. Il passo lo si legge dal catalogo
   facendogli applicare un grado, non lo si ricopia. */
export function raddoppiaIn(r) {
  const d = { danno: { arciere: 1, magica: 1, bombe: 1, ghiaccio: 1 },
              raggio: 1, cadenza: 0, gelo: 0, fragile: 0, veleno: 1 }
  r.dai(d, 1)
  const passo = Math.max(...Object.values(d.danno)) - 1 || d.raggio - 1 ||
                d.veleno - 1 || d.cadenza || d.fragile
  return Math.ceil(1 / passo - 1e-9)
}

const lanciato = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())
if (lanciato) {
  const arg = process.argv.slice(2)
  const iSoli = arg.indexOf('--soli')
  if (iSoli >= 0) {
    const n = Number(arg[iSoli + 1] || 40)
    console.log(`${n} gradi su una voce sola (e i regali della partita sulla stessa):\n`)
    console.log(''.padEnd(20) + LIBERE.map(l => l.chiave.replace('libera-', '').padStart(12)).join(''))
    for (const r of REGALI)
      console.log(`${r.emoji} ${r.id}`.padEnd(20) +
                  LIBERE.map(l => `o${finoDove(l, n, { soli: r.id }).onda}`.padStart(12)).join(''))
  } else {
    const gradi = (arg[0] || '0,10,20,35,50,100').split(',').map(Number)
    console.log('dove cede la libera, con N gradi già in tasca (+ quelli presi in partita):\n')
    console.log('gradi'.padEnd(20) + gradi.map(n => String(n).padStart(7)).join(''))
    for (const l of LIBERE) {
      const riga = gradi.map(n => {
        const f = finoDove(l, n)
        return (`o${f.onda}` + (f.esito === 'persa' ? '' : '!')).padStart(7)
      })
      console.log(l.chiave.padEnd(20) + riga.join(''))
    }
    console.log('\ncome li ha presi, per 100 gradi: ' +
                Object.entries(presiDaBambino(100)).map(([id, q]) => `${id} ${q}`).join(' · '))
  }
  console.log('\ngradi perché una voce raddoppi quello che tocca: ' +
              REGALI.map(r => `${r.emoji} ${raddoppiaIn(r)}`).join(' · '))
}
