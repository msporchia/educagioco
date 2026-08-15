<script setup>
/* ═══════════════════════════════════════════════════════════════════
   I TRE TASTI PER DIRE COM'ERA — il giudizio su una domanda.

   Compaiono solo se i giudizi sono accesi (schermata dei grandi), e
   quando sono spenti questo componente non mette a schermo niente: chi
   lo usa lo piazza e basta, senza chiedersi nulla.

     <Giudizio :voce="() => ({ gioco: 'dungeon', modulo, grado, … })" />

   PERCHÉ LA VOCE PUÒ ESSERE UNA FUNZIONE. Le due cose più utili da
   sapere di una domanda — quanto ci ha messo, se l'ha presa — cambiano
   mentre la domanda è a schermo. Un oggetto passato al montaggio le
   fotograferebbe tutte a zero: chi tocca 😰 dopo venti secondi di
   silenzio manderebbe «0s, aperta», che è precisamente l'informazione
   che serviva. Quindi i dati si **chiedono al tocco**.

   Stanno di fianco al titolo e non sotto le risposte, e non è una
   questione di gusto: sotto sarebbero a un centimetro dal dito di un
   bambino che risponde di fretta, e il quaderno si riempirebbe di
   giudizi che nessuno ha dato. Piccoli, in grigio, lontani dai tasti
   grossi che si toccano davvero.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'
import { giudiziAccesi, VERDETTI, annota } from '../store/giudizi.js'
import { nomeCorrente } from '../store/profile.js'

const props = defineProps({
  /* i dati di quello che si sta giudicando, o una funzione che li dà */
  voce: { type: [Object, Function], default: () => ({}) },
})

/* L'id di **questa comparsa a schermo**, non della domanda: due volte
   la stessa domanda in due partite sono due giudizi, ma due tocchi
   sulla stessa domanda sono un ripensamento e non due. */
let contatore = 0
const id = `g${Date.now().toString(36)}-${contatore++}`

const dato = ref('')

function segna(v) {
  if (dato.value === v.id) return
  dato.value = v.id
  const base = typeof props.voce === 'function' ? props.voce() : props.voce
  annota({ id, verdetto: v.id, chi: nomeCorrente() || '', ...base })
}
</script>

<template>
  <div v-if="giudiziAccesi" class="giudizio" data-che="giudizio">
    <button v-for="v in VERDETTI" :key="v.id" type="button"
            class="gd-tasto" :class="{ dato: dato === v.id }"
            :data-verdetto="v.id" :aria-label="v.che" :title="v.che"
            @click.stop="segna(v)">{{ v.ico }}</button>
  </div>
</template>

<style scoped>
.giudizio { display: flex; gap: 4px; align-items: center; }
.gd-tasto {
  width: 26px; height: 26px; padding: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  border-radius: 9px; border: 1px solid rgba(255, 255, 255, .14);
  background: rgba(255, 255, 255, .06);
  font-size: 13px; line-height: 1;
  /* spenti sono quasi invisibili: chi li cerca li trova, chi gioca no */
  opacity: .45; filter: grayscale(1);
  transition: opacity .12s ease, filter .12s ease, transform .1s ease;
}
.gd-tasto:active { transform: scale(.9); }
.gd-tasto.dato {
  opacity: 1; filter: none;
  background: rgba(255, 213, 138, .22); border-color: #ffd58a;
}
</style>
