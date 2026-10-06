<script setup>
// una figura di viste/pixel.js, a pixel netti
defineProps({
  figura: { type: Object, required: true },
  scala: { type: Number, default: 3 },
})
</script>

<template>
  <svg :width="figura.w * scala" :height="figura.h * scala" :viewBox="`0 0 ${figura.w} ${figura.h}`"
       shape-rendering="crispEdges" aria-hidden="true">
    <rect v-for="(r, i) in figura.rect" :key="i" :x="r.x" :y="r.y" :width="r.w" height="1" :fill="r.c" />
  </svg>
</template>
