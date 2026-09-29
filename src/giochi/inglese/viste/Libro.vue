<script setup>
/* Il capitolo del libro: prima il testo inglese da leggere, con la
   tipografia di un libro, poi le domande in italiano una alla volta. Il
   testo resta sopra anche durante le domande: rileggere è lecito, è
   quello che si fa con un libro. Le parole si toccano come dappertutto. */
import Testo from './Testo.vue'

defineProps({
  cap: { type: Object, required: true },        // { titolo, righe: [{ en }], domande: [{ testo, opzioni }] }
  fase: { type: String, default: 'leggi' },     // leggi | domande
  k: { type: Number, default: 0 },              // la domanda di adesso
  scelta: { type: Number, default: -1 },        // l'opzione toccata, -1 se non ancora
  attesa: { type: Number, default: 0 },
  giro: { type: Number, default: 0 },
})
defineEmits(['ho-letto', 'rispondi', 'tocca'])

function classe(d, o, i, scelta) {
  if (scelta < 0) return ''
  if (o.giusta) return 'ing-giusta'
  return i === scelta ? 'ing-sbagliata' : 'ing-spenta'
}
</script>

<template>
  <div class="ing-libro" data-libro-aperto>
    <article class="ing-pagina" :class="{ 'ing-pagina-corta': fase === 'domande' }" data-libro-testo>
      <h2 class="ing-capitolo">{{ cap.titolo }}</h2>
      <!-- le frasi di un capitolo sono un racconto: si leggono di seguito, come in un libro -->
      <p class="ing-riga"><Testo :testo="cap.righe.map(r => r.en).join(' ')" @tocca="el => $emit('tocca', el)" /></p>
      <div class="ing-fregio" aria-hidden="true">❦</div>
    </article>

    <div v-if="fase === 'leggi'" class="ing-dopo-lettura">
      <p class="ing-sotto">Tocca una parola se non sai cosa vuol dire.</p>
      <button type="button" class="ing-grosso" data-azione="ho-letto" @click="$emit('ho-letto')">
        Ho letto →
      </button>
    </div>

    <div v-else class="ing-libro-domanda" data-libro-domanda :data-k="k">
      <div class="ing-etichetta">Domanda {{ k + 1 }} di {{ cap.domande.length }}</div>
      <div class="ing-consegna ing-it ing-lunga">{{ cap.domande[k].testo }}</div>
      <div class="ing-opzioni ing-lunghe">
        <button v-for="(o, i) in cap.domande[k].opzioni" :key="k + '-' + i" type="button"
                class="ing-opzione" :class="classe(cap.domande[k], o, i, scelta)"
                :data-opzione="i" :data-giusta="o.giusta ? '' : null"
                @click="scelta < 0 && $emit('rispondi', i)">{{ o.testo }}</button>
      </div>
      <div v-if="scelta >= 0" class="ing-esito"
           :data-esito="cap.domande[k].opzioni[scelta].giusta ? 'giusta' : 'sbagliata'">
        <div v-if="cap.domande[k].opzioni[scelta].giusta" class="ing-bene">Giusto!</div>
        <div v-else class="ing-male">Non così: rileggi il testo qui sopra.</div>
        <div v-if="attesa" class="ing-avanti" data-attesa>
          <i :key="giro" :style="{ animationDuration: attesa + 'ms' }"></i>
        </div>
      </div>
    </div>
  </div>
</template>
