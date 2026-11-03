<script setup>
// Dentro la casa, la parte che si tocca (docs/fattoria3d/casa.md): la testata con «Esci», i due tasti (Arreda, Stanze), la barra del mobile
// in mano (gira, compra o metti qui, lascia) e i tre fogli: il catalogo dei mobili, il foglio di un mobile (colore, trama, gira, sposta,
// metti via; l'armadio apre anche il guardaroba) e la pianta (le stanze da comprare, pavimento e pareti). Riceve l'oggetto di casa.js.
import { reactive } from 'vue'
import { MOBILI, SCHEDE_MOBILI, COLORI, TRAME, PAVIMENTI, PARETI, CARTE, PREZZI_STANZE, MAX_STANZE } from '../dati/interni.js'
import { disegnaTrama } from '../scena3d/trame-pure.js'
import '../stile-casa.css'

const p = defineProps({
  casa: { type: Object, required: true },          // usaCasa() di casa.js
  monete: { type: Number, default: 0 },
})
defineEmits(['guardaroba'])
const { foglio, scheda, mobile, stanzaScelta, mano, messaggio, vista, voci, eArmadio } = p.casa
const c = p.casa
const vaiScheda = id => { scheda.value = id }
const scegliStanza = id => { stanzaScelta.value = id; messaggio.value = '' }

// le foto dei mobili: quella pronta se c'è, se no si chiede e arriva
const foto = reactive({})
const chiaveFoto = (tipo, colore, trama) => `mobile:${tipo}:${colore}:${trama}`
function fotoDi(tipo, colore, trama) {
  const k = chiaveFoto(tipo, colore, trama)
  if (foto[k] !== undefined) return foto[k]
  const pronta = c.anteprimaPronta(k)
  if (pronta) return (foto[k] = pronta)
  foto[k] = null
  c.anteprima(k).then(u => { foto[k] = u || null })
  return null
}
// i campioni delle trame: un canvas piccolo per (colore, trama), disegnato una volta
const campioni = {}
function campione(colore, trama) {
  const k = colore + trama
  if (!campioni[k] && typeof document !== 'undefined') {
    const cv = document.createElement('canvas'); cv.width = cv.height = 48
    disegnaTrama(cv.getContext('2d'), 48, colore, trama); campioni[k] = cv.toDataURL()
  }
  return campioni[k]
}
const coloreHex = (materiale, id) => (COLORI[materiale].find(x => x.id === id) || COLORI[materiale][0]).c
const finitura = () => vista.value?.stanze.find(s => s.id === stanzaScelta.value)
const prossimoPrezzo = () => { const n = vista.value ? vista.value.stanze.filter(s => s.tua).length : 1; return n < MAX_STANZE ? PREZZI_STANZE[n] : null }
</script>

<template>
  <div class="f3-int" data-f3="casa-dentro">
    <header class="f3-int-testa">
      <span class="f3-int-titolo">🏠 La casa</span>
      <button class="f3-int-esci" data-f3="esci-casa" @click="c.esci()">🚪 Esci</button>
    </header>

    <!-- i tasti: arredare e le stanze -->
    <div v-if="!foglio && !mano" class="f3-int-azioni">
      <button data-f3="apri-arreda" @click="c.apriCatalogo()">🛋️ Arreda</button>
      <button data-f3="apri-pianta" @click="c.apriPianta()">🗺️ Stanze</button>
    </div>

    <!-- il mobile in mano: si trascina o si tocca dove va -->
    <div v-if="mano" class="f3-int-mano" data-f3="mano" :data-ok="mano.ok">
      <p class="riga">{{ messaggio || (mano.ok ? 'Trascinalo dove vuoi' : 'Lì non ci sta: spostalo') }}</p>
      <div class="tasti">
        <button v-if="mano.gira" class="tondo" data-f3="mano-gira" aria-label="gira" @click="c.gira()">↻</button>
        <button class="si" :class="{ spenta: !mano.ok || (mano.nuovo && mano.prezzo > monete) }" data-f3="mano-posa" @click="c.posa()">
          {{ mano.nuovo ? `🛒 Compra 🪙${mano.prezzo}` : '✓ Metti qui' }}
        </button>
        <button class="no" data-f3="mano-lascia" @click="c.lascia()">✖️</button>
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

    <!-- un mobile -->
    <div v-if="foglio === 'mobile' && mobile" class="f3-foglio f3-colonna f3-int-mob" data-f3="mobile" :data-tipo="mobile.tipo">
      <h2>{{ mobile.voce.nome }}</h2>
      <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="c.chiudi()">✕</button>
      <div class="f3-corpo">
        <div class="f3-int-ritratto">
          <img v-if="fotoDi(mobile.tipo, mobile.colore, mobile.trama)" :src="fotoDi(mobile.tipo, mobile.colore, mobile.trama)" alt="" />
        </div>
        <p v-if="messaggio" class="f3-messaggio" data-f3="mobile-msg">{{ messaggio }}</p>
        <button v-if="eArmadio" class="f3-int-grande" data-f3="apri-armadio" @click="$emit('guardaroba')">👕 Apri l'armadio</button>
        <h3>Colore</h3>
        <div class="f3-int-campioni">
          <button v-for="col in COLORI[mobile.voce.tinte]" :key="col.id" class="campione" :class="{ su: mobile.colore === col.id }" :style="{ background: col.c }"
                  :aria-label="col.nome" :data-colore="col.id" @click="c.tingi(col.id, mobile.trama)"></button>
        </div>
        <template v-if="mobile.voce.trame">
          <h3>Trama</h3>
          <div class="f3-int-campioni">
            <button v-for="t in TRAME" :key="t.id" class="campione" :class="{ su: mobile.trama === t.id }" :aria-label="t.nome" :data-trama="t.id"
                    :style="{ backgroundImage: `url(${campione(coloreHex(mobile.voce.tinte, mobile.colore), t.id)})` }" @click="c.tingi(mobile.colore, t.id)"></button>
          </div>
        </template>
        <div class="f3-int-fila">
          <button data-f3="mobile-sposta" @click="c.sposta()">✋ Sposta</button>
          <button v-if="mobile.voce.strato !== 'muro'" data-f3="mobile-gira" @click="c.giraMobile()">↻ Gira</button>
          <button v-if="!eArmadio" data-f3="mobile-via" @click="c.mettiVia()">📦 Metti via</button>
        </div>
        <p class="f3-nota">Colore, trama, girare e spostare non costano niente.</p>
      </div>
    </div>

    <!-- la pianta -->
    <div v-if="foglio === 'pianta' && vista" class="f3-foglio f3-colonna f3-int-pianta" data-f3="pianta">
      <h2>🗺️ Le stanze</h2>
      <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="c.chiudi()">✕</button>
      <div class="f3-corpo">
        <div class="f3-int-mappa">
          <button v-for="s in vista.stanze" :key="s.id" class="stanza" :class="{ tua: s.tua, apribile: s.apribile, su: stanzaScelta === s.id }"
                  :style="{ gridColumn: s.c + 1, gridRow: s.r + 1 }" :data-stanza="s.id" :data-tua="s.tua" @click="scegliStanza(s.id)">
            <template v-if="s.tua">{{ s.id === 0 ? '🚪' : '' }} {{ s.mobili }} {{ s.mobili === 1 ? 'mobile' : 'mobili' }}</template>
            <template v-else-if="s.apribile">＋ 🪙 {{ s.prezzo }}</template>
            <template v-else>🔒</template>
          </button>
        </div>
        <p v-if="messaggio" class="f3-messaggio" data-f3="pianta-msg">{{ messaggio }}</p>
        <template v-if="finitura() && !finitura().tua">
          <p v-if="finitura().apribile" class="f3-nota">Una stanza nuova, attaccata a quelle che hai: dentro ci metti quello che vuoi.</p>
          <p v-else class="f3-nota">Prima compra una stanza vicina: le stanze si aggiungono una attaccata all'altra.</p>
          <button v-if="finitura().apribile" class="f3-int-grande" :class="{ spenta: finitura().prezzo > monete }" data-f3="compra-stanza" @click="c.compraStanza(stanzaScelta)">
            🛒 Compra la stanza 🪙{{ finitura().prezzo }}
          </button>
        </template>
        <template v-else-if="finitura()">
          <h3>Pavimento</h3>
          <div class="f3-int-campioni">
            <button v-for="pv in PAVIMENTI" :key="pv.id" class="campione largo" :class="{ su: finitura().finitura.pavimento === pv.id, [pv.motivo]: true }" :style="{ backgroundColor: pv.c }"
                    :aria-label="pv.nome" :data-pavimento="pv.id" @click="c.rifinisci({ pavimento: pv.id })"></button>
          </div>
          <h3>Pareti</h3>
          <div class="f3-int-campioni">
            <button v-for="pr in PARETI" :key="pr.id" class="campione" :class="{ su: finitura().finitura.pareti === pr.id }" :style="{ background: pr.c }"
                    :aria-label="pr.nome" :data-pareti="pr.id" @click="c.rifinisci({ pareti: pr.id })"></button>
          </div>
          <h3>Carta da parati</h3>
          <div class="f3-int-campioni">
            <button v-for="ct in CARTE" :key="ct.id" class="campione" :class="{ su: finitura().finitura.carta === ct.id }" :aria-label="ct.nome" :data-carta="ct.id"
                    :style="{ backgroundImage: `url(${campione((PARETI.find(x => x.id === finitura().finitura.pareti) || PARETI[0]).c, ct.id)})` }" @click="c.rifinisci({ carta: ct.id })"></button>
          </div>
        </template>
        <p class="f3-nota" v-if="prossimoPrezzo()">Le stanze sono al massimo {{ MAX_STANZE }}. Pavimento e pareti si cambiano gratis.</p>
        <p class="f3-nota" v-else>Hai tutte le stanze! Pavimento e pareti si cambiano gratis.</p>
      </div>
    </div>
  </div>
</template>
