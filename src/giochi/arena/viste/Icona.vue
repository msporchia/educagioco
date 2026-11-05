<script setup>
// Le icone dei comandi: una famiglia sola, stessa cornice da 40, stesso tratto scuro, due toni per figura, così accanto stanno bene
// (docs/arena/grafica.md). Se c'è il foglio dipinto (`dati/icone-dipinte.js`, voce 11 di DA-GENERARE.md) si usa quello.
import { computed } from 'vue'
import { ICONE, ATLANTE } from '../dati/icone-dipinte.js'

const props = defineProps({ nome: { type: String, required: true } })
const dipinta = computed(() => {
  const p = ICONE[props.nome]
  if (!p) return null
  const [colonna, riga, colonne, righe] = p
  return { backgroundImage: `url(${ATLANTE})`, backgroundSize: `${colonne * 100}% ${righe * 100}%`,
           backgroundPosition: `${colonna / Math.max(1, colonne - 1) * 100}% ${riga / Math.max(1, righe - 1) * 100}%` }
})
</script>

<template>
  <span v-if="dipinta" class="ar-ic" :style="dipinta" aria-hidden="true"></span>
  <svg v-else class="ar-ic" viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="#2b1c10" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <template v-if="nome === 'potenzia'">
      <path d="M20 4 34 18H26V24H14V18H6Z" fill="#6fd46a"/>
      <path d="M14 29H26V36H14Z" fill="#2fa84a"/>
    </template>
    <template v-else-if="nome === 'vendi'">
      <path d="M15 11 11 4H29L25 11Z" fill="#c9923a"/>
      <path d="M15 11H25C33 16 36 24 34 30 33 34 29 36 20 36S7 34 6 30C4 24 7 16 15 11Z" fill="#f0c04a"/>
      <circle cx="20" cy="24" r="6.5" fill="#fff0b8"/>
    </template>
    <template v-else-if="nome === 'conferma'">
      <path d="M5 21 11 15 17 21 30 7 36 13 17 33Z" fill="#6fd46a"/>
    </template>
    <template v-else-if="nome === 'numeri'">
      <path d="M8 6H32V30L26 36H8Z" fill="#f3dfae"/>
      <path d="M26 36V30H32Z" fill="#c9923a"/>
      <path d="M14 14H26M14 21H26M14 28H21" stroke-width="3"/>
    </template>
    <template v-else-if="nome === 'ripara'">
      <path d="M34 9 27 16 23 12 30 5C24 3 17 7 18 15L5 28C3 31 8 36 11 34L24 21C32 23 37 16 34 9Z" fill="#c8d4e4"/>
      <circle cx="9.5" cy="29.5" r="1.8" fill="#2b1c10" stroke="none"/>
    </template>
    <template v-else-if="nome === 'bomba'">
      <circle cx="18" cy="24" r="13" fill="#4a4556"/>
      <path d="M11 20C12 17 14 15 17 15" stroke="#c8d4e4" stroke-width="2.4"/>
      <path d="M26 14 30 9" stroke-width="3.4"/>
      <path d="M32 2 34 6 38 7 34 9 32 13 30 9 26 7 30 6Z" fill="#ffc04a"/>
    </template>
    <template v-else-if="nome === 'miniera'">
      <path d="M21 16 26 21 11 36 5 35 5 31Z" fill="#b07a42"/>
      <path d="M6 13C14 3 28 2 37 11 33 8 30 8 28 9L31 12 28 15 25 12C20 10 12 10 6 13Z" fill="#c8d4e4"/>
    </template>
    <template v-else-if="nome === 'riposo'">
      <path d="M32 26C22 28 13 19 16 7 7 10 3 20 8 28 13 36 27 37 32 26Z" fill="#f0c04a"/>
      <path d="M23 8H32L23 18H32" stroke-width="3"/>
    </template>
    <template v-else-if="nome === 'orologio'">
      <path d="M9 4H31V9C31 15 24 17 24 20S31 25 31 31V36H9V31C9 25 16 23 16 20S9 15 9 9Z" fill="#fff0b8"/>
      <path d="M13 34C13 29 18 27 20 25 22 27 27 29 27 34Z" fill="#f0c04a" stroke="none"/>
      <path d="M6 4H34M6 36H34" stroke-width="3.4"/>
    </template>
    <template v-else-if="nome === 'infinita'">
      <path d="M20 20C16 13 12 11 9 11 5 11 2 15 2 20S5 29 9 29C12 29 16 27 20 20 24 13 28 11 31 11 35 11 38 15 38 20S35 29 31 29C28 29 24 27 20 20Z" stroke-width="8"/>
      <path d="M20 20C16 13 12 11 9 11 5 11 2 15 2 20S5 29 9 29C12 29 16 27 20 20 24 13 28 11 31 11 35 11 38 15 38 20S35 29 31 29C28 29 24 27 20 20Z" stroke="#f0c04a" stroke-width="3.6"/>
    </template>
    <template v-else>
      <path d="M11 6H29L37 16 20 36 3 16Z" fill="#7fd8ff"/>
      <path d="M3 16H37M11 6 14 16 20 36 26 16 29 6M14 16 20 6 26 16" stroke-width="1.6"/>
    </template>
  </svg>
</template>
