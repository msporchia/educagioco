<script setup>
// Il menu della maestra sul PC del bambino, dietro il suo codice: le domande al posto del gioco, il blocco dopo, un altro
// nome, uscire. Un foglio che si chiude con la ✕ in alto a destra. docs/scuola/ripieghi.md
import { ref } from 'vue'
import CodiceMaestra from './CodiceMaestra.vue'

const props = defineProps({
  locale: { type: Boolean, default: false },        // senza lezione: niente nome da cambiare
  conGioco: { type: Boolean, default: false },      // il blocco ha un gioco che si può lasciare per le domande
  domande: { type: Boolean, default: false },       // le domande al posto del gioco, su questo PC
  nelBlocco: { type: Boolean, default: false },     // c'è un blocco da saltare
  conNome: { type: Boolean, default: false },
  avviso: { type: String, default: '' },
})
const emit = defineEmits(['chiudi', 'domande', 'salta', 'nome', 'esci'])
const aperto = ref(false)
</script>

<template>
  <div class="velo" data-menu-maestra @click.self="emit('chiudi')">
    <div class="maestra foglio">
      <button class="x" aria-label="chiudi" data-azione="chiudi-menu" @click="emit('chiudi')">✕</button>
      <CodiceMaestra v-if="!aperto" @giusto="aperto = true" @annulla="emit('chiudi')" />
      <template v-else>
        <h2>Per la maestra</h2>
        <div class="voci">
          <button v-if="props.conGioco || props.domande" class="bottone" data-azione="domande" @click="emit('domande')">
            {{ props.domande ? 'Torna al gioco' : 'Le domande invece del gioco' }}</button>
          <button v-if="props.nelBlocco" class="bottone" data-azione="salta" @click="emit('salta')">Salta al blocco dopo</button>
          <button v-if="props.conNome" class="bottone chiaro" data-azione="cambia-nome" @click="emit('nome')">Cambia nome</button>
          <button class="bottone chiaro" data-azione="esci" @click="emit('esci')">{{ props.locale ? 'Torna all\'inizio' : 'Esci dalla lezione' }}</button>
        </div>
        <p v-if="props.avviso" class="avviso" data-menu-avviso>{{ props.avviso }}</p>
        <p class="nota">Le domande e il blocco dopo valgono solo per questo computer.
          <template v-if="!props.locale"> «Esci» libera il nome: il bambino lo ritrova su un altro computer.</template></p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.velo { position:fixed; inset:0; z-index:80; display:flex; align-items:center; justify-content:center; padding:16px;
        background:rgba(20, 24, 40, .45) }
.foglio { position:relative; width:100%; max-width:440px; max-height:100%; overflow-y:auto; padding:28px 20px 20px;
          background:var(--superficie); border-radius:var(--raggio); box-shadow:var(--ombra);
          display:flex; flex-direction:column; gap:14px; text-align:center }
.x { position:absolute; top:8px; right:8px; width:36px; height:36px; border:0; background:none; font-size:20px; cursor:pointer;
     color:var(--inchiostro) }
.voci { display:flex; flex-direction:column; gap:10px }
.voci .bottone { font-size:17px; padding:12px 18px }
</style>
