<script setup>
/* ═══════════════════════════════════════════════════════════════════
   PROVA UNA VOCE — la palestra dei poc, dentro la schermata dei grandi.

   Un genitore che deve decidere se spegnere «Metri, litri e chili» ha
   davanti tre righe di spiegazione e un interruttore. Non basta: la
   domanda che sparisce la immagina, e a naso si spegne troppo o non si
   spegne niente. Qui invece la domanda arriva davvero — la stessa che
   riceverebbe il bambino, generata dallo stesso modulo — e si può
   rispondere, sbagliare e leggere il perché.

   Ha preso il posto delle palestre che stavano in `poc/`, una pagina
   per modulo, e le ha mandate in pensione. Là si provava un MODULO a
   raffica, per vedere se le domande erano belle; qui si prova UNA VOCE
   — un gruppo di sapere o una singola tipologia — perché la domanda che
   il genitore ha in mente è «cosa perdo se spengo questa?». E là le
   domande si rincorrevano da sole; qui una alla volta, col tasto per
   chiederne un'altra: chi è entrato voleva decidere, non giocare.
   Guardare se una domanda è bella si fa lo stesso, e si fa qui: sono
   le stesse domande, nella stessa messa in scena del gioco vero, che è
   più di quanto una palestra a parte potesse promettere.

   TRE MODI DI GUARDARE, e sono tre domande diverse che si fa chi entra:

     `chiave`      — «cosa perdo se spengo questa voce?». È quello di
                     sempre, e arriva dalla scheda «Cosa sa».
     `sorgente`    — «com'è fatta *questa* domanda?». Una classe precisa
                     del catalogo: modulo, grado e tipologia decisi, e
                     «Un'altra» resta lì dentro.
     `giro`        — «fammele vedere tutte». Una lista di classi che si
                     scorre in ordine, col contatore: in venti tocchi le
                     hai viste tutte, e nessuna può nascondersi.
     `eta`  — «cosa becca un bambino di quest'età?». Qui
                     non si scorre niente: si pesca come pesca un gioco,
                     campana e spenti compresi, e ogni domanda può
                     arrivare da un modulo diverso.

   I primi tre mostrano quello che **esiste**, l'ultimo quello che
   **capita**: sono due cose diverse e la seconda non si può dedurre
   dalla prima, che è il motivo per cui ci sono tutti e due i tasti.

   NON DECIDE NIENTE. Riceve una chiave, mostra le sue domande, e quando
   si chiude non ha toccato né il profilo né i progressi: l'interruttore
   sta sulla carta di fuori, ed è giusto che stia lì. Provare e spegnere
   sono due gesti diversi e restano due tasti diversi.

   La domanda la mette in scena `Domanda.vue`, la stessa dei giochi: i
   disegni (l'orologio, la figura da specchiare, i quadretti), le emoji
   e il «Era questa» col perché vengono da lì senza una riga in più. Se
   quella cambia, cambia anche qui — che è esattamente quello che si
   vuole, perché la promessa di questo pannello è «è la domanda vera».
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted } from 'vue'
import Domanda from './Domanda.vue'
import { esempioDi } from './saperi.js'
import { esempioDa } from './nucleo/esempi.js'
import { sorteQualunque } from './nucleo/sorte.js'
import { pescaComeUnGioco } from './catalogo.js'

const props = defineProps({
  /* la voce da provare: un gruppo (`misure`) o una tipologia
     (`orto:apostrofo`). Per chi genera sono la stessa cosa. */
  chiave: { type: String, default: '' },
  /* come si chiama, con le parole della carta da cui si è arrivati */
  nome: { type: String, default: '' },
  /* una classe precisa del catalogo: `{ modulo, grado, tipo, nome }` */
  sorgente: { type: Object, default: null },
  /* una lista di classi da scorrere in ordine (righe del catalogo) */
  giro: { type: Array, default: null },
  /* oppure la difficoltà a cui pescare, come farebbe un gioco */
  /* «cosa becca un bambino di quest'età?»: si pesca come pescherebbe un
     gioco, tagliando per età come in partita */
  eta: { type: Number, default: null },
})
defineEmits(['chiudi'])

const esempio = ref(null)
/* la chiave del `v-if`, non un punteggio: cambiarla rimonta la scheda,
   ed è l'unico modo perché la domanda dopo riparta pulita — canvas
   compresi. Quante ne ha fatte non interessa a nessuno: qui non si
   tiene il conto di niente, si guarda. */
const giro = ref(0)
const risposto = ref(false)

/* dove si è finiti: il modulo, il grado e cosa si chiede lì.
   L'ultimo pezzo si tace quando ripete il nome della voce — una
   tipologia si chiama come la riga che la descrive, e «La lettera h ·
   Ortografia grado 5 · La lettera h» è solo rumore. */
const dove = computed(() => {
  const e = esempio.value
  if (!e) return ''
  const pezzi = []
  /* il modulo si tace se il nome della voce lo dice già: dal catalogo si
     arriva con «📝 Problemi» scritto in grande, e ripeterlo sotto
     («📝 Problemi · 📝 Problemi · grado 1») è la riga che fa sembrare
     rotto un pannello che funziona */
  if (!props.nome.includes(e.titolo)) pezzi.push(e.titolo)
  pezzi.push(`grado ${e.grado}`)
  if (e.dice && e.dice !== props.nome) pezzi.push(e.dice)
  return pezzi.join(' · ')
})

/* dove si è arrivati dentro un giro. Parte da -1 perché il primo
   `unAltra()` — quello del montaggio — deve mostrare la prima, non la
   seconda. */
const passo = ref(-1)
const quante = computed(() => props.giro?.length || 0)
const nelGiro = computed(() => quante.value > 0)

/* il contatore che si legge in cima: senza, scorrere una lista di
   trentasette classi è indistinguibile dal pescarle a caso — che è
   esattamente il difetto da cui nasce tutto questo pannello */
const dovePosizione = computed(() =>
  nelGiro.value ? `${passo.value + 1} di ${quante.value}` : '')

function pesca() {
  if (nelGiro.value) {
    passo.value = (passo.value + 1) % quante.value
    const c = props.giro[passo.value]
    return esempioDa(c.sorgente, sorteQualunque())
  }
  if (props.sorgente) return esempioDa(props.sorgente, sorteQualunque())
  /* Una voce **e** un'età vogliono dire «di questo gruppo, quello che a
     lui arriva»: il gruppo è largo — «i numeri e le quantità» va dal
     colpo d'occhio ai numeri a tre cifre — e mostrare a un bambino di
     quattro anni la domanda da otto e mezzo chiede al grande di
     giudicare una cosa che non succederà. L'ordine conta: senza chiave
     l'età vuol dire l'altro modo, «cosa becca in partita». */
  if (props.chiave) return esempioDi(props.chiave, sorteQualunque(), props.eta)
  if (props.eta !== null) return pescaComeUnGioco(props.eta)
  return null
}

function unAltra() {
  esempio.value = pesca()
  risposto.value = false
  giro.value++
}

/* tornare indietro serve solo dentro un giro, e serve davvero: si scorre
   per giudicare, e la domanda che si vuole riguardare è quasi sempre
   quella appena passata. */
function indietro() {
  if (!nelGiro.value) return
  passo.value = (passo.value - 2 + quante.value * 2) % quante.value
  unAltra()
}

onMounted(unAltra)
</script>

<template>
  <div class="prova-velo" data-prova>
    <div class="prova-testa">
      <div class="prova-chi">
        <b>{{ nome || chiave }}</b>
        <!-- il modulo che la fa e il grado: serve a un grande per
             capire che la stessa voce esce in posti diversi -->
        <i v-if="esempio">{{ dove }}</i>
      </div>
      <!-- a che punto si è del giro: sta in cima e non nel piede perché
           è quello che dice se si sta scorrendo o pescando a caso -->
      <span v-if="nelGiro" class="prova-conta" data-conta>{{ dovePosizione }}</span>
      <button type="button" class="prova-x" aria-label="basta" @click="$emit('chiudi')">✕</button>
    </div>

    <div class="prova-palco">
      <!-- qui i tre tasti del giudizio contano più che nel gioco: è il
           posto dove una tipologia si scorre apposta, una domanda dopo
           l'altra, ed è lì che si vede che una è fuori misura -->
      <Domanda v-if="esempio" :key="giro" :domanda="esempio.domanda" :pittori="esempio.pittori"
               :origine="esempio" gioco="prova"
               :respiro="600" saltabile
               @risposto="unAltra" />
      <!-- non dovrebbe succedere: il tasto per arrivare qui compare
           solo dove `siPuoProvare` è vero. Se succede lo dice, invece
           di lasciare un rettangolo nero. -->
      <p v-else class="prova-niente">{{ chiave && eta !== null
        ? 'A quest\'età non gli arriva nessuna domanda di questo gruppo.'
        : 'Di questa voce non c\'è nessuna domanda da mostrare.' }}</p>
    </div>

    <div class="prova-piede">
      <!-- dentro un giro si torna indietro: si scorre per giudicare, e
           quella da riguardare è quasi sempre l'ultima passata -->
      <button v-if="nelGiro" type="button" class="prova-indietro" aria-label="quella prima"
              data-indietro @click="indietro">‹</button>
      <button type="button" class="prova-altra" @click="unAltra">
        {{ nelGiro ? 'La prossima ›' : (risposto ? "Un'altra" : 'Cambiala') }}
      </button>
      <button type="button" class="prova-fine" @click="$emit('chiudi')">Basta</button>
    </div>
  </div>
</template>

<style scoped>
/* fisso e sopra tutto: si è entrati per guardare una cosa sola, e la
   schermata dei genitori sotto non deve poter scorrere via */
.prova-velo {
  position: fixed; inset: 0; z-index: 60;
  display: flex; flex-direction: column;
  background: radial-gradient(120% 80% at 50% 0%, #1d2a4a 0%, #0d1220 60%, #080b14 100%);
  color: #e8edf7; text-align: left;
  padding: max(10px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
}
.prova-testa { display: flex; align-items: flex-start; gap: 10px; padding: 4px 2px 10px }
.prova-chi { flex: 1; min-width: 0 }
.prova-chi b { display: block; font-size: 16px; font-weight: 800 }
.prova-chi i {
  display: block; font-style: normal; font-size: 12px; color: #93a0bd;
  margin-top: 2px; overflow-wrap: anywhere;
}
.prova-x {
  flex: none; width: 40px; height: 40px; border-radius: 12px; cursor: pointer;
  border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06);
  color: #e8edf7; font: inherit; font-size: 17px;
}
.prova-conta {
  flex: none; align-self: center; font-size: 12px; font-weight: 700;
  color: #cbd5ea; background: rgba(255,255,255,.08);
  border-radius: 999px; padding: 5px 10px; white-space: nowrap;
}

/* il palco: `relative` perché il velo di `Domanda.vue` è `absolute` e
   si aggancia qui, non al telefono intero. `--qz-h` è l'altezza utile
   che gli si concede — meno di uno schermo, perché testa e piede se ne
   prendono un pezzo — e i disegni si rimpiccioliscono di conseguenza. */
.prova-palco { position: relative; flex: 1; min-height: 0; --qz-h: .82vh }
.prova-niente {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  margin: 0; padding: 20px; text-align: center; color: #93a0bd; font-size: 14px;
}

.prova-piede { display: flex; gap: 10px; padding-top: 12px }
.prova-piede button {
  flex: 1; min-height: 52px; cursor: pointer; border-radius: 16px;
  border: none; font: inherit; font-size: 16px; font-weight: 750;
}
.prova-altra { background: rgba(255,255,255,.1); color: #e8edf7 }
.prova-fine { background: #ffd58a; color: #23272f }
/* stretto apposta: è la scorciatoia per riguardare quella di prima, non
   uno dei due tasti veri */
.prova-indietro { flex: 0 0 56px; background: rgba(255,255,255,.1); color: #e8edf7; font-size: 20px }
.prova-piede button:active { transform: translateY(2px) }
</style>
