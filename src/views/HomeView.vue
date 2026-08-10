<script setup>
import { computed } from 'vue'
import { state, selectPlayer, level, countMastered,
         miei, daCurare, chiede, traguardi, serieGiorni, livelloOra,
         mateProgresso, calcProgresso, engProgresso, espProgresso, mercatoProgresso,
         labProgresso, tabellineIntere, genProgresso,
         giocoAcceso, quantiGiochiAccesi } from '../store/profile.js'
import { CAMPAGNA } from '../data/tabelline.js'
import { STAZIONI } from '../data/calcolo.js'
import { CAMPAGNA as TAPPE_EN } from '../data/campagna-inglese.js'
import { CAMPAGNA as TAPPE_ES } from '../data/campagna-spagnolo.js'
import { SCALE, TAPPE as TAPPE_POZ } from '../data/pozioni.js'
import { CAMPAGNE as GIORNATE } from '../data/bancarella.js'
import { QUANTI as QUANTI_GEN } from '../data/generale.js'
import { GIOCHI_NUOVI } from '../giochi/indice.js'
import { progresso as progressoDi } from '../giochi/campagne.js'

defineEmits(['vai'])

/* Scritta in fondo alla home: serve a rispondere a "il telefono ha preso
   l'aggiornamento?" guardando lo schermo, senza doverlo indovinare.
   La stringa la mette il build (vite.config.js). */
const versione = __VERSIONE__

/* English è un gioco solo: parole, verbi e frasi stanno nella stessa
   campagna, quindi il numero da mostrare è quanto se ne sa in tutto. */
const imparateEn = computed(() =>
  countMastered('en:') + countMastered('verbo:') + countMastered('frase:'))
const tappaEn = computed(() => engProgresso())
/* stessa cosa per lo spagnolo, che ha le sue chiavi: quello che si sa in
   una lingua non conta nell'altra */
const imparateEs = computed(() =>
  countMastered('es:') + countMastered('verbo-es:') + countMastered('frase-es:'))
const tappaEs = computed(() => espProgresso())
/* dalla home si vede dove si è arrivati nella campagna, non un numero
   astratto: "pianeta 4 di 10" dice al bambino cosa lo aspetta stasera */
const pianeta = computed(() => mateProgresso())
const stelleMate = computed(() => tabellineIntere().length)
/* negli asteroidi ci sono due campagne: i pianeti (tabelline) e le
   stazioni (calcolo a mente). La carta dice quella a cui si è più
   indietro, che è quella dove c'è da fare. */
const stazione = computed(() => calcProgresso())

/* il laboratorio ha le sue tappe, e a campagna finita il laboratorio libero */
const QUANTE_MISURE = SCALE.length
const QUANTE_TAPPE_POZ = TAPPE_POZ.length
const lab = computed(() => labProgresso())
const pozioni = computed(() => state.profile.totals.pozioni || 0)
const misure = computed(() => countMastered('pozioni:'))
const clienti = computed(() => state.profile.totals.clienti || 0)
const restiPerfetti = computed(() => state.profile.totals.restiPerfetti || 0)
/* la bancarella invece la campagna ce l'ha: le giornate di mercato */
const mercato = computed(() => mercatoProgresso())
const QUANTE_GIORNATE = GIORNATE.length

/* il generale: dove si è arrivati e quante stelle si sono raccolte in
   tutto (una per livello portato a casa, due per chi sta nel par) */
const generale = computed(() => genProgresso())
const stelleGen = computed(() =>
  Object.values(generale.value.stelle || {}).reduce((n, s) => n + s, 0))

const badge = computed(() => traguardi().filter(t => t.preso).length)
const serie = computed(() => serieGiorni())
const salita = computed(() => livelloOra())

/* I bisogni degli animali sono la sola cosa che cambia da sola mentre il
   gioco è chiuso: dirlo qui è metà del motivo per riaprirlo. Si nomina
   chi sta peggio e cosa vuole — "Watson vuole giocare" riporta al gioco
   molto più di "qualcuno ha bisogno di te". */
const animali = computed(() => miei().length)
const bisognosi = computed(() => daCurare())
const richiesta = computed(() => {
  const chi = bisognosi.value
  if (!chi.length) return ''
  const nomi = chi.map(p => p.nome)
  if (chi.length === 1) return `${nomi[0]} ${chiede(chi[0].id).def.chiede}`
  // da tre in su i nomi in fila diventano una filastrocca: si conta e basta
  if (chi.length > 2) return `${chi.length} amici hanno bisogno di te`
  return `${nomi.join(' e ')} hanno bisogno di te`
})
const oggetti = computed(() => state.profile.owned.length)

/* Azzerare i progressi non sta più qui: era un tocco solo, e un tocco solo
   prima o poi arriva per sbaglio. Ora vive dietro il PIN in GenitoriView,
   insieme a salvataggio e ripristino. */

/* Quali carte si vedono lo decidono i genitori, un gioco per volta e per
   bambino (`settings.giochi`). Un gioco spento sparisce dalla home ma
   resta raggiungibile dall'indirizzo (`#torri`): il frammento è roba da
   grandi e da test, non una strada che un bambino trova per caso.
   Cameretta e albo non si spengono: sono le monete e i progressi. */
const acceso = chiave => giocoAcceso(chiave)
const nessunGioco = computed(() => quantiGiochiAccesi() === 0)
</script>

<template>
  <!-- dove finiscono i dati non è roba da leggere per un bambino, ma il
       test di avvio deve poter dire che siamo su IndexedDB e non sulla
       memoria: sta nell'attributo, non sullo schermo -->
  <div class="schermo" :data-archivio="state.storage">
    <div class="centro">
      <!-- niente intestazione col nome: chi apre l'app sa già di chi è il
           telefono, e quella riga rubava il posto ai giochi. Chi sta
           giocando si legge dalla fila qui sotto quando i giocatori sono
           più di uno, e nell'albo. -->

      <!-- con un giocatore solo non c'è niente da scegliere: la fila
           sparisce invece di mostrare un bottone sempre premuto -->
      <div class="giocatori" v-if="state.giocatori.length > 1">
        <button v-for="g in state.giocatori" :key="g.id" class="gioc"
                :class="{ on: state.player === g.id }"
                @click="selectPlayer(g.id)">{{ g.nome }}</button>
      </div>

      <!-- la fascia è il riassunto di dove sei, e porta all'albo -->
      <button class="fascia" @click="$emit('vai','albo')">
        <span class="stella">⭐<b>{{ level }}</b></span>
        <span class="dove">
          <b>{{ salita.titolo }}</b>
          <span class="barretta"><i :style="{ width: Math.round(salita.quota * 100) + '%' }"></i></span>
        </span>
        <span class="numeri">
          🪙 {{ state.profile.coins }}<br>
          <em>🏅 {{ badge }}<span v-if="serie > 1"> · 🔥 {{ serie }}</span></em>
        </span>
      </button>

      <div class="carte">
        <button v-if="acceso('mate')" class="carta mate" @click="$emit('vai','mate')">
          <span class="ico">☄️</span>
          <b>Asteroidi</b>
          <i v-if="pianeta.libera">volo libero ♾️ · stazione
            {{ Math.min(stazione.tappa + 1, STAZIONI.length) }} di {{ STAZIONI.length }}</i>
          <i v-else>pianeta {{ Math.min(pianeta.tappa + 1, CAMPAGNA.length) }} di
            {{ CAMPAGNA.length }} · stazione
            {{ Math.min(stazione.tappa + 1, STAZIONI.length) }} di {{ STAZIONI.length }}</i>
        </button>
        <button v-if="acceso('inglese')" class="carta eng" @click="$emit('vai','inglese')">
          <span class="ico">🌐</span>
          <b>English</b>
          <i v-if="tappaEn.libera">gioco libero ♾️ · 🎯 {{ imparateEn }} sicure</i>
          <i v-else>tappa {{ Math.min(tappaEn.tappa + 1, TAPPE_EN.length) }} di
            {{ TAPPE_EN.length }} · 🎯 {{ imparateEn }} sicure</i>
        </button>
        <button v-if="acceso('spagnolo')" class="carta esp" @click="$emit('vai','spagnolo')">
          <span class="ico">🇪🇸</span>
          <b>Spagnolo</b>
          <i v-if="tappaEs.libera">gioco libero ♾️ · 🎯 {{ imparateEs }} sicure</i>
          <i v-else>tappa {{ Math.min(tappaEs.tappa + 1, TAPPE_ES.length) }} di
            {{ TAPPE_ES.length }} · 🎯 {{ imparateEs }} sicure</i>
        </button>
        <button v-if="acceso('torri')" class="carta td" @click="$emit('vai','torri')">
          <span class="ico">🏰</span>
          <b>Difendi il Castello</b>
          <i>operazioni in colonna · torri e nemici</i>
        </button>
        <button v-if="acceso('pozioni')" class="carta poz" @click="$emit('vai','pozioni')">
          <span class="ico">⚗️</span>
          <b>Il laboratorio delle pozioni</b>
          <i v-if="lab.libera">♾️ laboratorio libero · 🪜 {{ misure }}/{{ QUANTE_MISURE }} conversioni</i>
          <i v-else-if="pozioni">⚗️ tappa {{ lab.tappa + 1 }} di {{ QUANTE_TAPPE_POZ }}
            · 🧪 {{ pozioni }} preparate</i>
          <i v-else>litri, chili e metri · versa, pesa e taglia</i>
        </button>
        <button v-if="acceso('bancarella')" class="carta banco" @click="$emit('vai','bancarella')">
          <span class="ico">🛒</span>
          <b>La bancarella</b>
          <i v-if="mercato.libera">♾️ mercato libero · ✨ {{ restiPerfetti }} resti precisi</i>
          <i v-else-if="clienti">🧺 giornata {{ mercato.tappa + 1 }} di {{ QUANTE_GIORNATE }}
            · ✨ {{ restiPerfetti }} resti precisi</i>
          <i v-else>euro e centesimi · dai tu il resto</i>
        </button>
        <button v-if="acceso('generale')" class="carta gen" @click="$emit('vai','generale')">
          <span class="ico">🎖️</span>
          <b>Il generale</b>
          <i v-if="generale.tappa">🎖️ livello {{ Math.min(generale.tappa + 1, QUANTI_GEN) }} ·
            ⭐ {{ stelleGen }} stelle</i>
          <i v-else>dai gli ordini e guarda · sequenze, cicli, eventi</i>
        </button>
        <!-- I giochi della cartella `src/giochi/` portano con sé nome,
             icona, colore e la riga di avanzamento: qui non c'è una carta
             scritta a mano per ognuno, ce n'è una sola che le fa tutte.
             Un gioco nuovo compare in home senza toccare questo file. -->
        <button v-for="g in GIOCHI_NUOVI" :key="g.chiave" v-show="acceso(g.chiave)"
                class="carta gioco" :data-gioco="g.chiave"
                :style="{ background: `linear-gradient(120deg,${g.tinta},#fffffff0)` }"
                @click="$emit('vai', g.chiave)">
          <span class="ico">{{ g.icona }}</span>
          <b>{{ g.nome }}</b>
          <i>{{ g.riassunto(progressoDi(g.chiave)) }}</i>
        </button>
        <!-- se i genitori li hanno spenti tutti, la home lo dice: senza,
             sarebbe una schermata rotta invece di una scelta -->
        <p v-if="nessunGioco" class="mini vuoto">I giochi sono spenti.
          Si riaccendono da <b>genitori</b>, qui sotto.</p>
        <!-- una carta sola: la stanza, gli amici e il negozio sono lo stesso
             posto, e la riga sotto dice la cosa che cambia da sola — chi ha
             bisogno di te — perché è quella che fa riaprire il gioco -->
        <button class="carta room" @click="$emit('vai','cameretta')">
          <span class="ico">🛏️</span>
          <b>La cameretta</b>
          <i v-if="!animali">cani, gatti, pappagalli e un draghetto ti aspettano</i>
          <i v-else-if="richiesta" class="fame">{{ richiesta }}</i>
          <i v-else>{{ animali }} {{ animali > 1 ? 'animali' : 'animale' }} ·
            {{ oggetti }} {{ oggetti === 1 ? 'oggetto' : 'oggetti' }} sugli scaffali</i>
        </button>
        <!-- ai progressi si va dalla fascia in cima, che dice già livello,
             monete e medaglie: la carta qui sotto era la stessa strada
             detta due volte -->
      </div>

      <div v-if="state.regalo.n" :key="state.regalo.k" class="regalo">
        {{ state.regalo.n > 0 ? '+' : '' }}{{ state.regalo.n }} 🪙
      </div>

      <p v-if="state.storage === 'memoria'" class="avviso">
        Questa anteprima non può salvare nulla. Scarica il file e aprilo dal telefono
        o dal computer perché monete e progressi restino.
      </p>
      <!-- il piede è roba da grandi: sta su una riga sola, in fondo, e non
           si porta via lo spazio delle carte -->
      <p class="piede">
        <button class="link" @click="$emit('vai','genitori')">genitori</button>
        <span class="versione">aggiornato il {{ versione.etichetta
          }}<span v-if="versione.commit"> · {{ versione.commit }}</span></span>
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Va a capo, e i nomi lunghi si stringono invece di sfondare: finché i
   giocatori erano due scritti nel codice bastava una fila, adesso i
   genitori ne possono aggiungere quanti vogliono e su un telefono
   stretto tre nomi in fila escono già dallo schermo. */
.giocatori { display:flex; gap:10px; flex-wrap:wrap; justify-content:center;
             max-width:100%; padding:0 8px }
.gioc { padding:13px 26px; border-radius:999px; background:#ffffffcc; color:var(--viola-scuro);
        font-size:19px; font-weight:800; box-shadow:0 4px 0 #d4dce6; transition:.14s;
        max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.gioc.on { background:linear-gradient(180deg,var(--viola),var(--viola-scuro)); color:#fff;
           box-shadow:0 4px 0 #2c4283; transform:translateY(-1px) }
.carte { display:flex; flex-direction:column; gap:11px; width:100%; max-width:400px }
.carta { display:grid; grid-template-columns:auto 1fr; grid-template-rows:auto auto; gap:2px 14px;
         align-items:center; text-align:left; padding:14px 18px; border-radius:20px;
         background:var(--carta); box-shadow:0 5px 0 #dde3ea, 0 10px 22px #8593a822 }
.carta:active { transform:translateY(2px); box-shadow:0 3px 0 #dde3ea }
.carta .ico { grid-row:1/3; font-size:38px }
.carta b { font-size:18px; font-weight:900; color:var(--viola-scuro) }
.carta i { font-style:normal; font-size:13px; color:var(--tenue) }
.carta.mate { background:linear-gradient(120deg,#e8f0ff,#fffffff0) }
.carta.eng  { background:linear-gradient(120deg,#ffeaf2,#fffffff0) }
.carta.verbi { background:linear-gradient(120deg,#e8edf8,#fffffff0) }
.carta.esp  { background:linear-gradient(120deg,#fff0d9,#fffffff0) }
.carta.td   { background:linear-gradient(120deg,#e6f7e2,#fffffff0) }
.carta.poz  { background:linear-gradient(120deg,#ece2ff,#fffffff0) }
.carta.banco{ background:linear-gradient(120deg,#fff0dc,#fffffff0) }
.carta.gen  { background:linear-gradient(120deg,#e4f0e8,#fffffff0) }
.carta.room { background:linear-gradient(120deg,#ffeede,#fff6e0 45%,#fffffff0) }
/* la fascia: livello, quanto manca al prossimo, monete e medaglie */
.fascia { display:flex; align-items:center; gap:11px; width:100%; max-width:400px;
          padding:9px 14px; border-radius:18px; text-align:left;
          background:linear-gradient(120deg,#e8edf8,#fffffff0);
          box-shadow:0 4px 0 #dde3ea, 0 8px 18px #8593a822 }
.fascia:active { transform:translateY(2px); box-shadow:0 2px 0 #dde3ea }
.stella { position:relative; font-size:29px; flex:none }
.stella b { position:absolute; inset:0; display:grid; place-items:center; font-size:12.5px;
            font-weight:900; color:#7a4b00; padding-top:2px }
.dove { flex:1; min-width:0 }
.dove b { display:block; font-size:13px; font-weight:900; color:var(--viola-scuro);
          margin-bottom:4px }
.barretta { display:block; height:8px; border-radius:999px; background:#d7dfea; overflow:hidden }
.barretta i { display:block; height:100%; border-radius:999px; transition:width .5s;
              background:linear-gradient(90deg,var(--viola),var(--rosa)) }
.numeri { flex:none; font-size:13px; font-weight:900; color:var(--viola-scuro); text-align:right;
          line-height:1.35 }
.numeri em { font-style:normal; font-size:11.5px; color:var(--tenue) }
.carta .fame { color:var(--rosso); font-weight:800 }
.vuoto { text-align:center; padding:6px 0 2px }
/* le monete regalate dall'indirizzo: si vedono e poi se ne vanno */
.regalo { position:fixed; left:50%; top:21%; z-index:60; pointer-events:none;
          font-size:44px; font-weight:900; color:#c98a00;
          text-shadow:0 2px 0 #fff, 0 0 20px #ffd94a;
          animation:regalo 1.8s ease-out forwards }
@keyframes regalo { 0%{opacity:0;transform:translateX(-50%) scale(.4)}
                    25%{opacity:1;transform:translateX(-50%) scale(1.2)}
                    40%{transform:translateX(-50%) scale(1)}
                    100%{opacity:0;transform:translate(-50%,-120px) scale(.85)} }
/* Deve potersi leggere se la si cerca, e sparire se non la si cerca:
   e' roba da grandi, i bambini non ci devono nemmeno inciampare. */
.piede { display:flex; align-items:baseline; justify-content:center; gap:9px;
         flex-wrap:wrap; margin-top:10px }
.versione { font-size:11px; opacity:.42; letter-spacing:.3px }
</style>
