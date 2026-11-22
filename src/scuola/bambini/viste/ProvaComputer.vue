<script setup>
/* La prova del computer della classe (docs/scuola/prova-computer.md), dalla schermata del codice. Ogni gioco vero della scuola gira a
   tutto schermo con un pilota che lo muove e si contano le immagini al secondo; sotto SOGLIA_B si rifà con la grafica più sgranata
   (pixel.js) e, se va meglio, il PC se lo ricorda. Alla fine il verdetto e un tasto solo che apre il modulo già compilato.
   Sta dentro il <form> del codice: ogni tasto è type="button", se no lo manderebbe. */
import { ref, shallowRef, nextTick, onBeforeUnmount, onErrorCaptured } from 'vue'
import { VISTE } from '../../giochi/viste.js'
import { GIOCHI_PROVA, TEMPI, provaB, sceneDi, verdetto, frasi, resoconto, FRASE_ESITO } from '../prova-pc.js'
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
const PER_GIOCO = t => t.rodaggio + t.misura + 1500      // ms: avvio scartato, conto, caricamento (a occhio)
const secondi = Math.round(GIOCHI_PROVA.reduce((n, g) => n + sceneDi(g).length, 0) * PER_GIOCO(TEMPI) / 60000)

// il conto alla rovescia in cima: a ogni gioco (e a ogni giro con la grafica sgranata) la fine si ristima dai giochi che restano
const resto = ref(0)
let fineStimata = 0, orologio = 0
const stimaFine = (restanti, tempi) => { fineStimata = performance.now() + restanti * PER_GIOCO(tempi); resto.value = fineStimata - performance.now() }
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

const pausa = ms => new Promise(r => setTimeout(r, ms))

// in scena: il gioco montato e, se disegna su una tela, una tela visibile con le sue misure (un 3D carica i modelli prima); si
// conta da lì. Una tela qualunque: la prima può essere nascosta (la minimappa del sotterraneo, il disegno di riserva)
const TETTO_SCENA = { tela: 20000, tred: 30000 }
const telaVisibile = p => [...p.querySelectorAll('canvas')].some(c => c.width > 0 && c.getBoundingClientRect().width > 50)
async function inScenaDavvero(g, tetto = g.tred ? TETTO_SCENA.tred : TETTO_SCENA.tela) {
  const t0 = performance.now(), palco = () => document.querySelector('[data-prova-pc-palco]')
  while (performance.now() - t0 < tetto && !fermare && !guasto) {
    const p = palco()
    if (p?.querySelector('[data-gioco]') && (g.tela === false || telaVisibile(p))) return true
    await pausa(200)
  }
  return false
}

// un gioco a una scala di pixel: montato, mosso dal pilota, contato, smontato. Al massimo, appena in scena, il gioco si porta al
// suo peggio da sé (`window.__estremo`, che registra lui)
async function giocaUno(g, scala, tempi, massimo = false) {
  applicaPixel(scala)
  guasto = false
  inScena.value = { id: g.id, esercizio: g.esercizio, chiave: `${g.id}-${scala}-${massimo}` }
  await nextTick()
  let ferma = pilota(g.id)
  try {
    if (!(await inScenaDavvero(g)) && !fermare) return { errore: guasto ? 'il gioco non parte' : `non è comparso in ${(g.tred ? TETTO_SCENA.tred : TETTO_SCENA.tela) / 1000} secondi` }
    if (massimo) {
      if (typeof window.__estremo !== 'function') return { errore: 'non sa andare al massimo' }
      window.__estremo(); ferma(); ferma = pilota(g.id, { massimo: true })
    }
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

// una scena della misura di casa (grafica/benchmark/veri/), nel palco: la sua misura dice fps, la parte sotto i 30 e i fermi
async function misuraVeri(g, scala, tempi) {
  applicaPixel(scala)
  try {
    const { eseguiVeri } = await import('../../../grafica/benchmark/veri.js')
    const d = await eseguiVeri({ contenitore: document.querySelector('[data-prova-pc-palco]'), corto: !!window.__benchmarkCorto, fascia: 'bassa',
      solo: [g.veri.scena.id], fermo: () => fermare, tappe: [{ gruppo: 'fps', carica: g.veri.carica, tempi: 'fps', scene: [g.veri.scena] }] })
    const r = d.risultati[0]
    return !r ? { errore: 'non misurata' } : r.errore ? { errore: r.errore } : { fps: r.fps, sotto30: r.sotto30, fermi: r.fermi, dt95: r.dt95 }
  } catch (e) { return { errore: String((e && e.message) || e).slice(0, 60) } } finally { applicaPixel(1); await pausa(400) }
}
const misuraScena = (g, tipo, scala, tempi) => (tipo === 'massimo' && g.massimo === 'veri' ? misuraVeri(g, scala, tempi) : giocaUno(g, scala, tempi, tipo === 'massimo'))

async function avvia() {
  stato.value = 'corre'; fermare = false; avviso.value = ''
  clearInterval(orologio); orologio = setInterval(() => { resto.value = fineStimata - performance.now() }, 500)
  try {
    const { infoGpuVeri, proveCpu } = await import('../../../grafica/benchmark/veri.js')
    const info = infoGpuVeri()
    const tempi = window.__benchmarkCorto ? { rodaggio: 300, misura: 1000 } : TEMPI
    const giochi = []
    // `window.__provaSolo`: solo alcuni giochi (le prove e chi guarda un gioco da solo); `__provaSogliaB` cambia la soglia di B (le prove)
    const elenco = GIOCHI_PROVA.filter(g => !window.__provaSolo || window.__provaSolo.includes(g.id))
    // le scene in fila (la base e, dove c'è, quella al massimo): il conto alla rovescia le conta tutte
    const scene = elenco.flatMap(g => sceneDi(g).map(tipo => ({ g, tipo })))
    let k = 0
    for (const [i, g] of elenco.entries()) {
      if (fermare) break
      const fatte = []
      for (const tipo of sceneDi(g)) {
        if (fermare) break
        const nome = `${g.nome}${tipo === 'massimo' ? ', al massimo' : ''}`
        avanza.value = { i, n: elenco.length, nome }
        stimaFine(scene.length - k++, tempi)
        if (g.tred && !info.webgl2) { fatte.push({ tipo, a: { errore: 'niente WebGL 2' }, b: null }); continue }
        const a = await misuraScena(g, tipo, 1, tempi)
        let b = null
        if (provaB(a, window.__provaSogliaB) && !fermare) {
          avanza.value = { i, n: elenco.length, nome: `${nome}, con la grafica più sgranata` }
          stimaFine(scene.length - k + 1, tempi)
          b = await misuraScena(g, tipo, SCALA_B, tempi)
        }
        fatte.push({ tipo, a, b })
      }
      giochi.push({ id: g.id, scene: fatte })
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
  } finally { clearInterval(orologio) }
}
function chiudi() { fermare = true; applicaPixel(1); emit('chiudi') }
onBeforeUnmount(() => { fermare = true; applicaPixel(1); clearInterval(orologio) })

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

    <!-- la fascia in cima, per tutta la prova: che non si tocca niente, quanto manca; il gioco sta sotto, intero -->
    <div v-else-if="stato === 'corre'" class="fascia-prova" data-prova-pc-corre>
      <p class="non-toccare">Prova in corso: non toccare niente, fa tutto da sola</p>
      <p class="dettaglio">
        <span>Gioco {{ avanza.i + 1 }} di {{ avanza.n }}: {{ avanza.nome }}</span>
        <span class="manca" data-prova-pc-manca>{{ resto > 1000 ? `mancano circa ${mmss(resto)}` : 'quasi finito' }}</span>
        <button type="button" class="mini" data-azione="prova-pc-ferma" @click="fermare = true">Ferma</button>
      </p>
      <div class="barra"><i :style="{ width: (100 * avanza.i / avanza.n) + '%' }"></i></div>
    </div>

    <div v-else-if="stato === 'fatto'" class="carta" data-prova-pc-fine>
      <h2>Com'è andata</h2>
      <p class="scheda" :data-scheda="esito.scheda">Scheda video: <template v-if="esito.simile">simile a </template><b>{{ esito.gpu }}</b> ({{ SCHEDA[esito.scheda] }}<template
        v-if="esito.simile">; Chrome dice solo la famiglia</template>)</p>
      <ul class="giochi">
        <li v-for="g in esito.giochi" :key="g.id" :data-gioco-provato="g.id" :data-esito="g.esito" :data-b="g.b || ''">
          <span class="nome">{{ g.nome }}</span>
          <span class="esito">{{ FRASE_ESITO[g.esito] }}<template v-if="g.b === 'tenuta'"> (grafica sgranata)</template></span>
          <span v-if="g.massimo" class="massimo" :data-massimo="g.massimo">al massimo: {{ FRASE_ESITO[g.massimo] }}</span>
          <small v-if="g.perche" class="perche">{{ g.perche }}</small>
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
.palco { position: fixed; inset: var(--alta-fascia) 0 0 0; display: flex; flex-direction: column; background: var(--fondo) }
.prova-pc { --alta-fascia: 78px }
.palco > * { flex: 1; min-height: 0 }
.chiudi { position: fixed; top: 10px; right: 10px; z-index: 3; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--filo);
          background: var(--superficie); color: var(--inchiostro); font-size: 18px; cursor: pointer }
.fascia-prova { position: fixed; top: 0; left: 0; right: 0; z-index: 2; height: var(--alta-fascia); box-sizing: border-box; padding: 10px 70px 0 16px;
                display: flex; flex-direction: column; justify-content: center; gap: 4px; background: var(--inchiostro); color: #fff; text-align: center }
.non-toccare { margin: 0; font-size: 20px; font-weight: 700 }
.dettaglio { margin: 0; display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 4px 14px; font-size: 14px; opacity: .9 }
.manca { font-weight: 700; font-variant-numeric: tabular-nums }
.fascia-prova .barra { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: #ffffff33 }
.fascia-prova .barra i { display: block; height: 100%; background: var(--giallo); transition: width .4s }
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
.perche { flex-basis: 100%; color: var(--grigio); font-size: 13px }
.massimo { font-size: 14px; color: var(--grigio) }
.massimo[data-massimo="tratti"] { color: #b06d00 }
.massimo[data-massimo="scatti"] { color: var(--rosso) }
.dove { display: block; font-size: 14px; color: var(--grigio) }
.dove input { display: block; width: 100%; box-sizing: border-box; margin-top: 4px; padding: 10px 12px; font: inherit; font-size: 16px; color: var(--inchiostro);
              background: var(--superficie); border: 1px solid var(--filo); border-radius: var(--raggio-piccolo) }
.riga { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px }
.riga .bottone { font-size: 16px; padding: 12px 20px; text-decoration: none }
.bottone.chiaro { background: var(--tessera); color: var(--inchiostro) }
.nota { margin: 10px 0 0 !important; font-size: 13px; color: var(--grigio) }
.avviso { font-size: 14px }
</style>
