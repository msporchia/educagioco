<script setup>
// La lezione in corso, per la LIM: il codice enorme e i nomi che si accendono, poi «Via», chi è in che blocco e «Chiudi il blocco»
import { ref, reactive, computed, watch } from 'vue'
import { quaderno, voceDi, classeDi } from './stato.js'
import { diretta, via, avantiTutti, libera, togli, chiudiLezione, cambiaLezione, saltaBlocco, domandePer } from './diretta.js'
import { riassuntoVuoto, bloccoDellaRisposta } from './quaderno.js'
import { posizione, finita, bloccoDi, modoDi, sogliaDi, alleDomande, contaDi } from '../comune/lezione.js'
import { giocoDi, GIOCHI } from '../comune/esercizi.js'
import { ICONE } from '../comune/icone-giochi.js'
import { indirizzoBambini, iniziali, coloreDi } from './utili.js'
import Conferma from './Conferma.vue'
import CodicePerIPc from './CodicePerIPc.vue'
import Aiuto from './Aiuto.vue'
import Altro from './Altro.vue'

const emit = defineEmits(['vai', 'indietro'])
const voceId = quaderno.inCorso?.voce ?? null
const voce = computed(() => (voceId ? voceDi(voceId) : null))
const lezione = computed(() => quaderno.inCorso?.lezione ?? voce.value?.lezione)
const indirizzo = indirizzoBambini()
const messaggio = ref('')
const chiudendo = ref(false)

// prima che il servizio risponda, i nomi della classe spenti
const alunni = computed(() => {
  const dal = diretta.sentito ? diretta.alunni : (voce.value?.alunni ?? []).map(a => ({ ...a, preso: false, collegato: false, dove: null }))
  return dal.map(a => ({ ...a, esito: voce.value?.esiti[a.id] ?? riassuntoVuoto() }))
})
const dentro = computed(() => alunni.value.filter(a => a.collegato).length)
const inAttesa = computed(() => diretta.fase !== 'via')
const nomeClasse = computed(() => classeDi(quaderno.inCorso?.classe ?? '')?.nome ?? voce.value?.nomeClasse ?? '')
const n = computed(() => lezione.value?.blocchi?.length || 1)

// dove sta: la posizione che dice il bambino, almeno il pavimento di «Avanti tutti» (chi è scollegato lo raggiunge al rientro)
const posDi = a => (a.dove === 'finito' ? 'finito' : Number.isInteger(a.dove) ? posizione(a.dove, Math.max(diretta.avanti, a.avanti | 0)) : null)
const fuori = a => (a.collegato ? 'è dentro' : (a.esito.presente ? 'non collegato' : 'non è entrato'))
const giroDi = p => (lezione.value.inTondo ? `giro ${Math.floor(p / n.value) + 1}` : '')
function bloccoDetto(p) {
  if (p === 'finito' || finita(lezione.value, p)) return 'ha finito'
  return [n.value > 1 ? `blocco ${bloccoDi(lezione.value, p) + 1} di ${n.value}` : 'al lavoro', giroDi(p)].filter(Boolean).join(' · ')
}
const doveDi = a => { const p = posDi(a); return p === null ? fuori(a) : bloccoDetto(p) }
// fatte e giuste nel blocco in corso (in tondo, di questo giro), con la soglia se il blocco passa da solo
function inCorsoDi(a) {
  const p = posDi(a)
  if (p === null || p === 'finito' || finita(lezione.value, p)) return null
  const { passa, esercizio } = lezione.value.blocchi[bloccoDi(lezione.value, p)]
  return { fatte: 0, giuste: 0, ...diretta.conti[a.id]?.[p], modo: modoDi(passa), soglia: sogliaDi(passa), cosa: contaDi(esercizio).tante }
}
const puoLiberare = a => a.collegato || a.dove != null || a.esito.presente

/* le sue risposte, da aprire sotto il nome: per blocco, l'ultima in cima. «—» è il giusto caduto senza risposta (gli
   Asteroidi): non ha risposto, che non è uno sbaglio da spiegare */
function risposteDi(a) {
  const lista = [...(diretta.risposte[a.id] ?? [])].sort((x, y) => (y.n ?? 0) - (x.n ?? 0))
    .map(r => ({ ...r, b: bloccoDellaRisposta(r, n.value), esito: r.giusta ? 'si' : r.data === '—' ? 'vuota' : 'no' }))
  const conta = e => lista.filter(r => r.esito === e).length
  const blocchi = Array.from({ length: n.value }, (_, i) => ({ i, righe: lista.filter(r => r.b === i) })).filter(x => x.righe.length)
  return { quante: lista.length, giuste: conta('si'), sbagliate: conta('no'), vuote: conta('vuota'), blocchi }
}
// le schede dei bambini nascono chiuse: nome, dove sta, le barre e i conti, per vedere la classe in un colpo d'occhio; le risposte
// e i comandi si aprono toccando la scheda (segnalato dall'utente: aperte, una sola riempiva lo schermo del telefono)
const aperti = reactive(new Set())
const apri = id => (aperti.has(id) ? aperti.delete(id) : aperti.add(id))
const contiDette = r => [r.giuste && `${r.giuste} giuste`, r.sbagliate && `${r.sbagliate} sbagliate`,
  r.vuote && `${r.vuote} senza risposta`].filter(Boolean).join(' · ')

/* ── a colpo d'occhio: i pallini dei blocchi per ognuno, e la classe divisa per blocco ── */
const qualeBlocco = a => { const p = posDi(a); return p === null ? null : p === 'finito' || finita(lezione.value, p) ? 'finito' : bloccoDi(lezione.value, p) }
// per ogni blocco: fatto, qui, dopo (in tondo, di questo giro); chi non è entrato ha tutti i pallini vuoti
function pallini(a) {
  const b = qualeBlocco(a)
  return Array.from({ length: n.value }, (_, i) => (b === null ? 'dopo' : b === 'finito' || i < b ? 'fatto' : i === b ? 'qui' : 'dopo'))
}
// quanto manca alla soglia del blocco in corso (0..1); null se passa quando lo dice la maestra o a minuti
function soglia(a) {
  const c = inCorsoDi(a)
  if (!c?.soglia || c.modo === 'minuti') return null
  return Math.min(1, (c.modo === 'giuste' ? c.giuste : c.fatte) / c.soglia)
}
const giusteSuFatte = a => { const c = inCorsoDi(a); return c && c.fatte ? c.giuste / c.fatte : null }
const blocchiVisti = computed(() => (lezione.value?.blocchi ?? []).map((b, i) => {
  const g = GIOCHI.find(x => x.id === giocoDi(b.esercizio))
  return { i, nome: g?.nome ?? '', icona: ICONE[g?.id] ?? null, chi: alunni.value.filter(a => qualeBlocco(a) === i) }
}))
const finiti = computed(() => alunni.value.filter(a => qualeBlocco(a) === 'finito'))
const nonDentro = computed(() => alunni.value.filter(a => qualeBlocco(a) === null))

/* «Chiudi il blocco» (nel codice `avanti`, «Avanti tutti»): chiude il blocco dove sta chi è più indietro fra i collegati, e
   chi ci sta passa al dopo; chi è già avanti resta (il servizio: nuovoAvanti). Il tasto dice quale blocco e chi si muove. */
const avantiInutile = computed(() => !!lezione.value && finita(lezione.value, diretta.avanti))
const nomeBlocco = p => [n.value > 1 ? `blocco ${bloccoDi(lezione.value, p) + 1}` : 'blocco', giroDi(p) ? `del ${giroDi(p)}` : ''].filter(Boolean).join(' ')
const chiusura = computed(() => {
  if (!lezione.value) return null
  const qui = alunni.value.filter(a => a.collegato).map(posDi).filter(Number.isInteger)
  const dopo = Math.max(diretta.avanti + 1, (qui.length ? Math.min(...qui) : diretta.avanti) + 1)
  const ora = dopo - 1
  const chi = alunni.value.filter(a => a.collegato && posDi(a) === ora).map(a => a.nome)
  const finisce = finita(lezione.value, dopo)
  const tanti = chi.length > 1
  const dove = finisce ? (tanti ? 'finiscono la lezione' : 'finisce la lezione') : `${tanti ? 'passano' : 'passa'} al ${nomeBlocco(dopo)}`
  return {
    blocco: bloccoDi(lezione.value, ora),
    tasto: `Chiudi il ${nomeBlocco(ora)}`,
    frase: chi.length ? `${elenco(chi)} ${dove}. Chi è già più avanti resta dov'è.${finisce ? ' Se avanza tempo, aggiungi un blocco.' : ''}`
      : `Nessun collegato è lì: chi arriva dopo ${finisce ? 'trova la lezione finita' : `parte dal ${nomeBlocco(dopo)}`}.`,
  }
})
const elenco = nomi => (nomi.length <= 4 ? (nomi.length < 2 ? nomi.join('') : `${nomi.slice(0, -1).join(', ')} e ${nomi.at(-1)}`)
  : `${nomi.slice(0, 3).join(', ')} e altri ${nomi.length - 3}`)
// l'editor sulla lezione in corso: con un blocco nuovo in fondo, o aperto su quello da cambiare
const cambiaAlVolo = (dove = {}) => emit('vai', 'lezione', { inCorso: true, ...dove })
function avanti() { messaggio.value = ''; if (!avantiTutti()) senzaLinea() }

const senzaLinea = () => { messaggio.value = 'Non c\'è linea: riprova fra un attimo.' }
function parti() { messaggio.value = ''; if (!via()) senzaLinea() }
function liberaNome(id) { messaggio.value = ''; if (!libera(id)) senzaLinea() }
function togliNome(id) { messaggio.value = ''; if (!togli(id)) senzaLinea() }

/* ── se qualcosa non va (docs/scuola/ripieghi.md) ── */
const conGiochi = computed(() => !!lezione.value?.blocchi.some(b => giocoDi(b.esercizio) !== 'schede'))
function tuttiAlleDomande() {
  messaggio.value = ''
  const { lezione: l, restano } = alleDomande(lezione.value)
  if (!cambiaLezione(l)) return senzaLinea()
  messaggio.value = restano ? `Fatto. ${restano === 1 ? 'Un blocco esiste' : `${restano} blocchi esistono`} solo dentro il suo gioco: cambialo con «Cambia la lezione».`
    : 'Fatto: da adesso si risponde alle domande, senza giochi.'
}
// le domande al posto del gioco hanno senso se il suo blocco ha un gioco che si può lasciare
const bloccoConGioco = a => { const p = posDi(a); return Number.isInteger(p) && !finita(lezione.value, p) && giocoDi(lezione.value.blocchi[bloccoDi(lezione.value, p)].esercizio) !== 'schede' }
function salta(id) { messaggio.value = ''; if (!saltaBlocco(id)) senzaLinea() }
function domande(a) { messaggio.value = ''; if (!domandePer(a.id, !a.domande)) senzaLinea() }
function chiudi(soloQui = false) {
  messaggio.value = ''
  if (!chiudiLezione({ soloQui })) senzaLinea()
}

// quando la lezione finisce (chiusa da qui, scaduta) si passa al suo resoconto
watch(() => quaderno.inCorso, c => { if (!c && voceId) emit('vai', 'resoconto', { voce: voceId }, { al_posto: true }) }, { immediate: true })
</script>

<template>
  <template v-if="quaderno.inCorso">
    <section class="carta testa" data-diretta>
      <div class="fila tra">
        <span class="cosa"><b>{{ lezione?.nome }}</b><span class="nota">{{ nomeClasse }} · {{ dentro }} su {{ alunni.length }} collegati</span></span>
        <span class="linea" :class="diretta.linea" :data-linea="diretta.linea">{{ diretta.linea === 'su' ? 'collegata' : 'mi ricollego…' }}</span>
      </div>
      <p v-if="diretta.errore" class="avviso">{{ diretta.errore }}</p>
      <p v-if="messaggio" class="avviso" data-messaggio>{{ messaggio }}</p>
    </section>

    <section v-if="inAttesa" class="carta lim" data-sala>
      <p class="invito">Aprite <a :href="indirizzo" target="_blank" rel="noopener" class="copiabile"><b>{{ indirizzo }}</b></a> e scrivete il codice</p>
      <div class="codice copiabile" data-codice><span class="evidenziato">{{ quaderno.inCorso.codice }}</span></div>
      <ul class="nomi">
        <li v-for="a in alunni" :key="a.id" class="nome" :class="{ preso: a.preso, nuovo: a.nuovo }" :data-alunno="a.id" :data-preso="a.preso">
          <span>{{ a.nome }}</span>
          <span v-if="a.nuovo" class="etichetta">nuovo</span>
          <button v-if="!a.nuovo && puoLiberare(a)" class="bottone chiaro piccolo" data-azione="libera" @click="liberaNome(a.id)">Rimetti nella lista</button>
          <Conferma v-if="a.nuovo" etichetta="Togli il nome" domanda="Lo tolgo?" si="Togli" data-azione="togli" @si="togliNome(a.id)" />
        </li>
      </ul>
      <p class="nota">Un nome diventa verde quando un bambino lo tocca. «Rimetti nella lista» <Aiuto testo="Il nome torna libero nella lista e il bambino lo ritocca, da questo PC o da un altro: per un PC che si è rotto o un nome toccato per sbaglio. Le risposte date restano sue." />
        «Togli il nome» <Aiuto testo="Un nome che non è nella tua classe, scritto da un bambino: lo togli, con le sue risposte." /></p>
      <div class="fila centro-fila">
        <button class="bottone grande" data-azione="via" :disabled="!diretta.sentito" @click="parti">Via</button>
      </div>
    </section>

    <template v-else>
      <!-- il codice resta grande per tutta la lezione: chi chiude il browser per sbaglio, o arriva tardi, rientra da qui -->
      <section class="carta codice-sempre" data-codice-sempre>
        <span class="per-chi">Chi rientra o arriva tardi apre <a :href="indirizzo" target="_blank" rel="noopener" class="copiabile"><b>{{ indirizzo }}</b></a>
          e scrive</span>
        <span class="codice-medio copiabile" data-codice><span class="evidenziato">{{ quaderno.inCorso.codice }}</span></span>
      </section>
      <section class="carta">
        <!-- finita per tutti non è un tasto spento: si propone un blocco in più, che chi ha finito trova subito -->
        <div class="fila">
          <button v-if="!avantiInutile" class="bottone" data-azione="avanti-tutti" @click="avanti">{{ chiusura?.tasto }}</button>
          <button v-else class="bottone" :disabled="diretta.linea !== 'su'" data-azione="aggiungi-al-volo" @click="cambiaAlVolo({ aggiungi: true })">＋ Aggiungi un blocco</button>
          <Aiuto v-if="!avantiInutile" testo="Per la campanella o per chi è rimasto indietro: chi è nel blocco più indietro passa al blocco dopo, anche se quel blocco passerebbe da solo. Chi è già più avanti non si muove. Si può premere più volte." />
          <span class="nota" :data-avanti="diretta.avanti">{{ avantiInutile ? 'Tutti hanno finito l\'ultimo blocco: se avanza tempo, aggiungine uno e lo trovano subito.' : chiusura?.frase }}</span>
        </div>
        <!-- la lezione si cambia mentre si gioca: un blocco in più, o uno che non va (anche dalla sua colonna in «La classe») -->
        <div class="fila al-volo">
          <button v-if="!avantiInutile" class="bottone chiaro piccolo" :disabled="diretta.linea !== 'su'" data-azione="aggiungi-al-volo"
                  @click="cambiaAlVolo({ aggiungi: true })">＋ Aggiungi un blocco</button>
          <button class="bottone chiaro piccolo" :disabled="diretta.linea !== 'su'" data-azione="cambia-lezione" @click="cambiaAlVolo()">Cambia la lezione</button>
          <Aiuto testo="Si manda ai bambini senza un codice nuovo: ognuno resta al blocco dove si trova, un blocco cambiato riparte con le domande nuove, e chi aveva finito passa al blocco aggiunto." />
        </div>
      </section>
      <section class="carta" data-panoramica>
        <h2>La classe</h2>
        <div class="colonne">
          <div v-for="b in blocchiVisti" :key="b.i" class="colonna" :class="{ chiude: !avantiInutile && chiusura?.blocco === b.i }" :data-colonna="b.i">
            <div class="testa-colonna">
              <img v-if="b.icona" :src="b.icona.src" alt="" class="ico">
              <span><b>Blocco {{ b.i + 1 }}</b><span class="nota">{{ b.nome }}</span></span>
              <button class="cambia-blocco" :disabled="diretta.linea !== 'su'" :data-cambia-blocco="b.i" @click="cambiaAlVolo({ blocco: b.i })">Cambia</button>
            </div>
            <div class="gente">
              <span v-for="a in b.chi" :key="a.id" class="iniziali" :style="{ '--colore': a.collegato ? coloreDi(a.nome) : 'var(--filo)' }" :title="a.nome">{{ iniziali(a.nome) }}</span>
            </div>
            <span class="quanti">{{ b.chi.length }}</span>
          </div>
          <div class="colonna fine" data-colonna="finito">
            <div class="testa-colonna"><span class="ico bandiera" aria-hidden="true">✓</span><b>Finito</b>
              <button v-if="finiti.length && !lezione?.inTondo" class="cambia-blocco" :disabled="diretta.linea !== 'su'" data-azione="aggiungi-al-volo"
                      @click="cambiaAlVolo({ aggiungi: true })">＋ Blocco</button></div>
            <div class="gente">
              <span v-for="a in finiti" :key="a.id" class="iniziali" :style="{ '--colore': coloreDi(a.nome) }" :title="a.nome">{{ iniziali(a.nome) }}</span>
            </div>
            <span class="quanti">{{ finiti.length }}</span>
          </div>
        </div>
        <p v-if="nonDentro.length" class="nota">Non sono entrati: {{ nonDentro.map(a => a.nome).join(', ') }}</p>
      </section>
      <ul class="bambini" data-pannello>
        <li v-for="a in alunni" :key="a.id" class="carta bambino" :class="{ spento: !a.collegato, aperto: aperti.has(a.id) }" :data-alunno="a.id"
            :data-dove="posDi(a) ?? ''" :data-aperto="aperti.has(a.id)">
          <button type="button" class="testa-bambino" :aria-expanded="aperti.has(a.id)" data-azione="apri-bambino" @click="apri(a.id)">
            <b>{{ a.nome }} <span v-if="a.nuovo" class="etichetta">nuovo</span></b>
            <span class="nota">{{ doveDi(a) }}</span>
            <span class="freccia" aria-hidden="true">{{ aperti.has(a.id) ? '▴' : '▾' }}</span>
          </button>
          <div v-if="n > 1" class="pallini" aria-hidden="true">
            <span v-for="(s, i) in pallini(a)" :key="i" class="pallino" :class="s"></span>
          </div>
          <div v-if="soglia(a) !== null" class="striscia" :title="`${Math.round(soglia(a) * 100)}% della soglia`">
            <span :style="{ width: `${soglia(a) * 100}%` }"></span>
          </div>
          <div v-if="giusteSuFatte(a) !== null" class="esiti" :title="`${inCorsoDi(a).giuste} giuste su ${inCorsoDi(a).fatte}`">
            <span class="si" :style="{ flexGrow: inCorsoDi(a).giuste }"></span><span class="no" :style="{ flexGrow: inCorsoDi(a).fatte - inCorsoDi(a).giuste }"></span>
          </div>
          <p v-if="inCorsoDi(a)" data-blocco-in-corso>
            <template v-if="inCorsoDi(a).modo === 'giuste'"><b>{{ inCorsoDi(a).giuste }}</b> giuste su {{ inCorsoDi(a).soglia }} · {{ inCorsoDi(a).fatte }} fatte</template>
            <template v-else-if="inCorsoDi(a).modo === 'domande'"><b>{{ inCorsoDi(a).fatte }}</b> {{ inCorsoDi(a).cosa }} su {{ inCorsoDi(a).soglia }} · {{ inCorsoDi(a).giuste }} giuste</template>
            <template v-else><b>{{ inCorsoDi(a).fatte }}</b> fatte · <b>{{ inCorsoDi(a).giuste }}</b> giuste</template>
          </p>
          <p v-if="risposteDi(a).quante" class="conti nota" data-conti>{{ contiDette(risposteDi(a)) }}</p>
          <p v-if="a.domande" class="nota" data-solo-domande>Fa le domande al posto del gioco.</p>
          <template v-if="aperti.has(a.id)">
          <div v-if="risposteDi(a).quante" class="risposte" data-risposte>
            <div v-for="x in risposteDi(a).blocchi" :key="x.i" class="blocco-risposte" :data-risposte-blocco="x.i">
              <p v-if="n > 1" class="titoletto">Blocco {{ x.i + 1 }}</p>
              <ul>
                <li v-for="(r, k) in x.righe" :key="k" :class="r.esito" :data-esito="r.esito">
                  <span class="segno" aria-hidden="true">{{ r.esito === 'si' ? '✓' : r.esito === 'no' ? '✗' : '–' }}</span>
                  <span><b>{{ r.fatto }}</b>
                    <template v-if="r.esito === 'si'"><template v-if="r.data && r.data !== '—'">: {{ r.data }}</template></template>
                    <template v-else-if="r.esito === 'no'">: ha detto {{ r.data }}, era {{ r.attesa }}</template>
                    <template v-else>: non ha risposto, era {{ r.attesa }}</template></span>
                </li>
              </ul>
            </div>
          </div>
          <div class="fila">
            <span v-if="a.preso && posDi(a) !== 'finito'" class="comando">
              <button class="bottone chiaro piccolo" data-azione="salta" @click="salta(a.id)">Mandalo al blocco dopo</button>
              <Aiuto testo="Solo lui passa al blocco dopo, gli altri restano dove sono: per chi è bloccato o ha già capito." /></span>
            <span v-if="a.nuovo" class="comando">
              <Conferma etichetta="Togli il nome" domanda="Lo tolgo, con le sue risposte?" si="Togli" data-azione="togli" @si="togliNome(a.id)" />
              <Aiuto testo="Un nome che non è nella tua classe, scritto da un bambino: lo togli, con le sue risposte." /></span>
            <!-- i casi rari: in un menu, ognuno con la sua spiegazione -->
            <Altro v-if="(a.preso && (a.domande || bloccoConGioco(a))) || (!a.nuovo && puoLiberare(a))" class="a-destra">
              <button v-if="a.preso && (a.domande || bloccoConGioco(a))" class="voce-menu" role="menuitem" data-azione="domande" @click="domande(a)">
                <b>{{ a.domande ? 'Rimettigli il gioco' : 'Domande invece del gioco' }}</b>
                <span>{{ a.domande ? 'Torna a giocare allo stesso esercizio.'
                  : 'Se sul suo PC il gioco è lento o non parte: lo stesso esercizio come domande su una scheda.' }}</span></button>
              <button v-if="!a.nuovo && puoLiberare(a)" class="voce-menu" role="menuitem" data-azione="libera" @click="liberaNome(a.id)">
                <b>Rimetti il nome nella lista</b>
                <span>Per cambiare PC, o se ha toccato il nome di un altro: lo ritocca e riparte da dov'era. Le risposte restano sue.</span></button>
            </Altro>
          </div>
          </template>
        </li>
      </ul>
    </template>

    <section class="carta" data-se-non-va>
      <h2>Se qualcosa non va</h2>
      <div class="fila">
        <Conferma v-if="conGiochi" etichetta="Tutti alle domande" domanda="Tolgo i giochi a tutti?" si="Togli i giochi" data-azione="tutti-alle-domande" @si="tuttiAlleDomande" />
      </div>
      <p class="nota">Per cambiare un blocco o aggiungerne uno, i tasti stanno in cima. Per un bambino solo, i comandi stanno sotto il suo nome.</p>
      <CodicePerIPc />
    </section>

    <section class="carta">
      <div v-if="!chiudendo" class="fila">
        <button class="bottone chiaro" data-azione="chiudi-lezione" @click="chiudendo = true">Chiudi lezione</button>
        <button class="bottone chiaro" @click="emit('vai', 'inizio')">Torna al quaderno</button>
      </div>
      <template v-else>
        <p v-if="diretta.linea === 'su'">Chiudo la lezione? Sui PC dei bambini compare «La lezione è finita» e non si risponde più.</p>
        <p v-else>Non c'è linea: posso chiuderla solo qui. I PC dei bambini non lo sapranno. Le risposte arrivate restano su
          questo computer; quelle che mancano le prendi poi dal resoconto con «Recupera i risultati».</p>
        <div class="fila">
          <button v-if="diretta.linea === 'su'" class="bottone rosso" data-azione="conferma-chiudi" @click="chiudi()">Chiudi la lezione</button>
          <button v-else class="bottone rosso" data-azione="chiudi-solo-qui" @click="chiudi(true)">Chiudi solo qui</button>
          <button class="bottone chiaro" data-azione="annulla" @click="chiudendo = false">No, continua</button>
        </div>
      </template>
      <p class="nota">I risultati entrano nello storico man mano che arrivano.</p>
    </section>
  </template>
</template>

<style scoped>
.tra { justify-content:space-between }
.cosa { display:flex; flex-direction:column; gap:2px; min-width:0 }
.linea { font-size:12px; font-weight:600; padding:4px 10px; border-radius:999px; background:var(--tessera); color:var(--grigio) }
.linea.su { color:var(--inchiostro) }
.linea.su::before { content:'●'; color:var(--verde); margin-right:6px }
.lim { align-items:center; text-align:center; gap:18px; padding:24px 16px }
.invito { font-size:clamp(16px, 2.4vw, 26px) }
.codice { font-size:clamp(64px, 16vw, 200px); font-weight:900; letter-spacing:.12em; line-height:1; color:var(--inchiostro);
          font-variant-numeric:tabular-nums; padding-left:.12em }
.nomi { list-style:none; display:flex; flex-wrap:wrap; justify-content:center; gap:8px }
.nome { display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:999px; background:var(--tessera);
        font-size:clamp(15px, 1.8vw, 22px); font-weight:600; color:var(--grigio) }
.nome.preso { background:var(--verde); color:#fff }
.nome.nuovo { box-shadow:inset 0 0 0 2px var(--accento) }
.nome .etichetta { background:var(--superficie); color:var(--inchiostro) }
.centro-fila { justify-content:center }
.bottone.grande { font-size:clamp(20px, 3vw, 32px); padding:14px 56px }
.bambini { list-style:none; display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:12px }
.bambino { gap:6px }
.bambino.spento { opacity:.75 }
.risposte { font-size:13px }
.testa-bambino { display:flex; align-items:baseline; gap:8px; width:100%; padding:0; border:0; background:none; font:inherit;
                 color:inherit; text-align:left; cursor:pointer }
.testa-bambino .nota { margin-left:auto }
.testa-bambino .freccia { color:var(--grigio); font-size:12px }
.bambino.aperto { grid-column:1 / -1 }
.carta.codice-sempre { display:grid; grid-template-columns:minmax(0, 1fr) auto; align-items:center; gap:8px 24px }
.per-chi { font-size:clamp(14px, 1.8vw, 20px) }
.codice-medio { font-size:clamp(44px, 8vw, 88px); font-weight:900; letter-spacing:.12em; line-height:1; font-variant-numeric:tabular-nums }
@media (max-width:560px) { .carta.codice-sempre { grid-template-columns:1fr; justify-items:center; text-align:center } }
.blocco-risposte { margin-top:6px; max-height:240px; overflow-y:auto }
.blocco-risposte .titoletto { font-size:12px; font-weight:700; color:var(--grigio); margin-bottom:2px }
.blocco-risposte ul { list-style:none; display:flex; flex-direction:column; gap:2px }
.blocco-risposte li { display:flex; gap:6px; color:var(--grigio) }
.blocco-risposte .segno { flex:none; width:14px; font-weight:800 }
.blocco-risposte .si .segno { color:var(--verde) }
.blocco-risposte .no .segno { color:var(--rosso) }
.a-destra { margin-left:auto }
.comando { display:inline-flex; align-items:center; gap:4px }
.colonne { display:flex; gap:8px; overflow-x:auto; padding-bottom:4px }
.colonna { flex:1 0 130px; display:flex; flex-direction:column; gap:8px; padding:10px; border-radius:var(--raggio-piccolo); background:var(--tessera) }
.colonna.fine { background:#e6f4ea }
.testa-colonna { display:flex; align-items:center; gap:8px; font-size:14px }
.testa-colonna > span { display:flex; flex-direction:column }
.ico { width:32px; height:32px; border-radius:8px; object-fit:cover; flex:none }
.bandiera { display:grid; place-items:center; background:var(--verde); color:#fff; font-weight:700 }
.gente { display:flex; flex-wrap:wrap; gap:4px; min-height:30px }
.quanti { font-size:22px; font-weight:700; color:var(--grigio); align-self:flex-end; line-height:1 }
.pallini { display:flex; gap:4px }
.pallino { flex:1; height:8px; border-radius:4px; background:var(--tessera) }
.pallino.fatto { background:var(--verde) }
.pallino.qui { background:var(--accento) }
.striscia { height:10px; border-radius:5px; background:var(--tessera); overflow:hidden }
.striscia span { display:block; height:100%; background:var(--accento); border-radius:5px }
.esiti { display:flex; height:6px; border-radius:3px; overflow:hidden; gap:1px }
.esiti .si { background:var(--verde) } .esiti .no { background:var(--rosso) }
.colonna.chiude { box-shadow:inset 0 0 0 2px var(--penna) }
.cambia-blocco { margin-left:auto; flex:none; padding:3px 9px; border-radius:999px; border:1px solid var(--filo); background:var(--superficie);
                 font:inherit; font-size:12px; font-weight:600; color:var(--penna); cursor:pointer }
.cambia-blocco:disabled { opacity:.45 }
.al-volo { margin-top:2px }
</style>
