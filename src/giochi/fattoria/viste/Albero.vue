<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COME SI FA — L'ALBERO DI UNA MERCE, IN COLONNA

   Il consiglio dice il prossimo passo; questa pagina dice **tutta la
   strada**, e a che punto si è. In cima la merce scelta, sotto quello
   che le serve, e giù fino ai campi: ogni riga è una carta con la
   faccia vera, quanti ne servono contro quanti ne hai, e uno stato.
   Fra una merce e i suoi ingredienti c'è **la macchina**, con i suoi
   quattro stati (ce l'hai · sta lavorando · da comprare · nei premi).

   Si apre sempre **con una merce già scelta** — dal silo, dal mercato,
   dalla macchina — e non c'è una vista «tutto l'albero»: sarebbe un
   poster di quaranta nodi su un telefono, e un bambino non cerca
   l'albero, cerca il maglione.

   Non compone niente: riceve l'albero da `dati/albero.js` e lo
   disegna. Le righe ambra portano l'azione del consiglio, e premerla
   fa quello che farebbe il tasto sotto la ricetta — lo stesso
   `esegui(azione)` di `Gioco.vue`.

   ── È UN ALBERO, E SI VEDE CHE LO È ───────────────────────────────
   Era una fila di riquadri rientrati di un `margin-left`, col rientro
   tappato a quattro livelli: cinque fasi finivano appiattite su
   quattro rientri, e due rami che scendono in parallelo si leggevano
   come una lista sola — non si vedeva più quale ingrediente
   appartenesse a quale passaggio. E la riga della macchina stava
   rientrata **più dei figli che introduce**, cioè sporgeva a destra
   del gruppo che apre.

   Adesso le rotaie sono quelle di un albero vero (`┌ ├ │ └`), e non
   sono caratteri: sono bordi, perché i caratteri di riquadro cambiano
   altezza da un font all'altro e la riga verticale si spezza fra una
   riga e l'altra. Quale rotaia va dove lo dice `righeDi` in
   `dati/albero.js` — è dato puro, e si prova senza aprire niente.

   ── E NIENTE DI QUELLO CHE SI CALCOLA RESTA NASCOSTO ──────────────
   Due cose erano calcolate e mai scritte. **Le altre strade**
   (`via.alternative`): la lana esce dall'ovile e dalla conigliera, e
   chi ha solo la conigliera guardava una colonna che gli diceva di
   comprare un ovile. **La frase del consiglio** (`via.testo`): veniva
   chiesta per ogni riga ambra — cioè ricamminando la catena ogni
   volta — solo per prenderne il tasto, e la frase buona («Ti servono
   2 carote. Hai un campo libero: seminaci...») si buttava. Adesso sta
   sotto il tasto che la esegue, **dove aggiunge qualcosa**: se il passo
   che propone è la macchina della riga sotto, quella riga lo dice già
   (vedi `perche`).
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { righeDi } from '../dati/albero.js'
import { dentroA } from '../motore/consiglio.js'
import Merce from './Merce.vue'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  /* quello che torna da `alberoDi` */
  albero: { type: Object, default: null },
})
const emit = defineEmits(['fai', 'chiudi'])

const righe = computed(() => righeDi(props.albero))
const radice = computed(() => props.albero || { nome: '?', emoji: '📦' })

/* Cosa dice la riga della merce: verde se ne hai abbastanza, ambra se
   manca, e per una coltura lo stato del campo. */
const dice = n => {
  if (n.stato === 'arriva')
    return n.arriva ? `arriva al livello ${n.arriva}` : 'non si fa in fattoria'
  if (n.stato === 'ok') return `✓ ne hai ${n.ho}`
  const campo = n.via && n.via.campo
  if (campo) {
    if (campo.stato === 'pronto') return '🧺 pronto in un campo'
    if (campo.stato === 'cresce') return `🌱 sta crescendo · ${campo.manca} min`
  }
  return n.ho ? `ne hai ${n.ho}, ${n.servono - n.ho === 1 ? 'manca' : 'mancano'} ${n.servono - n.ho}`
              : 'manca'
}

/* La riga della macchina, fra la merce e i suoi ingredienti. */
const macchina = n => n.via && n.via.macchina
const diceMacchina = m => {
  if (m.stato === 'ok') return '✓ ce l\'hai'
  /* Con la fila (`dati/albero.js`): quanti ne sta facendo, o che è
     piena di altro. «ne fa 1» non si scrive — è quello che si capisce
     già da «pronto fra». */
  if (m.stato === 'lavora' && m.piena) return `⏳ fila piena · si libera fra ${m.manca} min`
  if (m.stato === 'lavora' && m.ne > 1) return `⏳ ne fa ${m.ne}, pronto fra ${m.manca} min`
  if (m.stato === 'lavora') return `⏳ pronto fra ${m.manca} min`
  if (m.stato === 'premio') return '🎁 ti aspetta nei premi'
  if (m.arriva) return `arriva al livello ${m.arriva}`
  return `🛒 non ce l'hai · 🪙${m.prezzo}`
}
/* Le altre strade aperte, scritte dove si fanno: «o nella
   conigliera». Il nome della macchina e il suo genere arrivano già
   risolti da `dati/albero.js` — la vista non conosce il catalogo. */
const altrove = via => {
  const alt = (via && via.alternative) || []
  if (!alt.length) return ''
  const dove = [...new Set(alt.map(a => a.dove ? dentroA(a.dove) : 'in un campo'))]
  return `o ${dove.join(', o ')}`
}

/* ── QUANDO LA FRASE DEL CONSIGLIO AGGIUNGE QUALCOSA ──
   `comeAvere` risale la catena e torna **il prossimo passo che si può
   fare**, che a volte è la macchina di questa riga e a volte sta molto
   più in basso. Quando è la macchina di questa riga, la riga sotto la
   dice già — «Tintoria · 🛒 non ce l'hai · 🪙300» — e scriverci sopra
   «Maglione alla lavanda si fa nella tintoria, che non hai (🪙300)»
   raddoppia l'altezza della colonna per ripetersi. Con sei fasi sono
   sei ripetizioni, cioè due schermate di telefono.

   Quando invece il passo sta altrove — «Hai un campo libero: seminaci
   erba», «I tuoi campi sono tutti occupati: fanne un altro» — quella
   frase è l'unica cosa che lo dice, e senza di lei il tasto porta
   da qualche parte senza spiegare dove. */
const perche = n => {
  const v = n.via, a = v && v.azione
  if (!a || !v.testo) return ''
  const suaMacchina = v.macchina && (a.voce === v.macchina.id)
  return suaMacchina ? '' : v.testo
}

/* Il tasto: cosa c'è scritto dipende da dove porta, come in `Passo.vue`. */
const etichetta = a => !a ? ''
  : a.che === 'compra' ? 'Apri il baule'
  : a.che === 'premio' ? 'Vai al premio'
  : a.che === 'ingrandisci' ? `Ingrandisci · 🪙${a.prezzo}`
  : 'Portami lì'

/* Che rotaia disegnare sull'ultima colonna di una riga: `chiude` è
   l'ultimo fratello (└), `apre` è la riga della macchina, che sta in
   testa al gruppo che introduce (┌). Una macchina senza figli sotto
   — una coltura — chiude invece di aprire. */
const snodo = n => n.ultimo ? 'chiude' : 'mezzo'
const snodoSotto = n => n.rami.length ? 'apre' : 'chiude'
</script>

<template>
  <div class="fa-foglio fa-albero" data-albero :data-albero-di="radice.prodotto">
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>🌳 Come si fa</h2>
    <p class="fa-piccolo">Dall'alto in basso: quello che vuoi, quello che gli
       serve, e giù fino ai campi. Le righe gialle hanno un tasto.</p>

    <div class="fa-rami">
      <template v-for="n in righe" :key="n.prodotto + '@' + n.livello">
        <!-- la merce -->
        <div class="fa-riga" :data-albero-riga="n.prodotto" :data-stato="n.stato">
          <span class="fa-rotaie" aria-hidden="true">
            <i v-for="(g, i) in n.guide" :key="i" :class="['fa-rot', { giu: g }]" />
            <i v-if="n.livello" :class="['fa-rot', snodo(n)]" />
          </span>
          <div :class="['fa-ramo', n.stato, { radice: n.livello === 0 }]">
            <Merce :merce="n.prodotto" :lato="n.livello === 0 ? 40 : 30" />
            <span class="fa-ramo-testo">
              <b>{{ n.nome }}<em v-if="n.livello"> ×{{ n.servono }}</em></b>
              <span>{{ dice(n) }}</span>
              <!-- la frase del consiglio, dove aggiunge qualcosa -->
              <small v-if="perche(n)" class="fa-ramo-perche"
                     data-albero-perche>{{ perche(n) }}</small>
            </span>
            <button v-if="n.via && n.via.azione" type="button" class="fa-bot piccolo"
                    :data-albero-azione="n.via.azione.che"
                    @click="emit('fai', n.via.azione)">{{ etichetta(n.via.azione) }}</button>
          </div>
        </div>
        <!-- la macchina (o il campo) in mezzo: apre il gruppo degli ingredienti -->
        <div v-if="n.via" class="fa-riga"
             :data-albero-macchina="macchina(n) ? macchina(n).id : null">
          <span class="fa-rotaie" aria-hidden="true">
            <i v-for="(g, i) in n.guideSotto" :key="i" :class="['fa-rot', { giu: g }]" />
            <i :class="['fa-rot', snodoSotto(n)]" />
          </span>
          <div :class="['fa-ramo', 'fa-macchina', macchina(n) ? macchina(n).stato : 'ok']">
            <span class="fa-ramo-testo">
              <b>{{ macchina(n) ? macchina(n).nome : n.via.nome
                 }}<em> · {{ n.via.minuti }} min</em></b>
              <span>{{ macchina(n) ? diceMacchina(macchina(n)) : 'si semina in un campo' }}</span>
              <small v-if="altrove(n.via)" class="fa-ramo-altrove"
                     data-albero-altrove>{{ altrove(n.via) }}</small>
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
