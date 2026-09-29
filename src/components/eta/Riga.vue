<script setup>
// una riga del quadro, unica per gioco/pezzo di scuola/domanda (vedi docs/genitori/quadro.md). `dentro` sposta a destra una domanda annidata nel suo pezzo di scuola. Due tasti soli: ▶ prova, ✎ apre la tacca (Taratura.vue) col contenuto nello slot.
defineProps({
  ico: { type: String, default: '' },
  nome: { type: String, required: true },
  sotto: { type: String, default: '' },
  stato: { type: Object, default: null }, // etichetta a destra: { testo, cls } — «c'è», «arriva più avanti»
  prova: { type: Boolean, default: false },
  tara: { type: Boolean, default: false },
  tarando: { type: Boolean, default: false }, // tacca aperta: la matita resta premuta
  ritoccata: { type: Boolean, default: false }, // messa a mano da un grande: resta ambra anche a tacca chiusa
  dentro: { type: Boolean, default: false },
  ultima: { type: Boolean, default: false }, // ultima di una fila rientrata: chiude la guida verticale
  apribile: { type: Boolean, default: false },
  aperto: { type: Boolean, default: false },
  chiave: { type: String, default: '' },
})
defineEmits(['prova', 'apri', 'tara'])
</script>

<template>
  <li class="voce-cassetto" :data-riga="chiave">
    <!-- .stop: la riga vive dentro un blocco che si chiude al tocco -->
    <div class="voce-riga" :class="[stato?.cls, { dentro, apribile, aperta: aperto, ultima,
                                                  ritoccata }]"
         :role="apribile ? 'button' : null" :tabindex="apribile ? 0 : null"
         @click.stop="apribile && $emit('apri')" @keydown.enter.stop="apribile && $emit('apri')">
      <span v-if="ico" class="ico">{{ ico }}</span>
      <span class="testo"><b>{{ nome }}</b><i v-if="sotto">{{ sotto }}</i></span>
      <em v-if="stato" :class="stato.cls">{{ stato.testo }}</em>
      <span v-if="apribile" class="apri">{{ aperto ? '▴' : '▾' }}</span>
      <button v-if="tara" type="button" class="tondo matita" :class="{ giu: tarando }"
              :data-tara-apri="chiave" :aria-label="'cambia la difficoltà di ' + nome"
              @click.stop="$emit('tara')">✎</button>
      <button v-if="prova" type="button" class="tondo prova" :data-prova="chiave"
              :aria-label="'prova ' + nome" @click.stop="$emit('prova')">▶</button>
    </div>
    <slot />
  </li>
</template>

<style scoped>
.voce-cassetto { display:flex; flex-direction:column; gap:0 }
.voce-riga { display:flex; align-items:center; gap:8px }
.voce-riga.apribile { cursor:pointer; -webkit-tap-highlight-color:transparent }
.voce-riga.apribile:active { transform:scale(.995) }
.apri { font-size:12px; font-weight:800; color:var(--viola); width:14px; text-align:center }
/* rientro largo + guida verticale, così l'annidamento si vede (non solo spazio bianco) */
.voce-riga.dentro { padding-left:46px; position:relative }
.voce-riga.dentro::before { content:''; position:absolute; left:27px; top:-4px; bottom:-4px;
                       width:2px; border-radius:2px; background:#e7e0f7 }
.voce-riga.dentro.ultima::before { bottom:50% } /* l'ultima chiude la guida a metà altezza */
.voce-riga.dentro::after { content:''; position:absolute; left:29px; top:50%; width:10px;
                      height:2px; border-radius:2px; background:#e7e0f7 }
.ico { font-size:18px; line-height:1; width:22px; text-align:center }
.testo { flex:1; display:flex; flex-direction:column; gap:0 }
.testo b { font-size:13px; font-weight:750 }
.voce-riga.dentro .testo b { font-size:12.5px; font-weight:600 }
.testo i { font-style:normal; font-size:11px; color:#8a8a99; line-height:1.3 }
em { font-style:normal; font-size:10.5px; font-weight:800; white-space:nowrap;
     padding:2px 7px; border-radius:8px }
em.si { color:#2f6b3f; background:#dff0d8 }
em.giu { color:#7a6a2f; background:#f3eed6 }
em.su { color:#5b3fa8; background:#eee7ff }
em.off { color:#8a4a4a; background:#f5e3e3 }
/* unico rosso del quadro: soglia identica all'avviso in posta (quiz/consiglio.js) */
em.va-male { color:#8c2f2f; background:#ffdede }
.voce-riga.giu .testo b, .voce-riga.su .testo b, .voce-riga.off .testo b { color:#7a7a8a }

.voce-riga.ritoccata { background:#fff6e4; box-shadow:inset 3px 0 0 #e5a52a;
                       border-radius:9px }
.voce-riga.ritoccata .testo b { color:#7d5410 }
.voce-riga.ritoccata .testo i { color:#9a7434 }
.voce-riga.ritoccata:not(.dentro) { padding:3px 6px; margin:0 -6px }

.tondo { border:none; cursor:pointer; font-family:inherit; font-size:11px; line-height:1;
         width:34px; height:34px; border-radius:11px; flex:none }
.tondo.prova { background:#f0eaff; color:var(--viola) }
.tondo.matita { background:#fbf0dc; color:#a9741c }
.tondo.matita.giu { background:#f2ddb2 }
.tondo:active { transform:translateY(1px) }
</style>
