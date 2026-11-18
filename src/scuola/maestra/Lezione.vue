<script setup>
// L'editor di una lezione (la lezione che viaggia, docs/scuola/protocollo.md): nome, obiettivo e «se hai finito»; anche da una lezione pronta
import { ref, computed } from 'vue'
import { CATALOGO, valido, descrivi } from '../comune/esercizi.js'
import { quaderno, salva, lezioneDi } from './stato.js'
import * as Q from './quaderno.js'
import { paginaMaestra, copia } from './utili.js'
import { lezioneDa } from '../comune/lezioni-pronte.js'
import SceltaEsercizio from './SceltaEsercizio.vue'
import Conferma from './Conferma.vue'

const props = defineProps({ id: { type: String, default: null }, proposta: { type: Object, default: null } })
const emit = defineEmits(['vai', 'indietro'])

const vecchia = props.id ? lezioneDi(props.id) : null
const primaBase = () => JSON.parse(JSON.stringify(CATALOGO.materie[0].voci[0].base))
const l = ref(vecchia ? JSON.parse(JSON.stringify(vecchia))
  : props.proposta ? lezioneDa(props.proposta, Q.nuovoId('l')) : Q.nuovaLezione(primaBase()))
const per = ref(l.value.obiettivo.minuti ? 'minuti' : 'quante')
const quante = ref(l.value.obiettivo.quante ?? 20)
const minuti = ref(l.value.obiettivo.minuti ?? 15)
const copiato = ref(false)
const daCopiare = ref('')

// la lezione come uscirà: senza nome prende quello dell'esercizio
const pronta = computed(() => {
  const o = l.value.obiettivo
  const nome = Q.nomePulito(l.value.nome, Q.MAX_NOME_LEZIONE) || (valido(o.esercizio) ? descrivi(o.esercizio).slice(0, Q.MAX_NOME_LEZIONE) : '')
  return {
    id: l.value.id, nome,
    obiettivo: { esercizio: o.esercizio, quante: per.value === 'quante' ? Number(quante.value) : null, minuti: per.value === 'minuti' ? Number(minuti.value) : null },
    dopo: l.value.dopo,
  }
})
const problema = computed(() => {
  const p = pronta.value
  if (!valido(p.obiettivo.esercizio)) return 'L\'obiettivo così non chiede niente.'
  if (per.value === 'quante' && !(Number.isInteger(p.obiettivo.quante) && p.obiettivo.quante >= 1 && p.obiettivo.quante <= Q.MAX_QUANTE)) return `Le domande vanno da 1 a ${Q.MAX_QUANTE}.`
  if (per.value === 'minuti' && !(Number.isInteger(p.obiettivo.minuti) && p.obiettivo.minuti >= 1 && p.obiettivo.minuti <= Q.MAX_MINUTI)) return `I minuti vanno da 1 a ${Q.MAX_MINUTI}.`
  if (p.dopo && !valido(p.dopo)) return 'Il «se hai finito» così non chiede niente.'
  return Q.lezioneValida(p) ? '' : 'La lezione non è completa.'
})

function salvaLezione() {
  if (problema.value || !Q.salvaLezione(quaderno, pronta.value)) return
  salva(['lezioni'])
  emit('vai', 'inizio')
}
function duplica() {
  const c = Q.duplicaLezione(quaderno, vecchia.id)
  salva(['lezioni'])
  if (c) emit('vai', 'lezione', { id: c.id }, { al_posto: true })
}
function cancella() { Q.cancellaLezione(quaderno, vecchia.id); salva(['lezioni']); emit('indietro') }
async function copiaLink() {
  const link = Q.linkDellaLezione(pronta.value, paginaMaestra())
  if (await copia(link)) { copiato.value = true; daCopiare.value = ''; setTimeout(() => (copiato.value = false), 2500) }
  else daCopiare.value = link
}
const conDopo = v => { l.value.dopo = v ? primaBase() : null }
</script>

<template>
  <section class="carta" data-editor-lezione>
    <h1>{{ vecchia ? 'Modifica la lezione' : 'Nuova lezione' }}</h1>
    <label>Nome della lezione
      <input v-model="l.nome" class="campo" :maxlength="Q.MAX_NOME_LEZIONE" :placeholder="pronta.nome || 'per esempio: ripasso del 9'" data-campo="nome-lezione">
    </label>
    <p v-if="props.proposta && !vecchia" class="bene" data-da-pronta>Pronta per la {{ props.proposta.anno }}ª: {{ props.proposta.allena }} Cambia quello che vuoi e salvala.</p>
  </section>

  <section class="carta">
    <h2>L'obiettivo</h2>
    <p class="nota">Quello che tutti fanno: un esercizio, per un certo numero di domande o di minuti.</p>
    <SceltaEsercizio v-model="l.obiettivo.esercizio" dove="obiettivo" />
    <div class="fila">
      <button class="tessera" :class="{ scelta: per === 'quante' }" :aria-pressed="per === 'quante'" data-per="quante" @click="per = 'quante'">Quante domande</button>
      <button class="tessera" :class="{ scelta: per === 'minuti' }" :aria-pressed="per === 'minuti'" data-per="minuti" @click="per = 'minuti'">Quanti minuti</button>
      <input v-if="per === 'quante'" v-model.number="quante" class="campo numero" type="number" min="1" :max="Q.MAX_QUANTE" data-campo="quante" aria-label="quante domande">
      <input v-else v-model.number="minuti" class="campo numero" type="number" min="1" :max="Q.MAX_MINUTI" data-campo="minuti" aria-label="quanti minuti">
    </div>
  </section>

  <section class="carta">
    <h2>Se hai finito</h2>
    <p class="nota">Facoltativo: un altro esercizio, senza fine, per chi finisce prima. Senza, chi finisce vede «Hai finito!».</p>
    <div class="fila">
      <button class="tessera" :class="{ scelta: !l.dopo }" :aria-pressed="!l.dopo" data-dopo="no" @click="conDopo(false)">Niente</button>
      <button class="tessera" :class="{ scelta: !!l.dopo }" :aria-pressed="!!l.dopo" data-dopo="si" @click="!l.dopo && conDopo(true)">Un altro esercizio</button>
    </div>
    <SceltaEsercizio v-if="l.dopo" v-model="l.dopo" dove="dopo" />
  </section>

  <section class="carta">
    <p v-if="problema" class="avviso" data-problema>{{ problema }}</p>
    <div class="fila">
      <button class="bottone" :disabled="!!problema" data-azione="salva-lezione" @click="salvaLezione">Salva la lezione</button>
      <button class="bottone chiaro" :disabled="!!problema" data-azione="copia-link" @click="copiaLink">{{ copiato ? 'Link copiato' : 'Copia il link' }}</button>
      <button v-if="vecchia" class="bottone chiaro" data-azione="duplica" @click="duplica">Duplica</button>
      <Conferma v-if="vecchia" etichetta="Cancella" si="Cancella" data-azione="cancella-lezione" @si="cancella" />
    </div>
    <label v-if="daCopiare">Il browser non lascia copiare: seleziona il link e copialo a mano
      <input class="campo" readonly :value="daCopiare" data-link-lezione @focus="$event.target.select()">
    </label>
    <p class="nota">Il link porta con sé la lezione: chi lo apre nella sua pagina della maestra la vede e può aggiungerla al suo quaderno.</p>
  </section>
</template>

<style scoped>
.numero { width:110px }
</style>
