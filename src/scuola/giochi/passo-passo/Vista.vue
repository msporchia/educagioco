<script setup>
// Da riempire (docs/scuola/giochi.md): finché c'è questa, il gioco «non parte» e si torna alle schede
import { onMounted } from 'vue'
defineProps({ esercizio: { type: Object, required: true }, alunno: { type: Object, required: true } })
const emit = defineEmits(['risposta', 'guasto'])
onMounted(() => emit('guasto'))
</script>

<template><div /></template>
