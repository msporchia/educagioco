// I segni scritti sopra la scena, in HTML nello strato sopra la tela: il 💤 di chi dorme, la corona e il nome del bersaglio di
// una missione e del mostro grosso, i galloni del caporale, la barretta della vita, i «+12 ✨» che salgono. Una riserva di
// elementi riusati: a ogni fotogramma si posano dove serve (`metti`), e il contenuto si riscrive solo quando cambia.
const CLASSE = 'sot3d-segno'

export function creaEtichette(strato) {
  const pool = []
  let n = 0
  const nuovo = () => {
    const el = document.createElement('div')
    el.className = CLASSE
    el.dataset.chiave = ''
    strato.appendChild(el)
    pool.push(el)
    return el
  }
  return {
    inizia() { n = 0 },
    // (x, y) in px nel campo, `chiave` dice il contenuto (si riscrive solo se cambia), `html` lo dà; `attr` i data- per i test
    metti(x, y, chiave, html, attr = null) {
      const el = pool[n] || nuovo()
      n++
      if (el.dataset.chiave !== chiave) {
        el.dataset.chiave = chiave
        el.innerHTML = html()
        for (const k of Object.keys(el.dataset)) if (k !== 'chiave') delete el.dataset[k]
        if (attr) for (const [k, v] of Object.entries(attr)) el.dataset[k] = v
      }
      const rx = Math.round(x), ry = Math.round(y)
      if (el._x !== rx || el._y !== ry) { el._x = rx; el._y = ry; el.style.transform = `translate(${rx}px, ${ry}px)` }
      if (el.hidden) el.hidden = false
    },
    chiudi() { for (let i = n; i < pool.length; i++) if (!pool[i].hidden) pool[i].hidden = true },
    // un altro strato (la discesa scaldata prima entra nella pagina: indice.js, `sposta`)
    sposta(nuovo) { strato = nuovo; for (const el of pool) nuovo.appendChild(el) },
    via() { for (const el of pool) el.remove(); pool.length = 0 },
  }
}

// i pezzi di HTML: niente dati del bambino, solo nomi del gioco (escape per sicurezza: i nomi sono dati)
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
export const barretta = q => `<i class="sot3d-vita"><b style="width:${Math.round(q * 100)}%"></b></i>`
