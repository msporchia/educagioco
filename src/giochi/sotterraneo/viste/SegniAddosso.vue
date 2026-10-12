<script setup>
// Gli stati che si vedono addosso (docs/sotterraneo/scontro-effetti.md, «Gli stati»): sul mostro lo stordito ha le stelle che gli
// girano sopra la testa, l'avvelenato le bolle verdi, chi brucia le fiammelle, chi è gelato la brina, chi sanguina le gocce, chi è
// bloccato le radici ai piedi, chi è senza difesa lo scudo spezzato; sull'eroe lo scudo una barriera, il parato uno scudo davanti,
// l'intoccabile la pietra, lo specchio un lucido che passa, la linfa foglioline che salgono. Disegnato in codice, si muove da sé
// (stile-effetti.css, `sa-`). Non decide niente: gli stati arrivano già fatti (statiDel / statiMiei in viste/campo.js).
import { computed } from 'vue'
import { SCUDO } from './glifi-base.js'

const props = defineProps({
  stati: { type: Array, default: () => [] },    // [{ chiave, fuoco?, gelo? }]
  largo: { type: Number, default: 48 },         // quanto è larga la figura, per il giro delle stelle
})
const ha = k => props.stati.some(x => x.chiave === k)
const fuoco = computed(() => props.stati.some(x => x.chiave === 'veleno' && x.fuoco))
const velenoso = computed(() => props.stati.some(x => x.chiave === 'veleno' && !x.fuoco))
const gelo = computed(() => props.stati.some(x => (x.chiave === 'debole' || x.chiave === 'fermo') && x.gelo))
const stordito = computed(() => props.stati.some(x => x.chiave === 'fermo' && !x.gelo))
const fiacco = computed(() => props.stati.some(x => x.chiave === 'debole' && !x.gelo))
</script>

<template>
  <span v-if="stati.length" class="sa" :style="{ '--lg': largo + 'px' }" aria-hidden="true">
    <!-- sul mostro -->
    <span v-if="stordito" class="sa-stelle" data-segno="stordito">
      <svg v-for="k in 3" :key="k" class="sa-stella" viewBox="0 0 12 12" width="11" height="11" :style="{ '--d': -(k - 1) * 0.33 + 's' }">
        <path d="M6 0L7.7 4.3L12 6L7.7 7.7L6 12L4.3 7.7L0 6L4.3 4.3Z" />
      </svg>
    </span>
    <span v-if="velenoso" class="sa-bolle" data-segno="veleno">
      <i v-for="k in 5" :key="k" :style="{ '--x': [18, 46, 72, 32, 60][k - 1] + '%', '--d': -(k - 1) * 0.37 + 's', '--k': [1, 0.7, 1.15, 0.85, 0.65][k - 1] }"></i>
    </span>
    <span v-if="fuoco" class="sa-fiamme" data-segno="fuoco">
      <svg v-for="k in 3" :key="k" viewBox="0 0 24 34" width="14" height="20" :style="{ '--x': [8, 50, 90][k - 1] + '%', '--d': -(k - 1) * 0.31 + 's' }">
        <path d="M12 1C13 8 21 11 21 21C21 28 17 33 12 33C7 33 3 28 3 22C3 17 6 15 7 11C9 13 10 15 10 17C12 14 12.5 7 12 1Z" fill="#ff6a1c" />
        <path d="M12 14C13 18 17 20 17 25C17 29 15 32 12 32C9 32 7 29 7 26C7 22 11 19 12 14Z" fill="#ffd25a" />
      </svg>
      <i v-for="k in 3" :key="'b' + k" :style="{ '--x': [24, 55, 78][k - 1] + '%', '--d': -(k - 1) * 0.5 + 's' }"></i>
    </span>
    <span v-if="gelo" class="sa-brina" data-segno="gelo">
      <i class="sa-velo"></i>
      <svg v-for="k in 4" :key="k" viewBox="0 0 12 18" width="9" height="14" :style="{ '--x': [4, 30, 62, 88][k - 1] + '%', '--k': [1, 1.3, 0.9, 1.15][k - 1] }">
        <path d="M6 0L11 7L9 18H3L1 7Z" /><path d="M6 0L11 7H6Z" fill="#fff" opacity=".7" />
      </svg>
      <svg class="sa-fiocchetto" viewBox="-6 -6 12 12" width="11" height="11"><path d="M0 -5V5M-4.3 -2.5L4.3 2.5M-4.3 2.5L4.3 -2.5" /></svg>
    </span>
    <span v-if="ha('sanguina')" class="sa-gocce" data-segno="sanguina">
      <i v-for="k in 3" :key="k" :style="{ '--x': [22, 52, 78][k - 1] + '%', '--d': -(k - 1) * 0.5 + 's' }"></i>
    </span>
    <svg v-if="ha('esposto')" class="sa-radici" viewBox="0 0 64 26" preserveAspectRatio="none" data-segno="radici">
      <path d="M2 24C8 16 4 10 12 6M14 25C20 18 16 12 24 8M30 25C34 17 40 20 44 10M46 25C52 18 50 12 58 8M60 24C56 20 62 14 62 10" />
      <path class="sa-spina" d="M12 6L8 3M24 8L20 4M44 10L49 7M58 8L62 5" />
    </svg>
    <svg v-if="ha('rotto')" class="sa-rotto" viewBox="0 0 24 24" width="16" height="16" data-segno="rotto">
      <path :d="SCUDO" fill="#8f98ab" /><path d="M12 2.8L19.5 5.6V11C19.5 16 16 19.6 12 21.2Z" fill="#6c7488" />
      <path d="M12.6 3.4L10.6 8.8L13.6 12L11 17.8L12.4 21" stroke="#0b0b10" stroke-width="1.8" fill="none" stroke-linecap="round" />
    </svg>
    <svg v-if="fiacco" class="sa-fiacco" viewBox="0 0 24 24" width="13" height="13" data-segno="fiacco"><path d="M12 3V11" stroke="#b9c2d4" stroke-width="3" stroke-linecap="round" /><path d="M5.4 10.4H18.6L12 20.4Z" fill="#b9c2d4" /></svg>

    <!-- sull'eroe -->
    <span v-if="ha('scudo')" class="sa-barriera" data-segno="scudo"><i></i></span>
    <svg v-if="ha('parato')" class="sa-parata" viewBox="0 0 24 24" width="20" height="20" data-segno="parato">
      <path :d="SCUDO" fill="#9fb4d6" stroke="#f1f6ff" stroke-width="1.2" /><path d="M12 2.8L19.5 5.6V11C19.5 16 16 19.6 12 21.2Z" fill="#6f86ad" />
    </svg>
    <span v-if="ha('intoccabile')" class="sa-pietre" data-segno="intoccabile">
      <svg v-for="k in 5" :key="k" viewBox="0 0 14 14" width="11" height="11" :style="{ '--x': [-6, 96, -10, 100, 46][k - 1] + '%', '--y': [10, 20, 62, 66, 96][k - 1] + '%', '--d': -k * 0.4 + 's' }">
        <path d="M1 9L3 3L8 1L13 5L12 12L5 13Z" fill="#8f897a" /><path d="M8 1L13 5L12 12L9 7Z" fill="#5f5a50" />
      </svg>
    </span>
    <span v-if="ha('specchio')" class="sa-lucido" data-segno="specchio"></span>
    <span v-if="ha('linfa')" class="sa-linfa" data-segno="linfa">
      <i v-for="k in 4" :key="k" :style="{ '--x': [18, 44, 70, 86][k - 1] + '%', '--d': -(k - 1) * 0.6 + 's' }"></i>
    </span>
  </span>
</template>
