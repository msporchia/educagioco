<script setup>
// Le monete gioco per gioco, dalla parte dei grandi: le soglie, i tetti
// di un gioco, i ⭐ consigliati, e «Ridai tempo». Vedi docs/genitori/varieta.md.
import { computed, onMounted } from 'vue'
import { state } from '../../store/profile.js'
import { regole, statoDi, secondiVeri, giro, ricarica, scegliSoglie, tettoDelGioco,
         consiglia, accendiDormienti, ridaiTempo } from '../../store/varieta.js'
import { GIOCHI } from '../../data/giochi.js'
import { inCasa } from '../../data/portata-giochi.js'
import { paga, comeDi, tettiDi, TETTO_MINUTI, FASE_BREVE, DOPPIO, DORMIENTE } from '../../data/varieta.js'

defineProps({ chi: { type: String, default: '' } })
onMounted(ricarica)

const PASSO = 5
const r = computed(() => { void state.profile.settings.varieta; return regole() })
const giochi = computed(() => GIOCHI.filter(g => paga(g) && inCasa(g.chiave)))

const oggi = computed(() => {
  void giro.value; void r.value
  return giochi.value
    .map(g => ({ g, st: statoDi(g.chiave), minuti: Math.round(secondiVeri(g.chiave) / 60) }))
    .filter(x => x.minuti > 0)
    .sort((a, b) => b.minuti - a.minuti)
})

const tieni = n => Math.max(0, Math.min(TETTO_MINUTI, n))
function sposta(quale, verso) {
  scegliSoglie({ [quale]: tieni(r.value[quale] + verso * PASSO) })
}
function spostaDelGioco(k, quale, verso) {
  const t = tettiDi(r.value, k)
  tettoDelGioco(k, { ...t, [quale]: tieni(t[quale] + verso * PASSO) })
}
function scegliCome(k, come) {
  if (come === 'suoi') tettoDelGioco(k, tettiDi(r.value, k) || { pieno: r.value.pieno, meta: r.value.meta })
  else tettoDelGioco(k, come)
}
const COME = [
  { k: 'tutti', nome: 'come tutti' },
  { k: 'suoi', nome: 'numeri suoi' },
  { k: 'libero', nome: 'nessun tetto' },
]
</script>

<template>
  <div class="varieta" data-varieta>
    <h2>Le monete, gioco per gioco</h2>
    <p class="mini">Stare tanto sullo stesso gioco rende sempre meno monete: si gioca
      lo stesso, ma per guadagnare conviene cambiare. Domani tornano piene. Il tempo
      non si ferma mai: lo decidete voi.</p>

    <div class="soglie">
      <div class="soglia" data-varieta-soglia="pieno">
        <span>Piene per</span>
        <button type="button" data-varieta-passo="giu" @click="sposta('pieno', -1)">−</button>
        <b>{{ r.pieno }}′</b>
        <button type="button" data-varieta-passo="su" @click="sposta('pieno', 1)">+</button>
      </div>
      <div class="soglia" data-varieta-soglia="meta">
        <span>poi a metà per</span>
        <button type="button" data-varieta-passo="giu" @click="sposta('meta', -1)">−</button>
        <b>{{ r.meta }}′</b>
        <button type="button" data-varieta-passo="su" @click="sposta('meta', 1)">+</button>
      </div>
      <p class="mini">Minuti di oggi sullo stesso gioco; dopo, per quel gioco niente monete fino a domani.</p>
    </div>

    <h3>Oggi</h3>
    <p v-if="!oggi.length" class="mini" data-varieta-oggi-vuoto>Oggi {{ chi }} non ha ancora
      giocato a niente che dia monete.</p>
    <ul v-else class="oggi">
      <li v-for="x in oggi" :key="x.g.chiave" :data-varieta-oggi="x.g.chiave" :data-fase="x.st.fase">
        <span>{{ x.g.ico }} {{ x.g.nome }} · {{ FASE_BREVE[x.st.fase] }} · {{ x.minuti }}′</span>
        <button v-if="x.st.fase === 'meta' || x.st.fase === 'vuoto'" type="button"
                class="ridai" data-azione="ridai-tempo" :data-gioco="x.g.chiave"
                @click="ridaiTempo(x.g.chiave)">Ridai tempo</button>
      </li>
    </ul>

    <h3>Gioco per gioco</h3>
    <p class="mini">⭐ consigliato: sulla sua carta compare 🪙×2, e vale doppio nei primi
      {{ DOPPIO }} minuti del giorno.</p>
    <ul class="giochi">
      <li v-for="g in giochi" :key="g.chiave" :data-varieta-gioco="g.chiave">
        <div class="testa">
          <button type="button" class="stella" :class="{ on: r.consigliati[g.chiave] }"
                  :data-consiglia="g.chiave" :aria-pressed="!!r.consigliati[g.chiave]"
                  @click="consiglia(g.chiave, !r.consigliati[g.chiave])">⭐</button>
          <span class="nome">{{ g.ico }} {{ g.nome }}</span>
        </div>
        <div class="come">
          <button v-for="c in COME" :key="c.k" type="button"
                  :class="{ ora: comeDi(r, g.chiave) === c.k }"
                  :data-tetto="c.k" @click="scegliCome(g.chiave, c.k)">{{ c.nome }}</button>
        </div>
        <div v-if="comeDi(r, g.chiave) === 'suoi'" class="suoi">
          <span>piene</span>
          <button type="button" data-varieta-suo="pieno-giu" @click="spostaDelGioco(g.chiave, 'pieno', -1)">−</button>
          <b>{{ tettiDi(r, g.chiave).pieno }}′</b>
          <button type="button" data-varieta-suo="pieno-su" @click="spostaDelGioco(g.chiave, 'pieno', 1)">+</button>
          <span>a metà</span>
          <button type="button" data-varieta-suo="meta-giu" @click="spostaDelGioco(g.chiave, 'meta', -1)">−</button>
          <b>{{ tettiDi(r, g.chiave).meta }}′</b>
          <button type="button" data-varieta-suo="meta-su" @click="spostaDelGioco(g.chiave, 'meta', 1)">+</button>
        </div>
      </li>
    </ul>

    <button type="button" class="dormienti" :class="{ spento: !r.dormienti }"
            data-flag="dormienti" @click="accendiDormienti(!r.dormienti)">
      <span class="parole"><b>Svegliare i giochi di scuola</b>
        <i>{{ r.dormienti
              ? `Un gioco di numeri o di parole che non apre da ${DORMIENTE} giorni prende il 🪙×2 da solo`
              : 'Spento: il 🪙×2 ce l\'hanno solo i giochi ⭐ consigliati' }}</i></span>
      <span class="leva"><span class="pallina"></span></span>
    </button>
  </div>
</template>

<style scoped>
.varieta { display:flex; flex-direction:column; gap:9px; width:100%; max-width:400px }
.varieta h3 { font-size:15px; font-weight:900; color:var(--viola-scuro); margin-top:6px }
.soglie, .oggi, .giochi { display:flex; flex-direction:column; gap:7px; list-style:none;
                          padding:0; margin:0 }
.soglia, .suoi { display:flex; align-items:center; gap:7px; font-size:14px }
.soglia > span:first-child { min-width:8.5em }
.soglia button, .suoi button { width:32px; height:32px; border-radius:10px; font-weight:900;
                               background:#fff; color:var(--viola-scuro); box-shadow:0 2px 0 #d4dce6 }
.soglia b, .suoi b { min-width:2.6em; text-align:center }
.oggi li { display:flex; align-items:center; justify-content:space-between; gap:8px;
           padding:8px 11px; border-radius:12px; background:var(--carta); font-size:13.5px }
.ridai { flex:none; padding:6px 10px; border-radius:10px; font-size:12.5px; font-weight:800;
         background:#fff3c4; color:#6a5200; box-shadow:0 2px 0 #e7d9a2 }
.giochi li { display:flex; flex-direction:column; gap:6px; padding:9px 11px; border-radius:12px;
             background:var(--carta) }
.testa { display:flex; align-items:center; gap:8px }
.stella { font-size:18px; width:34px; height:34px; border-radius:10px; background:#eef1f6;
          filter:grayscale(1); opacity:.45 }
.stella.on { filter:none; opacity:1; background:#fff0b8 }
.nome { font-weight:800; font-size:14px }
.come { display:flex; gap:4px }
.come button { flex:1; padding:5px 4px; border-radius:9px; font-size:12px; font-weight:700;
               background:#eef1f6; color:var(--tenue) }
.come button.ora { background:var(--viola); color:#fff }
.suoi { flex-wrap:wrap; font-size:12.5px }
.dormienti { display:flex; align-items:center; gap:10px; text-align:left; padding:11px 13px;
             border-radius:14px; background:var(--carta); margin-top:6px }
.dormienti b { color:var(--viola-scuro) }
.dormienti .parole { flex:1; display:flex; flex-direction:column; gap:2px }
.dormienti i { font-style:normal; font-size:12.5px; color:var(--tenue) }
.leva { position:relative; flex:none; width:46px; height:27px; border-radius:999px; background:var(--verde) }
.pallina { position:absolute; top:3px; left:22px; width:21px; height:21px; border-radius:50%;
           background:#fff; transition:left .2s }
.spento .leva { background:#c9c2d6 }
.spento .pallina { left:3px }
</style>
