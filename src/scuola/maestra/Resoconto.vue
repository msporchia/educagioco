<script setup>
// Il resoconto di una lezione: per bambino e per blocco, le domande più sbagliate della classe, stampa e CSV
import { ref, computed } from 'vue'
import { quaderno, salva, voceDi, classeDi } from './stato.js'
import { recupera } from './diretta.js'
import * as Q from './quaderno.js'
import { scarica, giorno, ora, iniziali, coloreDi } from './utili.js'
import { descriviBlocco, modoDi, sogliaDi } from '../comune/lezione.js'
import { giocoDi, GIOCHI, descrivi } from '../comune/esercizi.js'
import { descriviPassa } from '../comune/lezione.js'
import { ICONE } from '../comune/icone-giochi.js'
import Aiuto from './Aiuto.vue'
import Sbaglio from './Sbaglio.vue'

const props = defineProps({ voce: { type: String, required: true } })
const emit = defineEmits(['vai', 'indietro'])
const v = computed(() => voceDi(props.voce))
const righe = computed(() => (v.value ? Q.righeResoconto(v.value) : []))
const sbagliate = computed(() => (v.value ? Q.piuSbagliate(v.value) : []))
// cosa ha detto, in parole: «8, 7», o «nessuna risposta» se la domanda è andata senza (il sasso caduto)
const dettePerStampa = dette => { const l = (dette || []).filter(d => d && d !== '—'); return l.length ? `ha detto ${l.join(', ')}` : 'nessuna risposta' }
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

/* ── a colpo d'occhio: la classe in tre numeri, i blocchi col loro gioco, una riga per bambino con le barre ── */
const presenti = computed(() => righe.value.filter(r => r.presente))
const somma = (lista, k) => lista.reduce((n, r) => n + r.blocchi.reduce((m, c) => m + c[k], 0), 0)
const percento = (g, f) => (f ? Math.round(g / f * 100) : null)
const classeIntera = computed(() => ({ fatte: somma(presenti.value, 'fatte'), giuste: somma(presenti.value, 'giuste') }))
const tutte = r => ({ fatte: r.blocchi.reduce((n, c) => n + c.fatte, 0), giuste: r.blocchi.reduce((n, c) => n + c.giuste, 0) })
// il colore del voto: verde da 80 su cento, giallo da 50, se no rosso
const tono = p => (p === null ? '' : p >= 80 ? 'alto' : p >= 50 ? 'medio' : 'basso')
const blocchiVisti = computed(() => blocchi.value.map((b, i) => {
  const g = GIOCHI.find(x => x.id === giocoDi(b.esercizio))
  return { i, gioco: g?.nome ?? '', icona: ICONE[g?.id] ?? null, cosa: descrivi(b.esercizio), passa: descriviPassa(b.passa, b.esercizio) }
}))
const stampa = () => globalThis.print()
</script>

<template>
  <p v-if="!v" class="nota">Questa lezione non c'è più nel quaderno.</p>
  <template v-else>
    <section class="carta" data-resoconto>
      <h1>{{ v.lezione.nome }}</h1>
      <p class="quando">{{ v.nomeClasse }}, {{ giorno(v.avviata) }} alle {{ ora(v.avviata) }}</p>
      <div class="numeri">
        <span class="numero"><b>{{ presenti.length }}</b> su {{ righe.length }} bambini</span>
        <span class="numero"><b>{{ classeIntera.fatte }}</b> risposte</span>
        <span v-if="classeIntera.fatte" class="numero" :class="`tono-${tono(percento(classeIntera.giuste, classeIntera.fatte))}`">
          <b>{{ percento(classeIntera.giuste, classeIntera.fatte) }}%</b> giuste</span>
      </div>
      <ol class="blocchi-lezione">
        <li v-for="b in blocchiVisti" :key="b.i">
          <img v-if="b.icona" :src="b.icona.src" alt="" class="ico">
          <span v-else class="ico foglio" aria-hidden="true">📝</span>
          <span><span><b>{{ blocchiVisti.length > 1 ? `Blocco ${b.i + 1}` : b.gioco }}</b><template v-if="blocchiVisti.length > 1">, {{ b.gioco }}</template></span>
            <span class="nota">{{ b.cosa }}, {{ b.passa }}</span></span>
        </li>
      </ol>
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
      <ul class="pagella" data-pagella>
        <li v-for="r in righe" :key="r.id" class="bimbo" :class="{ assente: !r.presente }" :data-alunno="r.id">
          <span class="iniziali" :style="{ '--colore': r.presente ? coloreDi(r.nome) : 'var(--filo)' }" aria-hidden="true">{{ iniziali(r.nome) }}</span>
          <span class="chi">
            <b>{{ r.nome }}</b> <span v-if="r.nuovo" class="etichetta">nuovo</span>
            <button v-if="r.nuovo && classe && !inClasse(r.id)" class="bottone chiaro piccolo no-stampa" data-azione="aggiungi-alla-classe" @click="aggiungi(r)">Aggiungi alla classe</button>
          </span>
          <template v-if="r.presente">
            <span class="barre">
              <span v-for="(c, i) in r.blocchi" :key="i" class="blocco-bimbo" :data-blocco="i">
                <span class="striscia" :title="fatteGiuste(c)">
                  <span class="si" :style="{ flexGrow: c.giuste }"></span><span class="no" :style="{ flexGrow: c.fatte - c.giuste }"></span>
                </span>
                <span class="nota">{{ blocchi.length > 1 ? `${i + 1}: ` : '' }}{{ c.fatte ? `${c.giuste} ${c.giuste === 1 ? 'giusta' : 'giuste'} su ${c.fatte}` : 'niente' }}{{ c.fatte ? sotto(i, c) : '' }}</span>
              </span>
            </span>
            <span class="voto" :class="tono(percento(tutte(r).giuste, tutte(r).fatte))">{{ percento(tutte(r).giuste, tutte(r).fatte) ?? '–' }}<small v-if="tutte(r).fatte">%</small></span>
            <span v-if="r.sbagliate.length" class="sbagli">
              <Sbaglio v-for="(x, i) in r.sbagliate" :key="i" :fatto="x.fatto" :dette="x.dette" :attesa="x.attesa" :volte="x.volte" />
            </span>
          </template>
          <span v-else class="nota">non c'era</span>
        </li>
      </ul>

      <!-- per la stampa e per chi la vuole a tabella: la stessa cosa in righe e colonne -->
      <div class="scorre solo-stampa">
        <table class="tabella" data-tabella-resoconto>
          <thead><tr><th>Bambino</th>
            <th v-for="(b, i) in blocchi" :key="i" :title="descriviBlocco(b)">{{ blocchi.length > 1 ? `Blocco ${i + 1}` : 'Fatte e giuste' }}</th>
            <th>Sbaglia</th></tr></thead>
          <tbody>
            <tr v-for="r in righe" :key="r.id" :data-alunno="r.id">
              <td><b>{{ r.nome }}</b> <span v-if="r.nuovo" class="etichetta">nuovo</span></td>
              <template v-if="r.presente">
                <td v-for="(c, i) in r.blocchi" :key="i" :data-blocco="i">{{ fatteGiuste(c) }}<span v-if="c.fatte" class="nota">{{ sotto(i, c) }}</span></td>
                <td><span v-for="(x, i) in r.sbagliate" :key="i" class="sbaglio-stampa">{{ x.fatto }}: {{ dettePerStampa(x.dette) }}, giusta {{ x.attesa }}<template v-if="x.volte > 1"> ({{ x.volte }})</template></span></td>
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
      <ul v-else class="lista">
        <li v-for="(x, i) in sbagliate" :key="i" class="sbagliata">
          <span class="conto"><b>{{ x.fatto }}</b><span class="giusto">✓ {{ x.attesa }}</span></span>
          <span class="quanti"><span v-for="n in Math.min(x.quanti, 12)" :key="n" class="tacca"></span></span>
          <!-- chi l'ha sbagliata e cosa ha detto, non «un bambino» (l'utente) -->
          <span class="chi-sbaglia" data-chi-sbaglia>
            <span v-for="c in x.chi" :key="c.nome" class="uno"><b>{{ c.nome }}</b>
              <span class="detta">{{ dettePerStampa(c.dette) }}</span><template v-if="c.volte > 1"> ×{{ c.volte }}</template></span>
          </span>
        </li>
      </ul>
    </section>
  </template>
</template>

<style scoped>
.quando { color:var(--grigio) }
.numeri { display:flex; flex-wrap:wrap; gap:8px }
.numero { padding:6px 12px; border-radius:999px; background:var(--penna-chiara); color:var(--penna); font-size:14px }
.numero b { font-size:18px }
.numero.tono-alto { background:var(--corretto-chiaro); color:var(--corretto) }
.numero.tono-medio { background:#fff6d6; color:#8a6a00 }
.numero.tono-basso { background:var(--correzione-chiara); color:var(--correzione) }
.blocchi-lezione { list-style:none; display:flex; flex-direction:column; gap:8px }
.blocchi-lezione li { display:flex; align-items:center; gap:10px; font-size:14px }
.blocchi-lezione li > span { display:flex; flex-direction:column }
.ico { width:36px; height:36px; border-radius:9px; object-fit:cover; flex:none }
.ico.foglio { display:grid; place-items:center; background:#e9edf3; font-size:20px }

.pagella { list-style:none; display:flex; flex-direction:column }
.bimbo { display:grid; grid-template-columns:auto minmax(110px, 160px) 1fr auto; align-items:center; gap:6px 14px; padding:12px 0;
         border-top:1px solid var(--filo) }
.bimbo:first-child { border-top:0 }
.bimbo.assente { opacity:.6 }
.bimbo.assente .nota { grid-column:3 / -1 }
.chi { display:flex; flex-direction:column; align-items:flex-start; gap:4px }
.barre { display:flex; flex-wrap:wrap; gap:10px }
.blocco-bimbo { flex:1 1 140px; display:flex; flex-direction:column; gap:3px }
.striscia { display:flex; height:12px; border-radius:6px; overflow:hidden; background:var(--tessera); gap:1px }
.striscia .si { background:var(--corretto) } .striscia .no { background:var(--correzione) }
.voto { font-size:26px; font-weight:800; min-width:64px; text-align:right; color:var(--grigio); font-variant-numeric:tabular-nums }
.voto small { font-size:14px; font-weight:600 }
.voto.alto { color:var(--corretto) } .voto.medio { color:#b8861b } .voto.basso { color:var(--correzione) }
.sbagli { grid-column:2 / -1; display:flex; flex-wrap:wrap; gap:6px }
.sbaglio-stampa { display:block; font-size:13px }
@media (max-width:640px) { .bimbo { grid-template-columns:auto 1fr auto } .barre { grid-column:1 / -1 } }

.lista { list-style:none; display:flex; flex-direction:column; gap:8px }
.sbagliata { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:6px 16px; padding:10px 12px;
             border-radius:var(--raggio-piccolo); background:var(--correzione-chiara) }
.conto { display:flex; align-items:baseline; gap:10px; font-size:17px }
.giusto { font-size:14px; color:var(--corretto); font-weight:600 }
.chi-sbaglia { flex-basis:100%; display:flex; flex-wrap:wrap; gap:4px 14px; font-size:13px; color:var(--grigio) }
.chi-sbaglia .detta { color:var(--correzione); font-weight:600; margin-left:4px }
.quanti { display:flex; align-items:center; gap:3px; font-size:13px; color:var(--grigio) }
.tacca { width:6px; height:16px; border-radius:2px; background:var(--correzione); margin-right:1px }
</style>
