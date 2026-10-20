<script setup>
// Una merce nella bacheca degli ordini: per ora l'emoji dei dati dentro un cerchio; stessa API di Faccia.vue (`k` la chiave, `emoji`,
// `n` la quantità chiesta, il numerino in alto a destra), così si sostituisce con una riga. La misura viene da fuori (`--mb`).
defineProps({
  k: { type: String, default: '' },
  emoji: { type: String, default: '' },
  n: { type: Number, default: 0 },
})
</script>

<template>
  <span class="f3-mb" :data-merce="k">
    <span class="e" aria-hidden="true">{{ emoji }}</span>
    <b v-if="n > 0" class="x">×{{ n }}</b>
  </span>
</template>

<style>
.f3-mb { position: relative; display: inline-grid; place-items: center; width: var(--mb, 52px); height: var(--mb, 52px); border-radius: 50%; background: #fff; box-shadow: 0 2px 0 rgba(0,0,0,.18), inset 0 0 0 3px #e9d9b4; }
.f3-mb .e { font-size: calc(var(--mb, 52px) * .6); line-height: 1; }
.f3-mb .x { position: absolute; right: -8px; top: -5px; min-width: 24px; height: 22px; padding: 0 5px; box-sizing: border-box; border-radius: 11px; background: #3a2a1a; color: #fff; font: 800 12px/22px "Emoji Gioco", system-ui, sans-serif; text-align: center; }
</style>
