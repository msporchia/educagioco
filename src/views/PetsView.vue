<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA STANZA DEGLI ANIMALI
   Tre gatti da adottare una volta sola e del cibo che invece finisce:
   la sazietà cala di ora in ora, anche a gioco spento, così la ciotola
   da riempire è un motivo per tornare domani.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { state, adotta, compraCibo, dai, sazieta, haAnimale, inDispensa,
         dispensaPiena } from '../store/profile.js'
import { PETS, CIBI, REPARTI, FAME, umore } from '../data/pets.js'
import PetSprite from '../components/PetSprite.vue'
import { suono } from '../audio.js'

defineEmits(['vai'])

const tab = ref('stanza')
const scelto = ref(null)          // di chi stiamo riempiendo la ciotola
const messaggio = ref({ testo: '', n: 0 })
const boccone = ref(null)         // { id, e, cuori } — animazione del pasto
const masticando = ref('')

/* la fame passa col tempo reale: senza un battito l'orologio resterebbe
   fermo a quando si è aperta la stanza */
const adesso = ref(Date.now())
let battito = 0, timerBoccone = 0

const miei = computed(() => PETS.filter(p => haAnimale(p.id)))
const daAdottare = computed(() => PETS.filter(p => !haAnimale(p.id)))
const sat = id => sazieta(id, adesso.value)
const stato = id => (masticando.value === id ? 'mangia' : umore(sat(id)))

const frase = id => {
  const s = sat(id)
  if (masticando.value === id) return 'gnam gnam'
  if (s >= FAME.sazio) return 'sazio e felice'
  if (s < FAME.affamato) return 'ha fame!'
  return 'mangerebbe qualcosa'
}

function avvisa(t) { messaggio.value = { testo: t, n: messaggio.value.n + 1 } }

function scegli(p) {
  scelto.value = p.id
  suono.fusa()
}

function adottaOra(p) {
  if (!adotta(p.id)) return avvisa('Servono ' + FAME.costo + ' 🪙 per ' + p.nome)
  suono.compra(); suono.miao()
  scelto.value = p.id
  tab.value = 'stanza'
  avvisa(p.nome + ' è arrivato!')
}

function compra(c) {
  if (compraCibo(c.e)) { suono.moneta(); avvisa(c.nome + ' nella dispensa') }
}

function porgi(c) {
  const id = scelto.value
  if (!id) return
  const esito = dai(id, c.e)
  if (!esito) return
  const nome = PETS.find(p => p.id === id).nome
  if (esito === 'sazio') { suono.miao(); return avvisa(nome + ' è sazio, grazie!') }

  masticando.value = id
  boccone.value = { id, e: c.e, cuori: esito === 'preferito' }
  suono.sgranocchia()
  if (esito === 'preferito') { suono.fusa(); avvisa('è il preferito di ' + nome + '!') }
  clearTimeout(timerBoccone)
  timerBoccone = setTimeout(() => {
    masticando.value = ''; boccone.value = null; suono.miao()
  }, 1300)
}

onMounted(() => {
  scelto.value = miei.value[0]?.id || null
  if (!miei.value.length) tab.value = 'negozio'
  battito = setInterval(() => (adesso.value = Date.now()), 15000)
})
onUnmounted(() => { clearInterval(battito); clearTimeout(timerBoccone) })
</script>

<template>
  <div class="schermo">
    <div class="barra">
      <button class="tondo" @click="$emit('vai','home')">‹</button>
      <div class="sp"></div>
      <div class="gettone">🪙 <b>{{ state.profile.coins }}</b></div>
      <button class="tondo" @click="suono.muta()">{{ suono.acceso.value ? '🔊' : '🔇' }}</button>
    </div>

    <div class="centro">
      <div class="tabs">
        <button :class="{ on: tab === 'stanza' }" @click="tab = 'stanza'">🐾 Stanza</button>
        <button :class="{ on: tab === 'negozio' }" @click="tab = 'negozio'">🛒 Negozio</button>
      </div>

      <!-- ═══════════ STANZA ═══════════ -->
      <template v-if="tab === 'stanza'">
        <h2>Gli animali di {{ state.player }}</h2>

        <p v-if="!miei.length" class="testo">
          La stanza è ancora vuota. Nel negozio ti aspettano Watson, Sherlock e Irene:
          {{ FAME.costo }} 🪙 ciascuno.
        </p>

        <div v-else class="tappeto">
          <button v-for="p in miei" :key="p.id" class="posto"
                  :class="{ on: scelto === p.id }" @click="scegli(p)">
            <div class="scena">
              <span v-if="stato(p.id) === 'affamato'" class="fumetto">🍽️</span>
              <span v-else-if="stato(p.id) === 'sazio'" class="fumetto tenue">💤</span>
              <PetSprite :pet="p" :stato="stato(p.id)" :size="104" />
              <span v-if="boccone && boccone.id === p.id" class="boccone">{{ boccone.e }}</span>
              <span v-if="boccone && boccone.id === p.id && boccone.cuori" class="cuori">💖</span>
            </div>
            <b>{{ p.nome }}</b>
            <div class="pancia"><i :class="stato(p.id)" :style="{ width: sat(p.id) + '%' }"></i></div>
            <i class="frase" :class="stato(p.id)">{{ frase(p.id) }}</i>
          </button>
        </div>

        <!-- dispensa: si tocca il piatto e l'animale scelto lo mangia -->
        <template v-if="miei.length">
          <div class="dritta" v-if="scelto">
            Cosa diamo a <b>{{ PETS.find(p => p.id === scelto).nome }}</b>?
          </div>
          <div v-if="dispensaPiena()" class="dispensa">
            <button v-for="c in CIBI" :key="c.e" v-show="inDispensa(c.e)" class="piatto"
                    @click="porgi(c)">
              <span class="e">{{ c.e }}</span>
              <span class="q">×{{ inDispensa(c.e) }}</span>
            </button>
          </div>
          <p v-else class="mini">
            La dispensa è vuota — nel negozio c'è pollo, carne e sushi.
          </p>
        </template>
      </template>

      <!-- ═══════════ NEGOZIO ═══════════ -->
      <template v-else>
        <h2>Negozio degli animali</h2>

        <template v-if="daAdottare.length">
          <div class="titolino">Da adottare · {{ FAME.costo }} 🪙</div>
          <div class="adozioni">
            <button v-for="p in daAdottare" :key="p.id" class="adozione"
                    :disabled="state.profile.coins < FAME.costo" @click="adottaOra(p)">
              <PetSprite :pet="p" stato="normale" :size="86" />
              <b>{{ p.nome }}</b>
              <i>{{ p.razza }}</i>
              <i class="gusto">preferisce {{ p.preferito }}</i>
              <span class="prezzo">🪙 {{ FAME.costo }}</span>
            </button>
          </div>
        </template>
        <p v-else class="mini">Ci sono tutti e tre. Adesso pensa alla ciotola.</p>

        <template v-for="r in REPARTI" :key="r.tipo">
          <div class="titolino">{{ r.titolo }}</div>
          <div class="cibi">
            <button v-for="c in CIBI.filter(x => x.tipo === r.tipo)" :key="c.e" class="scheda"
                    :disabled="state.profile.coins < c.costo" @click="compra(c)">
              <span class="e">{{ c.e }}</span>
              {{ c.nome }}
              <span class="c">🪙 {{ c.costo }}</span>
              <span v-if="inDispensa(c.e)" class="gia">ne hai {{ inDispensa(c.e) }}</span>
            </button>
          </div>
        </template>
        <p class="mini">Il cibo finisce: gli animali tornano ad avere fame col passare delle ore.</p>
      </template>
    </div>

    <div v-if="messaggio.testo" :key="messaggio.n" class="annuncio">{{ messaggio.testo }}</div>
  </div>
</template>

<style scoped>
.tabs { display:flex; gap:8px }
.tabs button { padding:9px 20px; border-radius:999px; background:#ffffffaa; font-weight:800;
               font-size:15px; color:var(--tenue) }
.tabs button.on { background:linear-gradient(180deg,var(--viola),var(--viola-scuro)); color:#fff }

.titolino { font-size:12px; letter-spacing:1.5px; text-transform:uppercase;
            color:var(--tenue); font-weight:800; margin-top:4px }

/* ---------- la stanza ---------- */
.tappeto { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; width:100%; max-width:470px }
.posto { background:var(--carta); border-radius:20px; padding:8px 6px 10px; width:132px;
         display:flex; flex-direction:column; align-items:center; gap:3px;
         box-shadow:0 5px 0 #e3d6f0, 0 10px 22px #a08fc022; border:3px solid transparent }
.posto.on { border-color:var(--viola); box-shadow:0 5px 0 #ddd0ef, 0 0 0 4px #7c5cff22 }
.posto b { font-size:15px; font-weight:900; color:var(--viola-scuro) }
.scena { position:relative; display:flex; justify-content:center }
.fumetto { position:absolute; top:-2px; right:0; font-size:22px;
           animation:sobbalza 1.5s ease-in-out infinite }
.fumetto.tenue { opacity:.55; animation-duration:3s }
@keyframes sobbalza { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
.boccone { position:absolute; left:50%; top:34%; font-size:26px; pointer-events:none;
           animation:mangiato 1.3s ease-in forwards }
@keyframes mangiato { 0%{transform:translate(-50%,-34px) scale(1);opacity:0}
                      25%{transform:translate(-50%,-8px) scale(1);opacity:1}
                      100%{transform:translate(-50%,6px) scale(.25);opacity:0} }
.cuori { position:absolute; left:58%; top:16%; font-size:20px; pointer-events:none;
         animation:cuoricini 1.3s ease-out forwards }
@keyframes cuoricini { 0%{transform:scale(.3);opacity:0} 30%{transform:scale(1.1);opacity:1}
                       100%{transform:translateY(-34px) scale(.8);opacity:0} }

.pancia { width:88%; height:8px; border-radius:5px; background:#ece5f6; overflow:hidden }
.pancia i { display:block; height:100%; border-radius:5px; transition:width .5s ease }
.pancia i.sazio    { background:linear-gradient(90deg,var(--verde),#8fe0a8) }
.pancia i.normale  { background:linear-gradient(90deg,var(--giallo),var(--arancio)) }
.pancia i.affamato { background:linear-gradient(90deg,var(--rosso),#ff9d9d) }
.frase { font-style:normal; font-size:11.5px; font-weight:800; color:var(--tenue) }
.frase.affamato { color:var(--rosso) }
.frase.sazio { color:var(--verde) }

.dritta { font-size:13px; color:var(--tenue); font-weight:700 }
.dritta b { color:var(--viola-scuro) }
.dispensa { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; max-width:400px }
.piatto { position:relative; background:var(--carta); border-radius:16px; padding:8px 12px 6px;
          box-shadow:0 4px 0 #e3d6f0; display:flex; flex-direction:column; align-items:center }
.piatto:active { transform:translateY(2px); box-shadow:0 2px 0 #e3d6f0 }
.piatto .e { font-size:30px }
.piatto .q { font-size:11px; font-weight:900; color:var(--tenue) }

/* ---------- negozio ---------- */
.adozioni { display:flex; flex-wrap:wrap; gap:9px; justify-content:center; width:100%; max-width:470px }
.adozione { background:var(--carta); border-radius:18px; padding:9px 6px 10px; width:142px;
            display:flex; flex-direction:column; align-items:center; gap:1px;
            box-shadow:0 4px 0 #e3d6f0 }
.adozione:active { transform:translateY(2px); box-shadow:0 2px 0 #e3d6f0 }
.adozione:disabled { opacity:.5 }
.adozione b { font-size:15px; font-weight:900; color:var(--viola-scuro) }
.adozione i { font-style:normal; font-size:11px; color:var(--tenue) }
.adozione .gusto { font-size:11.5px }
.adozione .prezzo { margin-top:4px; font-size:13px; font-weight:900; color:#c98a00 }

.cibi { width:100%; max-width:470px; display:grid; gap:9px;
        grid-template-columns:repeat(auto-fill,minmax(92px,1fr)) }
.scheda { background:var(--carta); border-radius:16px; padding:10px 5px 8px; text-align:center;
          box-shadow:0 4px 0 #e3d6f0; font-weight:800; font-size:11.5px; color:#6b5c8a;
          display:flex; flex-direction:column; align-items:center; gap:2px }
.scheda:active { transform:translateY(2px); box-shadow:0 2px 0 #e3d6f0 }
.scheda:disabled { opacity:.4 }
.scheda .e { font-size:30px }
.scheda .c { color:#c98a00 }
.scheda .gia { font-size:10px; color:var(--verde) }

.annuncio { position:absolute; left:0; right:0; top:22%; text-align:center; pointer-events:none;
            font-size:clamp(18px,5vw,28px); font-weight:900; color:var(--viola-scuro);
            text-shadow:0 2px 0 #fff, 0 0 16px #fff;
            animation:apparire 1.7s ease-out forwards }
@keyframes apparire { 0%{opacity:0;transform:scale(.5)} 18%{opacity:1;transform:scale(1.1)}
                      32%{transform:scale(1)} 72%{opacity:1} 100%{opacity:0;transform:translateY(-18px)} }
</style>
