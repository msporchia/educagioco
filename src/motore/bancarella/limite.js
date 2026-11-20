/* A SCUOLA — i livelli scelti dalla maestra in giro, e come si racconta un resto alla maestra.
   Puro, gira in Node: vedi docs/bancarella/scuola.md. */
import { CUCINE } from '../../data/bancarella-cucine.js'
import { euro } from '../../data/bancarella.js'

// i testi che vanno alla maestra (il tetto del servizio, docs/scuola/protocollo.md)
export const LUNGO = 40
// i livelli che si possono scegliere: tutti tranne Cinque minuti, che è a tempo e conta il record
export const A_SCUOLA = CUCINE.filter(c => !c.durata).length

/* `{ da, a }`, numeri di livello da 1: gli indici in CUCINE, in fila. Senza limite, o con uno storto, `null`: è casa */
export function livelliDelLimite(limite) {
  if (!limite || !Number.isInteger(limite.da) || !Number.isInteger(limite.a)) return null
  if (limite.da < 1 || limite.a > A_SCUOLA || limite.da > limite.a) return null
  return Array.from({ length: limite.a - limite.da + 1 }, (_, i) => limite.da - 1 + i)
}

/* La difficoltà della maestra (docs/bancarella/scuola.md): quanti cuori e quanta pazienza in più o in meno ai clienti.
   Normale è com'è a casa; senza limite, o con una parola che non conosce, è normale */
export const REGOLE = {
  facile: { cuori: 5, pazienza: 1.5 },
  normale: { cuori: 3, pazienza: 1 },
  difficile: { cuori: 2, pazienza: 0.75 },
}
export const regolaDi = limite => REGOLE[limite?.difficolta] || REGOLE.normale

// finito l'ultimo si ricomincia dal primo
export const dopoNelGiro = (giro, k) => giro[(giro.indexOf(k) + 1) % giro.length]

// «10 €» e «6,50 €»: i tondi senza virgola, se no non ci sta
export const soldi = c => (c % 100 ? euro(c) : `${c / 100} €`)
const corto = s => (s.length <= LUNGO ? s : s.slice(0, LUNGO - 1) + '…')

/* Un'ordinazione pagata, per la maestra: solo dove il resto lo conta il bambino (`chiediResto`), se no `null`.
   `sbaglio`: il primo conto che non tornava, `{ cosa: 'totale' | 'resto', cent }`; `dato`: il resto consegnato */
export function raccontaResto(c, { rifiuti, sbaglio, dato, ms }) {
  if (!c?.chiediResto) return null
  const due = c.chiediTotale
  const conto = due ? c.articoli.map(a => soldi(a.prezzo)).join(' + ') : soldi(c.totale)
  const detto = sbaglio ? (sbaglio.cosa === 'totale' ? `totale ${soldi(sbaglio.cent)}` : `${due ? 'resto ' : ''}${soldi(sbaglio.cent)}`)
    : `${due ? 'resto ' : ''}${soldi(dato)}`
  return {
    chiave: c.chiave, giusta: rifiuti === 0, ultima: true, ms: Math.round(ms),
    fatto: corto(`resto su ${soldi(c.paga)} per ${conto}`),
    data: corto(detto),
    attesa: corto(due ? `totale ${soldi(c.totale)} · resto ${soldi(c.resto)}` : soldi(c.resto)),
  }
}
