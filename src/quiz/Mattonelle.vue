<script setup>
// Una mattonella per materia: quanto è saputo e la freccia su due settimane (vedi docs/genitori/come-va.md). Toccata, si entra.
defineProps({
  viste: { type: Array, default: () => [] },     // mattonelle di quiz/comeva.js con almeno una cosa vista
  nonAncora: { type: Array, default: () => [] }, // quelle mai giocate: un nome in riga, non una barra a zero
})
defineEmits(['apri'])

const FRECCIA = { su: '▲', giu: '▼', pari: '=' }
const scarto = m => {
  if (!m.freccia) return ''
  const d = m.pct - m.prima
  return m.freccia === 'pari' ? 'come prima' : `${d > 0 ? '+' : '−'}${Math.abs(d)}`
}
</script>

<template>
  <div class="mattonelle" data-mattonelle>
    <p v-if="!viste.length" class="vuoto">
      Non ha ancora giocato a niente che si possa misurare: le materie compaiono qui
      appena comincia.
    </p>

    <div v-else class="griglia">
      <button v-for="m in viste" :key="m.id" type="button" class="mattonella"
              :data-mattonella="m.id" @click="$emit('apri', m.id)">
        <span class="testa"><i>{{ m.emoji }}</i><b>{{ m.nome }}</b></span>
        <span class="numero">
          <b data-pct>{{ m.pct }}%</b>
          <em v-if="m.freccia" class="freccia" :class="m.freccia" :data-freccia="m.freccia"
              :title="`due settimane fa: ${m.prima}%`">{{ FRECCIA[m.freccia] }} {{ scarto(m) }}</em>
        </span>
        <span class="livello"><i :style="{ width: Math.max(2, m.pct) + '%' }"></i></span>
        <span class="sotto">{{ m.mappa ? 'la tavola ›' : 'guarda dentro ›' }}</span>
      </button>
    </div>

    <p v-if="nonAncora.length" class="mai" data-mattonelle-mai>
      Non ancora: {{ nonAncora.map(m => m.nome).join(', ') }}.
    </p>
  </div>
</template>

<style scoped>
.mattonelle { display: grid; gap: 7px; text-align: left }
.griglia { display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 7px }
.mattonella {
  display: grid; gap: 4px; padding: 10px 10px 8px; border: 0; border-radius: 14px;
  background: #f5f3fc; color: #23233a; font: inherit; text-align: left; cursor: pointer;
  -webkit-tap-highlight-color: transparent; min-width: 0;
}
.mattonella:active { transform: scale(.98); background: #ece7fb }
.testa { display: flex; align-items: center; gap: 6px; min-width: 0 }
.testa i { font-style: normal; font-size: 16px }
.testa b { font-size: 12px; font-weight: 750; line-height: 1.2;
           overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.numero { display: flex; align-items: baseline; justify-content: space-between; gap: 4px }
.numero b { font-size: 22px; font-weight: 850; color: #5b3fa8 }
.freccia { font-style: normal; font-size: 11px; font-weight: 800; padding: 2px 6px;
           border-radius: 8px; white-space: nowrap }
.freccia.su { background: #dff5e7; color: #1f7a45 }
.freccia.giu { background: #ffe2dc; color: #9a3a26 }
.freccia.pari { background: #ecebf2; color: #7a7a8a }
.livello { display: block; padding: 0; height: 7px; border-radius: 4px; background: #e4def5; overflow: hidden }
.livello i { display: block; height: 100%; border-radius: 4px; background: #7c5cd6 }
.sotto { font-size: 10.5px; color: #8a8a99 }
.vuoto, .mai { margin: 0; font-size: 11.5px; line-height: 1.45; color: #8a8a99 }
</style>
