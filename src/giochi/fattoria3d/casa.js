/* Dentro la casa, la parte di Gioco.vue (docs/fattoria3d/casa.md): entrare e uscire, la scena della casa (scena3d/casa3d.js) su una tela
   sua mentre la fattoria aspetta ferma, e i fogli (il catalogo dei mobili, un mobile, la pianta con le stanze). Come visite.js: la vista
   dice cosa si vuole, le regole sono del motore. Niente in comune con un amico: la casa è della propria fattoria. */
import { ref, computed, nextTick } from 'vue'
import { MOBILI, SCHEDE_MOBILI, ARMADIO } from './dati/interni.js'

const MOTIVI = {
  fuori: 'Lì non ci sta: deve stare tutto dentro una stanza tua.',
  occupato: 'Lì c\'è già qualcos\'altro.',
  porta: 'Davanti alla porta no, se no non si passa.',
  muro: 'Si appende sulla parete in fondo alla stanza.',
  'non-confina': 'Si compra una stanza attaccata a una che hai già.',
  'di-serie': 'L\'armadio resta in casa: è lui che ti cambia i vestiti.',
}
export const dettoInCasa = (r, monete = 0) => r.motivo === 'poche-monete'
  ? `Ti mancano 🪙${r.costo - monete}: le monete si guadagnano negli altri giochi.`
  : MOTIVI[r.motivo] || 'Non si può.'

/** `dammi()` → { motore, mondo }; `tela`, `sopra`: i ref della tela della casa; `cambio()`: dopo ogni mossa (salva e rilegge). */
export function usaCasa({ dammi, tela, sopra, q, versione, cambio, abito, apriGuardaroba, avvisa, altriFogli = () => false }) {
  const dentro = ref(false)
  const chiave = ref(0)                    // una tela nuova a ogni ingresso: un contesto WebGL non si riusa
  const foglio = ref(null)                 // null | 'catalogo' | 'mobile' | 'pianta'
  const scheda = ref(SCHEDE_MOBILI[0].id)  // la scheda del catalogo
  const mobileAperto = ref(null)           // l'id del mobile di cui si vede il foglio
  const stanzaScelta = ref(0)              // nella pianta: la stanza di cui si cambiano pavimento e pareti
  const mano = ref(null)                   // { tipo, nuovo, ok, gira, prezzo } mentre un mobile è in mano
  const messaggio = ref('')
  const rev = ref(0)
  let casa = null, vivo = true

  const toc = () => { rev.value++; cambio() }
  const vista = computed(() => { void versione.value; void rev.value; const { motore } = dammi(); return motore && dentro.value ? motore.vistaInterni() : null })
  const mobile = computed(() => {
    void versione.value; void rev.value
    const { motore } = dammi(); if (!motore || mobileAperto.value === null) return null
    const o = motore.s.interni.mobili.find(m => m.id === mobileAperto.value)
    return o ? { ...o, voce: MOBILI[o.tipo] } : null
  })

  const ui = {
    cambio() { toc() },
    fogliAperti: () => !!foglio.value || altriFogli(),
    apriMobile(id) { messaggio.value = ''; mobileAperto.value = id; foglio.value = 'mobile' },
    apriGuardaroba() { apriGuardaroba() },
    esci() { esci() },
    offriStanza(id) { messaggio.value = ''; stanzaScelta.value = id; foglio.value = 'pianta' },
    mano(info) { mano.value = info; if (info) messaggio.value = '' },
  }

  async function entra() {
    if (dentro.value) return
    const { motore, mondo } = dammi(); if (!motore || !mondo) return
    dentro.value = true; foglio.value = null; mano.value = null; messaggio.value = ''; chiave.value++
    mondo.ferma()                                                    // la fattoria aspetta ferma, com'è
    try {
      await nextTick()
      const { Casa3d } = await import('./scena3d/casa3d.js')
      if (!vivo || !dentro.value) return
      casa = new Casa3d({ canvas: tela.value, sopra: sopra.value, motore, ui, qualita: q, abito: abito.value })
      casa.avvia()
    } catch (e) {
      casa = null; dentro.value = false; mondo.avvia()
      avvisa('La porta non si apre: riprova più tardi')
    }
  }
  function esci() {
    if (!dentro.value) return
    const { mondo } = dammi()
    casa?.via(); casa = null
    dentro.value = false; foglio.value = null; mano.value = null
    mondo?.avvia()
    toc()
  }

  // ── il catalogo: un tocco prende in mano il mobile (si compra posandolo); i mobili messi via si riprendono gratis ──
  const voci = computed(() => {
    void versione.value; void rev.value
    if (!dentro.value) return []
    if (scheda.value === 'via') return (vista.value?.via || []).map(o => ({ id: o.id, tipo: o.tipo, nome: MOBILI[o.tipo].nome, prezzo: 0, colore: o.colore, trama: o.trama }))
    return Object.values(MOBILI).filter(m => m.scheda === scheda.value && !m.diSerie).map(m => ({ id: null, tipo: m.tipo || m.id, nome: m.nome, prezzo: m.prezzo, colore: m.colore, trama: m.trama || (m.trame ? 'unita' : null) }))
  })
  function apriCatalogo() { messaggio.value = ''; foglio.value = 'catalogo' }
  function scegli(v) {
    if (!casa) return
    foglio.value = null
    if (v.id !== null) casa.prendi(v.id); else casa.prendiNuovo(v.tipo, v.colore, v.trama)
  }
  // ── il mobile in mano ──
  function posa() {
    if (!casa) return
    const r = casa.posaMano()
    if (!r.ok) messaggio.value = dettoInCasa(r, dammi().motore.monete())
    else messaggio.value = ''
  }
  function gira() { casa?.giraInMano() }
  function lascia() { casa?.lasciaMano(); messaggio.value = '' }

  // ── il foglio di un mobile: colore, trama, gira, sposta, metti via ──
  function tingi(colore, trama) { const r = dammi().motore.tingiMobile(mobileAperto.value, colore, trama); if (r.ok) { casa?.cambiato(); toc() } }
  function giraMobile() { const r = dammi().motore.giraMobile(mobileAperto.value); if (!r.ok) messaggio.value = 'Girato non ci sta: spostalo prima in un posto più largo.'; else { casa?.cambiato(); toc() } }
  function sposta() { const id = mobileAperto.value; foglio.value = null; mobileAperto.value = null; casa?.prendi(id) }
  function mettiVia() {
    const r = dammi().motore.mettiViaMobile(mobileAperto.value)
    if (!r.ok) return void (messaggio.value = dettoInCasa(r))
    foglio.value = null; mobileAperto.value = null; casa?.cambiato(); toc()
    avvisa('Messo via: lo ritrovi nel catalogo, in «Messi via».')
  }
  const eArmadio = computed(() => mobile.value?.tipo === ARMADIO)

  // ── la pianta: comprare una stanza, pavimento e pareti ──
  function apriPianta() { messaggio.value = ''; foglio.value = 'pianta' }
  function compraStanza(id) {
    const { motore } = dammi(), r = motore.compraStanza(id)
    if (!r.ok) return void (messaggio.value = dettoInCasa(r, motore.monete()))
    messaggio.value = `Stanza nuova! L'hai pagata 🪙${r.costo}.`; stanzaScelta.value = id
    casa?.cambiato(); toc()
  }
  function rifinisci(finitura) { const r = dammi().motore.rifiniStanza(stanzaScelta.value, finitura); if (r.ok) { casa?.cambiato(); toc() } }

  function chiudi() { foglio.value = null; mobileAperto.value = null; messaggio.value = '' }
  const anteprima = k => casa ? casa.anteprima(k) : Promise.resolve(null)
  const anteprimaPronta = k => casa ? casa.anteprimaPronta(k) : null
  const vesti = a => casa?.vesti(a)
  const cameraLibera = () => !!casa && casa.cameraLibera
  const tornaAllEroe = () => casa?.tornaAllEroe()
  function via() { vivo = false; casa?.via(); casa = null }

  return {
    dentro, chiave, foglio, scheda, mobile, mobileAperto, stanzaScelta, mano, messaggio, vista, voci, eArmadio,
    entra, esci, apriCatalogo, scegli, posa, gira, lascia, tingi, giraMobile, sposta, mettiVia, apriPianta, compraStanza, rifinisci, chiudi,
    anteprima, anteprimaPronta, vesti, cameraLibera, tornaAllEroe, via,
    scena: () => casa,                     // per le prove e gli scatti (window.__fattoria3d.interni)
  }
}
