<script setup>
import { computed } from 'vue'
import { state, selectPlayer, level, countMastered,
         miei, daCurare, chiede, traguardi, serieGiorni, livelloOra,
         mateProgresso, calcProgresso, engProgresso, espProgresso, mercatoProgresso,
         labProgresso, tabellineIntere, genProgresso,
         giocoAcceso, quantiGiochiAccesi, varianteAccesa } from '../store/profile.js'
import { CHIAVE_MENTE, scaletta, posizioneOra, progressiDa,
         superata } from '../data/asteroidi.js'
import { CAMPAGNA as TAPPE_EN } from '../data/campagna-inglese.js'
import { CAMPAGNA as TAPPE_ES } from '../data/campagna-spagnolo.js'
import { SCALE, TAPPE as TAPPE_POZ } from '../data/pozioni.js'
import { CAMPAGNE as GIORNATE } from '../data/bancarella.js'
/* la riga del generale conta le prove CHE SI VEDONO, non tutte quelle
   che ci sono: quelle non ancora approvate stanno dietro il cancello dei
   giochi in prova, e «livello 4 di 26» a chi ne ha sei in elenco non
   direbbe niente di vero */
import { fatte as proveFatte, quante as proveQuante } from './generale/fila.js'
import { gioco as giocoNuovo } from '../giochi/indice.js'
import { progresso as progressoDi } from '../giochi/campagne.js'
import { GIOCHI } from '../data/giochi.js'
import { AREE, MODI } from '../data/aree.js'

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
/* Negli asteroidi le tabelline e i conti a mente sono una scaletta sola
   (`data/asteroidi.js`): la carta dice a che punto della fila si è, che
   è la cosa che il bambino ritrova aprendo il gioco. Il numero cambia se
   i grandi hanno spento il calcolo a mente, e deve: la fila che si vede
   è più corta. */
const stazione = computed(() => calcProgresso())
const menteAccesa = computed(() => varianteAccesa(CHIAVE_MENTE))
const filaMate = computed(() => scaletta(menteAccesa.value))
const progMate = computed(() => progressiDa(pianeta.value, stazione.value))
const doveMate = computed(() => posizioneOra(progMate.value, menteAccesa.value))
/* Quante ne sono state fatte e qual è la prima che manca sono DUE numeri
   diversi, e vanno detti tutti e due: chi arriva da prima della fusione
   può avere cinque pianeti e nessuna stazione, e allora «quante ne hai
   fatte» dice sette mentre «da dove si riprende» indica la prima tappa
   della fila. Dire solo il secondo farebbe sembrare che i progressi
   siano spariti. */
const fatteMate = computed(() =>
  filaMate.value.filter(v => superata(v, progMate.value)).length)

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

/* ═══════════ le carte, che adesso si costruiscono da sole ═══════════
   Erano tredici blocchi scritti a mano, ognuno con la sua riga di
   descrizione — e quella riga diceva già, con parole diverse, quello
   che `data/giochi.js` dice nel campo `che`. Due posti da tenere
   d'accordo per la stessa frase, e infatti non lo erano più: il
   castello in home si presentava «operazioni in colonna · torri e
   nemici» e nei settaggi dei genitori «operazioni in colonna, torri e
   nemici». Adesso la frase è una, sta col gioco, e qui si legge.

   Il colore invece resta CSS e non dato, per i sette vecchi: sono
   sfumature scritte a mano una per una (`.carta.td`, `.carta.poz`) e
   spostarle in una tabella di stringhe le renderebbe più difficili da
   ritoccare, non meno. I giochi nuovi portano la loro `tinta` nel
   manifesto perché nascono senza una riga di CSS dedicata. */
const CLASSE = {
  mate: 'mate', inglese: 'eng', spagnolo: 'esp', torri: 'td',
  pozioni: 'poz', bancarella: 'banco', generale: 'gen',
}

/* Un gruppo senza nemmeno un gioco acceso non si disegna: i genitori
   possono spegnere tutte le parole, e «PAROLE» su una fila vuota
   sarebbe un titolo che promette qualcosa che non c'è. */
const gruppi = computed(() => AREE
  .map(a => ({ ...a, giochi: GIOCHI.filter(g => g.area === a.chiave && acceso(g.chiave)) }))
  .filter(a => a.giochi.length))

/* A che punto sei, gioco per gioco. I cinque nuovi se lo sanno dire da
   soli (`riassunto()` nel manifesto); i sette vecchi no, e le loro
   righe stavano nel template — le stesse identiche espressioni, spostate
   qui perché il template adesso è un ciclo solo e non ha più un posto
   dove metterle. Una riga vuota è legittima: vuol dire «non l'hai
   ancora aperto», e la carta dice comunque cosa insegna. */
const dove = computed(() => {
  const q = (n, tot) => `${Math.min(n + 1, tot)} di ${tot}`
  return {
    mate: doveMate.value >= filaMate.value.length
      ? `volo libero ♾️ · ⭐ ${stelleMate.value}/10 tabelline`
      : `${fatteMate.value} tapp${fatteMate.value === 1 ? 'a' : 'e'} ` +
        `su ${filaMate.value.length} · ora ${filaMate.value[doveMate.value].T.nome}`,
    inglese: tappaEn.value.libera
      ? `gioco libero ♾️ · 🎯 ${imparateEn.value} sicure`
      : `tappa ${q(tappaEn.value.tappa, TAPPE_EN.length)} · 🎯 ${imparateEn.value} sicure`,
    spagnolo: tappaEs.value.libera
      ? `gioco libero ♾️ · 🎯 ${imparateEs.value} sicure`
      : `tappa ${q(tappaEs.value.tappa, TAPPE_ES.length)} · 🎯 ${imparateEs.value} sicure`,
    torri: '',
    pozioni: lab.value.libera
      ? `♾️ laboratorio libero · 🪜 ${misure.value}/${QUANTE_MISURE} conversioni`
      : pozioni.value
        ? `⚗️ tappa ${lab.value.tappa + 1} di ${QUANTE_TAPPE_POZ} · 🧪 ${pozioni.value} preparate`
        : '',
    bancarella: mercato.value.libera
      ? `♾️ mercato libero · ✨ ${restiPerfetti.value} resti precisi`
      : clienti.value
        ? `🧺 giornata ${mercato.value.tappa + 1} di ${QUANTE_GIORNATE} · ✨ ${restiPerfetti.value} resti precisi`
        : '',
    generale: generale.value.tappa
      ? `🎖️ livello ${Math.min(proveFatte + 1, proveQuante)} · ⭐ ${stelleGen.value} stelle`
      : '',
  }
})

/* i nuovi passano dal manifesto, i vecchi dalla tabella qui sopra */
function aChePunto (chiave) {
  if (chiave in dove.value) return dove.value[chiave]
  const m = giocoNuovo(chiave)
  return m ? m.riassunto(progressoDi(chiave)) : ''
}
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
        <!-- ═══ un ciclo solo, per tutti e dodici ═══
             I gruppi vengono da `data/aree.js` e le carte da
             `data/giochi.js`: qui non c'è più una carta scritta a mano
             per gioco, e un gioco nuovo compare senza toccare questo
             file — vale per i cinque della convenzione nuova come per i
             sette vecchi, che prima stavano scritti uno per uno.

             Tre righe per carta, e sono tre cose diverse: il nome, cosa
             insegna, e come si gioca più dove sei arrivato. La seconda
             è quella che mancava, ed è quella che serve a chi la home
             la guarda per scegliere invece che per riprendere. -->
        <template v-for="a in gruppi" :key="a.chiave">
          <h2 class="area">{{ a.emoji }} {{ a.nome }}</h2>
          <button v-for="g in a.giochi" :key="g.chiave"
                  class="carta gioco tre" :class="CLASSE[g.chiave]" :data-gioco="g.chiave"
                  :style="g.tinta ? { background: `linear-gradient(120deg,${g.tinta},#fffffff0)` } : null"
                  @click="$emit('vai', g.chiave)">
            <span class="ico">{{ g.ico }}</span>
            <b>{{ g.nome }}<em v-if="g.piccoli" class="tag">piccoli</em></b>
            <i>{{ g.che }}</i>
            <small class="modo">{{ MODI[g.come].emoji }} {{ MODI[g.come].nome
              }}<template v-if="aChePunto(g.chiave)"> · {{ aChePunto(g.chiave) }}</template></small>
          </button>
        </template>

        <!-- se i genitori li hanno spenti tutti, la home lo dice: senza,
             sarebbe una schermata rotta invece di una scelta -->
        <p v-if="nessunGioco" class="mini vuoto">I giochi sono spenti.
          Si riaccendono da <b>Per i grandi</b>, qui sotto.</p>

        <!-- ═══ quello che non è una materia ═══
             La cameretta non insegna niente e non sta in nessun gruppo:
             è il posto delle monete e degli animali, e il commento in
             `data/giochi.js` lo dice da sempre. Il lucchetto le sta
             accanto perché sono le due carte che non sono giochi. -->
        <h2 class="area">🏡 A casa</h2>
        <button class="carta room" @click="$emit('vai','cameretta')">
          <span class="ico">🛏️</span>
          <b>La cameretta</b>
          <i v-if="!animali">cani, gatti, pappagalli e un draghetto ti aspettano</i>
          <i v-else-if="richiesta" class="fame">{{ richiesta }}</i>
          <i v-else>{{ animali }} {{ animali > 1 ? 'animali' : 'animale' }} ·
            {{ oggetti }} {{ oggetti === 1 ? 'oggetto' : 'oggetti' }} sugli scaffali</i>
        </button>

        <!-- Era la scritta «genitori» in fondo, in grigio e in minuscolo:
             si trovava solo sapendo già che c'era. Il codice a quattro
             cifre è la porta, non l'essere nascosti — e una porta che
             non si vede la cerca soltanto chi sa già di doverla cercare.
             Il nome dice cosa c'è dentro, perché «genitori» diceva a chi
             è rivolta la pagina e non cosa ci si fa. -->
        <button class="carta grandi" data-azione="grandi" @click="$emit('vai','genitori')">
          <span class="ico">🔒</span>
          <b>Per i grandi</b>
          <i>quali giochi si vedono, chi gioca, i progressi e il codice</i>
        </button>
      </div>

      <div v-if="state.regalo.n" :key="state.regalo.k" class="regalo">
        {{ state.regalo.n > 0 ? '+' : '' }}{{ state.regalo.n }} 🪙
      </div>

      <p v-if="state.storage === 'memoria'" class="avviso">
        Questa anteprima non può salvare nulla. Scarica il file e aprilo dal telefono
        o dal computer perché monete e progressi restino.
      </p>
      <!-- nel piede resta la sola versione: la strada per i grandi adesso
           è una carta come le altre, qui sopra. Questa riga serve a
           rispondere «il telefono ha preso l'aggiornamento?» guardando
           lo schermo, e non è una cosa da toccare. -->
      <p class="piede">
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
/* grigio, e l'unica carta che non è colorata: in mezzo a undici carte a
   pastello quella dei grandi si deve vedere senza chiamare */
.carta.grandi { background:linear-gradient(120deg,#eceff4,#fffffff0) }

/* ── il titolo di un gruppo ──
   Non è una carta e non si tocca: sta fuori dal riquadro, in piccolo e
   in maiuscoletto, e serve a dire «da qui in giù sono numeri». Grosso
   com'era una carta si sarebbe letto come una cosa da aprire. */
.area { align-self:flex-start; margin:13px 0 -3px 7px; font-size:12px; font-weight:900;
        letter-spacing:.8px; text-transform:uppercase; color:var(--viola-scuro); opacity:.55 }
.area:first-child { margin-top:0 }

/* tre righe invece di due: il nome, cosa insegna, e come si gioca più
   dove sei arrivato. L'icona le attraversa tutte e tre. */
.carta.tre { grid-template-rows:auto auto auto }
.carta.tre .ico { grid-row:1/4 }
.modo { font-size:11.5px; color:var(--tenue); opacity:.9; line-height:1.3 }
/* i giochi che si aprono a quattro anni: un'etichetta e non un gruppo a
   parte, perché stanno benissimo dove sono — un bambino di sei anni che
   apre «Conta gli animali» non sta sbagliando schermata */
.tag { margin-left:7px; font-style:normal; font-size:10px; font-weight:900;
       letter-spacing:.4px; text-transform:uppercase; color:#2f6b3f;
       background:#dff0d8; border-radius:7px; padding:2px 6px; vertical-align:middle }
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
