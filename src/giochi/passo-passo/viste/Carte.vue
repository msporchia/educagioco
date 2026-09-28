<script setup>
/* Un elenco di carte — e dentro una scatola, un altro elenco uguale: si
   chiama da sé (vedi docs/passo-passo/zaino.md per il posto dentro/fuori
   una scatola e il giro visualizzato sulla testa). Non tocca niente: legge
   quello che `Fila.vue` le mette a disposizione con provide/inject — una
   carta dentro tre scatole non deve rimandare i tocchi su per tre livelli
   — e dice dove si è toccato. */
import { computed, inject } from 'vue'
import Icona from './Icona.vue'
import Lastra from './Lastra.vue'
import { nomeDellaMossa, LASTRE } from '../dati/mondo.js'
import { eApri, eSe, valoreDi } from '../dati/carte.js'

defineOptions({ name: 'Carte' })
const props = defineProps({
  nodi: { type: Array, required: true },
  fine: { type: Number, required: true },     // il posto in fondo a questo elenco
})

const f = inject('fila')

/* un posto prima di ogni carta, e uno in fondo */
const pezzi = computed(() => {
  const l = []
  for (const n of props.nodi) {
    l.push({ che: 'posto', p: n.i, key: 'p' + n.i })
    l.push({ che: n.che, nodo: n, key: 'n' + n.i })
  }
  l.push({ che: 'posto', p: props.fine, key: 'p' + props.fine })
  return l
})

/* il giro di una scatola, se sta girando (o si è fermata lì): «3/5», o
   solo «3» in un «fino a», che quanti giri saranno non lo sa */
const giroDi = i => {
  const g = (f.s.value.giri || []).find(x => x[0] === i)
  if (!g) return null
  return typeof g[2] === 'number' ? `${g[1]}/${g[2]}` : String(g[1])
}
const eCiclo = t => eApri(t)
const valoreNodo = n => (n.che === 'se' ? n.colore : n.volte ?? n.fino)
/* una testa a parole, per chi non vede lo schermo */
function testaInParole(n) {
  const v = valoreNodo(n)
  const colore = c => (c === 'casa' ? 'a casa' : `alla lastra ${(LASTRE[c] || {}).nome || c}`)
  if (n.che === 'se') return v == null ? 'se: che colore?' : `se sei sulla lastra ${(LASTRE[v] || {}).nome || v}`
  if (v == null) return 'ripeti: quante volte?'
  return typeof v === 'number' ? `ripeti ${v} volte` : `ripeti fino ${colore(v)}`
}
const numero = t => typeof valoreDi(t) === 'number'
</script>

<template>
  <template v-for="x in pezzi" :key="x.key">
    <template v-if="x.che === 'posto'">
      <span v-if="f.s.value.cursore === x.p && !f.s.value.inCorsa" class="pp-cursore" data-cursore
            aria-hidden="true"></span>
      <!-- il consiglio del 💡: la carta giusta in trasparenza, dove va -->
      <button v-if="f.s.value.cursore === x.p && f.s.value.fantasma" class="pp-tessera pp-fantasma"
              :class="{ 'pp-salto': f.s.value.consiglio.startsWith('salto-'),
                        'pp-fantasma-ciclo': eCiclo(f.s.value.consiglio),
                        'pp-fantasma-se': eSe(f.s.value.consiglio) }"
              :data-consiglio="f.s.value.consiglio"
              :aria-label="`metti qui: ${eCiclo(f.s.value.consiglio) ? 'una scatola' : nomeDellaMossa(f.s.value.consiglio)}`"
              @click="f.metti(f.s.value.consiglio)">
        <template v-if="eCiclo(f.s.value.consiglio)">
          <span class="pp-em pp-ciclo-icona">{{ eSe(f.s.value.consiglio) ? '❓' : '🔁' }}</span>
          <b v-if="numero(f.s.value.consiglio)">{{ valoreDi(f.s.value.consiglio) }}</b>
          <Lastra v-else :colore="valoreDi(f.s.value.consiglio)" />
        </template>
        <Icona v-else :mossa="f.s.value.consiglio" />
      </button>
    </template>

    <button v-else-if="x.che === 'mossa'" class="pp-tessera"
            :class="{ 'pp-salto': x.nodo.m.startsWith('salto-'),
                      'pp-corrente': f.s.value.corrente === x.nodo.i,
                      'pp-fatta': f.s.value.piatta && f.s.value.inCorsa && f.s.value.corrente > x.nodo.i,
                      'pp-guasto': f.s.value.guasto === x.nodo.i,
                      'pp-sospetta': f.s.value.sospette && x.nodo.i >= f.s.value.cursore }"
            :data-tessera="x.nodo.i" :data-mossa="x.nodo.m"
            :data-corrente="f.s.value.corrente === x.nodo.i ? '' : null"
            :data-guasto="f.s.value.guasto === x.nodo.i ? '' : null"
            :aria-label="nomeDellaMossa(x.nodo.m)"
            @click="f.toccaTessera(x.nodo.i)">
      <Icona :mossa="x.nodo.m" />
    </button>

    <div v-else class="pp-scatola" :class="{ 'pp-se': x.nodo.che === 'se',
                                             'pp-sospetta': f.s.value.sospette && x.nodo.i >= f.s.value.cursore }"
         :data-scatola="x.nodo.i" :data-tipo="x.nodo.che">
      <button class="pp-testa"
              :class="{ 'pp-manca': valoreNodo(x.nodo) == null, 'pp-aperta': f.s.value.scelta === x.nodo.i,
                        'pp-brilla': f.s.value.consiglioTesta === x.nodo.i,
                        'pp-gira': !!giroDi(x.nodo.i), 'pp-fermo': !!giroDi(x.nodo.i) && !f.s.value.inCorsa }"
              :data-testa="x.nodo.i" :data-volte="valoreNodo(x.nodo) ?? 'N'" :data-giro="giroDi(x.nodo.i)"
              :aria-label="testaInParole(x.nodo)" @click="f.testa(x.nodo.i)">
        <span class="pp-em pp-ciclo-icona" aria-hidden="true">{{ x.nodo.che === 'se' ? '❓' : '🔁' }}</span>
        <b v-if="giroDi(x.nodo.i) || typeof valoreNodo(x.nodo) !== 'string'">
          {{ giroDi(x.nodo.i) || (valoreNodo(x.nodo) ?? 'N') }}</b>
        <Lastra v-else :colore="valoreNodo(x.nodo)" />
      </button>
      <Carte :nodi="x.nodo.corpo" :fine="x.nodo.fine" />
      <!-- il bordo della scatola: toccarlo mette il cursore subito fuori -->
      <button class="pp-coda" :data-coda="x.nodo.fine" aria-label="dopo la scatola"
              @click="f.tocca(x.nodo.fine + 1)"></button>
    </div>
  </template>
</template>
