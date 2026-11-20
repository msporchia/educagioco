<script setup>
// La pagina d'inizio: come funziona, la pagina dei bambini, classi, lezioni, storico e il file del quaderno
import { ref, computed } from 'vue'
import { quaderno, salva } from './stato.js'
import * as Q from './quaderno.js'
import { lezioneValida, classiNelloStorico } from './quaderno.js'
import { indirizzoBambini, paginaMaestra, copia, scarica, iniziali, coloreDi, provaLezione } from './utili.js'
import { descriviBlocco } from '../comune/lezione.js'
import { giocoDi } from '../comune/esercizi.js'
import { ICONE } from '../comune/icone-giochi.js'
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

// i disegni dei giochi di una lezione, uno per gioco, nell'ordine dei blocchi; le domande hanno il foglio
const giochiDi = l => [...new Set((l.blocchi || []).map(b => giocoDi(b.esercizio)))].map(id => ({ id, icona: ICONE[id] || null }))
const PRIMI = 6   // i tondi delle iniziali di una classe, poi «+N»

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
  <section v-if="lezioneInCorso" class="carta in-corso" data-in-corso>
    <div class="fila tra">
      <span><span class="nota">Lezione in corso</span><b class="titolo">{{ lezioneInCorso.nome }}</b></span>
      <span class="codice-grande evidenziato copiabile">{{ quaderno.inCorso.codice }}</span>
    </div>
    <div class="fila"><button class="bottone" data-azione="torna-alla-lezione" @click="emit('vai', 'diretta')">Torna alla lezione</button></div>
  </section>

  <section class="carta" data-come-funziona>
    <h2>Come funziona</h2>
    <ol class="passi">
      <li><span class="n">1</span><b>Prepara</b><span>la classe coi nomi e una lezione: a che gioco, cosa si fa, quando si va avanti.</span></li>
      <li><span class="n">2</span><b>Apri sui PC</b><span>la pagina dei bambini, dall'indirizzo qui sotto o dal file con la chiavetta.</span></li>
      <li><span class="n">3</span><b>Avvia</b><span>e scrivi il codice alla lavagna: ogni bambino lo scrive e tocca il suo nome.</span></li>
      <li><span class="n">4</span><b>Via!</b><span>Vedi a che punto è ognuno; alla fine chiudi e hai il resoconto.</span></li>
    </ol>
  </section>

  <section class="carta" data-lezioni>
    <div class="fila tra">
      <h2>Le lezioni</h2>
      <button class="bottone" data-azione="nuova-lezione" @click="emit('vai', 'nuova')">Nuova lezione</button>
    </div>
    <p v-if="!quaderno.lezioni.length" class="nota">Ancora nessuna lezione: «Nuova lezione» te ne propone di pronte, per classe e per gioco.</p>
    <ul v-else class="schede">
      <li v-for="l in quaderno.lezioni" :key="l.id" class="scheda" :data-lezione="l.id">
        <span class="disegni">
          <template v-for="g in giochiDi(l)" :key="g.id">
            <img v-if="g.icona" :src="g.icona.src" alt="" class="ico">
            <span v-else class="ico foglio" aria-hidden="true">📝</span>
          </template>
        </span>
        <b class="titolo">{{ l.nome }}</b>
        <ol class="blocchi-scheda">
          <li v-for="(b, i) in l.blocchi" :key="i" class="nota">{{ descriviBlocco(b) }}</li>
        </ol>
        <span class="fila azioni">
          <button class="bottone piccolo" data-azione="avvia" :disabled="!lezioneValida(l) || !!quaderno.inCorso"
                  @click="emit('vai', 'avvia', { lezione: l })">Avvia</button>
          <button class="bottone chiaro piccolo" data-azione="prova-lezione" :disabled="!lezioneValida(l)" @click="provaLezione(l)">Prova</button>
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
  </section>

  <section class="carta" data-classi>
    <div class="fila tra">
      <h2>Le classi</h2>
      <button class="bottone chiaro" data-azione="nuova-classe" @click="emit('vai', 'classe', { id: null })">Nuova classe</button>
    </div>
    <p v-if="!quaderno.classi.length" class="nota">Ancora nessuna classe: scrivi il suo nome e i nomi dei bambini, uno per riga.</p>
    <ul v-else class="schede">
      <li v-for="c in quaderno.classi" :key="c.id" class="scheda" :data-classe="c.id">
        <b class="titolo">{{ c.nome || 'Senza nome' }}</b>
        <span class="faccine">
          <span v-for="a in c.alunni.slice(0, PRIMI)" :key="a.id" class="iniziali" :style="{ '--colore': coloreDi(a.nome) }" :title="a.nome">{{ iniziali(a.nome) }}</span>
          <span v-if="c.alunni.length > PRIMI" class="altri">+{{ c.alunni.length - PRIMI }}</span>
        </span>
        <span class="nota">{{ c.alunni.length === 1 ? 'un bambino' : `${c.alunni.length} bambini` }}</span>
        <span class="fila azioni">
          <button class="bottone chiaro piccolo" data-azione="modifica-classe" @click="emit('vai', 'classe', { id: c.id })">Modifica</button>
          <button class="bottone chiaro piccolo" data-azione="storico-classe" @click="emit('vai', 'storico', { classe: c.id })">Le lezioni fatte</button>
        </span>
      </li>
    </ul>
  </section>

  <section class="carta" data-pagina-bambini>
    <h2>La pagina dei bambini</h2>
    <p class="copiabile indirizzo" data-indirizzo-bambini><b>{{ indirizzo }}</b></p>
    <p class="nota">Sui PC lenti parte prima dal file: copialo con la chiavetta e aprilo con un doppio click. È uguale per tutte le classi.</p>
    <div class="fila">
      <a class="bottone chiaro" href="./index.html" download="educagioco-classe.html" data-azione="scarica-pagina-bambini">Scarica il file per i PC dei bambini</a>
    </div>
    <CodicePerIPc />
  </section>

  <section class="carta" data-storico>
    <h2>Lo storico</h2>
    <p v-if="!storico.length" class="nota">Qui compaiono le lezioni fatte, classe per classe.</p>
    <ul v-else class="elenco">
      <li v-for="c in storico" :key="c.id" :data-storico-classe="c.id">
        <span class="cosa"><b>{{ c.nome || 'Senza nome' }}</b>
          <span class="nota">{{ c.lezioni === 1 ? 'una lezione' : `${c.lezioni} lezioni` }}{{ c.cancellata ? ', classe cancellata' : '' }}</span></span>
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
.tra { justify-content:space-between }
.titolo { display:block; font-size:17px; font-weight:700; line-height:1.25 }
.in-corso { border-left:6px solid var(--penna) }
.codice-grande { font-size:34px; font-weight:800; letter-spacing:.12em; font-variant-numeric:tabular-nums }
/* come funziona: quattro passi in fila, ognuno col suo numero (è davvero una sequenza) */
.passi { list-style:none; display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:14px }
.passi li { display:flex; flex-direction:column; gap:2px; font-size:14px; line-height:1.4 }
.passi .n { width:30px; height:30px; border-radius:50%; display:grid; place-items:center; margin-bottom:4px; font-weight:800;
            color:var(--penna); border:2px solid var(--penna) }
.passi b { font-size:15px }
/* lezioni e classi come schede sul foglio */
.schede { list-style:none; display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:12px }
.scheda { display:flex; flex-direction:column; gap:8px; padding:14px; border-radius:var(--raggio); background:var(--superficie);
          border:1px solid var(--filo) }
.disegni { display:flex; gap:6px }
.ico { width:44px; height:44px; border-radius:11px; object-fit:cover; flex:none }
.ico.foglio { display:grid; place-items:center; background:#e9edf3; font-size:24px }
.blocchi-scheda { padding-left:18px; display:flex; flex-direction:column; gap:2px }
.azioni { margin-top:auto }
.faccine { display:flex; flex-wrap:wrap; gap:4px; align-items:center }
.altri { font-size:13px; font-weight:700; color:var(--grigio); padding-left:4px }
.indirizzo { font-size:17px }
</style>
