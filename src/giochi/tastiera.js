// La tastiera nei giochi, solo a scuola (ACCESA): un tasto fa quello che fa il pulsante sullo schermo, e chi ha mouse e
// tastiera vede accanto ai pulsanti il tasto da premere. docs/core/tastiera.md
import { ref, onMounted, onUnmounted } from 'vue'
import { ACCESA } from './tastiera-accesa.js'

// a scuola i tasti si vedono sempre: i PC hanno la tastiera, e un PC con lo schermo touch si crede un tablet (provato a
// guardare il mouse, `pointer: fine`: sui portatili touch e nelle prove i tasti non comparivano)
export const conTastiera = ref(ACCESA)

const scrivibile = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

// il nome con cui la mappa conosce un tasto: 'ArrowLeft', 'Shift+ArrowLeft', 'Enter', 'Spazio', 'r', '7'
export function nomeDelTasto(e) {
  if (e.key === ' ' || e.key === 'Spacebar') return 'Spazio'
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
  return (e.shiftKey && k.startsWith('Arrow') ? 'Shift+' : '') + k
}

/* `mappa`: { nome del tasto: funzione }. `attivo`: se il gioco ascolta adesso (niente fogli aperti, niente finale).
   Un tasto tenuto giù non si ripete (un passo per pressione), e Ctrl/Alt/⌘ restano del browser */
export function usaTasti(mappa, { attivo = () => true } = {}) {
  if (!ACCESA) return
  function premi(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing || scrivibile(e.target) || !attivo()) return
    const fai = mappa[nomeDelTasto(e)]
    if (!fai) return
    e.preventDefault()                    // le frecce e lo spazio non fanno scorrere la pagina
    conTastiera.value = true
    if (e.repeat) return
    // il pulsante cliccato col mouse tiene il fuoco: con Invio o Spazio scatterebbe anche lui
    const f = document.activeElement
    if (f && f !== document.body && typeof f.blur === 'function') f.blur()
    fai(e)
  }
  onMounted(() => addEventListener('keydown', premi))
  onUnmounted(() => removeEventListener('keydown', premi))
}
