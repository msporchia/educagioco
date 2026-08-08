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
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { state, buy, adotta, compraProdotto, haAnimale,
         inDispensa } from '../store/profile.js'
import { ITEMS } from '../data/shop.js'
import { PETS, PRODOTTI, REPARTI } from '../data/pets.js'
import PetSprite from './PetSprite.vue'
import { suono } from '../audio.js'

const props = defineProps({
  banco: { type: String, default: 'casa' },   // casa | animali
})
const emit = defineEmits(['banco', 'avviso', 'adottato'])

const posseduti = computed(() => new Set(state.profile.owned))
const daAdottare = computed(() => PETS.filter(p => !haAnimale(p.id)))

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

function adottaOra(p) {
  if (!adotta(p.id)) return emit('avviso', 'Servono ' + p.costo + ' 🪙 per ' + p.nome)
  suono.compra()
  suono[p.verso]()
  emit('adottato', p.id)
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
    <template v-if="daAdottare.length">
      <div class="titolino">Da adottare</div>
      <div class="adozioni">
        <button v-for="p in daAdottare" :key="p.id" class="adozione"
                :disabled="state.profile.coins < p.costo" @click="adottaOra(p)">
          <PetSprite :pet="p" stato="normale" :size="86" />
          <b>{{ p.nome }}</b>
          <i>{{ p.razza }}</i>
          <i class="gusto">ama {{ p.preferiti.join(' ') }}</i>
          <span class="prezzo">🪙 {{ p.costo }}</span>
        </button>
      </div>
    </template>
    <p v-else class="mini">Ci sono tutti e tre. Adesso pensa a tenerli contenti.</p>

    <template v-for="r in REPARTI" :key="r.tipo">
      <div class="titolino">{{ r.titolo }}</div>
      <div class="scorte">
        <button v-for="c in PRODOTTI.filter(x => x.tipo === r.tipo)" :key="c.e" class="scheda"
                :disabled="state.profile.coins < c.costo" @click="compraCibo(c)">
          <span class="e">{{ c.e }}</span>
          {{ c.nome }}
          <span class="c">🪙 {{ c.costo }}</span>
          <span v-if="inDispensa(c.e)" class="gia">ne hai {{ inDispensa(c.e) }}</span>
        </button>
      </div>
    </template>
    <p class="mini">
      Tutto finisce: col passare delle ore tornano ad avere fame, voglia di
      giocare e bisogno di una spazzolata.
    </p>
  </template>
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

.adozioni { display:flex; flex-wrap:wrap; gap:9px; justify-content:center; width:100%; max-width:470px }
.adozione { background:var(--carta); border-radius:18px; padding:9px 6px 10px; width:142px;
            display:flex; flex-direction:column; align-items:center; gap:1px;
            box-shadow:0 4px 0 #dde3ea }
.adozione:active { transform:translateY(2px); box-shadow:0 2px 0 #dde3ea }
.adozione:disabled { opacity:.5 }
.adozione b { font-size:15px; font-weight:900; color:var(--viola-scuro) }
.adozione i { font-style:normal; font-size:11px; color:var(--tenue) }
.adozione .gusto { font-size:11.5px }
.adozione .prezzo { margin-top:4px; font-size:13px; font-weight:900; color:#c98a00 }
</style>
