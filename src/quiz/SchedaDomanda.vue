<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA SCHEDA DI UNA DOMANDA — tutto quello che se ne sa, e cosa farne

   Si apre premendo il punteggio di una riga di «Come va», ed è **il
   posto dove si decide**. L'elenco dietro serve a trovare la riga; qui
   si guarda cosa c'è dentro quel numero e si sceglie.

   ── I NUMERI PRIMA, IL GIUDIZIO MAI ───────────────────────────────
   Quante volte gli è capitata, quante l'ha azzeccata, quanto ci mette,
   quand'è stata l'ultima volta. Non c'è nessuna frase che dica «tuo
   figlio è indietro»: chi guarda ha in mano un contesto che il gioco non
   ha — a scuola l'hanno fatta o no, era stanco, gliel'ha data il
   fratello — e con i numeri davanti quel giudizio lo fa meglio lui. È la
   stessa regola di `quiz/consiglio.js`, applicata a una schermata.

   ── E LE TRE COSE CHE SI POSSONO FARE ─────────────────────────────
   Provarla (▶, `quiz/Prova.vue`: il pannello se lo apre chi ci ospita,
   qui si emette e basta), spostarla (la tacca di
   `components/eta/Taratura.vue`, quella già in uso nel quadro dell'età —
   sette scatti da mezzo anno più «non ancora spiegate», che spegne il
   pezzo di scuola) e **ricominciare a contare**.

   Il terzo è quello che non c'era e che serve appena si comincia a
   ritoccare: il conto è appiccicoso. Dopo aver reso una cosa più facile,
   «ne ha sbagliate 7 su 10» resta scritto per settimane — perché quelle
   dieci risposte le ha date sulle domande di prima — e l'elenco continua
   a mettere in cima una riga già sistemata. Azzerare butta il conto e
   **non** il ripasso: quando quella cosa va ripassata è un'altra
   faccenda, e rimetterla a zero la farebbe ricomparire domani
   (`azzeraConto` in `store/profile.js`).
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import Taratura from '../components/eta/Taratura.vue'
import { anniInLettere } from '../components/eta/lettere.js'

const props = defineProps({
  /* una riga di `quiz/andamento.js` */
  riga: { type: Object, required: true },
  /* gli anni del bambino: la tacca dice «vale otto anni» e ha bisogno
     di sapere rispetto a chi */
  eta: { type: Number, default: null },
})
const emit = defineEmits(['chiudi', 'prova', 'ritocca', 'azzera'])

const tarando = ref(false)
const azzerando = ref(false)

const r = computed(() => props.riga)
/* si chiama `inAnni` e non `eta`: una funzione con lo stesso nome della
   prop la copre nel template, e `:eta="eta"` passerebbe la funzione
   invece del numero — un guasto che non dà nessun errore e fa sballare
   tutta la tacca */
const inAnni = t => anniInLettere(t)

/* «6 anni» se esce a un'età sola, «da 6 a 8 anni» se la stessa tipologia
   torna a più gradi. Due numeri e non una media: la media non
   corrisponde a nessuna domanda vera. */
const quando = computed(() =>
  r.value.da === r.value.a ? inAnni(r.value.da)
    : `da ${inAnni(r.value.da)} a ${inAnni(r.value.a)}`)

/* la tacca sposta **tutte** le classi di questa tipologia: se ne dichiarano
   i livelli, così il riquadro non dice «finisce in Difficili» mentre due su
   tre restano dov'erano */
const livelli = computed(() => r.value.classi.map(c => c.livello).filter(n => n != null))
const livello = computed(() => livelli.value.length ? Math.max(...livelli.value) : 50)

/* «tre giorni fa». Il giorno esatto non serve a nessuno — serve sapere
   se il conto parla di ieri o di tre mesi fa, perché un 3 su 10 di
   marzo non dice niente su oggi. */
const ULTIMA = [[1, 'oggi'], [2, 'ieri'], [7, 'questa settimana'],
                [31, 'questo mese'], [366, 'quest\'anno']]
const quandoUltima = computed(() => {
  if (!r.value.ultima) return ''
  const giorni = (Date.now() - r.value.ultima) / 86400000
  for (const [soglia, testo] of ULTIMA) if (giorni < soglia) return testo
  return 'più di un anno fa'
})

const scarto = computed(() => {
  const n = r.value.ritocco
  if (!n) return ''
  const mezzi = Math.abs(n) === 1 ? 'mezz\'anno' : `${Math.abs(n) / 2} anni`
  return `${mezzi} più ${n > 0 ? 'facile' : 'difficile'}, come l'hai messa tu`
})
</script>

<template>
  <div class="velo" data-scheda-domanda @click.self="$emit('chiudi')">
    <div class="scheda">
      <button type="button" class="chiudi" aria-label="chiudi"
              @click="$emit('chiudi')">✕</button>

      <div class="testa">
        <span class="ico">{{ r.icona }}</span>
        <div class="chi">
          <b>{{ r.nome }}</b>
          <i v-if="r.gruppoNome">{{ r.gruppoNome }} · {{ r.modulo }}</i>
          <i v-else>{{ r.modulo }}</i>
        </div>
      </div>

      <!-- ── il conto, in chiaro ──
           Quattro riquadri e non una frase: un genitore li scorre in un
           secondo e si fa l'idea da solo. Il riquadro che manca quando
           non c'è niente da dire non si mostra vuoto. -->
      <div class="numeri">
        <div><b>{{ r.quante }}</b><span>{{ r.quante === 1 ? 'volta' : 'volte' }}</span></div>
        <div><b>{{ r.ok }}</b><span>giuste</span></div>
        <div :class="{ male: !r.poche && r.quota <= 0.5 }">
          <b>{{ r.quante ? Math.round(r.quota * 100) + '%' : '–' }}</b><span>azzeccate</span>
        </div>
        <div v-if="r.secondi"><b>{{ r.secondi }}s</b><span>ci mette</span></div>
      </div>

      <p v-if="r.mai" class="dice">
        Non gli è ancora capitata. Il punteggio arriva quando comincerà a rispondere.
      </p>
      <p v-else-if="r.poche" class="dice">
        Solo {{ r.quante }} {{ r.quante === 1 ? 'risposta' : 'risposte' }}: troppo poche
        per dire com'è andata. Il conto diventa affidabile dopo otto.
      </p>

      <p class="dice">
        Serve <b>{{ quando }}</b><template v-if="scarto"> — {{ scarto }}</template>.
        <template v-if="quandoUltima"> L'ultima volta {{ quandoUltima }}.</template>
      </p>

      <!-- ── e cosa se ne fa ──
           Tre tasti in fila e nessuno di loro è distruttivo: si prova, si
           sposta, si ricomincia a contare. Spegnere del tutto sta dentro
           la tacca, all'ottavo scatto, dove c'è scritto cosa vuol dire. -->
      <div class="azioni">
        <button type="button" class="tasto" data-scheda="prova"
                @click="$emit('prova', r)">▶ provala</button>
        <button type="button" class="tasto" data-scheda="tara"
                :class="{ ora: tarando }" @click="tarando = !tarando">✎ spostala</button>
        <button v-if="r.quante" type="button" class="tasto" data-scheda="azzera"
                @click="azzerando = true">↻ ricomincia a contare</button>
      </div>

      <Taratura v-if="tarando && eta != null" :livello="livello" :livelli="livelli"
                :eta="eta" :ritocco="r.ritocco" :chiave="r.tipo"
                @applica="$emit('ritocca', { tipo: r.tipo, ...$event }); tarando = false"
                @chiudi="tarando = false" />

      <div v-if="azzerando" class="conferma">
        <p>Butta le <b>{{ r.quante }}</b> risposte contate finora e riparte da zero.
          Non tocca i progressi né il ripasso: serve dopo aver spostato una
          domanda, perché il vecchio conto parla delle domande di prima.</p>
        <div class="riga-tasti">
          <button type="button" class="tasto" data-scheda="azzera-no"
                  @click="azzerando = false">Lascia stare</button>
          <button type="button" class="tasto pieno" data-scheda="azzera-si"
                  @click="$emit('azzera', r); azzerando = false">Ricomincia</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.velo {
  position: fixed; inset: 0; z-index: 60; display: grid; place-items: center;
  padding: 16px; background: #0b0d16b0; backdrop-filter: blur(2px);
}
.scheda {
  position: relative; width: min(430px, 100%); max-height: 86vh; overflow: auto;
  padding: 18px 16px 16px; border-radius: 18px;
  background: #fff; color: #23233a; box-shadow: 0 18px 50px #0007;
}
.chiudi {
  position: absolute; top: 8px; right: 8px; width: 34px; height: 34px;
  border: 0; border-radius: 11px; background: #f1eefb; color: #6a5aa8;
  font: inherit; font-size: 14px; cursor: pointer;
}
.testa { display: flex; align-items: center; gap: 11px; padding-right: 34px }
.testa .ico { font-size: 26px }
.chi { display: grid }
.chi b { font-size: 15.5px }
.chi i { font-style: normal; font-size: 11.5px; color: #8a8a99 }

/* i numeri: quattro riquadri uguali, che si leggono in un secondo */
.numeri { display: flex; gap: 8px; margin: 14px 0 10px }
.numeri > div {
  flex: 1; display: grid; gap: 1px; padding: 8px 4px; text-align: center;
  background: #f5f3fc; border-radius: 12px;
}
.numeri b { font-size: 17px; font-weight: 800 }
.numeri span { font-size: 10.5px; color: #8a8a99 }
.numeri .male { background: #ffdede }
.numeri .male b { color: #8c2f2f }

.dice { margin: 8px 0; font-size: 12.5px; line-height: 1.45; color: #55556a }

.azioni { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 13px }
.tasto {
  flex: 1; min-width: 116px; padding: 10px 8px; border: 0; border-radius: 12px;
  font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer;
  background: #f1eefb; color: #5b3fa8;
}
.tasto.ora { background: #e3d9ff }
.tasto.pieno { background: #5b3fa8; color: #fff }
.conferma { margin-top: 12px; padding: 11px; background: #fff6e4; border-radius: 13px }
.conferma p { margin: 0 0 9px; font-size: 12.5px; line-height: 1.45; color: #7d5410 }
.riga-tasti { display: flex; gap: 7px }
</style>
