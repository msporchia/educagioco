// Le anteprime 3D nelle viste (docs/sotterraneo/anteprime-3d.md). Gioco.vue le fornisce solo nel Sotterraneo 3D: senza, ogni vista
// resta com'era (il Sotterraneo di sempre non cambia). Il servizio (e three) si carica alla prima richiesta; finché l'immagine non
// c'è, o se non verrà mai (niente modello, niente WebGL), la vista mostra lo sprite.
import { inject, provide, shallowRef, watch } from 'vue'

const ANTEPRIME = Symbol('anteprime3d')

const nellIndirizzo = re => typeof location !== 'undefined' && re.test(location.hash + location.search)

// Le anteprime fotografate sul computer (`npm run anteprime`, dati/anteprime-fatte.js): la roba, i mostri e le persone arrivano già fatte,
// decodificate una volta per chiave; il servizio (e three) disegna solo quel che manca, il ritratto dell'eroe vestito
let caricaFatte = null
const ottieniFatte = () => (caricaFatte ||= import('../dati/anteprime-fatte.js').then(m => m.ANTEPRIME, () => ({})))

/** Il fornitore senza Vue: le foto fatte, e il servizio per il resto. */
export function creaFornitore(eroe, { senzaMostri = false, senzaEroe = false } = {}) {
  let servizio = null, carica = null, chiuso = false, fatte = null
  const ottieni = () => (carica ||= import('../scena3d/anteprime3d.js')
    .then(m => (chiuso ? null : (servizio = m.creaAnteprime3d())))
    .catch(() => null))
  const decodificate = new Map()   // chiave → l'immagine pronta (Quadro3d la copia come una tela), o la promessa finché si decodifica
  function fotoDi(k) {
    if (decodificate.has(k)) return Promise.resolve(decodificate.get(k))
    const img = new Image()
    img.src = fatte[k]
    const p = (img.decode ? img.decode() : Promise.resolve()).then(() => { decodificate.set(k, img); return img }, () => { decodificate.delete(k); return null })
    decodificate.set(k, p)
    return p
  }
  const pronta = k => { const x = decodificate.get(k); return x && !(x instanceof Promise) ? x : null }
  const vale = k => !!k && !(k.startsWith('mostro:') && senzaMostri) && !((k.startsWith('eroe:') || k.startsWith('busto:')) && senzaEroe)
  const viva = k => ottieni().then(s => (s ? s.chiedi(k) : null))
  const api = {
    eroe,
    leggi: k => (vale(k) ? pronta(k) || (servizio ? servizio.leggi(k) : null) : null),
    chiedi: k => (vale(k) ? ottieniFatte().then(f => { fatte = f; return f[k] ? fotoDi(k) : viva(k) }) : Promise.resolve(null)),
    viva: k => (vale(k) ? viva(k) : Promise.resolve(null)),      // sempre col renderer (`npm run anteprime`)
    fatte: () => decodificate.size,                              // per le misure: quante foto fatte decodificate
    stato: () => (servizio ? servizio.stato() : null),
    programmi: () => (servizio ? servizio.programmi() : null),   // per le misure (docs/sotterraneo/prestazioni-3d.md)
    via() { chiuso = true; if (servizio) servizio.via(); if (typeof window !== 'undefined' && window.__anteprime3d === api) delete window.__anteprime3d },
  }
  return api
}

/** In Gioco.vue (solo nel 3D). `eroe()`: la chiave dell'eroe di adesso (l'armatura si mostra su chi la porta). */
export function fornisciAnteprime3d(eroe) {
  // `#icone2d` le spegne tutte; `#sprite` spegne i mostri e `#eroe2d` l'eroe, come in scena
  const spente = nellIndirizzo(/[#&?]icone2d\b/)
  const api = creaFornitore(eroe, { senzaMostri: nellIndirizzo(/[#&?]sprite\b/), senzaEroe: nellIndirizzo(/[#&?]eroe2d\b/) })
  if (!spente) { provide(ANTEPRIME, api); ottieniFatte() }
  if (typeof window !== 'undefined' && !spente) window.__anteprime3d = api   // per le prove: stato()
  return api
}

/** Il servizio, se c'è (null nel 2D). */
export const usaAnteprime3d = () => inject(ANTEPRIME, null)

/** L'immagine 3D (una tela, viste/Quadro3d.vue) per la chiave che `chiave()` dà ora: un ref che resta null finché non è pronta (o se non lo sarà mai). */
export function usaAnteprima(chiave) {
  const s = usaAnteprime3d()
  const url = shallowRef(null)
  if (!s) return url
  watch(chiave, k => {
    url.value = k ? s.leggi(k) : null
    if (k && !url.value) s.chiedi(k).then(u => { if (chiave() === k) url.value = u })
  }, { immediate: true })
  return url
}
