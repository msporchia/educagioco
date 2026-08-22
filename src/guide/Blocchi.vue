<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CORPO DI UNA GUIDA

   Disegna i blocchi di `guide/contenuti.js` e basta: non sa se sta
   dentro la schermata delle guide o dentro il velo di un gioco, e i due
   posti devono rendere uguale — una guida letta in due modi diversi è
   due guide da correggere.

   Il grassetto si scrive `**così**` perché le guide sono dato puro e
   dentro un dato non ci va HTML: chi le scrive non deve poter mettere un
   tag, e chi le legge non deve fidarsi. Qui si scappa il testo e si
   riconosce solo quella coppia di asterischi.

   ── DUE LIVELLI, E IL SECONDO STA CHIUSO ──────────────────────────
   Un blocco con `chiuso: true` nasce ripiegato: si vede il titolo con
   una freccia, e si apre toccandolo. Serve a una cosa sola, ma
   importante — **la risposta corta resta corta**. Il materiale lungo
   (perché è fatto così, cosa succede se, il ragionamento dietro) c'era
   già scritto altrove e non stava dentro l'applicazione proprio perché
   metterlo in fila avrebbe reso illeggibile la risposta di tre righe.
   Chiuso non è nascosto: la freccia dice che c'è dell'altro, e chi ha
   fretta tira dritto.

   Un blocco chiuso non è un blocco a parte: ha le stesse `righe`, gli
   stessi `passi`, lo stesso `testo`. Sono i contenuti a decidere quanto
   in profondità si vuole scendere, non due componenti diversi.

   ── `se` NASCONDE, `dove` RIPIEGA ─────────────────────────────────
   Due modi di trattare «questo vale solo su Android», e la differenza
   l'ha trovata un genitore che leggeva la guida **dal computer**: dei
   tre modi di installare l'app ne vedeva uno solo, il suo, che è
   proprio quello che non gli serviva — chi legge al computer sta quasi
   sempre per installarla sul telefono di un figlio, e chi legge da
   Android magari sull'iPhone della madre.

   Perciò un blocco con `dove:` **c'è sempre**: aperto se è la
   piattaforma che si ha in mano, ripiegato se è un'altra — e i tre si
   riordinano da sé, il proprio davanti. `se:` resta com'era e continua
   a nascondere, perché il suo mestiere è un altro: «✅ è già
   installato» a chi non l'ha installato non è un'informazione in meno,
   è una frase falsa.
   ═══════════════════════════════════════════════════════════════════ */
import { computed, ref } from 'vue'
import { piattaforma, installata, inGrassetto } from './aiuto.js'

const props = defineProps({
  blocchi: { type: Array, default: () => [] },
})

const dove = piattaforma()
const dentro = installata()

/* `se` filtra: un blocco senza `se` lo vedono tutti */
const filtrati = computed(() => props.blocchi.filter(b => {
  const se = typeof b === 'object' ? b.se : null
  if (!se) return true
  if (se === 'installata') return dentro
  if (se === 'da-installare') return !dentro
  return se === dove
}))

/* I blocchi `dove` si scambiano di posto fra loro — il proprio davanti —
   senza toccare quelli in mezzo: le posizioni che occupavano restano
   quelle, cambia solo chi ci sta dentro. Ordinarli spostandoli su e giù
   per la guida sposterebbe anche i paragrafi che li introducono. */
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

/* un blocco è ripiegato se lo chiede (`chiuso`) o se parla di un
   telefono che non è quello che si ha in mano */
const ripiegato = b => !!b.chiuso || (!!b.dove && b.dove !== dove)

/* Quali fisarmoniche sono aperte, per indice. Un `Set` e non un campo
   sul dato: i contenuti sono un dato puro condiviso da tutte le
   schermate, e scriverci dentro «aperto» vorrebbe dire che una guida
   letta nel velo si ritrova già spalancata quando la si riapre altrove. */
const aperti = ref(new Set())
const apri = i => {
  const s = new Set(aperti.value)
  s.has(i) ? s.delete(i) : s.add(i)
  aperti.value = s
}

/* Un `testo:` può essere una stringa o un elenco di paragrafi: chi
   scrive non deve ricordarsi le parentesi quadre per una riga sola. */
const paragrafi = b => b.testo == null ? [] : [].concat(b.testo)

/* Solo http(s), e non per paranoia verso i propri dati: un `javascript:`
   scritto per distrazione in un file di contenuti sarebbe l'unico modo
   di far entrare del codice da qui, ed è un controllo di una riga. */
const buono = u => /^https?:\/\//.test(String(u || ''))

const testo = inGrassetto
</script>

<template>
  <div class="guida-corpo">
    <template v-for="(b, i) in visibili" :key="i">
      <p v-if="typeof b === 'string'" class="par" v-html="testo(b)"></p>

      <!-- ── un blocco che si apre ── -->
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

      <!-- ── un blocco normale ── -->
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
.guida-corpo { display:flex; flex-direction:column; gap:14px; text-align:left;
               user-select:text }   /* una guida si copia e si incolla in chat */
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

/* ── la fisarmonica ──
   Più tenue di un blocco normale da chiusa: quello che c'è dentro è
   materiale in più, e non deve pesare quanto la risposta. */
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

/* un collegamento fuori dall'app: si vede che porta via, e lo dice la ↗ */
.collega { display:flex; flex-direction:column; gap:2px; margin-top:9px;
           padding:10px 12px; border-radius:12px; background:#f5f2ff;
           text-decoration:none }
.collega b { font-size:14px; color:var(--viola-scuro) }
.collega i { font-style:normal; font-size:11.5px; color:var(--tenue); line-height:1.35 }
.collega:active { transform:translateY(1px) }
</style>
