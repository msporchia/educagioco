<script setup>
/* ═══════════════════════════════════════════════════════════════════
   L'ELENCO DELLE GUIDE — una forma sola, due posti

   Le stesse voci si mostrano in due cornici diverse: la schermata «Come
   funziona» (`Guide.vue`) e il foglio che si apre al primo avvio
   (`VeloGuide.vue`), dove una schermata non si può aprire perché senza
   un profilo il benvenuto è montato al posto di tutto.

   **Le guide restano un registro solo** (`contenuti.js`): qui non c'è
   nessun testo, arriva tutto da fuori. Quello che stava per diventare
   due erano l'impaginazione e il CSS della riga, copiati nei due
   componenti — e due copie della stessa riga sono due righe che un
   giorno si guardano diverse senza che nessuno l'abbia deciso.

   Chi mostra un sottoinsieme lo sceglie prima di passarlo: il velo dà
   le `subito`, la schermata le dà tutte.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  guide: { type: Array, default: () => [] },
  /* il velo e la schermata marcano le voci con due attributi diversi:
     due test devono poter dire quale dei due stanno guardando */
  marca: { type: String, default: 'guida' },
})
defineEmits(['apri'])
</script>

<template>
  <button v-for="g in guide" :key="g.id" class="voce"
          :data-guida="marca === 'guida' ? g.id : null"
          :data-guida-velo="marca === 'velo' ? g.id : null"
          @click="$emit('apri', g)">
    <span class="ico">{{ g.emoji }}</span>
    <span class="dentro"><b>{{ g.titolo }}</b><i>{{ g.sommario }}</i></span>
    <span class="freccia">›</span>
  </button>
</template>

<style scoped>
.voce { display:flex; align-items:center; gap:11px; text-align:left; width:100%;
        padding:12px 13px; border-radius:16px; background:var(--carta);
        box-shadow:0 3px 10px #8593a824 }
.voce:active { transform:translateY(1px) }
.voce .ico { font-size:25px; flex:none }
.voce .dentro { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px }
.voce b { font-size:15.5px; color:var(--viola-scuro) }
.voce i { font-size:12.5px; color:var(--tenue); font-style:normal; line-height:1.35 }
.voce .freccia { font-size:22px; color:#c3cbd8; flex:none }
</style>
