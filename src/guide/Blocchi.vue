<script setup>
// Il corpo di una guida: disegna i blocchi di guide/contenuti.js, uguale
// nella schermata delle guide e nel velo di un gioco. Vedi docs/genitori/guide.md.
import { computed, ref } from 'vue'
import { piattaforma, installata, inGrassetto } from './aiuto.js'

const props = defineProps({
  blocchi: { type: Array, default: () => [] },
})

const dove = piattaforma()
const dentro = installata()

const filtrati = computed(() => props.blocchi.filter(b => {
  const se = typeof b === 'object' ? b.se : null
  if (!se) return true
  if (se === 'installata') return dentro
  if (se === 'da-installare') return !dentro
  return se === dove
}))

// i blocchi `dove` si scambiano di posto fra loro (il proprio davanti), le posizioni restano quelle
const visibili = computed(() => {
  const lista = filtrati.value.slice()
  const posti = []
  lista.forEach((b, i) => { if (typeof b === 'object' && b.dove) posti.push(i) })
  if (posti.length < 2) return lista
  const suoi = posti.map(i => lista[i])
    .sort((a, b) => (b.dove === dove) - (a.dove === dove))
  posti.forEach((i, n) => { lista[i] = suoi[n] })
  return lista
})

const ripiegato = b => !!b.chiuso || (!!b.dove && b.dove !== dove)

// un Set e non un campo sul dato: i contenuti sono condivisi da tutte le schermate
const aperti = ref(new Set())
const apri = i => {
  const s = new Set(aperti.value)
  s.has(i) ? s.delete(i) : s.add(i)
  aperti.value = s
}

const paragrafi = b => b.testo == null ? [] : [].concat(b.testo)

const buono = u => /^https?:\/\//.test(String(u || ''))   // solo http(s): un javascript: non deve passare

const testo = inGrassetto
</script>

<template>
  <div class="guida-corpo">
    <template v-for="(b, i) in visibili" :key="i">
      <p v-if="typeof b === 'string'" class="par" v-html="testo(b)"></p>

      <div v-else-if="ripiegato(b)" class="blocco pieghevole" :class="{ aperto: aperti.has(i) }">
        <button class="testa" :data-apri="b.titolo" :aria-expanded="aperti.has(i)"
                @click="apri(i)">
          <span class="freccia">{{ aperti.has(i) ? '▾' : '▸' }}</span>
          <b>{{ b.titolo }}</b>
        </button>
        <div v-if="aperti.has(i)" class="dentro">
          <p v-for="(p, j) in paragrafi(b)" :key="'p' + j" class="par" v-html="testo(p)"></p>
          <ul v-if="b.righe"><li v-for="(r, j) in b.righe" :key="j" v-html="testo(r)"></li></ul>
          <ol v-if="b.passi"><li v-for="(r, j) in b.passi" :key="j" v-html="testo(r)"></li></ol>
          <a v-for="(l, j) in (b.collegamenti || [])" :key="'l' + j" class="collega"
             :href="buono(l.url) ? l.url : null" target="_blank" rel="noopener">
            <b>{{ l.testo }} ↗</b><i v-if="l.sotto">{{ l.sotto }}</i>
          </a>
        </div>
      </div>

      <div v-else class="blocco">
        <h3 v-if="b.titolo">{{ b.titolo }}</h3>
        <p v-for="(p, j) in paragrafi(b)" :key="'p' + j" class="par dentro-blocco"
           v-html="testo(p)"></p>
        <ul v-if="b.righe"><li v-for="(r, j) in b.righe" :key="j" v-html="testo(r)"></li></ul>
        <ol v-if="b.passi"><li v-for="(r, j) in b.passi" :key="j" v-html="testo(r)"></li></ol>
        <a v-for="(l, j) in (b.collegamenti || [])" :key="'l' + j" class="collega"
           :href="buono(l.url) ? l.url : null" target="_blank" rel="noopener">
          <b>{{ l.testo }} ↗</b><i v-if="l.sotto">{{ l.sotto }}</i>
        </a>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* eccezione alla regola di style.css (che spegne la selezione): una guida si copia e si incolla */
.guida-corpo { display:flex; flex-direction:column; gap:14px; text-align:left;
               -webkit-user-select:text; user-select:text;
               -webkit-touch-callout:default }
.par { font-size:15px; line-height:1.5; color:var(--testo) }
.blocco { background:#ffffffb0; border-radius:14px; padding:12px 14px;
          box-shadow:0 2px 8px #8593a81f }
.blocco h3 { font-size:14px; font-weight:900; color:var(--viola-scuro);
             margin-bottom:7px }
.blocco ul, .blocco ol { padding-left:19px; display:flex; flex-direction:column; gap:7px }
.blocco li { font-size:14.5px; line-height:1.45; color:var(--testo) }
.blocco ul { list-style:disc }
.blocco ol { list-style:decimal }
.blocco :deep(b) { color:var(--viola-scuro) }
.par.dentro-blocco { font-size:14.5px }
.par.dentro-blocco + ul, .par.dentro-blocco + ol { margin-top:9px }

.pieghevole { padding:0; background:#ffffff8a }
.pieghevole.aperto { background:#ffffffb0 }
.testa { display:flex; align-items:center; gap:9px; width:100%; text-align:left;
         padding:11px 13px; background:none; border:none; font-family:inherit;
         cursor:pointer; border-radius:14px }
.testa .freccia { font-size:13px; color:var(--viola); flex:none; width:12px }
.testa b { font-size:14px; font-weight:800; color:var(--viola-scuro); line-height:1.35 }
.testa:active { transform:translateY(1px) }
.pieghevole .dentro { padding:0 13px 13px; display:flex; flex-direction:column; gap:9px }
.pieghevole .dentro .par { font-size:14px }

.collega { display:flex; flex-direction:column; gap:2px; margin-top:9px;
           padding:10px 12px; border-radius:12px; background:#f5f2ff;
           text-decoration:none }
.collega b { font-size:14px; color:var(--viola-scuro) }
.collega i { font-style:normal; font-size:11.5px; color:var(--tenue); line-height:1.35 }
.collega:active { transform:translateY(1px) }
</style>
