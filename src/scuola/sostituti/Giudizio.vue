<script setup>
// A scuola i tre tasti dei giudizi non ci sono: stessa interfaccia di components/Giudizio.vue, niente da mostrare.
defineProps({ voce: { type: [Object, Function], default: () => ({}) } })
</script>

<template><span v-if="false" /></template>
