<script setup>
// La pagina d'inizio: come funziona, la pagina dei bambini, classi, lezioni, storico e il file del quaderno. All'inizio a passi:
// prima la classe, poi la prima lezione, e solo con tutte e due il resto (docs/scuola/quaderno.md, «I primi passi»)
import { ref, computed } from 'vue'
import { quaderno, salva } from './stato.js'
import * as Q from './quaderno.js'
import { lezioneValida, classiNelloStorico } from './quaderno.js'
import { indirizzoBambini, paginaMaestra, copia, scarica, iniziali, coloreDi, provaLezione, vociDelBlocco } from './utili.js'
import { descriviPassa } from '../comune/lezione.js'
import { ICONE } from '../comune/icone-giochi.js'
import CodicePerIPc from './CodicePerIPc.vue'
import Altro from './Altro.vue'

const emit = defineEmits(['vai', 'indietro'])
const indirizzo = indirizzoBambini()
const storico = computed(() => classiNelloStorico(quaderno))
const lezioneInCorso = computed(() => quaderno.inCorso?.lezione)
const copiato = ref('')            // id della lezione il cui link è appena stato copiato
const daCopiare = ref('')          // il link, quando il browser non lascia copiare
const esitoFile = ref({ bene: '', male: '' })
const scelta = ref(null)
const daCancellare = ref('')     // la lezione che chiede «Cancello?» sotto il suo nome
// a che passo è: senza classe non si va avanti, poi la prima lezione; con tutte e due la pagina intera
const passo = computed(() => (!quaderno.classi.length ? 'classe' : !quaderno.lezioni.length ? 'lezione' : 'fatti'))

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
      <li><span class="n">2</span><b>Apri sui PC</b><span>la pagina dei bambini,
        <a :href="indirizzo" target="_blank" rel="noopener" class="copiabile" data-indirizzo-passi>{{ indirizzo }}</a>, o il file con la chiavetta.</span></li>
      <li><span class="n">3</span><b>Avvia</b><span>e scrivi il codice alla lavagna: ogni bambino lo scrive e tocca il suo nome.</span></li>
      <li><span class="n">4</span><b>Via!</b><span>Vedi a che punto è ognuno; alla fine chiudi e hai il resoconto.</span></li>
    </ol>
  </section>

  <section v-if="passo !== 'fatti'" class="carta" data-primi-passi :data-passo="passo">
    <h2>Per cominciare</h2>
    <ol class="primi">
      <li :class="quaderno.classi.length ? 'fatto' : 'ora'" data-primo-passo="classe">
        <span class="segno" aria-hidden="true">{{ quaderno.classi.length ? '✓' : '1' }}</span>
        <span class="cosa"><b>La classe</b>
          <span v-if="quaderno.classi.length" class="nota">{{ quaderno.classi[0].nome }}, {{ quaderno.classi[0].alunni.length === 1 ? 'un bambino' : `${quaderno.classi[0].alunni.length} bambini` }}</span>
          <span v-else>Il suo nome e i nomi dei bambini: ognuno toccherà il suo per entrare.</span></span>
        <button v-if="quaderno.classi.length" class="bottone chiaro piccolo" data-azione="modifica-classe"
                @click="emit('vai', 'classe', { id: quaderno.classi[0].id })">Modifica</button>
        <button v-else class="bottone" data-azione="nuova-classe" @click="emit('vai', 'classe', { id: null })">Crea la classe</button>
      </li>
      <li :class="quaderno.lezioni.length ? 'fatto' : passo === 'lezione' ? 'ora' : 'dopo'" data-primo-passo="lezione">
        <span class="segno" aria-hidden="true">{{ quaderno.lezioni.length ? '✓' : '2' }}</span>
        <span class="cosa"><b>La prima lezione</b>
          <span v-if="quaderno.lezioni.length" class="nota">{{ quaderno.lezioni[0].nome }}</span>
          <span v-else>A che gioco, cosa si chiede, quando si va avanti.</span></span>
        <button v-if="passo === 'lezione'" class="bottone" data-azione="nuova-lezione" @click="emit('vai', 'lezione', { id: null })">Prepara la lezione</button>
      </li>
    </ol>
    <p class="nota">Fatte tutte e due, qui trovi le lezioni da avviare, la pagina per i PC dei bambini, lo storico e il quaderno.</p>
    <!-- su un PC nuovo si riparte dal file: aprirlo non può aspettare la classe -->
    <p class="fila nota">Hai già il file del quaderno da un altro computer?
      <button class="bottone chiaro piccolo" data-azione="apri-quaderno" @click="scelta.click()">Apri il quaderno</button></p>
    <p v-if="esitoFile.male" class="avviso" data-esito-file="male">{{ esitoFile.male }}</p>
  </section>

  <template v-if="passo === 'fatti'">
  <section class="carta" data-lezioni>
    <div class="fila tra">
      <h2>Le lezioni</h2>
      <button class="bottone" data-azione="nuova-lezione" @click="emit('vai', 'lezione', { id: null })">Nuova lezione</button>
    </div>
    <p v-if="!quaderno.lezioni.length" class="nota">Ancora nessuna lezione: con «Nuova lezione» scegli il gioco e cosa si chiede.</p>
    <!-- una lezione per riga, su tutta la larghezza: il nome e i tasti in testa, sotto un riquadro per blocco col suo gioco e le
         cose che si chiedono una per riga (segnalato dall'utente: la scheda stretta faceva una frase unica illeggibile) -->
    <ul v-else class="lezioni">
      <li v-for="l in quaderno.lezioni" :key="l.id" class="lezione" :data-lezione="l.id">
        <div class="testa-lezione">
          <b class="titolo">{{ l.nome }}</b>
          <!-- in vista solo «Avvia»; il resto nel «⋯», ogni voce con la sua riga che dice a cosa serve (segnalato dall'utente: sei
               tasti in fila non si capivano) -->
          <span class="fila azioni">
            <span v-if="copiato === l.id" class="nota" data-link-copiato>Link copiato</span>
            <button class="bottone piccolo" data-azione="avvia" :disabled="!lezioneValida(l) || !!quaderno.inCorso"
                    @click="emit('vai', 'avvia', { lezione: l })">Avvia</button>
            <Altro>
              <button class="voce-menu" role="menuitem" data-azione="modifica-lezione" @click="emit('vai', 'lezione', { id: l.id })">
                <b>Modifica</b><span>Cambia giochi, domande e blocchi.</span></button>
              <button class="voce-menu" role="menuitem" data-azione="prova-lezione" :disabled="!lezioneValida(l)" @click="provaLezione(l)">
                <b>Provala tu</b><span>Si apre la pagina dei bambini con la lezione già partita: la giochi come un bambino, e non arriva niente a nessuno.</span></button>
              <button class="voce-menu" role="menuitem" data-azione="duplica" @click="duplica(l.id)">
                <b>Duplica</b><span>Una copia da cambiare; questa resta com'è.</span></button>
              <button class="voce-menu" role="menuitem" data-azione="copia-link" :disabled="!lezioneValida(l)" @click="copiaLink(l)">
                <b>Copia il link per una collega</b><span>Lo mandi per posta o in chat: chi lo apre nella sua pagina della maestra aggiunge la lezione al suo quaderno. È lungo: si incolla, non si detta.</span></button>
              <button class="voce-menu" role="menuitem" data-azione="cancella-lezione" @click="daCancellare = l.id">
                <b>Cancella</b><span>La toglie dal quaderno; le volte che l'hai fatta restano nello storico.</span></button>
            </Altro>
          </span>
        </div>
        <p v-if="daCancellare === l.id" class="fila conferma-cancella" data-conferma-cancella>
          <span>Cancello «{{ l.nome }}»?</span>
          <button class="bottone rosso piccolo" data-azione="conferma" @click="cancella(l.id); daCancellare = ''">Cancella</button>
          <button class="bottone chiaro piccolo" data-azione="annulla" @click="daCancellare = ''">No</button>
        </p>
        <ol class="blocchi-lezione">
          <li v-for="(b, i) in l.blocchi" :key="i" class="blocco-lezione" :data-blocco-lezione="i">
            <img v-if="ICONE[vociDelBlocco(b.esercizio).gioco?.id]" :src="ICONE[vociDelBlocco(b.esercizio).gioco.id].src" alt="" class="ico">
            <span v-else class="ico foglio" aria-hidden="true">📝</span>
            <span class="dentro">
              <b>{{ l.blocchi.length > 1 ? `${i + 1}. ` : '' }}{{ vociDelBlocco(b.esercizio).gioco?.nome ?? 'Esercizio non valido' }}</b>
              <ul class="voci"><li v-for="(v, k) in vociDelBlocco(b.esercizio).voci" :key="k">{{ v }}</li></ul>
              <span class="nota">{{ [vociDelBlocco(b.esercizio).difficolta, l.blocchi.length > 1 ? `si passa ${descriviPassa(b.passa, b.esercizio)}` : 'finché chiudi la lezione'].filter(Boolean).join(' · ') }}</span>
            </span>
          </li>
        </ol>
        <p v-if="l.inTondo" class="nota">In tondo: dopo l'ultimo blocco si ricomincia dal primo.</p>
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
    <!-- un link vero: la maestra la apre da qui per guardarla, e l'indirizzo resta da copiare -->
    <p class="copiabile indirizzo"><a :href="indirizzo" target="_blank" rel="noopener" data-indirizzo-bambini><b>{{ indirizzo }}</b></a></p>
    <p class="nota">Sui PC lenti parte prima dal file: copialo con la chiavetta e aprilo con un doppio click. È uguale per tutte le classi.</p>
    <div class="fila">
      <a class="bottone chiaro" href="./index.html" download="educagioco-classe.html" data-azione="scarica-pagina-bambini">Scarica il file per i PC dei bambini</a>
    </div>
    <CodicePerIPc />
    <!-- la prova di un PC della classe: la pagina dei bambini aperta sulla prova, che ai bambini non si mostra (docs/scuola/prova-computer.md) -->
    <h3>Prova un computer della classe</h3>
    <p class="nota">Apri questo indirizzo sul computer da provare: i giochi girano da soli per tre-quattro minuti, poi premi «Invia il resoconto».</p>
    <p class="copiabile indirizzo"><a :href="indirizzo + '#prova-computer'" target="_blank" rel="noopener" data-azione="prova-computer"><b>{{ indirizzo }}#prova-computer</b></a></p>
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
    </div>
    <p v-if="esitoFile.bene" class="bene" data-esito-file="bene">{{ esitoFile.bene }}</p>
    <p v-if="esitoFile.male" class="avviso" data-esito-file="male">{{ esitoFile.male }}</p>
    <p class="nota">Aprire un quaderno non cancella niente: aggiunge quello che manca e aggiorna quello che c'è già.</p>
  </section>
  </template>
  <input ref="scelta" type="file" accept=".json,application/json" hidden data-file-quaderno @change="apriFile">
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
.ico { width:44px; height:44px; border-radius:11px; object-fit:cover; flex:none }
.ico.foglio { display:grid; place-items:center; background:#e9edf3; font-size:24px }
/* le lezioni: una per riga; i blocchi in riquadri affiancati quanto ci stanno */
.lezioni { list-style:none; display:flex; flex-direction:column; gap:12px }
.lezione { display:flex; flex-direction:column; gap:10px; padding:14px; border-radius:var(--raggio); background:var(--superficie);
           border:1px solid var(--filo) }
.testa-lezione { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px 16px }
.testa-lezione .azioni { flex-wrap:wrap }
.blocchi-lezione { list-style:none; display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:10px }
.blocco-lezione { display:flex; gap:12px; align-items:flex-start; padding:10px 12px; border-radius:var(--raggio-piccolo);
                  background:var(--penna-chiara, var(--tessera)) }
.blocco-lezione .dentro { display:flex; flex-direction:column; gap:4px; min-width:0; font-size:14px }
.voce-menu:disabled { opacity:.45; cursor:default }
.conferma-cancella { font-size:14px }
.voci { padding-left:18px; display:flex; flex-direction:column; gap:2px; line-height:1.35 }
.faccine { display:flex; flex-wrap:wrap; gap:4px; align-items:center }
.altri { font-size:13px; font-weight:700; color:var(--grigio); padding-left:4px }
.indirizzo { font-size:17px }
/* i primi passi: quello da fare in blu, i fatti con la spunta verde, quello dopo spento */
.primi { list-style:none; display:flex; flex-direction:column; gap:10px }
.primi li { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:var(--raggio-piccolo); border:1px solid var(--filo) }
.primi .cosa { flex:1; display:flex; flex-direction:column; gap:2px; font-size:14px }
.primi .cosa b { font-size:16px }
.primi .segno { width:32px; height:32px; flex:none; border-radius:50%; display:grid; place-items:center; font-weight:800;
                color:var(--penna); border:2px solid var(--penna) }
.primi .ora { border:2px solid var(--penna); background:var(--penna-chiara) }
.primi .fatto .segno { color:#fff; background:var(--corretto); border-color:var(--corretto) }
.primi .dopo { opacity:.5 }
</style>
