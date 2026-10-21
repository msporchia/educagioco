// Le anteprime 3D nelle viste (docs/sotterraneo/anteprime-3d.md). Gioco.vue le fornisce solo nel Sotterraneo 3D: senza, ogni vista
// resta com'era (il Sotterraneo di sempre non cambia). Il servizio (e three) si carica alla prima richiesta; finché l'immagine non
// c'è, o se non verrà mai (niente modello, niente WebGL), la vista mostra lo sprite.
import { inject, provide, shallowRef, watch } from 'vue'

const ANTEPRIME = Symbol('anteprime3d')

const nellIndirizzo = re => typeof location !== 'undefined' && re.test(location.hash + location.search)

/** In Gioco.vue (solo nel 3D). `eroe()`: la chiave dell'eroe di adesso (l'armatura si mostra su chi la porta). */
export function fornisciAnteprime3d(eroe) {
  // `#icone2d` le spegne tutte; `#sprite` spegne i mostri e `#eroe2d` l'eroe, come in scena
  const spente = nellIndirizzo(/[#&?]icone2d\b/)
  const senzaMostri = nellIndirizzo(/[#&?]sprite\b/), senzaEroe = nellIndirizzo(/[#&?]eroe2d\b/)
  let servizio = null, carica = null, chiuso = false
  const ottieni = () => (carica ||= import('../scena3d/anteprime3d.js')
    .then(m => (chiuso ? null : (servizio = m.creaAnteprime3d())))
    .catch(() => null))
  const vale = k => !!k && !(k.startsWith('mostro:') && senzaMostri) && !((k.startsWith('eroe:') || k.startsWith('busto:')) && senzaEroe)
  const api = {
    eroe,
    leggi: k => (servizio && vale(k) ? servizio.leggi(k) : null),
    chiedi: k => (vale(k) ? ottieni().then(s => (s ? s.chiedi(k) : null)) : Promise.resolve(null)),
    stato: () => (servizio ? servizio.stato() : null),
    via() { chiuso = true; if (servizio) servizio.via() },
  }
  if (!spente) provide(ANTEPRIME, api)
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
