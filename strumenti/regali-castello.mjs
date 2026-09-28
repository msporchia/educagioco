// Quanto spostano i regali, davvero: il giocatore modello gioca ogni libera
// fino alla sconfitta con N gradi già in tasca (presi dal giro delle carte,
// non spalmati per catalogo) e si legge a che ondata cede. Vedi
// docs/castello/libere.md.
//   node strumenti/regali-castello.mjs                  # 0 10 20 35 50 100
//   node strumenti/regali-castello.mjs 0,50,200,400     # altri gradi
//   node strumenti/regali-castello.mjs --soli 40        # 40 gradi su una voce sola
import { LIBERE, REGALI, QUANTE_CARTE, regaliOfferti } from '../src/data/castello.js'
import { gioca, PROFILI } from './simula-castello.mjs'

export const sceltaDelBambino = k => regaliOfferti(k)[k % QUANTE_CARTE].id

export function presiDaBambino(n) {
  const o = {}
  for (let k = 0; k < n; k++) { const id = sceltaDelBambino(k); o[id] = (o[id] || 0) + 1 }
  return o
}

// `attesa: 1` toglie solo il tempo morto fra un'ondata e l'altra (con cento
// regali, l'ora concessa al simulatore si mangiava per orologio, non per
// difesa). `soli` mette tutti i gradi su una voce sola.
export function finoDove(libera, n, { soli = null } = {}) {
  const regali = soli ? { [soli]: n } : presiDaBambino(n)
  const sceglie = soli ? () => soli : i => sceltaDelBambino(n + i)
  const r = gioca({ ...libera, attesa: 1 }, { ...PROFILI.misura, regali, sceglie })
  return { onda: r.onda, esito: r.esito, presi: r.regali }
}

// Quanti gradi servono a raddoppiare quello che tocca (1 ÷ il passo di un
// grado, letto facendo applicare un grado al catalogo, non ricopiato).
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
