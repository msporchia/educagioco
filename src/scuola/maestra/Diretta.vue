<script setup>
// La lezione in corso, per la LIM: il codice enorme e i nomi che si accendono, poi «Via», chi è in che blocco e «Avanti tutti»
import { ref, computed, watch } from 'vue'
import { quaderno, voceDi, classeDi } from './stato.js'
import { diretta, via, avantiTutti, libera, togli, chiudiLezione } from './diretta.js'
import { riassuntoVuoto } from './quaderno.js'
import { posizione, finita, bloccoDi, modoDi, sogliaDi } from '../comune/lezione.js'
import { indirizzoBambini } from './utili.js'
import Conferma from './Conferma.vue'

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
const posDi = a => (a.dove === 'finito' ? 'finito' : Number.isInteger(a.dove) ? posizione(a.dove, diretta.avanti) : null)
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
  const passa = lezione.value.blocchi[bloccoDi(lezione.value, p)].passa
  return { fatte: 0, giuste: 0, ...diretta.conti[a.id]?.[p], modo: modoDi(passa), soglia: sogliaDi(passa) }
}
const puoLiberare = a => a.collegato || a.dove != null || a.esito.presente

// «Avanti tutti» alza il pavimento: dopo, nessuno sta prima della posizione avanti + 1
const avantiInutile = computed(() => !!lezione.value && finita(lezione.value, diretta.avanti))
const dopoAvanti = computed(() => {
  const p = diretta.avanti + 1
  if (!lezione.value || finita(lezione.value, p)) return 'Chi è ancora all\'ultimo blocco finisce la lezione.'
  const dove = [n.value > 1 ? `blocco ${bloccoDi(lezione.value, p) + 1}` : '', giroDi(p)].filter(Boolean).join(', ')
  return `Chi è più indietro passa al ${dove}.`
})
function avanti() { messaggio.value = ''; if (!avantiTutti()) senzaLinea() }

const senzaLinea = () => { messaggio.value = 'Non c\'è linea: riprova fra un attimo.' }
function parti() { messaggio.value = ''; if (!via()) senzaLinea() }
function liberaNome(id) { messaggio.value = ''; if (!libera(id)) senzaLinea() }
function togliNome(id) { messaggio.value = ''; if (!togli(id)) senzaLinea() }
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
      <p class="invito">Aprite <b class="copiabile">{{ indirizzo }}</b> e scrivete il codice</p>
      <div class="codice copiabile" data-codice>{{ quaderno.inCorso.codice }}</div>
      <ul class="nomi">
        <li v-for="a in alunni" :key="a.id" class="nome" :class="{ preso: a.preso, nuovo: a.nuovo }" :data-alunno="a.id" :data-preso="a.preso">
          <span>{{ a.nome }}</span>
          <span v-if="a.nuovo" class="etichetta">nuovo</span>
          <button v-if="!a.nuovo && puoLiberare(a)" class="bottone chiaro piccolo" data-azione="libera" @click="liberaNome(a.id)">Libera</button>
          <Conferma v-if="a.nuovo" etichetta="Togli" domanda="Lo tolgo?" si="Togli" data-azione="togli" @si="togliNome(a.id)" />
        </li>
      </ul>
      <p class="nota">Un nome diventa verde quando un bambino lo tocca. «Libera» lo rimette nella lista (un PC rotto, un nome sbagliato);
        «Togli» manda via un nome nuovo che non conosci.</p>
      <div class="fila centro-fila">
        <button class="bottone grande" data-azione="via" :disabled="!diretta.sentito" @click="parti">Via</button>
      </div>
    </section>

    <template v-else>
      <section class="carta">
        <p class="nota">Chi arriva tardi: <b class="copiabile">{{ indirizzo }}</b>, codice <b class="copiabile" data-codice>{{ quaderno.inCorso.codice }}</b></p>
        <div class="fila">
          <button class="bottone" :disabled="avantiInutile" data-azione="avanti-tutti" @click="avanti">Avanti tutti</button>
          <span class="nota" :data-avanti="diretta.avanti">{{ avantiInutile ? 'Tutti hanno finito l\'ultimo blocco.' : dopoAvanti }}
            {{ diretta.avanti === 0 ? '' : diretta.avanti === 1 ? 'Premuto una volta.' : `Premuto ${diretta.avanti} volte.` }}</span>
        </div>
      </section>
      <ul class="bambini" data-pannello>
        <li v-for="a in alunni" :key="a.id" class="carta bambino" :class="{ spento: !a.collegato }" :data-alunno="a.id" :data-dove="posDi(a) ?? ''">
          <div class="fila tra">
            <b>{{ a.nome }} <span v-if="a.nuovo" class="etichetta">nuovo</span></b>
            <span class="nota">{{ doveDi(a) }}</span>
          </div>
          <p v-if="inCorsoDi(a)" data-blocco-in-corso>
            <template v-if="inCorsoDi(a).modo === 'giuste'"><b>{{ inCorsoDi(a).giuste }}</b> giuste su {{ inCorsoDi(a).soglia }} · {{ inCorsoDi(a).fatte }} fatte</template>
            <template v-else-if="inCorsoDi(a).modo === 'domande'"><b>{{ inCorsoDi(a).fatte }}</b> fatte su {{ inCorsoDi(a).soglia }} · {{ inCorsoDi(a).giuste }} giuste</template>
            <template v-else><b>{{ inCorsoDi(a).fatte }}</b> fatte · <b>{{ inCorsoDi(a).giuste }}</b> giuste</template>
          </p>
          <ul v-if="a.esito.ultime.length" class="sbagliate" data-ultime-sbagliate>
            <li v-for="(s, i) in a.esito.ultime" :key="i"><b>{{ s.fatto }}</b>: ha detto {{ s.data }}, era {{ s.attesa }}<span v-if="n > 1"> (blocco {{ s.blocco + 1 }})</span></li>
          </ul>
          <div class="fila">
            <button v-if="!a.nuovo && puoLiberare(a)" class="bottone chiaro piccolo" data-azione="libera" @click="liberaNome(a.id)">Libera</button>
            <Conferma v-if="a.nuovo" etichetta="Togli" domanda="Lo tolgo, con le sue risposte?" si="Togli" data-azione="togli" @si="togliNome(a.id)" />
          </div>
        </li>
      </ul>
    </template>

    <section class="carta">
      <div v-if="!chiudendo" class="fila">
        <button class="bottone chiaro" data-azione="chiudi-lezione" @click="chiudendo = true">Chiudi lezione</button>
        <button class="bottone chiaro" @click="emit('vai', 'inizio')">Torna al quaderno</button>
      </div>
      <template v-else>
        <p v-if="diretta.linea === 'su'">Chiudo la lezione? Sui PC dei bambini compare «La lezione è finita» e non si risponde più.</p>
        <p v-else>Non c'è linea: posso chiuderla solo qui. I PC dei bambini non lo sapranno, e i risultati che mancano
          si recuperano dal resoconto entro tre ore dall'avvio.</p>
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
.sbagliate { list-style:none; font-size:13px; color:var(--grigio); display:flex; flex-direction:column; gap:2px }
</style>
