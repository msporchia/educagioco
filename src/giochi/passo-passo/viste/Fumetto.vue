<script setup>
/* Il fumetto della mappa: sopra la cosa toccata (sotto, se sopra non c'è
   posto), con la coda che la indica. Una casella aperta dice scalino, nome,
   racconto, stelle e «gioca» (o «continua»); una chiusa, un ponte col blocco
   e la tana dello zaino chiusa dicono cosa manca, senza tasto. La usano le
   due mappe; chi lo usa ne misura il `$el` per farlo vedere tutto.
   Vedi docs/passo-passo/mappa.md, «Il fumetto». */
defineProps({
  n: { type: Object, required: true },        // { id, tipo: casella | sentiero | blocco | zaino, nome, racconto, stato, serve, … }
  posto: { type: Object, required: true },    // { x, y, largo, sotto, coda } in pixel della mappa
  senzaFine: { type: Object, required: true },
})
defineEmits(['gioca'])

const STELLA = 'M12 2.6l2.85 5.95 6.55.85-4.8 4.55 1.2 6.5L12 17.3l-5.8 3.15 1.2-6.5-4.8-4.55 6.55-.85z'
const intestazione = n => (n.tipo === 'sentiero' ? 'In fondo alla strada'
  : n.tipo === 'blocco' ? 'Il ponte è chiuso'
  : n.tipo === 'zaino' ? 'La tana dello zaino'
  : `${n.scalino.icona} ${n.scalino.nome}${n.animale === 'cane' ? ' · col cane' : ''}`)
const perChi = n => (n.tipo === 'casella' ? n.id : n.tipo === 'sentiero' ? 'senza-fine' : n.id)
</script>

<template>
  <div class="pp-fumetto" :class="{ 'pp-sotto': posto.sotto }" data-fumetto :data-fumetto-per="perChi(n)"
       :style="{ left: posto.x + 'px', top: posto.y + 'px', width: posto.largo + 'px', '--coda': posto.coda + 'px' }"
       @click.stop>
    <small>{{ intestazione(n) }}</small>
    <b>{{ n.nome }}</b>
    <span v-if="n.racconto" class="pp-fumetto-racconto">{{ n.racconto }}</span>
    <template v-if="n.stato === 'chiusa'">
      <span class="pp-fumetto-serve" data-serve><span class="pp-em">🔒</span> {{ n.serve }}</span>
    </template>
    <template v-else>
      <span v-if="n.tipo !== 'sentiero'" class="pp-fumetto-stelle" :aria-label="`${n.stelle} stelle su 4`">
        <svg v-for="s in 4" :key="s" viewBox="0 0 24 24" :class="{ 'pp-presa': s <= n.stelle }"><path :d="STELLA" /></svg>
      </span>
      <span v-else class="pp-fumetto-record">{{ senzaFine.record ? 'record: ' + senzaFine.record : 'Ancora nessun record' }}</span>
      <button type="button" class="pp-fumetto-gioca" data-azione="parti" @click="$emit('gioca', n)">
        <svg class="pp-triangolo" viewBox="0 0 10 12" aria-hidden="true"><path d="M1.5 1.2l7.5 4.8-7.5 4.8z" /></svg>
        {{ n.aMeta ? 'continua' : 'gioca' }}
      </button>
    </template>
  </div>
</template>
