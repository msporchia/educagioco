<script setup>
// La pagina d'inizio: come funziona, la pagina dei bambini, classi, lezioni, storico e il file del quaderno
import { ref, computed } from 'vue'
import { quaderno, salva } from './stato.js'
import * as Q from './quaderno.js'
import { lezioneValida, classiNelloStorico } from './quaderno.js'
import { indirizzoBambini, paginaMaestra, copia, scarica, comeSiSvolge } from './utili.js'
import Conferma from './Conferma.vue'
import CodicePerIPc from './CodicePerIPc.vue'

const emit = defineEmits(['vai', 'indietro'])
const indirizzo = indirizzoBambini()
const storico = computed(() => classiNelloStorico(quaderno))
const lezioneInCorso = computed(() => quaderno.inCorso?.lezione)
const copiato = ref('')            // id della lezione il cui link è appena stato copiato
const daCopiare = ref('')          // il link, quando il browser non lascia copiare
const esitoFile = ref({ bene: '', male: '' })
const scelta = ref(null)

async function copiaLink(l) {
  const link = Q.linkDellaLezione(l, paginaMaestra())
  daCopiare.value = ''
  if (await copia(link)) { copiato.value = l.id; setTimeout(() => { if (copiato.value === l.id) copiato.value = '' }, 2500) }
  else daCopiare.value = link
}

function duplica(id) { Q.duplicaLezione(quaderno, id); salva(['lezioni']) }
function cancella(id) { Q.cancellaLezione(quaderno, id); salva(['lezioni']) }

function salvaFile() {
  scarica(Q.nomeDelFile(), JSON.stringify(Q.esporta(quaderno), null, 1), 'application/json')
}

function apriFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  const r = new FileReader()
  r.onload = () => {
    const letto = Q.leggiQuaderno(r.result)
    if (!letto.ok) { esitoFile.value = { bene: '', male: letto.errore }; return }
    const { nuove, sostituite } = Q.unisci(quaderno, letto.quaderno)
    salva()
    esitoFile.value = {
      bene: `Quaderno aperto: ${nuove} cose aggiunte, ${sostituite} aggiornate.`,
      male: letto.scartate ? `${letto.scartate} voci del file erano rovinate e le ho lasciate fuori.` : '',
    }
  }
  r.onerror = () => { esitoFile.value = { bene: '', male: 'Non riesco a leggere il file.' } }
  r.readAsText(file)
}
</script>

<template>
  <section v-if="lezioneInCorso" class="carta" data-in-corso>
    <h2>Lezione in corso</h2>
    <p>{{ lezioneInCorso.nome }} · codice <b class="copiabile">{{ quaderno.inCorso.codice }}</b></p>
    <div class="fila"><button class="bottone" data-azione="torna-alla-lezione" @click="emit('vai', 'diretta')">Torna alla lezione</button></div>
  </section>

  <section class="carta" data-come-funziona>
    <h2>Come funziona</h2>
    <ol class="passi">
      <li><b>Prepara</b> una classe con i nomi degli alunni e una lezione: cosa fare, blocco per blocco, e quando si passa al blocco dopo.</li>
      <li><b>Sui PC dei bambini</b> apri la pagina dei bambini, dall'indirizzo qui sotto o dal file copiato con la chiavetta.</li>
      <li><b>Avvia</b> la lezione: esce un codice da scrivere alla lavagna. Ogni bambino lo scrive e tocca il suo nome.</li>
      <li><b>Via!</b> I bambini rispondono, tu vedi a che punto sono. Alla fine chiudi la lezione e hai il resoconto.</li>
    </ol>
  </section>

  <section class="carta" data-pagina-bambini>
    <h2>La pagina dei bambini</h2>
    <p class="copiabile" data-indirizzo-bambini><b>{{ indirizzo }}</b></p>
    <p class="nota">Sui PC lenti parte prima dal file: copialo con la chiavetta e aprilo con un doppio click. È uguale per tutte le classi.</p>
    <div class="fila">
      <a class="bottone chiaro" href="./index.html" download="educagioco-classe.html" data-azione="scarica-pagina-bambini">Scarica il file per i PC dei bambini</a>
    </div>
    <CodicePerIPc />
  </section>

  <section class="carta" data-classi>
    <h2>Le classi</h2>
    <p v-if="!quaderno.classi.length" class="nota">Ancora nessuna classe.</p>
    <ul v-else class="elenco">
      <li v-for="c in quaderno.classi" :key="c.id" :data-classe="c.id">
        <span class="cosa"><b>{{ c.nome || 'Senza nome' }}</b><span class="nota">{{ c.alunni.length }} alunni</span></span>
        <span class="fila">
          <button class="bottone chiaro piccolo" data-azione="modifica-classe" @click="emit('vai', 'classe', { id: c.id })">Modifica</button>
          <button class="bottone chiaro piccolo" data-azione="storico-classe" @click="emit('vai', 'storico', { classe: c.id })">Storico</button>
        </span>
      </li>
    </ul>
    <div class="fila"><button class="bottone" data-azione="nuova-classe" @click="emit('vai', 'classe', { id: null })">Nuova classe</button></div>
  </section>

  <section class="carta" data-lezioni>
    <h2>Le lezioni</h2>
    <p v-if="!quaderno.lezioni.length" class="nota">Ancora nessuna lezione preparata.</p>
    <ul v-else class="elenco">
      <li v-for="l in quaderno.lezioni" :key="l.id" :data-lezione="l.id">
        <span class="cosa">
          <b>{{ l.nome }}</b>
          <span v-for="(r, i) in comeSiSvolge(l)" :key="i" class="nota">{{ r }}</span>
        </span>
        <span class="fila">
          <button class="bottone piccolo" data-azione="avvia" :disabled="!lezioneValida(l) || !!quaderno.inCorso"
                  @click="emit('vai', 'avvia', { lezione: l })">Avvia</button>
          <button class="bottone chiaro piccolo" data-azione="modifica-lezione" @click="emit('vai', 'lezione', { id: l.id })">Modifica</button>
          <button class="bottone chiaro piccolo" data-azione="duplica" @click="duplica(l.id)">Duplica</button>
          <button class="bottone chiaro piccolo" data-azione="copia-link" :disabled="!lezioneValida(l)" @click="copiaLink(l)">
            {{ copiato === l.id ? 'Link copiato' : 'Copia il link' }}</button>
          <Conferma etichetta="Cancella" si="Cancella" data-azione="cancella-lezione" @si="cancella(l.id)" />
        </span>
      </li>
    </ul>
    <label v-if="daCopiare">Il browser non lascia copiare: seleziona il link e copialo a mano
      <input class="campo" readonly :value="daCopiare" data-link-lezione @focus="$event.target.select()">
    </label>
    <p v-if="quaderno.inCorso && quaderno.lezioni.length" class="nota">Una lezione alla volta: per avviarne un'altra chiudi quella in corso.</p>
    <div class="fila"><button class="bottone" data-azione="nuova-lezione" @click="emit('vai', 'nuova')">Nuova lezione</button></div>
  </section>

  <section class="carta" data-storico>
    <h2>Lo storico</h2>
    <p v-if="!storico.length" class="nota">Qui compaiono le lezioni fatte, classe per classe.</p>
    <ul v-else class="elenco">
      <li v-for="c in storico" :key="c.id" :data-storico-classe="c.id">
        <span class="cosa"><b>{{ c.nome || 'Senza nome' }}</b>
          <span class="nota">{{ c.lezioni === 1 ? 'una lezione' : `${c.lezioni} lezioni` }}{{ c.cancellata ? ' · classe cancellata' : '' }}</span></span>
        <button class="bottone chiaro piccolo" data-azione="storico-classe" @click="emit('vai', 'storico', { classe: c.id })">Apri</button>
      </li>
    </ul>
  </section>

  <section class="carta" data-quaderno>
    <h2>Il quaderno</h2>
    <p>Classi, lezioni e storico stanno <b>solo in questo browser</b>. Il file del quaderno è <b>l'unica copia di sicurezza</b>:
      salvalo spesso (su una chiavetta, nella posta) e aprilo qui o su un altro PC per riavere tutto.</p>
    <div class="fila">
      <button class="bottone" data-azione="salva-quaderno" @click="salvaFile">Salva il quaderno</button>
      <button class="bottone chiaro" data-azione="apri-quaderno" @click="scelta.click()">Apri un quaderno</button>
      <input ref="scelta" type="file" accept=".json,application/json" hidden data-file-quaderno @change="apriFile">
    </div>
    <p v-if="esitoFile.bene" class="bene" data-esito-file="bene">{{ esitoFile.bene }}</p>
    <p v-if="esitoFile.male" class="avviso" data-esito-file="male">{{ esitoFile.male }}</p>
    <p class="nota">Aprire un quaderno non cancella niente: aggiunge quello che manca e aggiorna quello che c'è già.</p>
  </section>
</template>

<style scoped>
.passi { padding-left:20px; display:flex; flex-direction:column; gap:6px }
</style>
