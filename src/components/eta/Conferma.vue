<script setup>
/* ═══════════════════════════════════════════════════════════════════
   «APPLICA», E COSA SUCCEDE APPLICANDO

   ── PERCHÉ STA APPICCICATA IN BASSO ──────────────────────────────
   Perché il cartello che chiedeva conferma stava in fondo alla
   colonna, sotto un quadro alto quanto due schermi, e un grande che
   spostava la manopola non lo vedeva mai: quello che vedeva era una
   freccia che smetteva di rispondere. Una richiesta di conferma che
   non si vede non è una richiesta: è un tasto rotto.

   ── DICE COSA FA, NON «SEI SICURO?» ──────────────────────────────
   Due righe diverse per i due casi, perché sono due cose diverse:

     · **dentro la stessa fascia** — si sposta solo la mira delle
       domande, e tutto quello che il grande ha sistemato a mano resta
       dov'era. È il caso normale, e va detto: se non lo dicesse,
       «Applica» sembrerebbe pericoloso quanto l'altro.
     · **cambiando fascia** — giochi e saperi ripartono dai valori di
       quell'età, e se c'era roba a mano se ne va. Qui il numero conta
       più della frase: «2 giochi spenti a mano, 3 domande ritoccate»
       è una domanda a cui si può rispondere, «sei sicuro?» no.

   Non sa niente di profili e non scrive niente: riceve la `mossa`
   (quella che `data/partenze.js` ha già calcolato) ed emette.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { anniInLettere, perdeInParole } from './lettere.js'

const props = defineProps({
  /* l'età scelta con la manopola, quella che «Applica» scriverebbe */
  anni: { type: Number, required: true },
  /* il verdetto di `spostandoLEta`: cosa riscrive e cosa porta via */
  mossa: { type: Object, required: true },
})
defineEmits(['applica', 'annulla'])

/* quanto si perde, in voci contate: è il numero che rende la domanda
   vera. Zero voci vuol dire che non c'è niente di suo da perdere, e
   allora il cartello non allarma nessuno. */
const perde = computed(() => perdeInParole(props.mossa.perde || {}))

const inLettere = anniInLettere
</script>

<template>
  <div class="conferma" data-conferma="eta">
    <p class="che">
      <b>{{ inLettere(anni) }}</b>
      <template v-if="!mossa.riscrive">
        · si sposta solo la mira delle domande, i giochi restano come li hai messi
      </template>
      <template v-else-if="perde">
        · <span class="perde" data-perde>⚠ tornano di partenza: {{ perde }}</span>
      </template>
      <template v-else>
        · cambia fascia: giochi e domande ripartono dai valori di quell'età
      </template>
    </p>
    <div class="tasti">
      <button type="button" class="bottone chiaro" data-azione="eta-annulla"
              @click="$emit('annulla')">Annulla</button>
      <button type="button" class="bottone" data-azione="eta-applica"
              @click="$emit('applica')">Applica</button>
    </div>
  </div>
</template>

<style scoped>
/* Appiccicata in fondo alla colonna che scorre: finché c'è una
   modifica in sospeso resta a schermo, e sparisce quando non c'è più
   niente da applicare. */
.conferma { position:sticky; bottom:0; z-index:5;
            display:flex; flex-direction:column; gap:8px;
            background:#fff; border-radius:16px; padding:10px 12px;
            box-shadow:0 -3px 14px #00000022, 0 0 0 2px #5b3fa833 }
.che { margin:0; font-size:12.5px; line-height:1.35; color:#4a4a5a; text-align:left }
.che b { font-size:14px; color:var(--viola-scuro, #3b2b6b) }
/* `.avviso` non si poteva usare: è una classe globale (`style.css`) con
   sfondo, padding e `max-width`, e dentro una riga di testo diventava
   un riquadro arancione che si accavallava alla riga sotto. */
.perde { color:#a33 }
/* I due tasti sono quelli di sempre (`.bottone` in `style.css`, giallo
   il primario e chiaro il secondario): qui si stringono soltanto, per
   stare in due su una riga in fondo a uno schermo di telefono. I
   colori non si ridefiniscono — un tasto viola in mezzo a una
   schermata di tasti gialli si legge come un'altra cosa. */
.tasti { display:flex; gap:8px }
.tasti .bottone { flex:1; padding:12px 14px; font-size:16px; cursor:pointer;
                  border:none; font-family:inherit }
</style>
