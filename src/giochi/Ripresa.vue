<script setup>
// La partita lasciata a metà, in cima alla mappa di un gioco: dove si era e
// due tasti. E l'avviso prima di cominciarne un'altra, detto prima e mai
// dopo. Una per tutti i giochi: vedi docs/core/ripresa.md.
import { riprendiSeChiesta } from './ripresa.js'

const props = defineProps({
  ripresa: { type: Object, default: null },   // { emoji, nome, dettaglio }
  chiede: { type: String, default: '' },      // il nome di quella che si sta per cominciare
})
const emit = defineEmits(['riprendi', 'scorda', 'comincia', 'annulla'])
riprendiSeChiesta(() => props.ripresa, () => emit('riprendi'))
</script>

<template>
  <div v-if="ripresa" class="ri-carta" data-ripresa>
    <p class="ri-dove">
      <span class="ri-faccia em">{{ ripresa.emoji }}</span>
      <b>{{ ripresa.nome }}</b>
      <i class="em">{{ ripresa.dettaglio }}</i>
    </p>
    <button class="bottone" data-azione="riprendi" @click="$emit('riprendi')">
      <span class="em">▶</span> torno da dove ero
    </button>
    <button class="bottone chiaro ri-piccolo" data-azione="scorda" @click="$emit('scorda')">
      lascio perdere quella partita
    </button>
  </div>

  <div v-if="ripresa && chiede" class="ri-velo" data-chiede @click.self="$emit('annulla')">
    <div class="ri-modale">
      <h2><span class="em">⚠️</span> Hai una partita a metà</h2>
      <p>Se cominci <b>{{ chiede }}</b> perdi quella che avevi lasciato.</p>
      <button class="bottone" data-azione="riprendi-invece" @click="$emit('riprendi')">
        no, torno a quella di prima
      </button>
      <button class="bottone chiaro ri-piccolo" data-azione="comincia" @click="$emit('comincia')">
        va bene, comincio {{ chiede }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ri-carta { width:100%; max-width:420px; display:flex; flex-direction:column; gap:8px;
            background:linear-gradient(180deg, #fff8e2, var(--carta));
            border:2px solid #ffd257; border-radius:16px; padding:12px; margin:4px 0 6px }
.ri-dove { display:grid; grid-template-columns:auto 1fr; gap:0 10px; margin:0 }
.ri-dove .ri-faccia { font-size:30px; grid-row:span 2; align-self:center }
.ri-dove b { font-size:17px; align-self:end; color:var(--viola-scuro) }
.ri-dove i { font-style:normal; font-size:12.5px; color:var(--tenue) }
.ri-carta .bottone, .ri-modale .bottone { width:100%; padding:12px 18px; font-size:17px }
.ri-piccolo { font-size:14px !important; padding:9px 14px !important }
/* z-index 40: sopra la mappa, sotto la pausa (130) — docs/core/z-index-dal-codice.md */
.ri-velo { position:fixed; inset:0; z-index:40; display:flex; align-items:center;
           justify-content:center; padding:18px; background:#131a2acc }
.ri-modale { width:100%; max-width:340px; background:#fff; border-radius:22px; padding:16px;
             display:flex; flex-direction:column; gap:9px; box-shadow:0 10px 30px rgba(0,0,0,.35) }
.ri-modale h2 { font-size:19px; margin:0; color:var(--viola-scuro) }
.ri-modale p { margin:0 0 4px; font-size:15px }
.em { font-style:normal }
</style>
