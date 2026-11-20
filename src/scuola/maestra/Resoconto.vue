<script setup>
// Il resoconto di una lezione: per bambino e per blocco, le domande più sbagliate della classe, stampa e CSV
import { ref, computed } from 'vue'
import { quaderno, salva, voceDi, classeDi } from './stato.js'
import { recupera } from './diretta.js'
import * as Q from './quaderno.js'
import { scarica, giorno, ora, comeSiSvolge } from './utili.js'
import { descriviBlocco, modoDi, sogliaDi } from '../comune/lezione.js'
import Aiuto from './Aiuto.vue'

const props = defineProps({ voce: { type: String, required: true } })
const emit = defineEmits(['vai', 'indietro'])
const v = computed(() => voceDi(props.voce))
const righe = computed(() => (v.value ? Q.righeResoconto(v.value) : []))
const sbagliate = computed(() => (v.value ? Q.piuSbagliate(v.value) : []))
const classe = computed(() => (v.value ? classeDi(v.value.classe) : null))
const viva = computed(() => quaderno.inCorso?.voce === props.voce)
const recuperabile = computed(() => !viva.value && Q.recuperabile(v.value, Date.now()))
const blocchi = computed(() => v.value?.lezione.blocchi ?? [])
// la soglia non raggiunta di un blocco che passa da solo (in tondo i giri si sommano: non si dice)
function sotto(i, c) {
  const passa = blocchi.value[i]?.passa ?? null, n = sogliaDi(passa), modo = modoDi(passa)
  if (v.value.lezione.inTondo || !n || modo === 'minuti') return ''
  return (modo === 'giuste' ? c.giuste : c.fatte) < n ? ` (su ${n} ${modo})` : ''
}
const recuperando = ref(false)
const esitoRecupero = ref('')

const ESITI = { ok: 'Fatto: adesso ci sono anche le risposte che mancavano.', scaduta: 'Le risposte che mancavano non si possono più chiedere: sono passate tre ore. Quelle che vedi restano qui.',
                rete: 'Non riesco a collegarmi: riprova fra poco.' }
async function recuperaRisultati() {
  recuperando.value = true
  esitoRecupero.value = ESITI[await recupera(v.value)]
  recuperando.value = false
}

const inClasse = id => !!classe.value?.alunni.some(a => a.id === id)
function aggiungi(r) {
  if (Q.aggiungiAllaClasse(quaderno, v.value.classe, r)) salva(['classi'])
}
function csv() {
  const nome = `resoconto-${(v.value.nomeClasse || 'classe').replace(/[^\p{L}\p{N}]+/gu, '-')}-${new Date(v.value.avviata).toISOString().slice(0, 10)}.csv`
  scarica(nome, '﻿' + Q.csvResoconto(v.value), 'text/csv;charset=utf-8')
}
const fatteGiuste = p => (p.fatte ? `${p.fatte} fatte, ${p.giuste} giuste` : '—')
const stampa = () => globalThis.print()
</script>

<template>
  <p v-if="!v" class="nota">Questa lezione non c'è più nel quaderno.</p>
  <template v-else>
    <section class="carta" data-resoconto>
      <h1>{{ v.lezione.nome }}</h1>
      <p>{{ v.nomeClasse }} · {{ giorno(v.avviata) }}, {{ ora(v.avviata) }}</p>
      <p v-for="(r, i) in comeSiSvolge(v.lezione)" :key="i" class="nota">{{ r }}</p>
      <div v-if="viva" class="fila no-stampa">
        <span class="bene">La lezione è ancora in corso: i numeri crescono.</span>
        <button class="bottone chiaro piccolo" @click="emit('vai', 'diretta')">Torna alla lezione</button>
      </div>
      <div class="fila no-stampa">
        <button class="bottone" data-azione="stampa" @click="stampa">Stampa</button>
        <button class="bottone chiaro" data-azione="csv" @click="csv">Scarica CSV</button>
        <span v-if="recuperabile" class="fila">
          <button class="bottone chiaro" :disabled="recuperando" data-azione="recupera" @click="recuperaRisultati">
            {{ recuperando ? 'Mi collego…' : 'Recupera i risultati' }}</button>
          <Aiuto testo="Se durante la lezione è caduta la rete, qualche risposta può non essere arrivata qui: questo tasto la va a prendere. Si può fare per tre ore dall'avvio della lezione." />
        </span>
      </div>
      <p class="nota no-stampa">La lezione e i risultati sono salvati su questo computer, nel quaderno.</p>
      <p v-if="esitoRecupero" class="nota no-stampa" data-esito-recupero>{{ esitoRecupero }}</p>
    </section>

    <section class="carta">
      <h2>Bambino per bambino</h2>
      <div class="scorre">
        <table class="tabella" data-tabella-resoconto>
          <thead><tr><th>Bambino</th>
            <th v-for="(b, i) in blocchi" :key="i" :title="descriviBlocco(b)">{{ blocchi.length > 1 ? `Blocco ${i + 1}` : 'Fatte e giuste' }}</th>
            <th>Sbaglia</th></tr></thead>
          <tbody>
            <tr v-for="r in righe" :key="r.id" :data-alunno="r.id">
              <td>
                <b>{{ r.nome }}</b> <span v-if="r.nuovo" class="etichetta">nuovo</span>
                <div v-if="r.nuovo && classe && !inClasse(r.id)" class="no-stampa">
                  <button class="bottone chiaro piccolo" data-azione="aggiungi-alla-classe" @click="aggiungi(r)">Aggiungi alla classe</button>
                </div>
              </td>
              <template v-if="r.presente">
                <td v-for="(c, i) in r.blocchi" :key="i" :data-blocco="i">{{ fatteGiuste(c) }}<span v-if="c.fatte" class="nota">{{ sotto(i, c) }}</span></td>
                <td><span v-for="(s, i) in r.sbagliate" :key="i" class="sbaglio">{{ s.fatto }} → {{ s.attesa }}<template v-if="s.volte > 1"> ({{ s.volte }})</template></span></td>
              </template>
              <td v-else :colspan="r.blocchi.length + 1" class="nota">non c'era</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="carta" data-piu-sbagliate>
      <h2>Le domande più sbagliate</h2>
      <p v-if="!sbagliate.length" class="nota">Nessuna domanda sbagliata.</p>
      <ol v-else class="lista">
        <li v-for="(s, i) in sbagliate" :key="i"><b>{{ s.fatto }}</b> → {{ s.attesa }}
          <span class="nota">· {{ s.quanti === 1 ? 'un bambino' : `${s.quanti} bambini` }}, {{ s.volte === 1 ? 'una volta' : `${s.volte} volte` }}</span></li>
      </ol>
    </section>
  </template>
</template>

<style scoped>
.sbaglio { display:block; font-size:13px }
.lista { padding-left:22px; display:flex; flex-direction:column; gap:4px }
</style>
