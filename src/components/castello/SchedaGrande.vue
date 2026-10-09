<script setup>
/* La scheda di un mostro, aperta toccando il suo medaglione sullo stendardo:
   il mostro grande che cammina e si gira (il pittore `palco`), quanti ne
   arrivano, la vita, se vola, le torri che non lo toccano e quelle che sì,
   cosa fa quando cade. Tutto a parole: niente icone che vanno indovinate,
   solo le torri, che sono quelle del gioco. Nelle miste i due mostri
   affiancati, ognuno con le sue righe. Vedi docs/castello/mostri.md. */
import { ref, onMounted, onUnmounted } from 'vue'
import { creaTela } from '../../grafica/tela.js'
import { PITTORI } from '../../giochi/castello/scena/pittori.js'
import { TORRI } from '../../data/ops.js'
import { segnoDi } from '../../data/mostri.js'

const props = defineProps({
  voce: { type: Object, required: true },   // una voce dello stendardo
  torri: { type: Array, default: () => [] }, // le torri della tappa: quelle che lo colpiscono
})
const emit = defineEmits(['chiudi'])

const tele = ref([])
let campi = [], raf = 0
const mostri = () => (props.voce.con ? [props.voce, props.voce.con] : [props.voce])
const colpiscono = m => props.torri.filter(t => TORRI[t].danno && !(m.immune || []).includes(t))

function gira(ts) {
  campi.forEach((c, i) => c && c.disegna([{ che: 'palco', bestia: mostri()[i].id }], ts / 1000 + i * 1.1))
  raf = requestAnimationFrame(gira)
}
onMounted(() => {
  campi = tele.value.map(t => { const c = creaTela(t, PITTORI, { unita: 120, massimo: 4 }); c.ridimensiona(); return c })
  PITTORI.pronte().then(() => campi.forEach(c => c.ridimensiona()), () => {})
  raf = requestAnimationFrame(gira)
})
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="velo" data-scheda-grande @click.self="emit('chiudi')">
    <div class="pergamena" :class="{ capo: voce.capo, mista: voce.con }" :data-scheda-mista="voce.con ? '' : null">
      <button class="chiudi" aria-label="chiudi" data-azione="chiudi-scheda" @click="emit('chiudi')">✕</button>
      <b class="nome">{{ voce.con ? `${voce.nome} e ${voce.con.nome}` : voce.capo ? `${voce.nome} gigante` : voce.nome }}</b>
      <span class="sotto">{{ voce.ora ? 'adesso in campo' : `ondata ${voce.onda}` }} ·
        {{ voce.ora ? `ne restano ${voce.quanti}` : `ne arrivano ${voce.quanti}` }}<template v-if="voce.capo"> · è il capo</template></span>
      <div class="palchi">
        <div v-for="m in mostri()" :key="m.id" class="palco"><canvas ref="tele"></canvas></div>
      </div>
      <div v-for="m in mostri()" :key="m.id" class="righe" :data-per="m.id">
        <b v-if="voce.con" class="di">{{ m.nome }}</b>
        <span class="riga">vita {{ voce.vita }}<template v-if="m.vola"> · vola</template></span>
        <span v-if="m.immune && m.immune.length" class="riga" data-scheda-immune>non lo toccano
          <span v-for="t in m.immune" :key="t" class="no">{{ TORRI[t].emoji }}</span></span>
        <span v-else class="riga" data-scheda-immune>tutte le torri lo colpiscono</span>
        <span v-if="m.immune && m.immune.length && colpiscono(m).length" class="riga si">usa
          <span v-for="t in colpiscono(m)" :key="t" class="torre">{{ TORRI[t].emoji }}</span></span>
        <span v-if="m.abilita" class="riga" data-scheda-abilita :data-divisioni="m.divisioni > 1 ? m.divisioni : null">
          {{ segnoDi(m.abilita, m.divisioni).che }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="./scheda-grande.css"></style>
