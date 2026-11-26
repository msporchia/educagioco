<script setup>
// Una classe: il nome e gli alunni, uno per riga (chi riscrive gli stessi nomi tiene gli stessi id)
import { ref, computed } from 'vue'
import { quaderno, salva, classeDi } from './stato.js'
import * as Q from './quaderno.js'
import Conferma from './Conferma.vue'

const props = defineProps({ id: { type: String, default: null } })
const emit = defineEmits(['vai', 'indietro'])

const vecchia = props.id ? classeDi(props.id) : null
// un codice per bambino al posto del nome (docs/scuola/quaderno.md, «I codici dei bambini»): così nessun dato personale esce dal PC
const quanti = ref(20)
function creaCodici() { testo.value = Q.codiciBambini(quanti.value).join('\n') }
const nome = ref(vecchia?.nome ?? '')
const anno = ref(vecchia?.anno ?? null)
const testo = ref(vecchia ? Q.testoDegliAlunni(vecchia) : '')
const letti = computed(() => Q.alunniDaTesto(testo.value, vecchia?.alunni ?? []))
const problema = computed(() => {
  if (!Q.nomePulito(nome.value, Q.MAX_NOME_CLASSE)) return 'Dai un nome alla classe.'
  if (letti.value.troppi) return `Al massimo ${Q.MAX_ALUNNI} alunni per classe.`
  if (letti.value.doppi.length) return `Due bambini con lo stesso nome (${letti.value.doppi.join(', ')}): aggiungi l'iniziale del cognome, se no non sanno quale toccare.`
  return ''
})

function salvaClasse() {
  if (problema.value) return
  const classe = { id: vecchia?.id ?? Q.nuovoId('c'), nome: Q.nomePulito(nome.value, Q.MAX_NOME_CLASSE),
                   ...(Q.annoValido(anno.value) ? { anno: anno.value } : {}), alunni: letti.value.alunni }
  Q.salvaClasse(quaderno, classe)
  salva(['classi'])
  emit('indietro')
}

function cancella() {
  Q.cancellaClasse(quaderno, vecchia.id)
  salva(['classi'])
  emit('indietro')
}
</script>

<template>
  <section class="carta" data-editor-classe>
    <h1>{{ vecchia ? 'Modifica la classe' : 'Nuova classe' }}</h1>
    <label>Nome della classe
      <input v-model="nome" class="campo" :maxlength="Q.MAX_NOME_CLASSE" placeholder="per esempio: 3ª B" data-campo="nome-classe">
    </label>
    <div class="codici" data-codici>
      <p><b>Per non trattare dati personali come i nomi dei bambini, è meglio usare un codice per ognuno</b>, per esempio «Rosso 1»,
        «Rosso 2», «Blu 1»: lo dai a ogni bambino su un foglietto, e lui tocca il suo per entrare. Quello che scrivi qui, quando avvii
        una lezione, passa dal servizio della scuola e lo vede chi ha il codice della lezione: con i codici non esce nessun dato
        personale.</p>
      <div v-if="!testo.trim()" class="fila">
        <input v-model.number="quanti" class="campo numero" type="number" min="1" :max="Q.MAX_ALUNNI" aria-label="quanti bambini" data-campo="quanti">
        <span>bambini</span>
        <button type="button" class="bottone" data-azione="crea-codici" @click="creaCodici">Crea i codici</button>
      </div>
    </div>
    <label>I bambini, uno per riga
      <textarea v-model="testo" class="campo" spellcheck="false" data-campo="alunni"
                placeholder="Rosso 1&#10;Rosso 2&#10;Blu 1&#10;…"></textarea>
    </label>
    <p class="nota" data-conta-alunni>{{ letti.alunni.length }} alunni. I bambini vedranno queste righe e toccheranno la loro.</p>
    <p v-if="letti.accorciati.length" class="avviso">Nomi lunghi, accorciati a {{ Q.MAX_NOME }} lettere: {{ letti.accorciati.join(', ') }}</p>
    <p v-if="problema" class="avviso" data-problema>{{ problema }}</p>
    <div class="fila">
      <button class="bottone" :disabled="!!problema" data-azione="salva-classe" @click="salvaClasse">Salva la classe</button>
      <Conferma v-if="vecchia" etichetta="Cancella la classe" domanda="Cancello la classe? Lo storico delle sue lezioni resta."
                si="Cancella" data-azione="cancella-classe" @si="cancella" />
    </div>
  </section>
</template>

<style scoped>
.anno { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.codici { display:flex; flex-direction:column; gap:8px; padding:12px 14px; border-radius:var(--raggio-piccolo); background:var(--penna-chiara);
          font-size:14px; line-height:1.45 }
.campo.numero { width:90px; flex:none }
</style>
