/* Le visite, lato vista: il filo che unisce il motore dei vicini (motore/vicini.js), la mappa del trattore, la scena della visita
   (scena3d/visita.js, chiesta a richiesta) e i fogli della cassa e del mercato. Sta fuori da Gioco.vue per non gonfiarlo. Non conosce
   le monete né il profilo: usa il motore di casa che gli si dà. Vedi docs/fattoria3d/vicini.md. */
import { ref, shallowRef, computed, nextTick } from 'vue'
import { Vicini, motoreDiVisita } from './motore/vicini.js'
import { dettoDi } from './scena3d/detti.js'
import './stile-vicini.css'

const ANDATA_MS = 1300, RITORNO_MS = 800
const pausa = ms => new Promise(r => setTimeout(r, ms))
const tempo = ms => ms >= 60_000 ? Math.ceil(ms / 60_000) + ' min' : Math.max(1, Math.ceil(ms / 1000)) + ' s'

/** Una riga che dice cosa è successo, o cosa fare: il motore dei vicini torna { ok: false, motivo, … }. */
export function dettoVicino(r, extra = {}) {
  switch (r.motivo) {
    case 'cassa-piena': return `La cassa è piena! Riapre fra ${tempo(r.restoMs)}`
    case 'gia-pronto': return 'Di questo la cassa ne ha già abbastanza'
    case 'esaurito': return r.restoMs ? `Per ora è finito: torna fra ${tempo(r.restoMs)}` : 'Per ora è finito'
    case 'non-chiesto': case 'non-venduto': case 'non-comprato': return 'Questo non c\'è'
    case 'sconosciuto': return 'Questo villaggio non c\'è più'
    case 'mancano': {
      const n = Object.values(r.mancano || {})[0]
      return extra.emoji && n ? `Ti mancano ${extra.emoji} ${n}` : dettoDi('mancano-ingredienti', { ingredienti: r.mancano })
    }
    case 'poche-monete': return `Servono 🪙 ${r.costo}: te ne mancano ${r.mancano}`
    default: return dettoDi(r.motivo, { liv: r.liv })
  }
}

export function usaVisite({ dammi, tela, sopra, q, versione, cambio }) {
  const vicini = shallowRef(null)
  const fase = ref('casa')                  // casa | andata | visita | ritorno
  const mappaAperta = ref(false)
  const mappaMsg = ref('')
  const id = ref(null)
  const foglio = ref(null)                  // null | 'cassa' | 'mercato'
  const storia = ref(false)
  const messaggio = ref('')
  const verso = ref('')
  const chiave = ref(0)                     // una tela nuova a ogni visita: un contesto WebGL non si riusa
  const rev = ref(0)
  let mondoV = null, vivo = true

  const inVisita = computed(() => fase.value !== 'casa')
  const elenco = computed(() => { void versione.value; void rev.value; return vicini.value ? vicini.value.elenco() : [] })
  const scheda = computed(() => { void versione.value; void rev.value; return vicini.value && id.value ? vicini.value.scheda(id.value) : null })

  // le porte verso la scena della visita: ciò che non c'è (costruire, cartelli, trascinare) è un niente
  const uiVisita = new Proxy({
    cambio() { rev.value++; cambio() },
    fogliAperti: () => !!foglio.value || storia.value,
    apriLuogo(nome) { messaggio.value = ''; foglio.value = nome },
  }, { get: (t, k) => k in t ? t[k] : () => null })

  function avvia(salvato) { vicini.value = new Vicini({ motore: dammi().motore, stato: salvato }) }
  const serializza = () => vicini.value ? vicini.value.serializza() : null

  function apriMappa() {
    if (fase.value !== 'casa' || !vicini.value) return
    mappaMsg.value = ''; mappaAperta.value = true
  }

  async function vai(quale) {
    if (fase.value !== 'casa' || !vicini.value) return
    const r = vicini.value.entra(quale)
    if (!r.ok) return void (mappaMsg.value = dettoVicino(r))
    mappaAperta.value = false
    const f = r.fattoria
    fase.value = 'andata'; id.value = quale; verso.value = f.nome; foglio.value = null; messaggio.value = ''
    chiave.value++
    cambio()
    const { mondo } = dammi()
    mondo.ferma()                                                    // il mondo di casa aspetta fermo, com'è
    try {
      await Promise.all([pausa(ANDATA_MS), nextTick()])
      const { Visita } = await import('./scena3d/visita.js')          // il disegno della visita si chiede solo qui
      if (!vivo) return
      mondoV = new Visita({ canvas: tela.value, sopra: sopra.value, motore: motoreDiVisita(f), ui: uiVisita, qualita: q, fattoria: f, abito: dammi().mondo?.abito || null })
      mondoV.avvia()
      fase.value = 'visita'; storia.value = f.storia.length > 0
    } catch (e) {
      mondoV = null
      fase.value = 'casa'; id.value = null
      mondo.avvia()
      mappaMsg.value = 'Il trattore non parte: riprova più tardi'; mappaAperta.value = true
    }
  }

  async function torna() {
    if (fase.value !== 'visita' && fase.value !== 'andata') return
    const { mondo } = dammi()
    foglio.value = null; storia.value = false; fase.value = 'ritorno'; verso.value = 'casa'
    mondoV?.via(); mondoV = null
    await pausa(RITORNO_MS)
    if (!vivo) return
    fase.value = 'casa'; id.value = null
    mondo.avvia()
    cambio()
  }

  /** Il gesto dell'eroe in visita: un salto di gioia e il numero che sale. */
  function festeggia(testo) {
    if (!mondoV) return
    mondoV.fx.volo(testo, mondoV.eroe.posizione, 1.8)
    if (!mondoV.eroe.az) mondoV.eroe.avvia('esulta', 0.9)
  }
  const fine = () => { rev.value++; cambio() }

  function aiuta(k) {
    const r = vicini.value.aiuta(id.value, k)
    const dett = scheda.value && scheda.value.cassa.righe.find(x => x.k === k)
    if (!r.ok) return void (messaggio.value = dettoVicino(r, { emoji: dett && dett.emoji }))
    const em = dett ? dett.emoji : ''
    messaggio.value = r.completa
      ? `Cassa piena! Hai dato ${em} ${r.n} · +${r.premio} ⭐` + (r.dono ? ` · in regalo ${r.dono.n} ${scheda.value.cassa.dono ? scheda.value.cassa.dono.emoji : ''}` : '')
      : `Hai dato ${em} ${r.n} · +${r.premio} ⭐`
    festeggia(r.completa ? '📦 piena!' : `+${r.premio} ⭐`)
    fine()
  }
  function compra(k) {
    const dett = scheda.value && scheda.value.mercato.vende.find(x => x.k === k)
    const r = vicini.value.compra(id.value, k, 1)
    if (!r.ok) return void (messaggio.value = dettoVicino(r))
    messaggio.value = `Comprato ${dett ? dett.emoji : ''} ${r.n} · −🪙 ${r.costo}`
    festeggia(`−🪙 ${r.costo}`)
    fine()
  }
  function vendi(i) {
    const dett = scheda.value && scheda.value.mercato.compra[i]
    const r = vicini.value.vendi(id.value, i)
    if (!r.ok) return void (messaggio.value = dettoVicino(r, { emoji: dett && dett.emoji }))
    messaggio.value = `Scambio fatto: +${r.premio} ⭐` + (dett && dett.da ? ` e ${dett.da.emoji} ${dett.da.n}` : '')
    festeggia(`+${r.premio} ⭐`)
    fine()
  }

  function via() { vivo = false; mondoV?.via(); mondoV = null }

  return { vicini, fase, inVisita, mappaAperta, mappaMsg, id, foglio, storia, messaggio, verso, chiave, elenco, scheda,
           avvia, serializza, apriMappa, vai, torna, aiuta, compra, vendi, via }
}
