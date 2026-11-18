<script setup>
// Lo storico di un bambino: lezione per lezione fatte e giuste, e le domande che sbaglia più spesso
import { computed } from 'vue'
import { quaderno, classeDi } from './stato.js'
import { storicoDelBambino, vociDellaClasse } from './quaderno.js'
import { giorno } from './utili.js'

const props = defineProps({ classe: { type: String, required: true }, alunno: { type: String, required: true } })
const emit = defineEmits(['vai', 'indietro'])
const s = computed(() => storicoDelBambino(quaderno, props.classe, props.alunno))
const nome = computed(() => classeDi(props.classe)?.alunni.find(a => a.id === props.alunno)?.nome
  ?? vociDellaClasse(quaderno, props.classe).flatMap(v => v.alunni).find(a => a.id === props.alunno)?.nome ?? '')
const fg = p => (p.fatte ? `${p.fatte} fatte, ${p.giuste} giuste` : '—')
</script>

<template>
  <section class="carta" data-storico-di="bambino">
    <h1>{{ nome }}</h1>
    <h2>Lezione per lezione</h2>
    <p v-if="!s.lezioni.length" class="nota">Nessuna lezione ancora.</p>
    <div v-else class="scorre">
      <table class="tabella" data-tabella-bambino>
        <thead><tr><th>Quando</th><th>Lezione</th><th>Obiettivo</th><th>Se hai finito</th></tr></thead>
        <tbody>
          <tr v-for="l in s.lezioni" :key="l.voce" :data-voce="l.voce">
            <td>{{ giorno(l.avviata) }}</td>
            <td><button class="collegamento" @click="emit('vai', 'resoconto', { voce: l.voce })">{{ l.nome }}</button></td>
            <template v-if="l.presente || l.obiettivo.fatte || l.dopo.fatte">
              <td>{{ fg(l.obiettivo) }}</td><td>{{ fg(l.dopo) }}</td>
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
    <ol v-else class="lista">
      <li v-for="(x, i) in s.sbaglia" :key="i"><b>{{ x.fatto }}</b> → {{ x.attesa }}
        <span class="nota">· {{ x.volte === 1 ? 'una volta' : `${x.volte} volte` }}{{ x.quanti > 1 ? `, in ${x.quanti} lezioni` : '' }}</span></li>
    </ol>
  </section>
</template>

<style scoped>
.lista { padding-left:22px; display:flex; flex-direction:column; gap:4px }
.collegamento { background:none; padding:0; font:inherit; color:var(--accento); text-align:left; text-decoration:underline }
</style>
