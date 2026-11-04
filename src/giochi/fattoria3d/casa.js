/* Dentro la casa, la parte di Gioco.vue (docs/fattoria3d/casa.md): entrare e uscire, la scena della casa (scena3d/casa3d.js) su una tela
   sua mentre la fattoria aspetta ferma, i fogli (il catalogo dei mobili, un mobile), la striscia di pavimento e pareti e la stanza nuova, che
   si compra come un lotto. Come visite.js: la vista dice cosa si vuole, le regole sono del motore. Niente in comune con un amico: la casa è
   della propria fattoria. */
import { ref, computed, nextTick } from 'vue'
import { MOBILI, SCHEDE_MOBILI, ARMADIO, prezzoFinitura } from './dati/interni.js'

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

/** `dammi()` → { motore, mondo }; `tela`, `sopra`: i ref della tela della casa; `cambio()`: dopo ogni mossa (salva e rilegge); `chiedi`: la
    domanda con due scelte, quella del terreno. */
export function usaCasa({ dammi, tela, sopra, q, versione, cambio, abito, apriGuardaroba, avvisa, chiedi, altriFogli = () => false }) {
  const dentro = ref(false)
  const chiave = ref(0)                    // una tela nuova a ogni ingresso: un contesto WebGL non si riusa
  const foglio = ref(null)                 // null | 'catalogo' | 'mobile'
  const scheda = ref(SCHEDE_MOBILI[0].id)  // la scheda del catalogo
  const mobileAperto = ref(null)           // l'id del mobile di cui si vede il foglio
  const tinte = ref(null)                  // { stanza, parte, prova } mentre si provano pavimento e pareti
  const mano = ref(null)                   // { tipo, nuovo, ok, motivo, gira, prezzo } mentre un mobile è in mano
  const messaggio = ref('')
  const rev = ref(0)
  let casa = null, vivo = true

  const toc = () => { rev.value++; cambio() }
  const dici = testo => casa?.fx.parla(testo)        // nel fumetto del contadino: l'avviso della fattoria sta nelle sue barre, che qui non ci sono
  const vista = computed(() => { void versione.value; void rev.value; const { motore } = dammi(); return motore && dentro.value ? motore.vistaInterni() : null })
  const mobile = computed(() => {
    void versione.value; void rev.value
    const { motore } = dammi(); if (!motore || mobileAperto.value === null) return null
    const o = motore.s.interni.mobili.find(m => m.id === mobileAperto.value)
    return o ? { ...o, voce: MOBILI[o.tipo] } : null
  })

  const ui = {
    cambio() { toc() },
    fogliAperti: () => !!foglio.value || !!tinte.value || altriFogli(),
    apriMobile(id) { messaggio.value = ''; mobileAperto.value = id; foglio.value = 'mobile' },
    apriGuardaroba() { apriGuardaroba() },
    esci() { esci() },
    offriStanza(id) {
      const st = dammi().motore.vistaInterni().stanze.find(s => s.id === id)
      chiedi('Stanza nuova', 'Allarga la casa: una stanza in più, attaccata a quelle che hai, con la sua porta.',
        [{ t: `Compra · 🪙 ${st.prezzo}`, fn: () => compraStanza(id) }, { t: 'Non ora', quieto: true }])
    },
    mano(info) { mano.value = info; if (info) messaggio.value = '' },
  }

  async function entra() {
    if (dentro.value) return
    const { motore, mondo } = dammi(); if (!motore || !mondo) return
    dentro.value = true; foglio.value = null; tinte.value = null; mano.value = null; messaggio.value = ''; chiave.value++
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
    dentro.value = false; foglio.value = null; tinte.value = null; mano.value = null
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
    dici('Messo via: lo ritrovi nel catalogo, in «Messi via».')
  }
  const eArmadio = computed(() => mobile.value?.tipo === ARMADIO)

  // ── una stanza nuova: la risposta alla domanda di `offriStanza` ──
  function compraStanza(id) {
    const { motore } = dammi(), r = motore.compraStanza(id)
    if (!r.ok) return dici(dettoInCasa(r, motore.monete()))
    casa?.stanzaComprata(id); toc()
    if (r.spostati.length) dici(`Per la porta nuova ho spostato: ${r.spostati.map(t => MOBILI[t].nome).join(', ')}.`)
  }

  // ── pavimento e pareti della stanza dove sta il contadino: si provano dal vivo, si paga solo se piace ──
  const prezzoTinte = computed(() => {
    void versione.value; void rev.value
    const t = tinte.value, { motore } = dammi()
    return t && motore ? prezzoFinitura(motore.s.interni.finiture[t.stanza], t.prova) : 0
  })
  function apriTinte() {
    if (!casa) return
    const stanza = casa.stanzaQui()
    messaggio.value = ''; tinte.value = { stanza, parte: 'pavimento', prova: { ...dammi().motore.s.interni.finiture[stanza] } }
    casa.provaFinitura(stanza, tinte.value.prova); casa.guardaStanza(stanza)
  }
  function provaTinta(parte, id) { const t = tinte.value; t.prova = { ...t.prova, [parte]: id }; messaggio.value = ''; casa?.provaFinitura(t.stanza, t.prova) }
  function pagaTinte() {
    if (!prezzoTinte.value) return
    const { motore } = dammi(), t = tinte.value, r = motore.rifiniStanza(t.stanza, t.prova)
    if (!r.ok) return void (messaggio.value = dettoInCasa(r, motore.monete()))
    lasciaTinte(); toc()
  }
  function lasciaTinte() { tinte.value = null; messaggio.value = ''; casa?.provaFinitura(null); casa?.tornaAllEroe() }

  function chiudi() { foglio.value = null; mobileAperto.value = null; messaggio.value = '' }
  const anteprima = k => casa ? casa.anteprima(k) : Promise.resolve(null)
  const anteprimaPronta = k => casa ? casa.anteprimaPronta(k) : null
  const vesti = a => casa?.vesti(a)
  const cameraLibera = () => !!casa && casa.cameraLibera
  const tornaAllEroe = () => casa?.tornaAllEroe()
  function via() { vivo = false; casa?.via(); casa = null }

  return {
    dentro, chiave, foglio, scheda, mobile, mobileAperto, tinte, prezzoTinte, mano, messaggio, vista, voci, eArmadio,
    entra, esci, apriCatalogo, scegli, posa, gira, lascia, tingi, giraMobile, sposta, mettiVia, apriTinte, provaTinta, pagaTinte, lasciaTinte, chiudi,
    anteprima, anteprimaPronta, vesti, cameraLibera, tornaAllEroe, via,
    scena: () => casa,                     // per le prove e gli scatti (window.__fattoria3d.interni)
  }
}
