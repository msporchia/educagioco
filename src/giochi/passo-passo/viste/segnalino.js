/* Il segnalino delle due mappe (viste/Valle.vue e viste/MondoZaino.vue): l'animale
   che salta di posto in posto, a fotogrammi, fermo a schermo nascosto. La
   strada gliela dà chi lo usa (`viaggio(da, a)`, i passi di scena/valle.js o
   scena/isole.js); `segui` riceve dove sta, per la vista; `arrivato` il nodo
   dove si è posato. Vedi docs/passo-passo/mappa.md, «Il segnalino». */
import { ref, shallowRef } from 'vue'
import { arco, ANIMALE } from '../scena/isole.js'

export function usaSegnalino({ nodoDi, viaggio, segui = () => {}, arrivato = () => {} }) {
  const el = ref(null), corpo = ref(null), ombra = ref(null)
  const posato = ref(null)          // l'id del nodo dove sta, o dell'ultimo da cui è passato
  const animale = ref('coniglio')
  const viaggiando = shallowRef(null)
  const mira = ref(null)            // dove sta andando
  const sbuffo = ref(null)          // { x, y, n }: la nuvoletta dove l'animale cambia su un ponte
  let verso = 1                     // guarda a destra (1) o a sinistra (-1)
  let qui = null                    // dove ripartire: un nodo, o un punto a metà strada
  let nSbuffo = 0

  function metti(p, terra, { sx = 1, sy = 1, alfa = 1 } = {}) {
    if (el.value) {
      el.value.style.transform = `translate(${Math.round(p.x - ANIMALE.largo / 2)}px, ${Math.round(p.y - ANIMALE.alto)}px)`
      el.value.style.opacity = alfa.toFixed(2)
    }
    if (corpo.value) corpo.value.style.transform = `scale(${(verso * sx).toFixed(3)}, ${sy.toFixed(3)})`
    // l'ombra resta per terra, e si stringe quando lui è in alto
    if (ombra.value) {
      const su = Math.max(0, terra.y - p.y)
      ombra.value.style.transform = `translate(${Math.round(terra.x - 14)}px, ${Math.round(terra.y - 3)}px) scale(${Math.max(0.45, 1 - su / 120).toFixed(2)})`
      ombra.value.style.opacity = (alfa * Math.max(0.35, 1 - su / 160)).toFixed(2)
    }
  }
  function posa() {
    const n = nodoDi(posato.value)
    if (!n) return
    qui = n.id
    animale.value = n.animale
    metti(n.piede, n.piede)
  }

  /* Il viaggio fino a `a`, coi passi di `viaggio` (o quelli dati). Un altro
     `vai` durante il viaggio cambia meta: da fermo subito, se no appena
     finito il salto che sta facendo, da dove è atterrato. `dopo` si fa
     all'arrivo di questo viaggio (non se la meta cambia) al posto di posarlo:
     la tana che porta all'altra mappa. */
  function vai(a, { attesa = 0, passi: dati = null, coda = null, dopo = null } = {}) {
    if (viaggiando.value) { viaggiando.value.vai(a, { passi: dati, coda, dopo }); return }
    let passi = dati || [...viaggio(qui ?? posato.value, a), ...(coda || [])]
    if (!passi.length) {
      posato.value = a; posa(); arrivato(a)
      if (dopo) dopo()
      return
    }
    let i = 0, t = -attesa, prima = null, id = 0, finito = false, cambia = null, poi = dopo
    mira.value = a
    const arriva = () => {
      if (finito) return
      finito = true
      cancelAnimationFrame(id)
      posato.value = mira.value
      mira.value = null
      viaggiando.value = null
      if (poi) { qui = posato.value; poi(); return }
      posa()
      arrivato(posato.value)
    }
    // da fermo (prima di partire) si cambia subito, se no appena atterrato
    const strada = nuova => {
      passi = nuova.passi || [...viaggio(qui ?? posato.value, nuova.a), ...(nuova.coda || [])]
      i = 0; t = Math.max(0, t); mira.value = nuova.a; poi = nuova.dopo
    }
    const fotogramma = ora => {
      if (finito) return
      const nascosto = typeof document !== 'undefined' && document.hidden
      if (prima !== null && !nascosto) t += Math.min(0.05, Math.max(0, (ora - prima) / 1000))
      prima = ora
      while (i < passi.length && t >= passi[i].dur) {
        t -= passi[i].dur
        if (passi[i].al !== null && passi[i].al !== undefined) posato.value = passi[i].al
        qui = passi[i].qui !== undefined ? passi[i].qui : passi[i].al
        i++
        if (cambia) { strada(cambia); cambia = null }
      }
      if (cambia && i === 0 && t < 0) { strada(cambia); cambia = null }
      if (i >= passi.length) return arriva()
      if (t >= 0) {
        const p = passi[i]
        const q = t / p.dur
        animale.value = p.animale
        if (p.che === 'salto') {
          if (p.verso) verso = p.verso
          const s = arco(p.da, p.a, q, p.alto)
          metti(s, { x: s.x, y: p.da.y + (p.a.y - p.da.y) * q }, { sx: s.sx, sy: s.sy })
          segui(s.x, s.y)
        } else if (p.che === 'entra') {
          if (p.sbuffo && (!sbuffo.value || sbuffo.value.x !== p.dove.x || sbuffo.value.y !== p.dove.y))
            sbuffo.value = { x: p.dove.x, y: p.dove.y, n: ++nSbuffo }
          // si rimpicciolisce nel buco (o nella nuvoletta)
          metti({ x: p.dove.x, y: p.dove.y + q * 10 }, p.dove, { sx: 1 - q * 0.7, sy: 1 - q * 0.8, alfa: 1 - q })
          segui(p.dove.x, p.dove.y)
        } else {
          // sbuca: cresce dal buco, con un saltello
          const su = Math.sin(Math.PI * q) * 10
          metti({ x: p.dove.x, y: p.dove.y + (1 - q) * 10 - su }, p.dove,
                { sx: 0.3 + 0.7 * q, sy: 0.2 + 0.8 * q, alfa: Math.min(1, q * 1.6) })
          segui(p.dove.x, p.dove.y)
        }
      }
      id = requestAnimationFrame(fotogramma)
    }
    id = requestAnimationFrame(fotogramma)
    viaggiando.value = {
      chiudi: arriva,
      ferma() { finito = true; cancelAnimationFrame(id) },
      vai(nuova, { passi: p = null, coda: c = null, dopo: d = null } = {}) {
        if (nuova === mira.value && !p && !c) return
        cambia = { a: nuova, passi: p, coda: c, dopo: d }
      },
    }
  }

  return {
    el, corpo, ombra, posato, animale, viaggiando, mira, sbuffo, metti, posa, vai,
    get verso() { return verso },
    set verso(v) { verso = v || 1 },
    get qui() { return qui },
  }
}
