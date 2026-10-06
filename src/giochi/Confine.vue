<script setup>
// La striscia fra il campo e il programma: ▲ alza il confine (più
// programma), ▼ lo abbassa (più campo). Vedi docs/core/interfaccia.md.
import { posto, sposta, grandeServe } from './confine.js'
</script>

<template>
  <div class="cf-striscia" data-confine :data-posto="posto">
    <button type="button" class="cf-tasto" data-azione="piu-programma" aria-label="più spazio al programma"
            :disabled="posto === -1" @click="sposta(-1)">▲</button>
    <span class="cf-righe" aria-hidden="true"><i></i><i></i><i></i></span>
    <button type="button" class="cf-tasto" data-azione="piu-campo" aria-label="più spazio al campo"
            :disabled="posto === 1 || (posto === 0 && !grandeServe)" @click="sposta(1)">▼</button>
  </div>
</template>

<style scoped>
.cf-striscia {
  flex: none; display: flex; align-items: center; justify-content: center; gap: 10px;
  height: 30px; border-top: 1.5px solid #cfd5e2; background: #f3f5f9;
  -webkit-user-select: none; user-select: none;
}
.cf-tasto {
  width: 56px; height: 26px; border-radius: 9px; border: 1.5px solid #cfd5e2; background: #fff;
  font-size: 13px; line-height: 1; color: #4a5468; padding: 0;
}
.cf-tasto:disabled { opacity: .35 }
.cf-righe { display: flex; flex-direction: column; gap: 3px }
.cf-righe i { display: block; width: 26px; height: 2px; border-radius: 1px; background: #c3cad8 }
</style>
