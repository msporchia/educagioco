// Gli elementi di una scena 3D, per sapere chi pesa (docs/core/vecchio-telefono-elementi.md): ogni cosa che si disegna porta il nome
// del suo elemento (`segna`, `userData.elemento3d`: `elemento` è già del gioco, quello di un'arma; i figli lo ereditano) e un elemento spento non si disegna né fa ombra, senza buttarlo
// né toccare il gioco: va sullo strato 31, che nessuna telecamera guarda (la sua `visible` resta di chi gioca). Una mesh con più
// materiali dice l'elemento di ognuno (`userData.elementiMateriali`): si spegne il materiale. Dato puro sulla scena di three.

const VIA = 1 << 31   // lo strato 31: la telecamera e l'ombra guardano lo 0

/** `o` è dell'elemento `nome` (con i suoi figli); torna `o`. */
export const segna = (o, nome) => { if (o) o.userData.elemento3d = nome; return o }

/** Quello che `fai()` aggiunge in fondo a `radice` è dell'elemento `nome`; torna quello che torna `fai`. */
export function segnaNuovi(radice, nome, fai) {
  const n0 = radice.children.length
  const r = fai()
  for (let i = n0; i < radice.children.length; i++) segna(radice.children[i], nome)
  return r
}

function metti(o, via) {
  const d = o.userData
  if (via) { if (!('strato0' in d)) { d.strato0 = o.layers.mask; o.layers.mask = VIA } }
  else if ('strato0' in d) { o.layers.mask = d.strato0; delete d.strato0 }
}
function mettiMateriale(m, via) {
  const d = m.userData
  if (via) { if (!('visto0' in d)) { d.visto0 = m.visible; m.visible = false } }
  else if ('visto0' in d) { m.visible = d.visto0; delete d.visto0 }
}
function cammina(o, sopra, spento) {
  const e = o.userData.elemento3d || sopra
  if (e) metti(o, spento(e))
  const mm = o.userData.elementiMateriali
  if (mm && Array.isArray(o.material)) o.material.forEach((m, i) => { if (mm[i]) mettiMateriale(m, spento(mm[i])) })
  const c = o.children
  for (let i = 0; i < c.length; i++) cammina(c[i], e, spento)
}

/** Spegne (`spento(nome)` vero) o riaccende gli elementi di tutta la scena. `resto`: il nome di quello che sta in cima senza nome
    (le luci di fondo, una cosa dimenticata): se c'è, anche lui si spegne, e la scena «tutto spento» è vuota davvero. */
export function nascondiElementi(radice, spento, resto = null) {
  const c = radice.children
  for (let i = 0; i < c.length; i++) cammina(c[i], resto, spento)
}

/**
 * Il passo di ogni fotogramma: `nomi` gli elementi di quella scena, `acceso(nome)` se si disegna. Se tutti sono accesi non fa niente
 * (un giro su `nomi`); se uno è spento ripassa la scena (le cose nate dopo, gli effetti, si spengono anche loro), e una volta ancora
 * quando si riaccendono tutti.
 */
export function creaElementi(nomi, acceso, resto = 'resto') {
  let prima = false
  return radice => {
    const ora = nomi.some(k => !acceso(k))
    if (ora || prima) nascondiElementi(radice, k => nomi.includes(k) && !acceso(k), nomi.includes(resto) ? resto : null)
    prima = ora
  }
}
