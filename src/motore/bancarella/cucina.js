/* LA CUCINA — prova: un fornello, due piatti, poi la cassa di sempre.
   Vedi docs/bancarella/cucina.md. Puro, gira in Node. */

/* I secondi della pentola: quanto cuoce, e quanto resta buona prima di scuocere. */
export const COTTURA = 7
export const TIENE = 6

export const PIATTI = [
  { emoji: '🍝', nome: 'pasta al pomodoro', prezzo: 650, banco: 'cucina' },
  { emoji: '🥪', nome: 'panino al formaggio', prezzo: 350, banco: 'cucina' },
]

/* Le cose da prendere: dove vanno lo decide `tocca`. */
export const DISPENSA = ['pasta', 'sugo', 'pane', 'formaggio']

export const cucinaNuova = () => ({ pentola: { fase: 'vuota', t: 0 }, piatti: [null, null] })

/* Il tempo passa solo sulla pentola: `cuoce` → `pronta` → `scotta`. */
export function avanza(c, dt) {
  const p = c.pentola
  if (p.fase === 'vuota' || p.fase === 'scotta') return c
  p.t += dt
  if (p.fase === 'cuoce' && p.t >= COTTURA) { p.fase = 'pronta'; p.t -= COTTURA }
  if (p.fase === 'pronta' && p.t >= TIENE) { p.fase = 'scotta'; p.t = 0 }
  return c
}

// quanto manca alla fine di questa fase, da 0 a 1: la barra sul fornello
export const quantoPentola = p => (p.fase === 'cuoce' ? p.t / COTTURA : p.fase === 'pronta' ? 1 - p.t / TIENE : 0)

const piattoLibero = c => c.piatti.findIndex(p => !p)
const piattoCon = (c, cosa) => c.piatti.findIndex(p => p && !p.pronto && p.cose.at(-1) === cosa)

/* Un tocco su una cosa della dispensa o sulla pentola. Torna `true` se è
   successo qualcosa: una mossa che non si può fare non cambia niente. */
export function tocca(c, cosa) {
  const p = c.pentola
  if (cosa === 'pentola') {
    if (p.fase === 'scotta') { c.pentola = { fase: 'vuota', t: 0 }; return true }
    if (p.fase !== 'pronta') return false
    const i = piattoLibero(c)
    if (i < 0) return false
    c.piatti[i] = { cose: ['pasta'], pronto: '' }
    c.pentola = { fase: 'vuota', t: 0 }
    return true
  }
  if (cosa === 'pasta') {
    if (p.fase !== 'vuota') return false
    c.pentola = { fase: 'cuoce', t: 0 }
    return true
  }
  if (cosa === 'pane') {
    const i = piattoLibero(c)
    if (i < 0) return false
    c.piatti[i] = { cose: ['pane'], pronto: '' }
    return true
  }
  const su = cosa === 'sugo' ? 'pasta' : cosa === 'formaggio' ? 'pane' : ''
  const i = su ? piattoCon(c, su) : -1
  if (i < 0) return false
  c.piatti[i].cose.push(cosa)
  c.piatti[i].pronto = cosa === 'sugo' ? '🍝' : '🥪'
  return true
}

/* Il piatto `i` va al cliente, se è quello che vuole: torna `true` e libera il posto. */
export function servi(c, i, vuole) {
  const p = c.piatti[i]
  if (!p || !p.pronto || p.pronto !== vuole) return false
  c.piatti[i] = null
  return true
}
