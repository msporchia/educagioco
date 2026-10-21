<script setup>
// La mossa che il mostro farà al suo turno (docs/sotterraneo/mosse.md): un tondo col suo segno disegnato (spada rossa l'attacco, due
// spade arancioni il colpo forte, croce verde la cura, stella viola l'incantesimo, onde gialle l'urlo) e il suo nome sotto. Si vede
// solo per chi ha più di una mossa: il comune ha l'attacco e basta. Le stesse forme delle animazioni 3D (poc/mostri-3d/mosse-anim.js).
defineProps({ mossa: { type: Object, required: true } })   // vistaDella(mossa) di dati/mosse.js
</script>

<template>
  <span class="sot-mossa" :style="{ '--tinta': mossa.colore }" :data-mossa="mossa.tipo" :data-mossa-id="mossa.id" :data-icona="mossa.icona" :title="mossa.nome">
    <svg class="sot-mossa-tondo" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="10.6" fill="#12141ad9" stroke="currentColor" stroke-width="1.6" />
      <g v-if="mossa.icona === 'spada' || mossa.icona === 'spade'" fill="currentColor">
        <path transform="rotate(40 12 12)" d="M12 3.8 13.3 6v8.2h-2.6V6Z M8.6 14.2h6.8v1.3H8.6Z M11.3 15.5h1.4v3h-1.4Z" />
        <path v-if="mossa.icona === 'spade'" transform="rotate(-40 12 12)" d="M12 3.8 13.3 6v8.2h-2.6V6Z M8.6 14.2h6.8v1.3H8.6Z M11.3 15.5h1.4v3h-1.4Z" />
      </g>
      <path v-else-if="mossa.icona === 'croce'" fill="currentColor" d="M10 5.5h4v4.5h4.5v4H14v4.5h-4V14H5.5v-4H10Z" />
      <path v-else-if="mossa.icona === 'stella'" fill="currentColor" d="M12 4.2 13.9 9.4 19.4 9.5 15 12.9 16.6 18.2 12 15.1 7.4 18.2 9 12.9 4.6 9.5 10.1 9.4Z" />
      <g v-else fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
        <circle cx="7" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <path d="M10 8.8a4.5 4.5 0 0 1 0 6.4 M12.6 6.6a7.6 7.6 0 0 1 0 10.8 M15.2 4.6a10.5 10.5 0 0 1 0 14.8" />
      </g>
    </svg>
    <b class="sot-mossa-nome">{{ mossa.nome }}</b>
  </span>
</template>
