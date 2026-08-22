<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COME VA — l'elenco delle domande, dalla peggiore alla migliore

   ── PERCHÉ ESISTE, E PERCHÉ LA PRIMA VERSIONE ERA STATA SOSPESA ───
   Le manopole ci sono tutte e nessuno le tocca, perché **nessuno va a
   cercare un problema che non sa di avere**: un genitore apre le
   impostazioni quando qualcosa lo infastidisce, e la taratura sbagliata
   di una tipologia non infastidisce lui — infastidisce il figlio, che
   non ha le parole per dirlo. Quindi il verso si gira: invece di
   aspettare che il grande cerchi, qui si dice cosa si è notato.

   La prima versione mostrava **solo i segnali**: le tre o quattro righe
   sopra soglia, con il tasto per ritoccarle. Era corretta e non si
   capiva, per un motivo che si vede solo mettendocisi davanti — un
   elenco di quattro righe senza il resto non dice se sono quattro su
   dieci o quattro su centoventi, e senza quel confronto «ne ha sbagliate
   7 su 10» non si sa se è un disastro o la normalità. Adesso ci sono
   tutte, ordinate: le peggiori vengono in cima da sole, e intorno c'è la
   misura per capirle.

   ── UNA RIGA, TRE COSE ────────────────────────────────────────────
   Il nome, i cuori, e quanto ha risposto. Il **punteggio è il tasto**:
   premendolo si apre la scheda con tutti i numeri e le tre cose che si
   possono fare (`SchedaDomanda.vue`). Non c'è una fila di tastini sulla
   riga — erano quattro nella scheda vecchia, e tre erano triangoli.

   ── E NON RITOCCA NIENTE DA SÉ ────────────────────────────────────
   Vale parola per parola quello che sta in `quiz/consiglio.js`: un
   pomeriggio storto o un fratello che ha giocato al posto suo
   insegnerebbero la cosa sbagliata. Qui si mostra il conto, il tasto lo
   preme un umano.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { fasceDelBambino } from './catalogo.js'
import { andamentoDi, riassuntoDi, CUORI } from './andamento.js'
import SchedaDomanda from './SchedaDomanda.vue'
import { state, ritocca, azzeraConto, etaDelBambino } from '../store/profile.js'

const emit = defineEmits(['prova'])

/* `giro` è la dipendenza che rifà i conti dopo un ritocco o un azzera:
   `state.profile.items` è reattivo, ma il catalogo lo si ricalcola a
   mano — costa, e non serve rifarlo a ogni battito. */
const giro = ref(0)
const aperta = ref(null)          // la riga di cui è aperta la scheda
const mostraMai = ref(false)

const eta = computed(() => etaDelBambino())

const elenco = computed(() => {
  giro.value
  const righe = fasceDelBambino().flatMap(f => f.righe)
  return andamentoDi(righe, state.profile.items || {})
})
const conti = computed(() => riassuntoDi(elenco.value))

/* ── i cuori ──
   Cinque simboli e non una percentuale: la colonna si legge con l'occhio
   invece che parola per parola. Sbiaditi quando le prove sono poche —
   il segnale c'è, il verdetto no (vedi `andamento.js`). */
const cuori = r => '♥'.repeat(r.cuori) + '♡'.repeat(CUORI - r.cuori)

function apri(r) { aperta.value = r }
function chiudi() { aperta.value = null }

/* La tacca emette `{ ritocco, spenta }` — la stessa forma che riceve il
   quadro dell'età, perché è lo stesso componente. `spenta` qui è sempre
   falso: spegnere è roba del **pezzo di scuola** e la tacca lo offre solo
   dove c'è un pezzo di scuola da spegnere (`puoSpegnere`), mentre qui si
   guarda una tipologia sola — era il ✕ che, standosene sulla riga di una
   domanda, ne toglieva otto. */
function ritoccaRiga({ tipo, ritocco: gradini }) {
  ritocca(tipo, gradini)
  giro.value++
}
function azzeraRiga(r) {
  azzeraConto(r.tipo)
  giro.value++
  /* la scheda resta aperta e i numeri dentro si azzerano sotto gli
     occhi: chiuderla lascerebbe il dubbio di non aver premuto */
  aperta.value = elenco.value.tutte.find(x => x.tipo === r.tipo) || null
}
function provaRiga(r) {
  chiudi()
  emit('prova', { sorgente: r.sorgente, nome: r.nome, giro: r.classi })
}
</script>

<template>
  <div class="come-va" data-come-va>
    <!-- ── la misura di tutto il resto ──
         Tre numeri in cima, perché «ne ha sbagliate 7 su 10» detto dopo
         dodici risposte in tutta la vita è un'altra cosa che detto dopo
         duemila. -->
    <div class="sommario" data-sommario>
      <div><b>{{ conti.risposte }}</b><span>risposte in tutto</span></div>
      <div><b>{{ conti.incontrate }}</b><span>domande incontrate</span></div>
      <div :class="{ male: conti.male > 0 }"><b>{{ conti.male }}</b><span>vanno male</span></div>
    </div>

    <p v-if="!conti.risposte" class="vuoto">
      Non ha ancora risposto a niente. Questa pagina si riempie da sola giocando:
      ogni domanda si porta dietro quante volte gli è capitata e come è andata.
    </p>

    <template v-else>
      <p class="mini">
        Dalla peggiore alla migliore. <b>Premi il punteggio</b> di una riga per vedere
        tutti i numeri e decidere: provarla, spostarla più facile, o smettere di
        chiedergliela. Sotto {{ conti.minime }} risposte i cuori sono sbiaditi —
        troppo poche per dire com'è andata.
      </p>

      <!-- ── LA RIGA INTERA È IL TASTO ──
           Il punteggio da solo è un bersaglio da novanta pixel in fondo
           a una riga larga tutto lo schermo: si manca, e chi lo manca
           conclude che quella riga non si apre. Il `<button>` è la riga
           — nome, icona e cuori dentro di lui — così il dito atterra
           dove capita e succede la stessa cosa. I cuori restano
           disegnati come un tasto perché sono la parte che dice
           *quanto*, ed è lì che l'occhio va per prima. -->
      <ul class="righe">
        <li v-for="r in elenco.viste" :key="r.tipo" :data-riga="r.tipo">
          <button type="button" class="riga" :data-voto="r.tipo" @click="apri(r)">
            <span class="ico">{{ r.icona }}</span>
            <span class="testo">
              <b>{{ r.nome }}</b>
              <i>{{ r.gruppoNome || r.modulo }}</i>
            </span>
            <span class="voto" :class="{ poche: r.poche, ritoccata: r.ritocco }">
              <b class="cuori">{{ cuori(r) }}</b>
              <i>{{ r.poche ? `${r.quante} prove` : `${r.ok} su ${r.quante}` }}</i>
            </span>
          </button>
        </li>
      </ul>

      <!-- ── e quelle che non gli sono ancora capitate ──
           In coda e chiuse: non hanno un voto e non ne possono avere uno,
           ma si tengono perché è da lì che si spegne in anticipo una cosa
           che a scuola non hanno ancora fatto. -->
      <button v-if="elenco.mai.length" type="button" class="altre"
              data-altre @click="mostraMai = !mostraMai">
        {{ mostraMai ? '▴' : '▾' }} altre {{ elenco.mai.length }} non gli sono ancora capitate
      </button>
      <ul v-if="mostraMai" class="righe spente">
        <li v-for="r in elenco.mai" :key="r.tipo" :data-riga="r.tipo">
          <button type="button" class="riga" :data-voto="r.tipo" @click="apri(r)">
            <span class="ico">{{ r.icona }}</span>
            <span class="testo">
              <b>{{ r.nome }}</b>
              <i>{{ r.gruppoNome || r.modulo }}</i>
            </span>
            <span class="voto mai"><b class="cuori">–</b><i>mai vista</i></span>
          </button>
        </li>
      </ul>
    </template>

    <SchedaDomanda v-if="aperta" :riga="aperta" :eta="eta"
                   @chiudi="chiudi" @prova="provaRiga"
                   @ritocca="ritoccaRiga" @azzera="azzeraRiga" />
  </div>
</template>

<style scoped>
.come-va { display: grid; gap: 10px }

.sommario { display: flex; gap: 8px }
.sommario > div {
  flex: 1; display: grid; gap: 1px; padding: 9px 4px; text-align: center;
  background: #f5f3fc; border-radius: 13px;
}
.sommario b { font-size: 18px; font-weight: 800 }
.sommario span { font-size: 10.5px; color: #8a8a99; line-height: 1.2 }
.sommario .male { background: #ffdede }
.sommario .male b { color: #8c2f2f }

.mini { margin: 0; font-size: 11.5px; line-height: 1.45; color: #8a8a99 }
.vuoto { margin: 0; font-size: 12.5px; line-height: 1.5; color: #55556a }

.righe { list-style: none; margin: 0; padding: 0; display: grid; gap: 3px }
/* la riga intera è il tasto: bersaglio largo quanto lo schermo, e il
   testo dentro resta allineato a sinistra come in un elenco */
.riga {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 4px 6px; margin: 0 -6px; border: 0; border-radius: 12px;
  background: none; color: inherit; font: inherit; text-align: left;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.riga:active { background: #f5f3fc; transform: scale(.995) }
.ico { font-size: 17px; width: 22px; text-align: center }
.testo { flex: 1; min-width: 0; display: grid }
.testo b { font-size: 13px; font-weight: 700 }
.testo i { font-style: normal; font-size: 11px; color: #8a8a99 }

/* il punteggio non è più un tasto per conto suo — lo è tutta la riga —
   ma resta disegnato come tale: è la parte che dice *quanto*, ed è lì
   che l'occhio va per prima scorrendo l'elenco */
.voto {
  display: grid; gap: 1px; min-width: 92px; padding: 6px 9px;
  border-radius: 12px; background: #f5f3fc; color: #5b3fa8;
  text-align: right;
}
.voto .cuori { font-size: 13px; letter-spacing: 1px }
.voto i { font-style: normal; font-size: 10.5px; color: #8a8a99 }
/* poche prove: il segnale c'è, il verdetto no */
.voto.poche { opacity: .55 }
.voto.ritoccata { background: #fff6e4; color: #7d5410 }
.voto.mai { background: #f2f2f6; color: #9a9aa8 }
.righe.spente .testo b { color: #7a7a8a; font-weight: 600 }

.altre {
  margin-top: 2px; padding: 9px; border: 0; border-radius: 12px;
  background: #f5f3fc; color: #5b3fa8; font: inherit; font-size: 12px;
  font-weight: 700; cursor: pointer;
}
</style>
