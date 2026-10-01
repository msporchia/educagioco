// Tenere premuto su un tasto che ha già un mestiere (una tessera, una
// risposta spagnola): chiede la traduzione della parola sotto il dito invece
// di premerlo. Il click che arriva dopo si ingoia. Uno spostamento oltre la
// soglia del dito (docs/core/il-dito.md) vuol dire che stava scorrendo.
export const TENERE = 450
const SOGLIA = 16

export function tenere(azione) {
  let timer = 0, preso = false, x0 = 0, y0 = 0
  return {
    giu(e) {
      preso = false
      x0 = e.clientX; y0 = e.clientY
      const el = e.target instanceof Element ? e.target : null
      const tasto = e.currentTarget
      clearTimeout(timer)
      timer = setTimeout(() => {
        preso = true
        const parola = (el && el.closest('[data-parola]')) || tasto
        azione(parola)
      }, TENERE)
    },
    muovi(e) { if (Math.hypot(e.clientX - x0, e.clientY - y0) > SOGLIA) clearTimeout(timer) },
    su() { clearTimeout(timer) },
    // da chiamare in testa al click: vero se questo click va ignorato
    ingoia() { const era = preso; preso = false; return era },
  }
}
