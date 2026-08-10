<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL NEGOZIO, UNO SOLO

   Prima ce n'erano due, in due schermate diverse: quello della cameretta
   (l'orsetto, il telescopio, il castello) e quello degli animali (il
   pollo, la palla, la spazzola). Le monete però sono sempre le stesse, e
   due negozi vogliono dire ricordarsi in quale delle due stanze si
   comprava cosa. Adesso si entra da una porta sola e si sceglie il banco:
   🛏️ per la cameretta, 🐾 per gli animali.

   I due banchi si chiamano 🧸 Oggetti e 🐾 Animali, non "Cameretta" e
   "Animali": un tasto che si chiama come una stanza sembra portarci, e
   invece cambia soltanto lo scaffale che si sta guardando.

   Il banco lo decide chi apre la porta: dalla stanza si entra dov'era
   l'ultima volta, ma da "niente in dispensa" si entra già fra le ciotole.

   ── ADOTTARE È UN GESTO IN DUE TEMPI ──
   Si tocca l'amico e si apre un cartello: come lo chiami, e — se i
   quattro posti sono pieni — chi va ad aspettarti al rifugio. Non è un
   passaggio in più per gusto di chiederlo: il nome è l'unica cosa di un
   animale che appartiene al bambino, e mandare via qualcuno senza dirlo
   sarebbe la sola cosa spiacevole di tutta la cameretta.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { state, buy, adotta, riprendi, sostituisci, compraProdotto, haAnimale,
         postiLiberi, miei, alRifugio, inDispensa } from '../store/profile.js'
import { ITEMS } from '../data/shop.js'
import { PETS, PRODOTTI, REPARTI, FAMIGLIE, POSTI_CASA, DIETE,
         dietaDi, delReparto, menuDi, quotaRientro } from '../data/pets.js'
import PetSprite from './PetSprite.vue'
import { suono } from '../audio.js'

const props = defineProps({
  banco: { type: String, default: 'casa' },   // casa | animali
})
const emit = defineEmits(['banco', 'avviso', 'adottato'])

const posseduti = computed(() => new Set(state.profile.owned))

/* ---------- il catalogo, per famiglia ---------- */
const daAdottare = computed(() =>
  FAMIGLIE.map(f => ({ ...f, chi: PETS.filter(p => p.famiglia === f.k && !haAnimale(p.id)) }))
    .filter(f => f.chi.length))

const rifugio = computed(() => alRifugio())
const casa = computed(() => miei())

/* ---------- il cartello dell'adozione ---------- */
const scelto = ref(null)         // il pet che si sta portando a casa
const nome = ref('')
const esce = ref('')             // chi lascia il posto, quando la casa è piena

const torna = computed(() => !!scelto.value && haAnimale(scelto.value.id))
const prezzo = computed(() =>
  !scelto.value ? 0 : torna.value ? quotaRientro(scelto.value.id) : scelto.value.costo)
const pieno = computed(() => postiLiberi() === 0)
const pochiSoldi = computed(() => state.profile.coins < prezzo.value)

/* Chi esce non è mai preselezionato: con un nome già spuntato basta un
   tocco distratto sul tasto grande per mandare al rifugio il primo della
   fila, e sarebbe l'unica cosa spiacevole di tutta la cameretta. */
function apri(p) {
  scelto.value = p
  nome.value = p.nome
  esce.value = ''
}

function chiudi() { scelto.value = null; esce.value = '' }

function conferma() {
  const p = scelto.value
  if (!p) return
  const fatto = pieno.value
    ? sostituisci(esce.value, p.id, nome.value)
    : (torna.value ? riprendi(p.id) : adotta(p.id, nome.value))
  if (!fatto) return emit('avviso', 'Servono ' + prezzo.value + ' 🪙 per ' + nome.value)
  suono.compra()
  suono[p.verso]()
  chiudi()
  emit('adottato', p.id)
}

/* ---------- gli scaffali della roba ----------
   I reparti di cibo che non servono a nessuno dei tuoi restano nascosti
   dietro un tasto: chi ha due cani non deve scorrere i fiocchi per
   pesci per arrivare alla spazzola. Non spariscono del tutto perché si
   compra anche PRIMA di adottare — e a casa vuota si vede tutto. */
const tutto = ref(false)

const serveAQualcuno = r => !r.cibi || !casa.value.length ||
  casa.value.some(p => r.cibi.some(c => dietaDi(p.id).includes(c)))

const repartiVisti = computed(() => REPARTI.filter(r => tutto.value || serveAQualcuno(r)))
const nascosti = computed(() => REPARTI.length - repartiVisti.value.length)

/* chi mangia la roba di questo scaffale, in emoji: è il cartellino che
   insegna che il sushi è da gatti e i semi da pappagalli */
function mangiatori(r) {
  if (!r.cibi) return ''
  return FAMIGLIE.filter(f => PETS.some(p => p.famiglia === f.k &&
      r.cibi.some(c => (DIETE[p.specie] || []).includes(c))))
    .map(f => f.emoji).join('')
}

/* `buy` sistema da sé l'oggetto sulla mensola meno piena: la stanza lo
   trova già al suo posto quando si torna dalla porta */
function compraOggetto(it) {
  if (!buy(it[0], it[2])) return
  suono.compra()
  emit('avviso', it[1] + ' è sullo scaffale')
}

function compraCibo(c) {
  if (compraProdotto(c.e)) { suono.moneta(); emit('avviso', c.nome + ' nella dispensa') }
}
</script>

<template>
  <div class="reparti">
    <button :class="{ on: banco === 'casa' }" @click="emit('banco', 'casa')">🧸 Oggetti</button>
    <button :class="{ on: banco === 'animali' }" @click="emit('banco', 'animali')">🐾 Animali</button>
  </div>

  <!-- ═══════════ BANCO DELLA CAMERETTA ═══════════ -->
  <template v-if="banco === 'casa'">
    <div class="titolino">Da mettere sulle mensole</div>
    <p class="testo">{{ posseduti.size }} di {{ ITEMS.length }} oggetti raccolti</p>
    <div class="scorte">
      <button v-for="it in ITEMS" :key="it[0]" class="scheda"
              :class="{ mio: posseduti.has(it[0]) }"
              :disabled="posseduti.has(it[0]) || state.profile.coins < it[2]"
              @click="compraOggetto(it)">
        <span class="e">{{ it[0] }}</span>{{ it[1] }}
        <span class="c">{{ posseduti.has(it[0]) ? '✔ tuo' : '🪙 ' + it[2] }}</span>
      </button>
    </div>
    <p class="mini">Gli oggetti comprati vanno sulle mensole della stanza,
      e si trascinano dove vuoi.</p>
  </template>

  <!-- ═══════════ BANCO DEGLI ANIMALI ═══════════ -->
  <template v-else>
    <p class="posti">
      In cameretta <b>{{ casa.length }} di {{ POSTI_CASA }}</b>
      <span v-if="!postiLiberi()"> — per prenderne un altro, uno va ad aspettarti al rifugio</span>
    </p>

    <!-- chi aspetta al rifugio viene prima: è già tuo -->
    <template v-if="rifugio.length">
      <div class="titolino">🏡 Ti aspettano al rifugio</div>
      <div class="adozioni">
        <button v-for="p in rifugio" :key="p.id" class="adozione mio" @click="apri(p)">
          <PetSprite :pet="p" stato="normale" :size="86" />
          <b>{{ p.nome }}</b>
          <i>{{ p.razza }}</i>
          <span class="prezzo">riprendilo · 🪙 {{ quotaRientro(p.id) }}</span>
        </button>
      </div>
    </template>

    <template v-for="f in daAdottare" :key="f.k">
      <div class="titolino">{{ f.emoji }} {{ f.titolo }}</div>
      <div class="adozioni">
        <button v-for="p in f.chi" :key="p.id" class="adozione"
                :disabled="state.profile.coins < p.costo" @click="apri(p)">
          <PetSprite :pet="p" stato="normale" :size="86" />
          <b>{{ p.nome }}</b>
          <i>{{ p.razza }}</i>
          <i class="gusto">ama {{ p.preferiti.join(' ') }}</i>
          <i class="menu">mangia {{ menuDi(p.id).join(' ') }}</i>
          <span class="prezzo">🪙 {{ p.costo }}</span>
        </button>
      </div>
    </template>
    <p v-if="!daAdottare.length" class="mini">Li hai adottati tutti quanti!
      Adesso pensa a tenerli contenti.</p>

    <template v-for="r in repartiVisti" :key="r.tipo">
      <div class="titolino">{{ r.titolo }} <span class="chi">{{ mangiatori(r) }}</span></div>
      <div class="scorte">
        <button v-for="c in delReparto(r.tipo)" :key="c.e" class="scheda"
                :disabled="state.profile.coins < c.costo" @click="compraCibo(c)">
          <span class="e">{{ c.e }}</span>
          {{ c.nome }}
          <span class="c">🪙 {{ c.costo }}</span>
          <span v-if="inDispensa(c.e)" class="gia">ne hai {{ inDispensa(c.e) }}</span>
        </button>
      </div>
    </template>
    <button v-if="nascosti" class="altro" @click="tutto = true">
      vedi anche gli altri {{ nascosti }} scaffali
    </button>

    <p class="mini">
      Tutto finisce: col passare delle ore tornano ad avere fame, voglia di
      giocare e bisogno di una spazzolata. E ognuno mangia le sue cose.
    </p>
  </template>

  <!-- ═══════════ IL CARTELLO DELL'ADOZIONE ═══════════ -->
  <div v-if="scelto" class="velo" @click.self="chiudi">
    <div class="cartello">
      <PetSprite :pet="scelto" stato="contento" :size="120" />
      <b class="razza">{{ scelto.razza }}</b>
      <p class="descr">{{ scelto.descr }}</p>

      <label class="nome">
        <span>Come lo chiami?</span>
        <input v-model="nome" maxlength="14" :disabled="torna"
               aria-label="nome dell'animale" @keyup.enter="conferma" />
      </label>
      <p v-if="torna" class="mini">Torna a casa con il suo nome, i suoi pasti
        e quello che aveva addosso.</p>

      <template v-if="pieno">
        <p class="scegli">In cameretta ci stanno {{ POSTI_CASA }} amici.
          Chi va ad aspettarti al rifugio?</p>
        <div class="fila-casa">
          <button v-for="p in casa" :key="p.id" class="chi-esce"
                  :class="{ on: esce === p.id }" @click="esce = p.id">
            <PetSprite :pet="p" stato="normale" :size="56" />
            <i>{{ p.nome }}</i>
          </button>
        </div>
        <p class="mini">Al rifugio sta benissimo e non costa niente: quando
          lo rivuoi a casa basta ripassare di qui.</p>
      </template>

      <div class="tasti">
        <button class="annulla" @click="chiudi">annulla</button>
        <button class="ok" :disabled="pochiSoldi || !nome.trim() || (pieno && !esce)"
                @click="conferma">
          {{ torna ? 'Torna a casa' : 'Adotta' }} · 🪙 {{ prezzo }}
        </button>
      </div>
      <p v-if="pochiSoldi" class="mini manca">Ti mancano
        {{ prezzo - state.profile.coins }} 🪙: gioca ancora un po'.</p>
    </div>
  </div>
</template>

<style scoped>
/* i due banchi restano in cima mentre si scorre: sono la sola via per
   passare da uno all'altro, e in fondo a un negozio lungo cinque scaffali
   cercarli tornando su ogni volta è una tortura. Il margine negativo li
   fa aderire al bordo dello scorrimento, non al padding della colonna. */
.reparti { display:flex; gap:8px; position:sticky; top:-18px; z-index:6;
           padding:14px 10px 10px; margin:-18px -10px -8px;
           background:#fdf6ec; box-shadow:0 10px 12px -10px #8593a855 }
.reparti button { padding:9px 18px; border-radius:999px; background:#ffffffcc; font-weight:800;
                  font-size:14px; color:var(--tenue); box-shadow:0 2px 7px #8593a81f }
.reparti button.on { background:linear-gradient(180deg,var(--viola),var(--viola-scuro)); color:#fff }

.titolino { font-size:12px; letter-spacing:1.5px; text-transform:uppercase;
            color:var(--tenue); font-weight:800; margin-top:4px }
.titolino .chi { letter-spacing:0; font-size:14px }
.posti { font-size:13px; color:var(--tenue); font-weight:700; text-align:center;
         max-width:400px }
.posti b { color:var(--viola-scuro) }

.scorte { width:100%; max-width:470px; display:grid; gap:9px;
          grid-template-columns:repeat(auto-fill,minmax(92px,1fr)) }
.scheda { background:var(--carta); border-radius:16px; padding:10px 5px 8px; text-align:center;
          box-shadow:0 4px 0 #dde3ea; font-weight:800; font-size:11.5px; color:#5f6675;
          display:flex; flex-direction:column; align-items:center; gap:2px }
.scheda:active { transform:translateY(2px); box-shadow:0 2px 0 #dde3ea }
.scheda:disabled { opacity:.4 }
.scheda .e { font-size:30px }
.scheda .c { color:#c98a00 }
.scheda .gia { font-size:10px; color:var(--verde) }
.scheda.mio { opacity:.45 }

.altro { font-size:12px; font-weight:800; color:var(--viola); background:#ffffffcc;
         border-radius:999px; padding:8px 16px; box-shadow:0 2px 7px #8593a81f }

.adozioni { display:flex; flex-wrap:wrap; gap:9px; justify-content:center; width:100%; max-width:470px }
.adozione { background:var(--carta); border-radius:18px; padding:9px 6px 10px; width:142px;
            display:flex; flex-direction:column; align-items:center; gap:1px;
            box-shadow:0 4px 0 #dde3ea }
.adozione:active { transform:translateY(2px); box-shadow:0 2px 0 #dde3ea }
.adozione:disabled { opacity:.5 }
.adozione b { font-size:15px; font-weight:900; color:var(--viola-scuro) }
.adozione i { font-style:normal; font-size:11px; color:var(--tenue) }
.adozione .gusto, .adozione .menu { font-size:11.5px }
.adozione .prezzo { margin-top:4px; font-size:13px; font-weight:900; color:#c98a00 }
/* chi è già tuo si vede: aspetta soltanto di tornare */
.adozione.mio { background:#f2f7ff; box-shadow:0 4px 0 #ccd9ee }
.adozione.mio .prezzo { color:var(--viola) }

/* ---------- il cartello ---------- */
.velo { position:fixed; inset:0; z-index:40; background:#2a2136aa;
        display:grid; place-items:center; padding:14px }
.cartello { background:#fdf8f0; border-radius:24px; padding:14px 16px 16px;
            width:min(100%,360px); max-height:92vh; overflow:auto;
            display:flex; flex-direction:column; align-items:center; gap:4px;
            box-shadow:0 18px 40px #00000044 }
.cartello .razza { font-size:16px; font-weight:900; color:var(--viola-scuro) }
.cartello .descr { font-size:12.5px; color:var(--tenue); font-weight:700; margin:0 0 4px }
.nome { display:flex; flex-direction:column; align-items:center; gap:4px; width:100% }
.nome span { font-size:12px; font-weight:800; color:var(--tenue) }
.nome input { width:min(100%,220px); text-align:center; font-size:20px; font-weight:900;
              color:var(--viola-scuro); background:#fff; border:2px solid #dde3ea;
              border-radius:14px; padding:7px 10px; font-family:inherit }
.nome input:focus { outline:none; border-color:var(--viola) }
.nome input:disabled { background:#f2f2f2; color:var(--tenue) }

.scegli { font-size:13px; font-weight:800; color:var(--viola-scuro); margin:8px 0 2px;
          text-align:center }
.fila-casa { display:flex; flex-wrap:wrap; gap:6px; justify-content:center }
.chi-esce { background:#fff; border-radius:14px; padding:4px 6px 6px; width:74px;
            display:flex; flex-direction:column; align-items:center;
            border:2px solid transparent; box-shadow:0 2px 0 #dde3ea }
.chi-esce i { font-style:normal; font-size:11px; font-weight:800; color:var(--tenue);
              max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.chi-esce.on { border-color:var(--viola); background:#eef2fd }

.tasti { display:flex; gap:8px; margin-top:10px; width:100% }
.tasti button { flex:1; border-radius:16px; padding:11px 8px; font-weight:900; font-size:14px }
.annulla { background:#ffffffcc; color:var(--tenue); box-shadow:0 3px 0 #dde3ea }
.ok { background:linear-gradient(180deg,var(--viola),var(--viola-scuro)); color:#fff;
      box-shadow:0 3px 0 #3d4f9e }
.ok:disabled { opacity:.45 }
.manca { color:var(--rosso) }
</style>
