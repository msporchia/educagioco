<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COME VA — quello che il bambino ha già detto giocando

   ── PERCHÉ ESISTE ──
   Le manopole ci sono tutte, e nessuno le tocca. Non perché siano
   nascoste — stanno nella scheda «Giochi», in fila, col tasto pronto —
   ma perché **nessuno va a cercare un problema che non sa di avere**: un
   genitore apre le impostazioni quando qualcosa lo infastidisce, e la
   taratura sbagliata di una tipologia di domande non infastidisce lui,
   infastidisce il figlio, che non ha le parole per dirlo.

   Quindi il verso si gira: invece di aspettare che il grande cerchi,
   qui si dice cosa si è notato. Le stesse righe della scheda «Giochi»,
   ma **solo quelle che hanno qualcosa da dire**, in cima alla prima
   schermata che si apre entrando.

   Non ritocca niente da sé, e non è una svista: vale parola per parola
   quello che sta scritto in `quiz/consiglio.js` — un pomeriggio storto o
   un fratello che ha giocato al posto suo insegnerebbero la cosa
   sbagliata. Qui si mostra il conto, il tasto lo preme un umano.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { fasceDelBambino } from './catalogo.js'
import { MINIME } from './consiglio.js'
import { state, ritoccoSapere, ritocca } from '../store/profile.js'

const emit = defineEmits(['tutte'])

/* ── PERCHÉ SERVE RICORDARE COSA SI È GIÀ FATTO ──
   Il consiglio nasce dal conto delle risposte già date, e quel conto non
   cambia perché un grande ha spostato la riga: «ne ha sbagliate 8 su 10»
   resta vero fino a che non ne arrivano di nuove. Nella scheda «Giochi»
   va bene così — lì si guarda lo stato delle cose — ma qui è una lista
   di cose da fare, e una voce che resta dopo essere stata fatta si preme
   due volte: tre gradini invece di uno, che è precisamente il modo di
   sballare una taratura credendo di sistemarla.

   Quindi la riga seguita esce di scena e lo dice. Vale per questa
   visita: chi torna domani, se il conto è ancora storto, se lo ritrova —
   ed è giusto, perché vuol dire che il ritocco non è bastato. */
const fatti = ref([])
const esito = ref('')
const giro = ref(0)

/* Quante risposte ha dato in tutto: sotto la soglia di
   `consiglio.js` non c'è niente da dire e sarebbe sbagliato far finta
   di sì — «va tutto bene» detto dopo tre domande è una bugia. */
const risposte = computed(() => {
  const items = state.profile.items || {}
  return Object.values(items).reduce((n, it) => n + (it.ok || 0) + (it.err || 0), 0)
})

const segnali = computed(() => {
  giro.value
  const righe = []
  for (const f of fasceDelBambino()) {
    if (f.chiave === 'spenta') continue     // spenta a mano: non è un problema, è una scelta
    for (const c of f.righe) if (c.consiglio) righe.push(c)
  }
  /* prima i muri (dove sbaglia), poi i pedaggi (dove non impara più
     niente): un bambino che si blocca conta più di uno che si annoia */
  righe.sort((a, b) => (a.consiglio.verso - b.consiglio.verso) || (a.consiglio.quota - b.consiglio.quota))

  /* Una tipologia con più gradi è più righe nel catalogo — «Le ore
     intere» grado 1 e grado 2 — ma **il conto è uno solo**, perché sta
     sotto la chiave della tipologia: senza questo passaggio lo stesso
     consiglio compariva due volte di fila, e a chi legge sembra un
     doppio problema invece che lo stesso. Nella scheda «Giochi» le
     righe restano separate, ed è giusto: lì si guarda cosa esiste. */
  const visti = new Set()
  return righe.filter(c => {
    const t = c.tipo || c.chiave
    if (visti.has(t) || fatti.value.includes(t)) return false
    visti.add(t)
    return true
  }).slice(0, 3)
})

function sistema (c) {
  const chiave = c.tipo || c.chiave
  const verso = c.consiglio.verso > 0 ? -1 : 1
  const ora = ritoccoSapere(chiave)
  const n = Math.max(-3, Math.min(3, ora + verso))
  if (n !== ora) ritocca(chiave, n)
  fatti.value = [...fatti.value, chiave]
  esito.value = n === ora
    ? `«${c.nome}» era già spostata al massimo: se non basta, spegni il suo gruppo dalle materie.`
    : `Fatto: «${c.nome}» ${verso > 0 ? 'arriverà più avanti' : 'arriverà prima'}. Si vede alla prossima partita.`
  giro.value++
}
</script>

<template>
  <div class="comeva" data-blocco="come-va">
    <h2>Come va</h2>

    <!-- ha giocato troppo poco perché i numeri vogliano dire qualcosa -->
    <p v-if="risposte < MINIME" class="mini quieto" data-comeva="poco">
      Ha risposto a {{ risposte }} {{ risposte === 1 ? 'domanda' : 'domande' }}: troppo poche
      per accorgersi di qualcosa. Quando una materia gli andrà stretta o larga, te lo scrivo qui.
    </p>

    <!-- tutto nella norma: si dice, e si dice che è una buona notizia -->
    <p v-else-if="!segnali.length && !fatti.length" class="mini quieto" data-comeva="niente">
      Niente da segnalare: le domande gli stanno arrivando della misura giusta.
      Se qualcosa cambia lo trovi qui.
    </p>

    <!-- seguiti tutti i consigli: resta solo quello che si è fatto -->
    <p v-else-if="!segnali.length" class="mini quieto" data-comeva="sistemato">
      Sistemato. Se qualcos'altro andrà storto, lo trovi qui.
    </p>

    <!-- e qui il motivo per cui questo blocco esiste -->
    <template v-else>
      <p class="mini quieto">Guardando come risponde, due o tre cose si notano.
        Decidi tu: un pomeriggio storto non è una materia troppo difficile.</p>
      <div class="segnali">
        <div v-for="c in segnali" :key="c.chiave" class="segnale" :data-segnale="c.chiave">
          <span class="che">
            <b>{{ c.icona }} {{ c.nome }}</b>
            <i>{{ c.consiglio.detto }}</i>
          </span>
          <button class="fai" :data-sistema="c.chiave" @click="sistema(c)">
            {{ c.consiglio.verso < 0 ? 'più facili' : 'più difficili' }}
          </button>
        </div>
      </div>
    </template>

    <p v-if="esito" class="mini fatto" data-comeva="esito">{{ esito }}</p>

    <button class="tutte" data-azione="tutte-le-domande" @click="emit('tutte')">
      Tutte le materie, in fila ›
    </button>
  </div>
</template>

<style scoped>
.comeva { width:100%; display:flex; flex-direction:column; gap:8px }
.quieto { text-align:left; line-height:1.45 }

.segnali { display:flex; flex-direction:column; gap:7px }
.segnale { display:flex; align-items:center; gap:9px; padding:10px 12px; border-radius:14px;
           background:var(--carta); box-shadow:0 2px 8px #8593a81f; text-align:left }
.segnale .che { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px }
.segnale b { font-size:14px; color:var(--viola-scuro) }
.segnale i { font-style:normal; font-size:12px; color:var(--tenue) }
.fai { flex:none; padding:8px 13px; border-radius:999px; font-size:12.5px; font-weight:800;
       background:#e8f0ff; color:#2c4283 }
.fai:active { transform:translateY(1px) }

.fatto { text-align:left; color:var(--verde); font-weight:650 }
.tutte { align-self:flex-start; margin-top:2px; background:none; padding:4px 0;
         font-size:12.5px; font-weight:700; color:var(--tenue); text-decoration:underline }
</style>
