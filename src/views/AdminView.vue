<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA PAGINA DEI TRUCCHI — `#admin`

   I cheat di casa stanno nell'indirizzo, ognuno letto dal posto che lo
   riguarda (`#monete=500` dal profilo, `#fattoria-tipo=30` dalla
   fattoria, `#sotterraneo=roba` dal sotterraneo…), ed erano diventati
   abbastanza da non ricordarseli: si andavano a cercare nel codice.
   Qui ci sono tutti, uno per tasto, più quello che serve a usarli bene
   — un bambino di prova su cui provarli.

   ── NIENTE CODICE, E NIENTE PORTA IN HOME ─────────────────────────
   Non chiede il codice dei grandi e non ha una carta da nessuna parte:
   ci si arriva solo scrivendo `#admin` nell'indirizzo, che dall'app
   installata non si può fare. È la stessa porta dei cheat che elenca
   — un bambino che la trova si è guadagnato il diritto di usarla — e
   un codice in più sarebbe una cosa in più da ricordare, cioè proprio
   quello che questa pagina toglie.

   ── I TASTI NON FANNO: SCRIVONO L'INDIRIZZO ───────────────────────
   Quasi ogni tasto scrive il cheat che esiste già e porta dove quel
   cheat si legge. Non si rifà niente qui: se un cheat cambia, questa
   pagina lo segue senza saperlo. Fanno da sé solo le cose che un cheat
   non ha — il bambino di prova, i due interruttori che stanno dietro il
   codice dei grandi, il codice rimesso a `0000`.
   ═══════════════════════════════════════════════════════════════════ */
import { computed, ref } from 'vue'
import Barra from '../components/Barra.vue'
import { state, selectPlayer, creaGiocatore, nomeCorrente, etaDelBambino,
         sperimentaliAccesi, accendiSperimentali, tuttoAperto, accendiTuttoAperto }
  from '../store/profile.js'
import { azzeraPin } from '../store/pin.js'
import { ripara } from '../incidenti.js'
import { GIOCHI } from '../data/giochi.js'
import { LIVELLI_TIPO } from '../giochi/fattoria/motore/tipo.js'

const emit = defineEmits(['vai'])

const VERSIONE = typeof __VERSIONE__ !== 'undefined' ? __VERSIONE__ : { etichetta: 'sviluppo', commit: '' }
const chi = computed(() => nomeCorrente())
const eta = computed(() => etaDelBambino())
const prova = computed(() => sperimentaliAccesi())
const aperto = computed(() => tuttoAperto())
const esito = ref('')

/* Un cheat dell'indirizzo, e la schermata dove si legge. Scriverlo
   basta per le monete (le riscuote il profilo a qualunque ora); gli
   altri si leggono **entrando** nel loro gioco, e ci si porta lì. */
function trucco(frammento, dove = null) {
  location.hash = frammento
  if (dove) emit('vai', dove)
}

/* ── il bambino di prova ──
   La fattoria di prova butta quella del bambino attivo: sul server di
   casa è quella vera. Un tasto solo lo crea la prima volta e ci torna
   le altre; si toglie dalle impostazioni dei grandi come ogni bambino. */
const PROVA = 'Prova'
async function bambinoDiProva() {
  const c = state.giocatori.find(g => g.nome === PROVA)
  if (c) await selectPlayer(c.id)
  else await creaGiocatore(PROVA)
}

async function codiceAZero() {
  await azzeraPin()
  esito.value = 'Il codice dei grandi è tornato 0000.'
}

/* le schermate che non sono giochi: ci si arriva da qui senza passare
   dalla home */
const ALTRE = [
  { chiave: 'genitori', ico: '⚙︎', nome: 'Impostazioni dei grandi' },
  { chiave: 'novita', ico: '📰', nome: 'Novità' },
  { chiave: 'guide', ico: '❔', nome: 'Come funziona' },
  { chiave: 'albo', ico: '🏅', nome: 'Albo' },
]

/* Promemoria per scriverli a mano: sono gli stessi dei tasti, più
   quelli che vogliono un numero che si sa solo al momento. */
const A_MANO = [
  ['#admin', 'questa pagina'],
  ['#monete=500', 'monete in più (con − le toglie)'],
  ['#fattoria-tipo=30', 'fattoria già giocata di quel livello, 1–99'],
  ['#fattoria=40', 'solo il livello della fattoria, il prato resta'],
  ['#stagione=natale', 'la fattoria a Natale (o halloween)'],
  ['#sotterraneo=roba', 'si scende equipaggiati'],
  ['#abisso=12', 'l\'abisso dal piano 12'],
  ['#seme=812', 'il sotterraneo con quel seme, per rivedere una discesa'],
  ['#pin=1234', 'il codice dei grandi rimesso a quello'],
  ['#ripara', 'butta la copia del gioco e la riscarica'],
  ['#fattoria', 'apre un gioco: la chiave dopo il #'],
]
</script>

<template>
  <div class="schermo" data-admin>
    <Barra titolo="Admin" :audio="false" monete @indietro="$emit('vai','home')" />

    <div class="corpo">
      <p class="chi">Gioca <b>{{ chi }}</b> · {{ eta }} anni
        <small>versione {{ VERSIONE.etichetta }}{{ VERSIONE.commit ? ' · ' + VERSIONE.commit : '' }}</small></p>

      <section class="gruppo">
        <h2>👶 Chi gioca</h2>
        <p class="nota">I tasti qui sotto valgono per il bambino attivo.</p>
        <div class="tasti">
          <button v-for="g in state.giocatori" :key="g.id" :class="{ ora: g.id === state.player }"
                  :data-giocatore="g.id" @click="selectPlayer(g.id)">{{ g.nome }}</button>
          <button data-azione="bambino-prova" @click="bambinoDiProva">＋ Bambino di prova</button>
        </div>
      </section>

      <section class="gruppo">
        <h2>🪙 Monete</h2>
        <div class="tasti">
          <button v-for="n in [100, 500, 2000, 10000]" :key="n" :data-trucco="'monete=' + n"
                  @click="trucco('monete=' + n)">+{{ n }}</button>
          <button data-trucco="monete=-500" @click="trucco('monete=-500')">−500</button>
        </div>
      </section>

      <section class="gruppo">
        <h2>🌾 Fattoria</h2>
        <h3>Fattoria di prova, già giocata</h3>
        <p class="nota">Prende il posto di quella di {{ chi }}, che finisce nel cestino.</p>
        <div class="tasti">
          <button v-for="l in LIVELLI_TIPO" :key="l" :data-trucco="'fattoria-tipo=' + l"
                  @click="trucco('fattoria-tipo=' + l, 'fattoria')">livello {{ l }}</button>
        </div>
        <h3>Solo il livello — il prato resta com'è</h3>
        <div class="tasti">
          <button v-for="l in [10, 20, 40, 65]" :key="l" :data-trucco="'fattoria=' + l"
                  @click="trucco('fattoria=' + l, 'fattoria')">livello {{ l }}</button>
        </div>
        <h3>Le feste, fuori stagione</h3>
        <div class="tasti">
          <button data-trucco="stagione=natale" @click="trucco('stagione=natale', 'fattoria')">🎄 Natale</button>
          <button data-trucco="stagione=halloween"
                  @click="trucco('stagione=halloween', 'fattoria')">🎃 Halloween</button>
        </div>
      </section>

      <section class="gruppo">
        <h2>🕳️ Sotterraneo</h2>
        <div class="tasti">
          <button data-trucco="sotterraneo=roba"
                  @click="trucco('sotterraneo=roba', 'sotterraneo')">🎒 Scendi equipaggiato</button>
          <button data-trucco="abisso=12" @click="trucco('abisso=12', 'sotterraneo')">⬇️ L'abisso dal piano 12</button>
        </div>
        <p class="nota">Valgono dalla prossima discesa, finché restano nell'indirizzo.</p>
      </section>

      <section class="gruppo">
        <h2>🎮 Apri un gioco</h2>
        <div class="tasti">
          <button v-for="g in GIOCHI" :key="g.chiave" :data-apri="g.chiave"
                  @click="$emit('vai', g.chiave)">{{ g.ico }} {{ g.nome }}{{ g.sperimentale ? ' 🧪' : '' }}</button>
        </div>
        <p class="nota">Si apre anche quello che in home non c'è; 🧪 è un gioco in prova.</p>
      </section>

      <section class="gruppo">
        <h2>⚙️ Interruttori di {{ chi }}</h2>
        <button :class="['leva', { acceso: prova }]" data-azione="sperimentali"
                @click="accendiSperimentali(!prova)"><span>🧪 I giochi in prova in home</span><i></i></button>
        <button :class="['leva', { acceso: aperto }]" data-azione="tutto-aperto"
                @click="accendiTuttoAperto(!aperto)"><span>🔓 Tutte le tappe aperte</span><i></i></button>
      </section>

      <section class="gruppo">
        <h2>🧰 Il resto</h2>
        <div class="tasti">
          <button v-for="a in ALTRE" :key="a.chiave" :data-apri="a.chiave"
                  @click="$emit('vai', a.chiave)">{{ a.ico }} {{ a.nome }}</button>
          <button data-azione="pin-zero" @click="codiceAZero">🔑 Codice dei grandi a 0000</button>
          <button data-azione="ripara" @click="ripara">♻️ Riscarica il gioco</button>
        </div>
        <p v-if="esito" class="esito">{{ esito }}</p>
      </section>

      <section class="gruppo">
        <h2>📋 A mano, nell'indirizzo</h2>
        <ul class="a-mano">
          <li v-for="[c, d] in A_MANO" :key="c"><code class="copiabile">{{ c }}</code> {{ d }}</li>
        </ul>
        <p class="nota">Si sommano con <code>&amp;</code>: <code class="copiabile">#fattoria-tipo=30&amp;monete=2000</code></p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.corpo { flex:1; overflow-y:auto; padding:12px 14px 24px;
         display:flex; flex-direction:column; gap:11px;
         width:min(520px,100%); margin:0 auto }
.chi { margin:0; text-align:center; color:var(--viola-scuro); font-size:15px }
.chi small { display:block; font-size:11.5px; color:var(--tenue) }
.gruppo { padding:13px 16px 12px; border-radius:20px; background:var(--carta);
          box-shadow:0 5px 0 #dde3ea, 0 10px 22px #8593a822;
          display:flex; flex-direction:column; gap:7px }
h2 { margin:0; font-size:17px; color:var(--viola-scuro) }
h3 { margin:4px 0 0; font-size:12.5px; font-weight:900; letter-spacing:.4px;
     text-transform:uppercase; color:var(--tenue) }
.nota { margin:0; font-size:12.5px; color:var(--tenue) }
.tasti { display:flex; flex-wrap:wrap; gap:7px }
.tasti button { padding:9px 13px; border-radius:999px; font-size:14px; font-weight:800;
                color:var(--viola-scuro); background:#ffffff; box-shadow:0 3px 0 #d4dce6 }
.tasti button.ora { background:var(--viola); color:#fff; box-shadow:0 3px 0 #00000022 }
.tasti button:active, .leva:active { transform:translateY(2px) }
.leva { display:flex; align-items:center; justify-content:space-between; gap:10px;
        padding:10px 12px; border-radius:14px; background:#ffffff; font-size:14.5px;
        font-weight:800; color:var(--viola-scuro); text-align:left }
.leva i { flex:none; width:42px; height:25px; border-radius:999px; background:#c9c2d6;
          position:relative; transition:.15s }
.leva i::after { content:''; position:absolute; top:3px; left:3px; width:19px; height:19px;
                 border-radius:50%; background:#fff; transition:.15s; box-shadow:0 1px 3px #00000033 }
.leva.acceso i { background:#38c172 }
.leva.acceso i::after { left:20px }
.esito { margin:0; font-size:13.5px; font-weight:800; color:#2b8a57 }
.a-mano { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:5px;
          font-size:13px; color:#2f3a52 }
code { font-size:12.5px; padding:1px 6px; border-radius:6px; background:#eef1f6;
       color:var(--viola-scuro) }
</style>
