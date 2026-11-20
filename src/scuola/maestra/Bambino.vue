<script setup>
// Lo storico di un bambino: lezione per lezione fatte e giuste (in tutto e blocco per blocco), e le domande che sbaglia più spesso
import { computed } from 'vue'
import { quaderno, classeDi } from './stato.js'
import { storicoDelBambino, vociDellaClasse } from './quaderno.js'
import { giorno, iniziali, coloreDi } from './utili.js'

const props = defineProps({ classe: { type: String, required: true }, alunno: { type: String, required: true } })
const emit = defineEmits(['vai', 'indietro'])
const s = computed(() => storicoDelBambino(quaderno, props.classe, props.alunno))
const nome = computed(() => classeDi(props.classe)?.alunni.find(a => a.id === props.alunno)?.nome
  ?? vociDellaClasse(quaderno, props.classe).flatMap(v => v.alunni).find(a => a.id === props.alunno)?.nome ?? '')
const fg = p => (p.fatte ? `${p.fatte} fatte, ${p.giuste} giuste` : '—')
const tutto = bl => bl.reduce((t, c) => ({ fatte: t.fatte + c.fatte, giuste: t.giuste + c.giuste }), { fatte: 0, giuste: 0 })
const perBlocco = bl => bl.map((c, i) => `${i + 1}: ${c.fatte ? `${c.fatte}/${c.giuste}` : '—'}`).join(' · ')
const percento = c => (c.fatte ? Math.round(c.giuste / c.fatte * 100) : null)
const tono = p => (p === null ? '' : p >= 80 ? 'alto' : p >= 50 ? 'medio' : 'basso')
</script>

<template>
  <section class="carta" data-storico-di="bambino">
    <div class="fila">
      <span class="iniziali grande" :style="{ '--colore': coloreDi(nome) }" aria-hidden="true">{{ iniziali(nome) }}</span>
      <h1>{{ nome }}</h1>
    </div>
    <h2>Lezione per lezione</h2>
    <p v-if="!s.lezioni.length" class="nota">Nessuna lezione ancora.</p>
    <ul v-else class="lezioni">
      <li v-for="l in s.lezioni" :key="l.voce" :class="{ assente: !l.presente }">
        <span class="cosa"><button class="collegamento" @click="emit('vai', 'resoconto', { voce: l.voce })">{{ l.nome }}</button>
          <span class="nota">{{ giorno(l.avviata) }}</span></span>
        <template v-if="l.presente">
          <span class="striscia" :title="fg(tutto(l.blocchi))">
            <span class="si" :style="{ flexGrow: tutto(l.blocchi).giuste }"></span><span class="no" :style="{ flexGrow: tutto(l.blocchi).fatte - tutto(l.blocchi).giuste }"></span>
          </span>
          <span class="voto" :class="tono(percento(tutto(l.blocchi)))">{{ percento(tutto(l.blocchi)) ?? '–' }}<small v-if="tutto(l.blocchi).fatte">%</small></span>
        </template>
        <span v-else class="nota">non c'era</span>
      </li>
    </ul>
    <div v-if="s.lezioni.length" class="scorre solo-stampa">
      <table class="tabella" data-tabella-bambino>
        <thead><tr><th>Quando</th><th>Lezione</th><th>In tutto</th><th>Blocco per blocco (fatte/giuste)</th></tr></thead>
        <tbody>
          <tr v-for="l in s.lezioni" :key="l.voce" :data-voce="l.voce">
            <td>{{ giorno(l.avviata) }}</td>
            <td><button class="collegamento" @click="emit('vai', 'resoconto', { voce: l.voce })">{{ l.nome }}</button></td>
            <template v-if="l.presente">
              <td>{{ fg(tutto(l.blocchi)) }}</td><td class="nota">{{ l.blocchi.length > 1 ? perBlocco(l.blocchi) : '' }}</td>
            </template>
            <td v-else colspan="2" class="nota">non c'era</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="carta" data-sbaglia>
    <h2>Le domande che sbaglia più spesso</h2>
    <p v-if="!s.sbaglia.length" class="nota">Nessuna domanda sbagliata.</p>
    <ul v-else class="lista">
      <li v-for="(x, i) in s.sbaglia" :key="i" class="sbagliata"><b>{{ x.fatto }}</b> <span class="giusto">fa {{ x.attesa }}</span>
        <span class="nota">{{ x.volte === 1 ? 'una volta' : `${x.volte} volte` }}{{ x.quanti > 1 ? `, in ${x.quanti} lezioni` : '' }}</span></li>
    </ul>
  </section>
</template>

<style scoped>
.iniziali.grande { width:48px; height:48px; font-size:17px }
.lezioni { list-style:none; display:flex; flex-direction:column }
.lezioni li { display:grid; grid-template-columns:minmax(160px, 1fr) minmax(120px, 2fr) 70px; align-items:center; gap:14px; padding:10px 0;
              border-top:1px solid var(--filo) }
.lezioni li:first-child { border-top:0 }
.lezioni li.assente { opacity:.6 }
.lezioni .cosa { display:flex; flex-direction:column }
.striscia { display:flex; height:12px; border-radius:6px; overflow:hidden; background:var(--tessera); gap:1px }
.striscia .si { background:var(--corretto) } .striscia .no { background:var(--correzione) }
.voto { font-size:22px; font-weight:800; text-align:right; color:var(--grigio) }
.voto small { font-size:13px }
.voto.alto { color:var(--corretto) } .voto.medio { color:#b8861b } .voto.basso { color:var(--correzione) }
.lista { list-style:none; display:flex; flex-direction:column; gap:6px }
.sbagliata { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 10px; padding:8px 12px; border-radius:var(--raggio-piccolo);
             background:var(--correzione-chiara) }
.sbagliata b { color:var(--correzione) }
.giusto { color:var(--corretto); font-weight:600 }
.collegamento { background:none; padding:0; font:inherit; color:var(--accento); text-align:left; text-decoration:underline }
</style>
