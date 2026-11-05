<script setup>
// Dentro la casa, la parte che si tocca (docs/fattoria3d/casa.md): la testata con «Esci», i due tasti (Arreda, Colori), la barra del mobile
// in mano (gira, compra o metti qui, lascia), la striscia di pavimento e pareti (si provano sulla stanza, si pagano qui) e i due fogli: il
// catalogo dei mobili e il foglio di un mobile, che si apre col tocco (viste/Mobile.vue). Spostare è tenerlo premuto (scena3d/casa3d.js). Riceve l'oggetto di casa.js.
import { reactive } from 'vue'
import { SCHEDE_MOBILI, PAVIMENTI, PARETI, CARTE, PREZZI_FINITURE } from '../dati/interni.js'
import { dettoInCasa } from '../casa.js'
import { campioneTrama } from './campione-trama.js'
import Mobile from './Mobile.vue'
import '../stile-casa.css'

const p = defineProps({
  casa: { type: Object, required: true },          // usaCasa() di casa.js
  monete: { type: Number, default: 0 },
})
const { foglio, scheda, mobile, tinte, prezzoTinte, mano, messaggio, vista, voci } = p.casa
const c = p.casa
const vaiScheda = id => { scheda.value = id }
const PARTI = [{ id: 'pavimento', nome: 'Pavimento' }, { id: 'pareti', nome: 'Pareti' }, { id: 'carta', nome: 'Carta' }]
const vaiParte = id => { tinte.value.parte = id }

// le foto dei mobili: quella pronta se c'è, se no si chiede e arriva
const foto = reactive({})
// col giro è la foto grande in cima al foglio: `vestita:` è la chiave che anteprime.js fa grande
const chiaveFoto = (tipo, colore, trama, giro) => (giro === null ? `mobile:${tipo}:${colore}:${trama}` : `vestita:${tipo}:${colore}:${trama}:${giro}`)
function fotoDi(tipo, colore, trama, giro = null) {
  const k = chiaveFoto(tipo, colore, trama, giro)
  if (foto[k] !== undefined) return foto[k]
  const pronta = c.anteprimaPronta(k)
  if (pronta) return (foto[k] = pronta)
  foto[k] = null
  c.anteprima(k).then(u => { foto[k] = u || null })
  return null
}
const colorePareti = () => (PARETI.find(x => x.id === tinte.value.prova.pareti) || PARETI[0]).c
</script>

<template>
  <div class="f3-int" data-f3="casa-dentro">
    <header class="f3-int-testa">
      <span class="f3-int-titolo">🏠 La casa</span>
      <button class="f3-int-esci" data-f3="esci-casa" @click="c.esci()">🚪 Esci</button>
    </header>

    <!-- i tasti: arredare e dipingere (le stanze nuove si comprano toccandole) -->
    <div v-if="!foglio && !mano && !tinte" class="f3-int-azioni">
      <button data-f3="apri-arreda" @click="c.apriCatalogo()">🛋️ Arreda</button>
      <button data-f3="apri-tinte" @click="c.apriTinte()">🎨 Colori</button>
    </div>

    <!-- il mobile in mano: dal catalogo si trascina o si tocca dove va; tenuto al dito si posa staccando il dito, e il ↻ si preme con un altro dito -->
    <div v-if="mano" class="f3-int-mano" data-f3="mano" :data-ok="mano.ok">
      <p class="riga" data-f3="mano-riga">{{ messaggio || (!mano.ok ? dettoInCasa(mano) : mano.tenuto ? 'Lascialo dove vuoi' : 'Trascinalo dove vuoi') }}</p>
      <div class="tasti">
        <button v-if="mano.gira" class="tondo" data-f3="mano-gira" aria-label="gira" @pointerdown.prevent="c.gira()" @keydown.enter.prevent="c.gira()">↻</button>
        <button v-if="!mano.tenuto" class="si" :class="{ spenta: !mano.ok || (mano.nuovo && mano.prezzo > monete) }" data-f3="mano-posa" @click="c.posa()">
          {{ mano.nuovo ? `🛒 Compra 🪙${mano.prezzo}` : '✓ Metti qui' }}
        </button>
        <button v-if="!mano.tenuto" class="no" data-f3="mano-lascia" @click="c.lascia()">✖️</button>
      </div>
    </div>

    <!-- pavimento e pareti: si provano sulla stanza, si pagano qui -->
    <div v-if="tinte" class="f3-int-tinte" data-f3="tinte" :data-stanza="tinte.stanza">
      <nav class="f3-int-schede">
        <button v-for="s in PARTI" :key="s.id" :class="{ su: tinte.parte === s.id }" :data-parte="s.id" @click="vaiParte(s.id)">{{ s.nome }} 🪙{{ PREZZI_FINITURE[s.id] }}</button>
      </nav>
      <div v-if="tinte.parte === 'pavimento'" class="f3-int-campioni">
        <button v-for="pv in PAVIMENTI" :key="pv.id" class="campione largo" :class="{ su: tinte.prova.pavimento === pv.id, [pv.motivo]: true }" :style="{ backgroundColor: pv.c }"
                :aria-label="pv.nome" :data-pavimento="pv.id" @click="c.provaTinta('pavimento', pv.id)"></button>
      </div>
      <div v-else-if="tinte.parte === 'pareti'" class="f3-int-campioni">
        <button v-for="pr in PARETI" :key="pr.id" class="campione" :class="{ su: tinte.prova.pareti === pr.id }" :style="{ background: pr.c }"
                :aria-label="pr.nome" :data-pareti="pr.id" @click="c.provaTinta('pareti', pr.id)"></button>
      </div>
      <div v-else class="f3-int-campioni">
        <button v-for="ct in CARTE" :key="ct.id" class="campione" :class="{ su: tinte.prova.carta === ct.id }" :aria-label="ct.nome" :data-carta="ct.id"
                :style="{ backgroundImage: `url(${campioneTrama(colorePareti(), ct.id)})` }" @click="c.provaTinta('carta', ct.id)"></button>
      </div>
      <p class="riga" data-f3="tinte-riga">{{ messaggio || (prezzoTinte ? 'Ti piace così?' : 'Tocca un colore: lo vedi subito, lo paghi solo se ti piace.') }}</p>
      <div class="tasti">
        <button class="si" :class="{ spenta: !prezzoTinte || prezzoTinte > monete }" data-f3="tinte-compra" @click="c.pagaTinte()">🛒 Compra 🪙{{ prezzoTinte }}</button>
        <button class="no" data-f3="tinte-lascia" aria-label="lascia com'era" @click="c.lasciaTinte()">✖️</button>
      </div>
    </div>

    <!-- il catalogo -->
    <div v-if="foglio === 'catalogo'" class="f3-foglio f3-colonna f3-int-cat" data-f3="catalogo-casa">
      <h2>🛋️ Arreda</h2>
      <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="c.chiudi()">✕</button>
      <nav class="f3-int-schede">
        <button v-for="s in SCHEDE_MOBILI" :key="s.id" :class="{ su: scheda === s.id }" :data-scheda-casa="s.id" @click="vaiScheda(s.id)">{{ s.nome }}</button>
        <button v-if="vista && vista.via.length" :class="{ su: scheda === 'via' }" data-scheda-casa="via" @click="vaiScheda('via')">📦 Messi via ({{ vista.via.length }})</button>
      </nav>
      <div class="f3-corpo">
        <div class="f3-int-carte">
          <button v-for="v in voci" :key="v.id ?? v.tipo" class="f3-int-carta" :class="{ cara: v.prezzo > monete }" :data-mobile-carta="v.tipo" @click="c.scegli(v)">
            <img v-if="fotoDi(v.tipo, v.colore, v.trama)" :src="fotoDi(v.tipo, v.colore, v.trama)" alt="" />
            <span v-else class="attesa" aria-hidden="true"></span>
            <b>{{ v.nome }}</b>
            <small>{{ v.prezzo ? `🪙 ${v.prezzo}` : v.id !== null ? 'Rimetti' : '' }}</small>
          </button>
        </div>
        <p class="f3-nota">Tocca un mobile: lo metti dove vuoi e lo paghi quando lo posi. Colori e trame si cambiano gratis dopo.</p>
      </div>
    </div>

    <!-- un mobile: colore, trama, gira, metti via -->
    <Mobile v-if="foglio === 'mobile' && mobile" :casa="casa" :foto="fotoDi" />
  </div>
</template>
