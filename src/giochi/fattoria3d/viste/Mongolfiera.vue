<script setup>
// Il foglio della mongolfiera, la nave: un'insegna col cielo azzurro, le nuvolette e il pallone grande; sotto la stiva, tre file di
// cassette di legno (una merce per fila) da riempire un po' alla volta. Ogni cassetta ha la faccia della merce, il conto `ha/serve`
// (verde se c'è, rosso se manca) e il suo tasto «Metti sulla mongolfiera»; il tasto spento (aria-disabled) dice cosa manca quando si
// tocca. Fila piena e tutto pieno accendono il loro bonus. Riceve una fotografia già pronta (`motore.vistaMongolfiera()`) e dice cosa si
// vuole con gli `emit`. Premia esperienza ⭐, mai monete. Vedi docs/fattoria3d/mongolfiera.md.
import { computed } from 'vue'
import Faccia from './Faccia.vue'
import '../stile-mongolfiera.css'

const p = defineProps({
  nave: { type: Object, required: true },          // motore.vistaMongolfiera(): { stato, file, piene, totale, pronte, restoMs, … }
  messaggio: { type: String, default: '' },        // l'esito dell'ultimo tocco (manca roba, cassa messa, partita)
  traguardo: { type: Object, default: () => ({ fatte: 0, meta: 1 }) },   // le casse messe verso la prossima soglia del traguardo
  livelloIngresso: { type: Number, default: 10 },
})
defineEmits(['carica', 'parti', 'chiudi'])

const tempo = ms => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') }
const barra = computed(() => p.nave.totale ? Math.round(100 * p.nave.piene / p.nave.totale) : 0)
const sotto = computed(() => ({
  'non-tua': 'Non è ancora tua', viaggio: 'In viaggio alla fiera', vuota: 'Aspetta un carico',
  terra: `Casse a bordo ${p.nave.piene}/${p.nave.totale}`,
}[p.nave.stato]))
const chiusa = computed(() => p.nave.aperta
  ? `Tocca la mongolfiera sulla mappa per comprarla: costa 🪙 ${p.nave.prezzo}. Se sta su un terreno che non è ancora tuo, compra prima quello.`
  : `La mongolfiera arriva al livello ${p.livelloIngresso}.`)
const barraTraguardo = computed(() => Math.min(100, Math.round(100 * p.traguardo.fatte / Math.max(1, p.traguardo.meta))))
const piuTutto = computed(() => Math.round(100 * p.nave.bonusTutto))
const piuFila = computed(() => Math.round(100 * p.nave.bonusFila))
</script>

<template>
  <div class="f3-foglio f3-colonna f3-mg" data-f3="mongolfiera" :data-stato="nave.stato">
    <header class="f3-mg-cielo">
      <i class="nuvola n1" aria-hidden="true"></i><i class="nuvola n2" aria-hidden="true"></i><i class="nuvola n3" aria-hidden="true"></i>
      <span class="f3-mg-pallone" aria-hidden="true"><b class="cesta"></b></span>
      <div class="titolo">
        <h2>La mongolfiera</h2>
        <small data-f3="mongolfiera-sotto">{{ sotto }}</small>
      </div>
    </header>
    <button class="f3-chiudi f3-mg-x" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>

    <div class="f3-corpo">
      <p v-if="nave.stato === 'non-tua'" class="f3-messaggio" data-f3="mongolfiera-chiusa">{{ chiusa }}</p>

      <template v-else>
        <p v-if="messaggio" class="f3-messaggio" data-f3="mongolfiera-msg">{{ messaggio }}</p>

        <section v-if="nave.stato === 'viaggio'" class="f3-mg-viaggio" data-f3="mongolfiera-viaggio">
          <span class="vola" aria-hidden="true">🎈</span>
          <b>Torna fra <span data-f3="mongolfiera-resto">{{ tempo(nave.restoMs) }}</span></b>
          <small>È alla fiera a portare la roba. Al ritorno ha un nuovo carico da riempire: intanto prepara i prodotti.</small>
        </section>

        <p v-else-if="nave.stato === 'vuota'" class="f3-messaggio" data-f3="mongolfiera-vuota">Non c'è niente da portare: la mongolfiera aspetta di sapere cosa serve.</p>

        <template v-else>
          <div class="f3-mg-stato">
            <div class="f3-mg-barra" data-f3="mongolfiera-piene" :aria-label="'casse a bordo ' + nave.piene + ' su ' + nave.totale">
              <span>Casse a bordo <b>{{ nave.piene }}/{{ nave.totale }}</b></span>
              <i><u :style="{ width: barra + '%' }"></u></i>
            </div>
            <div class="f3-mg-tutto" :class="{ acceso: nave.piene === nave.totale }" data-f3="mongolfiera-tutto">
              <b>Tutto pieno: +{{ piuTutto }}% <span class="xp">(+{{ nave.bonusTuttoXp }} ⭐)</span> e una sorpresa della fiera 🎪</b>
              <small>La mongolfiera parte e torna con un nuovo carico.</small>
            </div>
          </div>

          <section v-for="fila in nave.file" :key="fila.i" class="f3-mg-fila" :class="{ piena: fila.piena }" :data-fila="fila.i" :data-merce="fila.k">
            <div class="f3-mg-testa">
              <Faccia :k="fila.k" :emoji="fila.emoji" :lato="38" />
              <span class="nome"><b>{{ fila.nome }}</b><small>{{ fila.casse[0].pezzi }} {{ fila.casse[0].pezzi === 1 ? 'pezzo' : 'pezzi' }} per cassa</small></span>
              <span class="f3-mg-premio" :class="{ acceso: fila.piena }" data-f3="mongolfiera-fila-bonus" :data-acceso="fila.piena">
                {{ fila.piena ? '✓ ' : '' }}Fila piena +{{ piuFila }}% <span class="xp">(+{{ fila.bonus }} ⭐)</span>
              </span>
            </div>
            <div class="f3-mg-casse">
              <div v-for="cassa in fila.casse" :key="cassa.c" class="f3-mg-cassa" :class="{ piena: cassa.piena, pronta: cassa.pronta }"
                   :style="{ '--i': cassa.c }" data-f3="mongolfiera-cassa" :data-fila="fila.i" :data-cassa="cassa.c" :data-piena="cassa.piena" :data-pronta="cassa.pronta">
                <div class="cassetta">
                  <Faccia :k="fila.k" :emoji="fila.emoji" :n="cassa.pezzi" :lato="44" />
                  <span v-if="cassa.piena" class="timbro" aria-hidden="true">✓</span>
                </div>
                <span v-if="!cassa.piena" class="conto" :class="cassa.manca ? 'manca' : 'ok'" data-f3="mongolfiera-conto">{{ cassa.ha }}/{{ cassa.pezzi }}</span>
                <span class="premio">+{{ cassa.xp }} ⭐</span>
                <span v-if="cassa.piena" class="a-bordo">A bordo</span>
                <!-- aria-disabled e non disabled: un tasto spento non si tocca, e toccarlo deve dire cosa manca -->
                <button v-else type="button" class="metti" :class="{ spenta: !cassa.pronta }" :aria-disabled="!cassa.pronta" :data-puoi="cassa.pronta"
                        data-f3="mongolfiera-carica" @click="$emit('carica', fila.i, cassa.c)">Metti sulla mongolfiera</button>
              </div>
            </div>
          </section>

          <button type="button" class="f3-mg-parti" data-f3="mongolfiera-parti" @click="$emit('parti')">Parti subito</button>
          <p class="f3-nota f3-mg-nota">Parti subito: restano i ⭐ delle casse già a bordo, ma niente bonus del tutto né sorpresa. Il carico nuovo arriva dopo il viaggio.</p>
        </template>

        <div class="f3-mg-conta" data-f3="mongolfiera-conta" :aria-label="'casse messe ' + traguardo.fatte + ' su ' + traguardo.meta">
          <span>Sulla mongolfiera {{ traguardo.fatte }}/{{ traguardo.meta }}</span>
          <i><u :style="{ width: barraTraguardo + '%' }"></u></i>
        </div>
        <p class="f3-nota">Le casse danno esperienza ⭐, non monete. Ogni cassa si mette da sola: non serve avere tutto, serve tornare.</p>
      </template>
    </div>
  </div>
</template>
