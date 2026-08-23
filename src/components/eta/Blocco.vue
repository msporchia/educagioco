<script setup>
/* ═══════════════════════════════════════════════════════════════════
   UN BLOCCO DEL QUADRO DI UN'ETÀ

   Titolo · quanti sono · cosa vuol dire · l'assaggio, e si apre
   toccandolo in qualunque punto. Cinque blocchi hanno questa forma e
   la avevano già — ma scritta cinque volte a mano dentro
   `ManopolaEta.vue`, che è il modo in cui due di loro erano finiti
   diversi dagli altri senza che nessuno l'avesse deciso: uno mostrava
   l'icona e l'altro no, uno il sottotitolo e l'altro no.

   Non sa niente di età, di saperi e di domande: riceve delle parole e
   uno slot. Chi lo usa decide cosa ci va dentro.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  titolo: { type: String, required: true },
  /* quanti sono, già scritto: «5», «3 su 14», «nessuna» */
  conta: { type: String, default: '' },
  /* la riga grigia sotto il titolo: cosa vuol dire questo blocco */
  spiega: { type: String, default: '' },
  /* l'assaggio da chiuso, quando non si passa lo slot `chiuso` */
  assaggio: { type: String, default: '' },
  aperto: { type: Boolean, default: false },
  /* Un blocco che non ha niente dentro non si apre, e si vede che non
     si apre: un riquadro identico agli altri che non risponde al dito
     è peggio di uno che dichiara di essere una riga e basta. */
  apribile: { type: Boolean, default: true },
  /* ── QUI DENTRO C'È QUALCOSA CHE NON FUNZIONA ──
     `{ conta, frase }`, e sono l'unica cosa rossa di un blocco: le
     righe che vanno male stanno due aperture più sotto, e da chiuso un
     blocco non ne mostra niente — quindi il segnale risale fin qui,
     col nome, che è quello che un grande ha letto nell'avviso e sta
     cercando. Chi lo compone è `data/quadro.js` (`vannoMale`), con la
     stessa soglia della posta. */
  allarme: { type: Object, default: null },
})
defineEmits(['apri'])
</script>

<template>
  <div class="voce" :class="{ apribile, aperta: aperto, muta: !apribile }"
       :role="apribile ? 'button' : null" :tabindex="apribile ? 0 : null"
       @click="apribile && $emit('apri')" @keydown.enter="apribile && $emit('apri')">
    <span class="tit">
      <span>{{ titolo }}</span>
      <b v-if="conta">{{ conta }}</b>
      <b v-if="allarme" class="male" data-va-male>{{ allarme.conta }}</b>
      <em v-if="apribile">{{ aperto ? '▴' : '▾' }}</em>
    </span>
    <i v-if="spiega" class="spiega">{{ spiega }}</i>

    <template v-if="!aperto">
      <!-- prima dell'assaggio, e non al posto suo: l'assaggio dice cosa
           c'è qui dentro — è vero tutti i giorni — questa dice cosa non
           funziona adesso, ed è la sola per cui valga la pena aprire -->
      <b v-if="allarme" class="frase male" data-male-frase>{{ allarme.frase }}</b>
      <slot name="chiuso">
        <b v-if="assaggio" class="frase">{{ assaggio }}</b>
      </slot>
    </template>
    <slot v-else />
  </div>
</template>

<style scoped>
.voce { display:flex; flex-direction:column; gap:3px; background:#fff; border-radius:14px;
        padding:9px 12px; box-shadow:0 2px 8px #0000000d }
/* La testata: nome · quanti · la freccina. Uguale per tutti — erano due
   forme diverse, e due forme fanno sembrare due cose diverse quello che
   è lo stesso gesto ripetuto. */
.tit { display:flex; align-items:baseline; gap:7px;
       font-size:11px; text-transform:uppercase; letter-spacing:.4px; color:#8a8a99;
       font-weight:800 }
.tit > span:first-child { flex:1 }
.tit > b { font-size:13px; font-weight:800; color:var(--viola-scuro);
           text-transform:none; letter-spacing:0 }
.tit > em { font-style:normal; font-size:13px; font-weight:800; color:var(--viola) }
/* Rosso vero, come l'etichetta della riga che va male (`Riga.vue`): è
   lo stesso fatto detto da più lontano, quindi è lo stesso colore. */
.tit > b.male { color:#8c2f2f; background:#ffdede; padding:1px 7px; border-radius:8px;
                font-size:11px }

.frase { font-size:13.5px; font-weight:650; line-height:1.4 }
.frase.male { color:#8c2f2f; font-size:12.5px; font-weight:700 }
.spiega { font-style:normal; font-size:11px; color:#9a9aa8; line-height:1.3; margin:-1px 0 3px }

/* Si tocca tutto il riquadro, non la parolina in fondo alla riga:
   quella è larga due centimetri su un telefono, e chi prova a premere
   il titolo — cioè chiunque — non otterrebbe niente e concluderebbe
   che non si apre. */
.voce.apribile { cursor:pointer; -webkit-tap-highlight-color:transparent }
.voce.apribile:active { transform:scale(.995) }
.voce.apribile.aperta { box-shadow:0 2px 10px #0000001a, inset 0 0 0 2px #f0eaff }

/* quello che non si apre si vede che non si apre */
.voce.muta { background:#faf9fd; box-shadow:none; border:1px dashed #e4e0ee }
.voce.muta .tit > b { color:#9a9aa8 }
.voce.muta .frase { color:#6a6a7a; font-weight:600 }
</style>
