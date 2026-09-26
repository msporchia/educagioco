<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CASTELLO A SPRITE — il coordinatore

   Si gioca: è il tower defense vero (`views/TowerDefense.vue`, chiave
   `torri`) con **un'altra pelle** — il campo disegnato a celle con le
   immagini generate, strade a squadra, torri e mostri come figure. Le
   tappe, i conti, le ondate e il salvataggio sono quelli di `torri`:
   chi vince una tappa qui l'ha vinta anche là, ed è voluto, perché
   questo è il gioco che prenderà il posto di quello.

   La pelle sta in `scena/pelle.js` e dice cosa cambia; il resto — il
   motore, il foglio dei conti, la mappa delle tappe — non sa che esiste.

   Cosa manca, e dove sta scritto:
     · undici mostri su diciotto fanno le veci di un altro
       (`FIGURA_DI` in `scena/pittori.js`);
     · tre scene per quattro campagne: le grotte, le mura e la palude
       prendono in prestito un vestito (`VESTITO_DI` in `scena/vestito.js`);
     · la radura grande non sta ancora sulla scacchiera
       (`DA_RIDISEGNARE` in `motore/carta.js`), e si gioca coi suoi guasti;
     · le torri vengono da un foglio di provenienza non documentata
       (`dati/figure.js`): va rifatto prima di pubblicare altrove;
     · le tappe sono tarate sulla strada smussata, e quella a squadra è
       più lunga (vedi `scena/pelle.js`).

   Il visore di prima — il campo a tessere del foglio `terreni.png` —
   non è più montato: `scena/campo.js`, `scena/tela.js` e
   `dati/atlante.js` restano per i loro test e per il banco degli sprite
   (`npm run mondo`), e fuori dal file unico perché nessuno li importa.
   TODO: toglierli quando arriva il foglio del terreno.
   ═══════════════════════════════════════════════════════════════════ */
import { markRaw } from 'vue'
import TowerDefense from '../../views/TowerDefense.vue'
import { PELLE } from './scena/pelle.js'

defineOptions({ name: 'CastelloSprite' })
const emit = defineEmits(['vai'])

/* la pelle è una tabella di funzioni e di pittori: niente da osservare */
const pelle = markRaw(PELLE)
</script>

<template>
  <TowerDefense :pelle="pelle" titolo="Castello a sprite" guida="castello"
                @vai="(...a) => emit('vai', ...a)" />
</template>
