<script setup>
// Le cinque aree di «Come va», da aprire: dall'area si scende alle materie (va meglio / va peggio), e da una materia alle sue domande
// (docs/genitori/come-va.md). Sostituisce le mattonelle in fila: dodici materie tutte insieme non dicono dove guardare.
defineProps({
  aree: { type: Array, default: () => [] },       // areeDi di quiz/comeva.js
  aperta: { type: String, default: null },        // l'area aperta
})
const emit = defineEmits(['area', 'apri'])

const FRECCIA = { su: '▲', giu: '▼', pari: '=' }
const scarto = x => {
  if (!x.freccia) return ''
  const d = x.pct - x.prima
  return x.freccia === 'pari' ? 'come prima' : `${d > 0 ? '+' : '−'}${Math.abs(d)}`
}
const nelleMaterie = a => a.materie.length + a.nonAncora.length
</script>

<template>
  <div class="aree" data-mattonelle data-aree>
    <section v-for="a in aree" :key="a.id" class="area" :class="{ aperta: aperta === a.id, vuota: a.pct == null }" :data-area="a.id">
      <button type="button" class="capo" :data-area-capo="a.id" :aria-expanded="aperta === a.id"
              :disabled="!nelleMaterie(a)" @click="emit('area', aperta === a.id ? null : a.id)">
        <span class="ico" aria-hidden="true">{{ a.emoji }}</span>
        <span class="testo">
          <b>{{ a.nome }}</b>
          <span v-if="a.pct == null" class="mai">non ancora giocata</span>
          <span v-else class="barra"><i :style="{ width: Math.max(2, a.pct) + '%' }"></i></span>
        </span>
        <span v-if="a.pct != null" class="num">
          <b data-area-pct>{{ a.pct }}%</b>
          <em v-if="a.freccia" class="freccia" :class="a.freccia" :data-area-freccia="a.freccia">{{ FRECCIA[a.freccia] }} {{ scarto(a) }}</em>
        </span>
        <span class="chev" aria-hidden="true">{{ aperta === a.id ? '▾' : '▸' }}</span>
      </button>

      <ul v-if="aperta === a.id" class="materie">
        <li v-for="m in a.materie" :key="m.id">
          <button type="button" class="materia" :data-mattonella="m.id" @click="emit('apri', m.id)">
            <span class="ico" aria-hidden="true">{{ m.emoji }}</span>
            <span class="testo">
              <b>{{ m.nome }}</b>
              <span class="barra"><i :style="{ width: Math.max(2, m.pct) + '%' }"></i></span>
            </span>
            <span class="num">
              <b data-pct>{{ m.pct }}%</b>
              <em v-if="m.freccia" class="freccia" :class="m.freccia" :data-freccia="m.freccia" :title="`due settimane fa: ${m.prima}%`">{{ FRECCIA[m.freccia] }} {{ scarto(m) }}</em>
            </span>
            <span class="etichetta">
              <em v-if="m.meglio" class="meglio" data-va-meglio>va meglio</em>
              <em v-if="m.peggio" class="peggio" data-va-peggio>va peggio</em>
              <span v-if="!m.meglio && !m.peggio" class="dentro">guarda dentro ›</span>
            </span>
          </button>
        </li>
        <li v-if="a.nonAncora.length" class="non-ancora" data-mattonelle-mai>Non ancora: {{ a.nonAncora.map(m => m.nome).join(', ') }}.</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.aree { display: grid; gap: 7px; text-align: left }
.area { border-radius: 14px; background: #f5f3fc; overflow: hidden }
.area.vuota { opacity: .65 }
.capo, .materia { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 12px; border: 0; background: none; font: inherit; color: #23233a; text-align: left; cursor: pointer; min-height: 52px; -webkit-tap-highlight-color: transparent }
.capo:disabled { cursor: default }
.capo:active:not(:disabled), .materia:active { background: #ece7fb }
.ico { font-size: 20px; flex: none }
.testo { flex: 1; min-width: 0; display: grid; gap: 4px }
.testo b { font-size: 14px; font-weight: 800 }
.mai { font-size: 11.5px; color: #8a8a99 }
.barra { display: block; height: 7px; border-radius: 4px; background: #e4def5; overflow: hidden }
.barra i { display: block; height: 100%; border-radius: 4px; background: #7c5cd6 }
.num { flex: none; display: grid; justify-items: end; gap: 2px }
.num b { font-size: 18px; font-weight: 850; color: #5b3fa8 }
.freccia { font-style: normal; font-size: 10.5px; font-weight: 800; padding: 1px 6px; border-radius: 8px; white-space: nowrap }
.freccia.su { background: #dff5e7; color: #1f7a45 }
.freccia.giu { background: #ffe2dc; color: #9a3a26 }
.freccia.pari { background: #ecebf2; color: #7a7a8a }
.chev { color: #9a8fc0; flex: none }
.materie { list-style: none; margin: 0; padding: 0 6px 8px; display: grid; gap: 4px }
.materia { background: #fff; border-radius: 11px; padding: 9px 10px }
.materia .ico { font-size: 17px }
.materia .testo b { font-size: 13px }
.etichetta { flex: none; min-width: 76px; text-align: right; font-size: 10.5px }
.etichetta .dentro { color: #8a8a99 }
.meglio, .peggio { font-style: normal; font-weight: 800; padding: 2px 7px; border-radius: 8px; white-space: nowrap }
.meglio { background: #dff5e7; color: #1f7a45 }
.peggio { background: #fff0d6; color: #8a5a0a }
.non-ancora { padding: 2px 6px 0; font-size: 11.5px; color: #8a8a99 }
</style>
