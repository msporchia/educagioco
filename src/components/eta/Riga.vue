<script setup>
/* ═══════════════════════════════════════════════════════════════════
   UNA RIGA DENTRO UN BLOCCO DEL QUADRO

   Icona · nome · una riga di contesto · e a destra o lo stato o i
   tasti. È la stessa riga per un gioco, per un pezzo di scuola e per
   una domanda, ed è **una sola** perché sono lo stesso gesto: guardo
   una cosa e voglio sapere che ne è di lei.

   Erano tre `<li>` scritti a mano nello stesso file, con dentro quasi
   lo stesso markup. Uno aveva l'icona, un altro no; uno il sottotitolo,
   un altro no — e nessuna di quelle differenze era stata decisa. Da
   fuori sembravano tre cose diverse, e infatti la domanda che le ha
   fatte diventare una è stata «perché hanno una struttura diversa?».

   `dentro` è l'unica variante vera: una classe di domanda dentro il suo
   pezzo di scuola sta un gradino più a destra, perché è quello il modo
   di dire che appartiene a lui e non alla fila.

   ── DUE TASTI, E NON QUATTRO ─────────────────────────────────────
   Il ▶ prova, la ✎ tara. Nella scheda delle domande ce n'erano quattro
   — ▼ ▲ ▶ ✕ — e tre erano triangoli, cioè la stessa forma in tre
   orientamenti; peggio, due dei quattro non parlavano della riga su cui
   stavano (i ▼▲ spostavano la tipologia a tutti i gradi, il ✕ spegneva
   il gruppo intero). Qui la ✎ apre **la tacca**, che è dove quelle cose
   si dicono per intero e con le parole (`Taratura.vue`), e la riga
   chiusa torna a essere una riga.

   Il contenuto della tacca non lo sa: arriva nello slot. Questa resta
   quello che era — una riga che mostra una cosa — e chi la usa decide
   cosa si apre sotto.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  ico: { type: String, default: '' },
  nome: { type: String, required: true },
  /* la riga piccola sotto il nome: il modulo, la materia, cosa fa */
  sotto: { type: String, default: '' },
  /* l'etichetta a destra: `{ testo, cls }` — «c'è», «arriva più avanti» */
  stato: { type: Object, default: null },
  /* il ▶ che apre la domanda vera */
  prova: { type: Boolean, default: false },
  /* la ✎ che apre la tacca della difficoltà */
  tara: { type: Boolean, default: false },
  /* la tacca è aperta: la matita resta premuta, così si vede da dove
     è uscito quel riquadro */
  tarando: { type: Boolean, default: false },
  /* ce l'ha messa lì un grande, non l'età: la riga si colora, e resta
     colorata anche a tacca chiusa — è l'unico modo di sapere, scorrendo
     l'elenco, che quella è fuori dalla taratura di casa */
  ritoccata: { type: Boolean, default: false },
  /* rientrata sotto la riga che la contiene */
  dentro: { type: Boolean, default: false },
  /* l'ultima di una fila rientrata: chiude la guida verticale */
  ultima: { type: Boolean, default: false },
  /* una riga che a sua volta ne contiene altre: la freccina, e il tocco
     che le apre. Serve perché un blocco aperto a otto anni sono
     cinquantasette domande in venti pezzi di scuola — tutte insieme non
     è un elenco, è un muro. */
  apribile: { type: Boolean, default: false },
  aperto: { type: Boolean, default: false },
  /* per i test e per chi deve ritrovarla */
  chiave: { type: String, default: '' },
})
defineEmits(['prova', 'apri', 'tara'])
</script>

<template>
  <li class="voce-cassetto" :data-riga="chiave">
    <!-- `.stop` anche qui: la riga vive dentro un riquadro che si chiude
         al tocco, e senza fermarlo aprire un pezzo di scuola chiuderebbe
         nello stesso gesto il blocco che lo contiene -->
    <div class="voce-riga" :class="[stato?.cls, { dentro, apribile, aperta: aperto, ultima,
                                                  ritoccata }]"
         :role="apribile ? 'button' : null" :tabindex="apribile ? 0 : null"
         @click.stop="apribile && $emit('apri')" @keydown.enter.stop="apribile && $emit('apri')">
      <span v-if="ico" class="ico">{{ ico }}</span>
      <span class="testo"><b>{{ nome }}</b><i v-if="sotto">{{ sotto }}</i></span>
      <em v-if="stato" :class="stato.cls">{{ stato.testo }}</em>
      <span v-if="apribile" class="apri">{{ aperto ? '▴' : '▾' }}</span>
      <!-- `.stop` non è pignoleria: il riquadro intero si apre e si chiude
           al tocco, quindi senza fermarlo il ▶ aprirebbe la domanda e
           nello stesso gesto richiuderebbe l'elenco da cui è stata
           chiesta. -->
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
/* ── L'ANNIDAMENTO SI DEVE VEDERE ──
   Un rientro piccolo non si legge come «queste stanno dentro quella»:
   si legge come una riga scritta storta. Rientro largo, e una guida
   verticale che le tiene insieme — è la guida a dire dove finisce il
   pezzo di scuola, cosa che il solo spazio bianco non sa fare quando le
   domande sono cinque o sei. */
.voce-riga.dentro { padding-left:46px; position:relative }
.voce-riga.dentro::before { content:''; position:absolute; left:27px; top:-4px; bottom:-4px;
                       width:2px; border-radius:2px; background:#e7e0f7 }
/* l'ultima della fila chiude la guida a metà altezza, con il trattino
   che la aggancia: così si vede dove il gruppo finisce */
.voce-riga.dentro.ultima::before { bottom:50% }
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
/* ── QUESTA GLI STA ANDANDO MALE ──
   Rosso vero, ed è l'unico posto del quadro dove ce n'è uno: gli altri
   quattro stati dicono *dove* sta una cosa, questo dice che qualcosa
   non funziona, ed è l'unica riga per cui valga la pena fermarsi a
   scorrere l'elenco. La soglia è quella dell'avviso in posta
   (`quiz/consiglio.js`), così il numero letto qui e quello letto là
   sono lo stesso numero. */
em.va-male { color:#8c2f2f; background:#ffdede }
.voce-riga.giu .testo b, .voce-riga.su .testo b, .voce-riga.off .testo b { color:#7a7a8a }

/* ── FUORI DALLA TARATURA DI CASA ──
   Ambra e non viola, e a riga chiusa: scorrendo l'elenco si vede subito
   cosa è stato messo a mano, che è la sola informazione che il
   contatore «3 domande spostate» non riesce a dare — lui dice quante,
   non quali. */
.voce-riga.ritoccata { background:#fff6e4; box-shadow:inset 3px 0 0 #e5a52a;
                       border-radius:9px }
.voce-riga.ritoccata .testo b { color:#7d5410 }
.voce-riga.ritoccata .testo i { color:#9a7434 }
.voce-riga.ritoccata:not(.dentro) { padding:3px 6px; margin:0 -6px }

/* I due tasti di una riga: piccoli ma con un bersaglio vero sotto — 34
   px è il minimo che un dito prende senza mirare. */
.tondo { border:none; cursor:pointer; font-family:inherit; font-size:11px; line-height:1;
         width:34px; height:34px; border-radius:11px; flex:none }
.tondo.prova { background:#f0eaff; color:var(--viola) }
.tondo.matita { background:#fbf0dc; color:#a9741c }
.tondo.matita.giu { background:#f2ddb2 }
.tondo:active { transform:translateY(1px) }
</style>
