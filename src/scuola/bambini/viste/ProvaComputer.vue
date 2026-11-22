<script setup>
/* La prova del computer della classe (docs/scuola/prova-computer.md), dalla schermata del codice. Ogni gioco vero della scuola gira a
   tutto schermo con un pilota che lo muove e si contano le immagini al secondo; sotto SOGLIA_B si rifà con la grafica più sgranata
   (pixel.js) e, se va meglio, il PC se lo ricorda. Alla fine il verdetto e un tasto solo che apre il modulo già compilato.
   Sta dentro il <form> del codice: ogni tasto è type="button", se no lo manderebbe. */
import { ref, shallowRef, nextTick, onBeforeUnmount, onErrorCaptured } from 'vue'
import { VISTE } from '../../giochi/viste.js'
import { GIOCHI_PROVA, TEMPI, provaB, verdetto, frasi, resoconto, FRASE_ESITO } from '../prova-pc.js'
import { contaFotogrammi, pilota } from '../prova-pc-giro.js'
import { applicaPixel, ricordaB, SCALA_B } from '../pixel.js'

const emit = defineEmits(['chiudi'])
const MODULO = 'https://tally.so/r/lb28zp'      // lo stesso dei giudizi di casa (GenitoriView.vue), campi `giudizi` e `versione`
const versione = __VERSIONE_SCUOLA__
const ALUNNO = { id: 'prova-computer', nome: 'Prova' }

const stato = ref('pronto')            // pronto | corre | fatto | guasto
const avanza = ref({ i: 0, n: GIOCHI_PROVA.length, nome: '' })
const inScena = shallowRef(null)       // il gioco montato adesso: { id, esercizio, chiave }
const esito = ref(null)
const dati = shallowRef(null)
const dove = ref('')
const avviso = ref('')
const macchina = ref({})
let fermare = false, guasto = false
const secondi = Math.round(GIOCHI_PROVA.length * (TEMPI.rodaggio + TEMPI.misura + 1500) / 60000)

const pausa = ms => new Promise(r => setTimeout(r, ms))

// in scena: il gioco montato e, se disegna su una tela, la tela con le sue misure (un 3D carica i modelli prima); si conta da lì
async function inScenaDavvero(g, tetto = 20000) {
  const t0 = performance.now(), palco = () => document.querySelector('[data-prova-pc-palco]')
  while (performance.now() - t0 < tetto && !fermare && !guasto) {
    const p = palco(), c = p?.querySelector('canvas')
    if (p?.querySelector('[data-gioco]') && (g.tela === false || (c && c.width > 0 && c.getBoundingClientRect().width > 0))) return true
    await pausa(200)
  }
  return false
}

// un gioco a una scala di pixel: montato, mosso dal pilota, contato, smontato
async function giocaUno(g, scala, tempi) {
  applicaPixel(scala)
  guasto = false
  inScena.value = { id: g.id, esercizio: g.esercizio, chiave: `${g.id}-${scala}` }
  await nextTick()
  const ferma = pilota(g.id)
  try {
    if (!(await inScenaDavvero(g)) && !fermare) return { errore: guasto ? 'il gioco non parte' : 'non è comparso in 20 secondi' }
    const m = await contaFotogrammi(tempi, () => fermare || guasto)
    return guasto ? { errore: 'il gioco non parte' } : m
  } finally {
    ferma()
    inScena.value = null
    applicaPixel(1)
    await nextTick(); await pausa(400)      // il contesto 3D di un gioco si chiude prima del prossimo
  }
}
onErrorCaptured(() => { guasto = true; return false })

async function avvia() {
  stato.value = 'corre'; fermare = false; avviso.value = ''
  try {
    const { infoGpuVeri, proveCpu } = await import('../../../grafica/benchmark/veri.js')
    const info = infoGpuVeri()
    const tempi = window.__benchmarkCorto ? { rodaggio: 300, misura: 1000 } : TEMPI
    const giochi = []
    // `window.__provaSolo`: solo alcuni giochi (le prove e chi guarda un gioco da solo); `__provaSogliaB` cambia la soglia di B (le prove)
    const elenco = GIOCHI_PROVA.filter(g => !window.__provaSolo || window.__provaSolo.includes(g.id))
    for (const [i, g] of elenco.entries()) {
      if (fermare) break
      avanza.value = { i, n: elenco.length, nome: g.nome }
      if (g.tred && !info.webgl2) { giochi.push({ id: g.id, a: { errore: 'niente WebGL 2' }, b: null }); continue }
      const a = await giocaUno(g, 1, tempi)
      let b = null
      if (provaB(a, window.__provaSogliaB) && !fermare) {
        avanza.value = { i, n: elenco.length, nome: `${g.nome}, con la grafica più sgranata` }
        b = await giocaUno(g, SCALA_B, tempi)
      }
      giochi.push({ id: g.id, a, b })
    }
    const d = { info, giochi, js: fermare ? null : proveCpu(), fermata: fermare }
    dati.value = d; window.__provaComputer = d
    esito.value = verdetto(d)
    // solo una prova intera decide: una fermata a metà non cancella quello che il PC sapeva
    if (!fermare && !window.__provaSolo) ricordaB(Object.fromEntries(esito.value.giochi.filter(x => x.b === 'tenuta').map(x => [x.id, SCALA_B])))
    macchina.value = { cpu: navigator.hardwareConcurrency, memoria: navigator.deviceMemory, schermo: `${innerWidth}x${innerHeight}`, dpr: devicePixelRatio }
    stato.value = 'fatto'
  } catch (e) {
    avviso.value = 'La prova non è partita: ' + ((e && e.message) || e); stato.value = 'guasto'
  }
}
function chiudi() { fermare = true; applicaPixel(1); emit('chiudi') }
onBeforeUnmount(() => { fermare = true; applicaPixel(1) })

function link() {
  const testo = resoconto(dati.value, { versione, ua: navigator.userAgent, ...macchina.value, dove: dove.value })
  return `${MODULO}?${new URLSearchParams({ versione: 'scuola ' + versione, giudizi: testo })}`
}
const SCHEDA = { video: 'il 3D lo fa la scheda video', processore: 'il 3D lo fa il processore, non la scheda video', manca: 'niente grafica 3D' }
</script>

<template>
  <div class="prova-pc" :class="{ corre: stato === 'corre' }" data-prova-pc>
    <div v-if="stato === 'corre'" class="palco" data-prova-pc-palco>
      <component :is="VISTE[inScena.id]" v-if="inScena" :key="inScena.chiave" :esercizio="inScena.esercizio" :alunno="ALUNNO"
                 :onRisposta="() => {}" @guasto="guasto = true" />
    </div>
    <button class="chiudi" type="button" aria-label="chiudi" data-azione="prova-pc-chiudi" @click="chiudi">✕</button>

    <div v-if="stato === 'pronto'" class="carta">
      <h2>Prova questo computer</h2>
      <p>Per sapere se i giochi della scuola vanno bene qui. Ogni gioco parte da solo per qualche secondo, poi il prossimo: circa
        {{ secondi }} minuti. Non toccare niente finché non finisce: alla fine basta premere «Invia».</p>
      <button type="button" class="bottone" data-azione="prova-pc-avvia" @click="avvia">Avvia la prova</button>
    </div>

    <div v-else-if="stato === 'corre'" class="segno-prova" data-prova-pc-corre>
      <span><b>{{ avanza.i + 1 }} di {{ avanza.n }}</b> · {{ avanza.nome }}</span>
      <button type="button" class="mini" data-azione="prova-pc-ferma" @click="fermare = true">Ferma</button>
    </div>

    <div v-else-if="stato === 'fatto'" class="carta" data-prova-pc-fine>
      <h2>Com'è andata</h2>
      <p class="scheda" :data-scheda="esito.scheda">Scheda video: <b>{{ esito.gpu }}</b> ({{ SCHEDA[esito.scheda] }})</p>
      <ul class="giochi">
        <li v-for="g in esito.giochi" :key="g.id" :data-gioco-provato="g.id" :data-esito="g.esito" :data-b="g.b || ''">
          <span class="nome">{{ g.nome }}</span>
          <span class="esito">{{ FRASE_ESITO[g.esito] }}<template v-if="g.b === 'tenuta'"> (grafica sgranata)</template></span>
        </li>
      </ul>
      <p v-for="(f, k) in frasi(esito)" :key="k" class="frase" data-prova-pc-frase>{{ f }}</p>
      <label class="dove">Quale computer è? (facoltativo: l'aula, il posto)
        <input v-model="dove" type="text" maxlength="200" data-prova-pc-dove placeholder="es. aula 3, il primo vicino alla finestra">
      </label>
      <div class="riga">
        <a class="bottone" data-azione="prova-pc-invia" :href="link()" target="_blank" rel="noopener">Invia il resoconto</a>
        <button type="button" class="bottone chiaro" data-azione="prova-pc-rifai" @click="avvia">Rifai la prova</button>
      </div>
      <p class="nota">«Invia il resoconto» apre un modulo già compilato: lì basta premere Invia.</p>
    </div>

    <div v-else class="carta" data-prova-pc-guasto>
      <h2>Qualcosa non va</h2>
      <p class="avviso">{{ avviso }}</p>
      <button type="button" class="bottone" data-azione="prova-pc-rifai" @click="avvia">Rifai la prova</button>
    </div>
  </div>
</template>

<style scoped>
.prova-pc { position: fixed; inset: 0; z-index: 9990; background: var(--fondo); color: var(--inchiostro); display: flex; align-items: center;
            justify-content: center; padding: 16px; overflow: auto; text-align: left }
.palco { position: fixed; inset: 0; display: flex; flex-direction: column; background: var(--fondo) }
.palco > * { flex: 1; min-height: 0 }
.chiudi { position: fixed; top: 10px; right: 10px; z-index: 3; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--filo);
          background: var(--superficie); color: var(--inchiostro); font-size: 18px; cursor: pointer }
.segno-prova { position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 3; display: flex; align-items: center; gap: 10px;
               padding: 6px 8px 6px 14px; border-radius: 999px; background: var(--superficie); border: 1px solid var(--filo); box-shadow: var(--ombra);
               font-size: 14px; white-space: nowrap }
.mini { font: inherit; font-size: 13px; padding: 4px 12px; border-radius: 999px; border: 0; background: var(--tessera); color: var(--inchiostro); cursor: pointer }
.carta { position: relative; z-index: 1; width: 100%; max-width: 560px; margin: auto 0; background: var(--superficie); border: 1px solid var(--filo);
         border-radius: var(--raggio); padding: 20px; line-height: 1.45; box-shadow: var(--ombra) }
.carta p { margin: 0 0 12px }
h2 { margin: 0 0 10px; font-size: 22px }
.scheda[data-scheda="processore"], .scheda[data-scheda="manca"] { color: var(--rosso); font-weight: 600 }
.giochi { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 4px }
.giochi li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; padding: 6px 12px; border-radius: var(--raggio-piccolo); background: var(--tessera) }
.giochi .nome { font-weight: 700; min-width: 8em }
.giochi .esito { font-weight: 600 }
li[data-esito="liscio"] .esito { color: #1f8a4c }
li[data-esito="tratti"] .esito { color: #b06d00 }
li[data-esito="scatti"] .esito, li[data-esito="non-parte"] .esito { color: var(--rosso) }
li[data-esito="non-misurato"] .esito { color: var(--grigio); font-weight: 400 }
.dove { display: block; font-size: 14px; color: var(--grigio) }
.dove input { display: block; width: 100%; box-sizing: border-box; margin-top: 4px; padding: 10px 12px; font: inherit; font-size: 16px; color: var(--inchiostro);
              background: var(--superficie); border: 1px solid var(--filo); border-radius: var(--raggio-piccolo) }
.riga { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px }
.riga .bottone { font-size: 16px; padding: 12px 20px; text-decoration: none }
.bottone.chiaro { background: var(--tessera); color: var(--inchiostro) }
.nota { margin: 10px 0 0 !important; font-size: 13px; color: var(--grigio) }
.avviso { font-size: 14px }
</style>
