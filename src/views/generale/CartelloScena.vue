<script setup>
/* Il cartello che passa fra una scena e l'altra. Dura due secondi e
   dice una cosa sola: **cosa è cambiato**. Senza, le tre battaglie
   sembrano la stessa partita ripetuta tre volte. */
defineProps({
  n:      { type: Number, default: 2 },   // quale scena sta per cominciare
  quante: { type: Number, default: 3 },
  testo:  { type: String, default: '' },
})
</script>

<template>
  <div class="cambio-scena">
    <div class="dentro">
      <span class="et">scena {{ n }} di {{ quante }}</span>
      <b>stavolta {{ testo }}</b>
      <small>stesso piano, mondo diverso: se regge anche qui, è un piano vero.</small>
    </div>
  </div>
</template>

<style scoped>
.cambio-scena { position:absolute; inset:0; z-index:15; display:grid; place-items:center;
            padding:18px; background:#0b1020c4; animation:entra .18s ease }
.dentro { max-width:300px; text-align:center; display:grid; gap:6px; background:var(--carta);
          border-radius:16px; padding:14px 16px; box-shadow:0 10px 30px #0007 }
.et { font-size:10px; font-weight:900; letter-spacing:.8px; text-transform:uppercase;
      color:#b5891f }
.dentro b { font-size:15.5px; line-height:1.35; color:var(--viola-scuro) }
.dentro small { font-size:11.5px; line-height:1.4; color:var(--tenue) }
@keyframes entra { from { opacity:0 } to { opacity:1 } }
</style>
