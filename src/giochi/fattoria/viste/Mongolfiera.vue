<script setup>
/* La mongolfiera: le casse da riempire, una alla volta — vedi docs/fattoria/chi-chiede.md.
   "Parti!" a metà chiede conferma (dicendo cosa se ne va); la conferma si rimette a zero al cambio
   di pallone, se no un componente rimasto montato se la porterebbe dietro. */
import { computed, ref, watch } from 'vue'
import Merce from './Merce.vue'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  // naveDi: {aTerra, n, file, piene, di, preso, tuttoIntero, bonusTutto, pieno} o {aTerra:false, minuti}
  nave: { type: Object, required: true },
})
const emit = defineEmits(['carica', 'parti', 'chiudi', 'albero'])

const chiede = ref(false)
watch(() => props.nave.n, () => { chiede.value = false })
watch(() => props.nave.aTerra, () => { chiede.value = false })

const vuote = computed(() => props.nave.aTerra ? props.nave.di - props.nave.piene : 0)


function premiParti() {
  if (props.nave.pieno) return emit('parti')
  chiede.value = true
}
</script>

<template>
  <div class="fa-foglio fa-mercato fa-mongolfiera" data-mongolfiera>
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>La mongolfiera</h2>

    <!-- Il cielo vuoto dice fra quanto torna: non è un guasto. -->
    <template v-if="!nave.aTerra">
      <p data-cielo class="fa-cielo">☁️ <b>{{ nave.minuti }} min</b></p>
      <p class="fa-piccolo">Torna a chiedere cose fatte con le macchine.</p>
    </template>

    <template v-else>
      <!-- Il conto: quanto si è preso, e quanto dà finirla tutta (con la sorpresa). -->
      <p class="fa-conto" data-conto>
        <em class="fa-premio-xp">⭐ {{ nave.preso }}</em>
        <span v-if="!nave.pieno"> / <em class="fa-premio-xp">⭐ {{ nave.tuttoIntero }}</em> 🎁</span>
      </p>

      <!-- Come «Carica» in Hay Day: una fila di casse per merce. La cassa che si può riempire ha il
           foglietto «!», quella riempita è verde. Toccare la figura della fila apre il suo albero. -->
      <div class="fa-stiva">
        <div v-for="fila in nave.file" :key="nave.n + '-' + fila.i" class="fa-fila-casse"
             :data-fila="fila.i">
          <button type="button" class="fa-chiesta fa-merce-fila" :data-albero-apri="fila.merce"
                  :title="fila.nome" @click="emit('albero', fila.merce)">
            <Merce :merce="fila.merce" :lato="40" />
            <span><b>{{ fila.hai }}</b></span>
          </button>
          <button v-for="c in fila.casse" :key="c.j" type="button"
                  :class="['fa-cassa', { piena: c.piena, pronta: c.pronta }]"
                  :data-cassa="fila.i + '-' + c.j" data-azione="carica"
                  :disabled="c.piena || !c.pronta"
                  @click="emit('carica', { fila: fila.i, cassa: c.j })">
            <i v-if="c.pronta && !c.piena" class="fa-avviso-cassa">!</i>
            <span class="fa-cartellino">
              <Merce :merce="fila.merce" :lato="28" />
              <b>{{ c.piena ? '✓' : c.pezzi }}</b>
            </span>
          </button>
          <em class="fa-premio-xp fa-bonus-fila" :title="'fila piena'">+⭐{{ fila.bonus }}</em>
        </div>
      </div>

      <!-- La conferma sta al posto del tasto, non in fondo a un elenco. -->
      <div v-if="chiede" class="fa-conferma-parti" data-conferma="parti">
        <p>Parte con <b>{{ vuote }} {{ vuote === 1 ? 'cassa vuota' : 'casse vuote' }}</b>:
           le ⭐ prese restano.</p>
        <div class="fa-fila">
          <button class="fa-bot piano" data-azione="lascia" @click="chiede = false">
            Lascia stare</button>
          <button class="fa-bot forte" data-azione="parti-davvero"
                  @click="chiede = false; emit('parti')">Parti!</button>
        </div>
      </div>
      <div v-else class="fa-fila">
        <button class="fa-bot" :class="nave.pieno ? 'forte' : 'piano'"
                data-azione="parti" @click="premiParti">🎈 Parti!</button>
      </div>
    </template>
  </div>
</template>
