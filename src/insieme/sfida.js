// La sfida in due vista da un gioco (docs/core/insieme.md, «Un gioco nuovo in due»): crea il tavolo, entra col codice, invita un
// amico, porta l'incontro dalla sala d'attesa alla partita e dice com'è la linea. Il gioco dà la sua `regola` (incontro.js) e cosa
// fare quando si parte; la sala (SalaSfida.vue) e il cartello (CartelloLinea.vue) leggono quello che torna da qui.
import { ref, shallowRef, computed, watch } from 'vue'
import { Incontro } from './incontro.js'
import { creaTavolo, nuovoPosto } from './rete.js'
import { registra } from '../incidenti.js'
import { dati as datiAmici } from '../store/amici.js'
import { stato as amiciStato, invita as invitaAmico } from '../amici/servizio.js'
import { ingresso, prendiIngresso } from '../amici/ingresso.js'

export const ASPETTA_A_DIRLO = 1.5      // secondi di guasto prima del cartello: non si dice a ogni singhiozzo
const ATTESA_INVITO = 45000             // ms: un amico che non risponde

/* `gioco`: la chiave (quella degli inviti, src/amici/giochi.js); `regola()`: la regola per l'incontro; `alVia(incontro)`: la
   partita è partita, la si mette in scena; `mostra()`: il gioco fa vedere la sala (lasciando quello che stava facendo) */
export function usaSfida({ gioco, regola, alVia, mostra }) {
  const regia = shallowRef(null)        // l'incontro dei due telefoni (non è reattivo: `stato` e `motivo` lo seguono)
  const stato = ref('')
  const motivo = ref('')
  const passo = ref('scelta')           // scelta | creo | attesa | entro | errore
  const codice = ref('')
  const errore = ref('')
  const invitato = ref('')              // il nome dell'amico invitato, mentre lo si aspetta
  const scelto = ref('')                // la chiave dell'amico già scelto dalla lista degli amici («Gioca con…»): la sala parte da lui
  const linea = ref('')                 // '' | 'io' (ho perso la linea) | 'altro' (non si sente)
  let guastaDa = 0, scadenza = 0

  const inDue = () => !!regia.value && regia.value.stato === 'gioco'

  function collegati(cod, scelte, posto = nuovoPosto()) {
    const r = new Incontro({ codice: cod, regola: regola(), scelte, alCambio: () => cambio(r), opzioni: { posto } })
    regia.value = r
    stato.value = r.stato
  }

  function cambio(r) {
    if (!r || regia.value !== r) return
    const prima = stato.value
    stato.value = r.stato
    motivo.value = r.motivo
    // nel libretto dei guasti dei grandi: com'è andata la linea, da leggere senza cavo
    if (r.stato === 'rotta' && prima !== 'rotta') registra('sfida', `${gioco}: ${r.motivo}`, false)
    if (r.stato === 'finita' && prima !== 'finita' && r.canale.diario.cadute) registra('sfida', `${gioco}: finita bene, ${r.diagnosi()}`, false)
    // l'amico invitato è arrivato al tavolo: non lo si aspetta più (se no dopo 45 s la sfida si chiudeva a partita in corso)
    if (r.stato !== 'attesa' && invitato.value) { clearTimeout(scadenza); invitato.value = '' }
    if (r.stato === 'gioco' && prima !== 'gioco') {
      linea.value = ''; guastaDa = 0
      alVia(r)
    }
  }

  function chiudi() {
    invitato.value = ''
    clearTimeout(scadenza)
    const r = regia.value
    regia.value = null
    stato.value = ''
    motivo.value = ''
    linea.value = ''; guastaDa = 0
    codice.value = ''
    if (r) r.chiudi()
  }

  const sbaglia = testo => { errore.value = testo; passo.value = 'errore' }

  /* prima la sala (il gioco lascia la partita a metà mentre l'incontro c'è ancora: una sfida non si salva come sosta), poi via
     l'incontro di prima */
  function apri() {
    mostra()
    chiudi()
    scelto.value = ''
    passo.value = 'scelta'
  }

  async function crea(scelte) {
    passo.value = 'creo'
    const posto = nuovoPosto()
    try { codice.value = await creaTavolo({ posto }) } catch (e) { return sbaglia(e.message) }
    passo.value = 'attesa'
    collegati(codice.value, scelte, posto)
  }

  /* un amico invitato (docs/core/amici.md): si prepara il tavolo, ci si siede, e solo allora parte l'invito col codice dentro.
     `dati`: quello che l'invito porta oltre al codice (lo controlla `valida` in src/amici/giochi.js) */
  async function invita(chiave, scelte, dati) {
    chiudi()
    const a = amiciStato.amici.find(x => x.chiave === chiave)
    passo.value = 'creo'
    const posto = nuovoPosto()
    try { codice.value = await creaTavolo({ posto }) } catch (e) { return sbaglia(e.message) }
    collegati(codice.value, scelte, posto)
    const r = regia.value
    for (let t = 0; regia.value === r && r.ruolo !== 'host' && t < 120; t++) await new Promise(res => setTimeout(res, 100))
    if (regia.value !== r) return                                    // annullato nel frattempo
    if (r.ruolo !== 'host' || !invitaAmico(chiave, gioco, { ...dati, codice: codice.value })) {
      chiudi(); return sbaglia('Non riesco a invitare adesso. Riprova fra un poco.')
    }
    invitato.value = a?.nome || 'il tuo amico'
    passo.value = 'attesa'
    clearTimeout(scadenza)
    scadenza = setTimeout(() => finisceInvito(`${invitato.value} non risponde`), ATTESA_INVITO)
  }
  function finisceInvito(perche) {
    if (!invitato.value || passo.value !== 'attesa' || (regia.value && regia.value.stato !== 'attesa')) return
    chiudi(); sbaglia(perche)
  }
  watch(() => amiciStato.risposta, r => { if (r && !r.ok) finisceInvito(`${invitato.value} adesso non può giocare`) })

  function entra(cod) {
    passo.value = 'entro'
    codice.value = cod
    collegati(cod, null)
  }

  /* «Gioca» su un invito: il gioco lascia quello che stava facendo e mostra la sala, e si entra al tavolo dell'amico. Il gioco
     la chiama anche quando si apre (l'invito può averlo aperto lui). Con `amico` invece del codice si arriva dalla lista degli
     amici: la sala si apre sulle scelte, con quell'amico già da invitare */
  function daInvito() {
    const d = prendiIngresso(gioco)
    if (!d) return
    apri()
    if (d.amico) scelto.value = d.amico
    else entra(d.codice)
  }
  watch(ingresso, i => { if (i?.gioco === gioco) daInvito() })

  /* il tempo che passa, dal battito del gioco: la partita avanza, e il cartello della linea si accende dopo un attimo */
  function avanza(dt) {
    const r = regia.value
    if (!r) return
    r.avanza(dt)
    const l = r.linea
    const guasta = l.io !== 'su' ? 'io' : l.altro !== 'su' ? 'altro' : ''
    guastaDa = guasta ? guastaDa + dt : 0
    const detta = guastaDa > ASPETTA_A_DIRLO ? guasta : ''
    if (detta !== linea.value) linea.value = detta
  }

  const amici = computed(() => (datiAmici.attivo && datiAmici.online ? amiciStato.amici.filter(a => !a.inAttesa) : []))
  // la fase che la sala mostra, e la frase per chi la legge
  const fase = computed(() => (stato.value === 'rotta' ? 'rotta' : stato.value === 'trattativa' ? 'accordo' : passo.value))
  const messaggio = computed(() => (stato.value === 'rotta' ? motivo.value : errore.value))
  const rotta = computed(() => stato.value === 'rotta')

  return { regia, stato, motivo, codice, invitato, scelto, linea, fase, messaggio, rotta, amici, inDue, apri, crea, invita, entra, daInvito, chiudi, avanza }
}
