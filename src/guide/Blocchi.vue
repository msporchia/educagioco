<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CORPO DI UNA GUIDA

   Disegna i blocchi di `guide/contenuti.js` e basta: non sa se sta
   dentro la schermata delle guide o dentro il velo di un gioco, e i due
   posti devono rendere uguale — una guida letta in due modi diversi è
   due guide da correggere.

   Il grassetto si scrive `**così**` perché le guide sono dato puro e
   dentro un dato non ci va HTML: chi le scrive non deve poter mettere un
   tag, e chi le legge non deve fidarsi. Qui si scappa il testo e si
   riconosce solo quella coppia di asterischi.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { piattaforma, installata } from './aiuto.js'

const props = defineProps({
  blocchi: { type: Array, default: () => [] },
})

const dove = piattaforma()
const dentro = installata()

/* `se` filtra: un blocco senza `se` lo vedono tutti */
const visibili = computed(() => props.blocchi.filter(b => {
  const se = typeof b === 'object' ? b.se : null
  if (!se) return true
  if (se === 'installata') return dentro
  if (se === 'da-installare') return !dentro
  return se === dove
}))

const testo = t => String(t)
  .replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
</script>

<template>
  <div class="guida-corpo">
    <template v-for="(b, i) in visibili" :key="i">
      <p v-if="typeof b === 'string'" class="par" v-html="testo(b)"></p>
      <div v-else class="blocco">
        <h3 v-if="b.titolo">{{ b.titolo }}</h3>
        <ul v-if="b.righe"><li v-for="(r, j) in b.righe" :key="j" v-html="testo(r)"></li></ul>
        <ol v-if="b.passi"><li v-for="(r, j) in b.passi" :key="j" v-html="testo(r)"></li></ol>
      </div>
    </template>
  </div>
</template>

<style scoped>
.guida-corpo { display:flex; flex-direction:column; gap:14px; text-align:left;
               user-select:text }   /* una guida si copia e si incolla in chat */
.par { font-size:15px; line-height:1.5; color:var(--testo) }
.blocco { background:#ffffffb0; border-radius:14px; padding:12px 14px;
          box-shadow:0 2px 8px #8593a81f }
.blocco h3 { font-size:14px; font-weight:900; color:var(--viola-scuro);
             margin-bottom:7px }
.blocco ul, .blocco ol { padding-left:19px; display:flex; flex-direction:column; gap:7px }
.blocco li { font-size:14.5px; line-height:1.45; color:var(--testo) }
.blocco ul { list-style:disc }
.blocco ol { list-style:decimal }
.blocco :deep(b) { color:var(--viola-scuro) }
</style>
