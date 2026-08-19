<script setup>
/* Gli attrezzi della cosa selezionata, **appesi all'oggetto** e non in un
   pannello che copre lo schermo: girare una staccionata vuol dire vederla
   girare, e con un pannello davanti non la vedi.

   ── QUANDO COMPAIONO ──────────────────────────────────────────────
   Al **tocco lungo** su una cosa già posata — lo stesso gesto con cui la
   si sposta, meno il trascinamento: «tieni premuto per sistemare». Fa
   eccezione chi non ha niente da fare al tocco secco (una panchina, un
   albero): lì bastano da soli, perché non c'è altro.

   Al tocco secco su un campo, un silo o una macchina **non** compaiono:
   quel tocco apre la loro scheda. Prima faceva tutte e due le cose, e il
   risultato era che chiudendo la scheda — o appena finito di seminare —
   questi tastini riemergevano da soli sopra la cosa appena lavorata, a
   proporre di spostarla.

   Spariscono mentre la stai tirando — è quando sono lontani dal dito e
   non servono a niente — e sotto un foglio aperto, che è la stessa
   regola detta da un'altra parte (`doveAttrezzi` in `Gioco.vue`). */
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  gesti: { type: Array, default: () => [] },   // [{ chiave, icona, titolo, spento }]
})
const emit = defineEmits(['fai', 'fine'])
</script>

<template>
  <div class="fa-attrezzi" :style="{ left: x + 'px', top: y + 'px' }">
    <button v-for="g in gesti" :key="g.chiave" :title="g.titolo"
            :disabled="g.spento" @click="emit('fai', g.chiave)">{{ g.icona }}</button>
    <button title="ho finito" @click="emit('fine')">✓</button>
  </div>
</template>
