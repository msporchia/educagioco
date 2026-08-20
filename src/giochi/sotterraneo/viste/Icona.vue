<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA FACCIA DI UNA COSA — una sola, in tutto il gioco

   La stessa boccetta aveva tre facce: lo sprite disegnato quando stava
   per terra, l'emoji 🧪 nella riga «l'hai presa», l'emoji di nuovo al
   banco del mercante — e lo sprite ancora nella tasca dello zaino. Da
   fuori non si legge come una svista di disegno: si legge come **tre
   oggetti diversi**, e un bambino che cerca «quella cosa lì» non la
   riconosce.

   La regola è una riga: **dove il foglio ha il pezzo, si usa il pezzo;
   l'emoji è il ripiego** — per le armature, che nel foglio non ci sono
   (`sprite: null` in `dati/cose.js`), e per un pezzo che sparisse.
   Chiunque mostri una cosa passa di qui, così la regola non si può
   dimenticare in un posto solo.

   ── E LA SCALA È UNA SOLA ─────────────────────────────────────────
   Prima ogni posto chiedeva «grande quanto ci sta qui» (`alto: 40`
   nella tasca, `22` nella riga dell'avviso), e la scala usciva da una
   divisione: la boccetta, alta 14 pixel, veniva ×2 nella tasca e ×1
   nell'avviso — **la stessa figura grande la metà**, che a occhio è
   un'altra icona. Peggio ancora fra oggetti: il medaglione, alto 9,
   usciva ×4 e sembrava un piatto.

   Adesso la scala è dichiarata e uguale per tutti (×2), e le figure
   restano grandi come sono disegnate: il medaglione è piccolo perché è
   un medaglione, lo spadone è lungo perché è uno spadone. È la stessa
   regola del campo, dove tutto sta alla scala del mondo.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { figura, SCALA } from './figura.js'

const props = defineProps({
  sprite: { type: String, default: null },
  em: { type: String, default: '' },
  /* quanto grande viene l'**emoji** di ripiego: la scala degli sprite
     non la decide chi chiama, quella di un'emoji sì — è un carattere, e
     in una riga di testo va tarata sul testo che le sta intorno */
  emAlto: { type: Number, default: 22 },
})

const f = computed(() => (props.sprite ? figura(props.sprite, { scala: SCALA }) : null))
</script>

<template>
  <span class="sot-icona" :style="f ? f.gabbia : null">
    <i v-if="f" :style="f.pezzo"></i>
    <b v-else class="em" :style="{ fontSize: emAlto + 'px' }">{{ em }}</b>
  </span>
</template>
