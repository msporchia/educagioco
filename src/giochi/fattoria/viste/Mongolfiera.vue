<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MONGOLFIERA — LE CASSE DA RIEMPIRE

   Tre file (quattro dal 66), una merce per fila, e in ogni fila due o
   tre casse. **Ogni cassa è un tasto**: si preme e si carica, da sola,
   e il premio arriva subito. È la cosa che la distingue dal banco, e
   il disegno la deve dire: al banco si guarda un ordine e si chiede
   «ce l'ho tutto?», qui si guarda una cassa e si chiede «questa ce la
   faccio?».

   ── LE CASELLE ────────────────────────────────────────────────────
   Dentro una cassa ci sono le sue caselle, una per pezzo, come al
   banco e nelle ricette (`viste/Macchina.vue`): una cassa **caricata**
   le ha tutte piene e il bordo verde; una da caricare accende quelle
   che hai in silo. «2 su 3» è un conto, tre quadratini con due accesi
   si guardano.

   ── «PARTI!» E LA SUA CONFERMA ────────────────────────────────────
   Partire a metà non toglie niente — le casse caricate hanno già reso
   — ma porta via quelle vuote, e il cielo resta vuoto un'ora. Una cosa
   che si scopre dopo averla premuta è una trappola, quindi a metà il
   tasto non parte: chiede, dicendo **cosa** se ne va. A tutto pieno
   parte e basta, perché non c'è niente da perdere.

   La conferma è uno stato del componente, e un componente che resta
   montato fra un pallone e l'altro se la porterebbe dietro (CLAUDE.md,
   «Un `v-if` che non si spegne mai non rimonta niente»): si rimette a
   zero quando cambia il pallone.

   Non sa niente del profilo né del granaio: riceve la nave già
   contata da `motore/mongolfiera.js` (`naveDi`) e manda fuori
   `carica`, `parti` e `albero`.
   ═══════════════════════════════════════════════════════════════════ */
import { computed, ref, watch } from 'vue'
import Merce from './Merce.vue'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  /* `naveDi`: `{ aTerra, n, file, piene, di, preso, tuttoIntero,
     bonusTutto, pieno }`, oppure `{ aTerra: false, minuti }` */
  nave: { type: Object, required: true },
})
const emit = defineEmits(['carica', 'parti', 'chiudi', 'albero'])

const chiede = ref(false)
watch(() => props.nave.n, () => { chiede.value = false })
watch(() => props.nave.aTerra, () => { chiede.value = false })

const pronte = computed(() => props.nave.aTerra
  ? props.nave.file.reduce((n, f) => n + f.casse.filter(c => c.pronta).length, 0) : 0)
const vuote = computed(() => props.nave.aTerra ? props.nave.di - props.nave.piene : 0)

/* Le caselle di una cassa: piene tutte se è caricata, se no accese
   quante ne hai in silo. */
const caselle = (fila, cassa) => Array.from({ length: cassa.pezzi },
  (_, i) => ({ piena: cassa.piena || i < fila.hai }))

/* Quanto manca per la prossima cassa di una fila: è il numero che
   rimanda a produrre, e si preme per aprire l'albero. */
const manca = fila => {
  const prossima = fila.casse.find(c => !c.piena)
  return prossima && !prossima.pronta ? prossima.pezzi - fila.hai : 0
}

function premiParti() {
  if (props.nave.pieno) return emit('parti')
  chiede.value = true
}
</script>

<template>
  <div class="fa-foglio fa-mercato fa-mongolfiera" data-mongolfiera>
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>La mongolfiera</h2>

    <!-- Il cielo vuoto non è un foglio vuoto: dice fra quanto torna, e
         perché — chi l'ha appena mandata via deve leggere che l'attesa
         è il prezzo della partenza, non un guasto. -->
    <template v-if="!nave.aTerra">
      <p data-cielo>È partita! La prossima atterra fra
         <b>{{ nave.minuti }}</b> {{ nave.minuti === 1 ? 'minuto' : 'minuti' }}.</p>
      <p class="fa-piccolo">Intanto prepara la roba: arriverà a chiedere
         cose fatte con le macchine, non il raccolto crudo.</p>
    </template>

    <template v-else>
      <p v-if="nave.pieno">Tutto pieno! Premi <b>Parti!</b> e mandala via
         contenta.</p>
      <p v-else-if="pronte">Ci {{ pronte === 1 ? 'è una cassa' : 'sono ' + pronte + ' casse' }}
         che puoi caricare adesso: ogni cassa dà <b>subito</b> la sua ⭐.</p>
      <p v-else>Riempi le casse un po' alla volta: ogni cassa dà subito la
         sua ⭐, e non ha fretta — aspetta finché non la mandi via tu.</p>

      <!-- Il conto: quanto si è preso e quanto si prenderebbe finendo.
           Il premio grosso sta scritto qui, perché è la ragione per non
           partire a metà. -->
      <p class="fa-conto" data-conto>
        <em class="fa-premio-xp">⭐ {{ nave.preso }}</em> presi
        <span v-if="!nave.pieno"> · <em class="fa-premio-xp">⭐ {{ nave.tuttoIntero }}</em>
          se la riempi tutta, e una sorpresa 🎁</span>
      </p>

      <div class="fa-ordini fa-casse">
        <div v-for="fila in nave.file" :key="nave.n + '-' + fila.i" class="fa-ordine"
             :class="{ pronto: fila.casse.some(c => c.pronta), fatta: fila.piena }"
             :data-fila="fila.i">
          <div class="fa-chi">
            <b><Merce :merce="fila.merce" :lato="24" /></b>
            <span>{{ fila.nome }} · ne hai {{ fila.hai }}</span>
            <em class="fa-premio-xp">{{ fila.piena ? '✓' : 'fila piena +' }} ⭐ {{ fila.bonus }}</em>
          </div>

          <div class="fa-chiede">
            <button v-for="c in fila.casse" :key="c.j" type="button"
                    :class="['fa-cassa', { piena: c.piena, pronta: c.pronta }]"
                    :data-cassa="fila.i + '-' + c.j" data-azione="carica"
                    :disabled="c.piena || !c.pronta"
                    @click="emit('carica', { fila: fila.i, cassa: c.j })">
              <span class="fa-caselle">
                <span v-for="(k, i) in caselle(fila, c)" :key="i"
                      :class="['fa-casella', { piena: k.piena }]">
                  <Merce :merce="fila.merce" :lato="20" />
                </span>
              </span>
              <u>{{ c.piena ? '✓ caricata' : `⭐ ${c.xp}` }}</u>
            </button>
          </div>

          <!-- Quello che manca **si preme**: apre l'albero di quella
               merce, come al banco. -->
          <p v-if="manca(fila)" class="fa-piccolo fa-manca">
            <span>Per la prossima cassa ti {{ manca(fila) > 1 ? 'servono' : 'serve' }}</span>
            <button type="button" class="fa-manca-tasto" :data-albero-apri="fila.merce"
                    @click="emit('albero', fila.merce)">
              <b>{{ manca(fila) }}
              <Merce :merce="fila.merce" :lato="20" />
              {{ fila.nome.toLowerCase() }}</b> 🌳</button>
          </p>
        </div>
      </div>

      <!-- La conferma sta **al posto del tasto**, non in fondo a un
           elenco: chi ha premuto guarda lì. -->
      <div v-if="chiede" class="fa-conferma-parti" data-conferma="parti">
        <p>Parte con <b>{{ vuote }} {{ vuote === 1 ? 'cassa vuota' : 'casse vuote' }}</b>:
           le ⭐ che hai già preso restano, le casse vuote se ne vanno con lei.
           La prossima arriva fra un'ora.</p>
        <div class="fa-fila">
          <button class="fa-bot piano" data-azione="lascia" @click="chiede = false">
            Lascia stare</button>
          <button class="fa-bot forte" data-azione="parti-davvero"
                  @click="chiede = false; emit('parti')">Parti!</button>
        </div>
      </div>
      <div v-else class="fa-fila">
        <button class="fa-bot" :class="nave.pieno ? 'forte' : 'piano'"
                data-azione="parti" @click="premiParti">🎈 Parti!</button>
      </div>

      <p class="fa-piccolo">Tutto pieno dà <b>⭐ {{ nave.bonusTutto }}</b> in più
         e una decorazione della fiera, che non si trova nel baule.</p>
    </template>
  </div>
</template>
