// La fascia grafica del telefono (docs/core/vecchio-telefono.md, «La fascia»): un telefono non cambia prestazioni nel tempo, quindi si
// misura una volta (grafica/benchmark/qualita-rapida.js, meno di un secondo) e si tiene qui, fuori dai profili; si rimisura dopo
// un mese o se cambia lo schermo. I giochi 3D leggono `fasciaAttiva()` quando partono e prendono da `PROFILI` i numeri della loro fascia.
import { ref } from 'vue'
import { load, save, flush } from './storage.js'

const CHIAVE = 'qualita'
export const FASCE = ['alta', 'media', 'bassa']
const SCADENZA = 30 * 86400000
export const VERSIONE_MISURA = 1     // si alza se cambia la prova o le soglie: le misure vecchie si rifanno

// Tutto quello che una fascia cambia, in un posto solo. Il Sotterraneo non perde botti, arredo e ombre (dai log del Note 7 i triangoli
// costano poco: da 10k a 100k solo +1,4 ms): si abbassano i pixel, le fette di nebbia e il passaggio finale. `alta` è il gioco di prima. I numeri della bassa e della media sono da
// provare sul telefono (docs/core/vecchio-telefono.md): si ritoccano qui.
// La bassa nel Sotterraneo 3D (i nomi di ACCESI in scena3d/costanti.js, `nome:numero` per un numero): niente passaggio finale, due fuochi
// accesi invece di sei, lampo e magia in una luce sola e niente rimbalzo né luce del palco (ogni luce puntiforme costa a ogni pixel
// anche spenta), l'ombra a 512 ridisegnata a fotogrammi alterni, la nebbia con due strati di rumore, metà scintille
// (docs/sotterraneo/grafica-3d-costi.md, «La fascia bassa»)
// misurato sul Note 7 (log del 22/10): l'ombra del cono costa ~8 ms, la nebbia a più fette ~3-6, la polvere ~2; vedi docs/core/vecchio-telefono-elementi.md
// e il piano con la luce per vertice e la nebbia nei vertici (docs/sotterraneo/appiattimento-3d.md, «Nel gioco»); `rilievo`: nelle discese la bassa
// le normal map le ha già tolte (terreno e arredo semplici), resta il terreno di sopra (docs/sotterraneo/prestazioni-3d-bassa.md)
const SPEGNI_BASSA = ['post', 'fuochi:2', 'lampi', 'palco', 'ombre', 'ombraMappa:512', 'ombraOgni:2', 'ottaveNebbia:2', 'quanteScintille:0.5', 'nebbiaFitta', 'quantaPolvere:0.4', 'lucePerVertice:1', 'terrenoSemplice:1', 'arredoSemplice:1', 'arredoFuso:1', 'armiSemplici:1', 'torciaSemplice:1', 'rilievo', 'rumoreTrama:1']
// `mostriSopra`: quanti mostri al più col modello 3D nel mondo di sopra (gli altri sprite): ~35 chiamate l'uno, nella bassa 6 invece di 8
// (con 8 il filo principale del telefono imitato sta a 29-35 ms: docs/sotterraneo/limiti-3d.md)

export const PROFILI = {
  alta:  { asteroidi: { dprPartenza: 2,   scintille: 1400, fumo: 400, lenti: 90, passo: 0.85 }, sotterraneo: { dprMax: 1.5,  fetteNebbia: 5, mostriSopra: 8, spegni: [] } },
  media: { asteroidi: { dprPartenza: 1.5, scintille: 700,  fumo: 200, lenti: 45, passo: 0.8 },  sotterraneo: { dprMax: 1.25, fetteNebbia: 3, mostriSopra: 8, spegni: [] } },
  bassa: { asteroidi: { dprPartenza: 1,   scintille: 350,  fumo: 100, lenti: 20, passo: 0.75 }, sotterraneo: { dprMax: 1, dprMin: 1, fetteNebbia: 2, mostriSopra: 6, spegni: SPEGNI_BASSA } },
}

export const scelta = ref('auto')   // 'auto' o una fascia, deciso dai grandi
export const misura = ref(null)     // { fascia, punti, js, quando, gpu, dpr, v }

// mai il booleano nudo né una stringa sola: un oggetto (vedi docs/core/archivio.md)
export async function avviaQualita() {
  const c = await load(CHIAVE)
  scelta.value = FASCE.includes(c?.scelta) ? c.scelta : 'auto'
  misura.value = c?.misura && FASCE.includes(c.misura.fascia) ? c.misura : null
}
const scrivi = () => { save(CHIAVE, { scelta: scelta.value, misura: misura.value }); return flush() }
export const scegliFascia = f => { scelta.value = FASCE.includes(f) ? f : 'auto'; return scrivi() }
export const salvaMisura = m => { misura.value = m; return scrivi() }

// il cheat `#…&qualita=bassa` vince su tutto (per provare sul computer); poi la scelta dei grandi; poi la misura; senza niente, alta
export function fasciaAttiva() {
  const q = typeof location !== 'undefined' ? new URLSearchParams((location.hash || '').slice(1)).get('qualita') : null
  if (FASCE.includes(q)) return q
  if (scelta.value !== 'auto') return scelta.value
  return misura.value ? misura.value.fascia : 'alta'
}
export const profilo = gioco => PROFILI[fasciaAttiva()][gioco]

// da rifare? mai fatta, vecchia di un mese, cambiato lo schermo o la prova
export function serveMisura(ora = Date.now(), dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1) {
  const m = misura.value
  return !m || m.v !== VERSIONE_MISURA || ora - m.quando > SCADENZA || Math.abs((m.dpr || 0) - dpr) > 0.01
}
