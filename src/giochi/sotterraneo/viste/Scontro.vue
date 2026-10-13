<script setup>
// Lo scontro a gruppi (docs/sotterraneo/scontro.md, «La vista»), su un pezzo di stanza vero: l'eroe a sinistra con il posto del
// compagno sfalsato sotto, i mostri a colonne sul pavimento a destra (il grosso davanti e al centro), la fila dei turni in
// una colonna sul bordo destro. Sotto ogni mostro la sua barra della vita, senza numeri (il brivido di non sapere quanto
// resiste), e sopra «ti colpisce 3». Toccando un mostro lo si fa bersaglio. Non calcola niente: riceve i numeri già fatti
// dal motore (viste/campo.js) e il racconto del turno che si sta facendo (viste/racconto.js, `fx`).
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { CIECA } from '../../pausa.js'
import { PEZZI } from '../dati/atlante.js'
import { scalaDelGrosso, figuraDelGrosso } from '../dati/grossi.js'
import { scalaDelMostro, piazza, SCALA_FIGURE } from './campo.js'
import Icona from './Icona.vue'
import Grosso from './Grosso.vue'
import Creatura from './Creatura.vue'
import Glifo from './Glifo.vue'
import Palco from './Palco.vue'
import FilaDeiTurni from './FilaDeiTurni.vue'
import Scene from './Scene.vue'
import SegniAddosso from './SegniAddosso.vue'

const props = defineProps({
  mostri: { type: Array, required: true },    // [{ i, nome, sprite, em, grosso, chiave, ossa, ossaMax, morto, stati, colpisce, salta, bersaglio, colpito }] nell'ordine dei posti
  posti: { type: Object, required: true },    // { file, grande, celle: [{ col, riga, file }] }
  turni: { type: Array, default: () => [] },  // [{ chi: 'eroe' | posto, salta }]: i prossimi sette
  apertura: { type: Object, default: () => ({}) },
  palco: { type: Object, default: () => ({}) },   // lo scenario vero: { pavimento, faccia, roccia }
  eroe: { type: Object, default: () => ({}) },   // { sprite, em, vita, vitaMax }
  mie: { type: Array, default: () => [] },     // cosa protegge l'eroe in questo scontro (scudo, parato…)
  fx: { type: Object, required: true },        // il racconto di adesso (viste/racconto.js)
})
const emit = defineEmits(['bersaglio', 'accorcia'])

/* ── le misure: gli sprite hanno una scala intera (pixel nitidi), scelta su quanto è largo il palco ── */
const duello = ref(null)
const larg = ref(352)
let osserva = null
onMounted(() => {
  if (duello.value && typeof ResizeObserver !== 'undefined') {
    osserva = new ResizeObserver(([e]) => { larg.value = Math.round(e.contentRect.width) })
    osserva.observe(duello.value)
  }
  liberoDa = performance.now() + CIECA
})
onUnmounted(() => osserva && osserva.disconnect())

const quanti = computed(() => props.mostri.length)
// UNA scala per tutti, eroe compreso: i fogli sono già in proporzione fra loro (il ratto più piccolo del cavaliere,
// l'orco più grosso: strumenti/sprite/sorgenti/creature/creature.json). Una scala per i mostri e una per
// l'eroe faceva il ratto grande come il cavaliere (l'utente, 12 ottobre: «grotteschi, vanno proporzionati»)
const scala = computed(() => SCALA_FIGURE)
const scalaEroe = scala
// dove stanno i piedi di ognuno (colonne sul pavimento, viste/campo.js); chi sta più in alto è un filo più piccolo, a quarti
const piano = computed(() => piazza(props.posti, props.mostri, larg.value))
// il compagno dell'eroe non c'è ancora: il suo posto non si disegna, e l'eroe sta a metà del pavimento (viste/campo.js, `piazza`)
const compagno = false
const scalaM = (m, k) => scalaDelMostro(m.tipo, PEZZI[m.sprite] ? PEZZI[m.sprite][3] : 16, Math.round(scala.value * piano.value.mostri[k].prof * 4) / 4)
// il grosso sta nella sua scatola (1,9 eroi di altezza, 3 di larghezza: dati/grossi.js), non a un passo intero sopra gli altri
const scalaGrosso = chi => scalaDelGrosso(chi, scala.value)
const stretto = computed(() => larg.value < 340)   // a 320 px la riga della minaccia si accorcia
const barra = computed(() => (quanti.value === 1 ? 72 : 56))
// il punto dei piedi di un mostro e l'ordine in cui si disegna (chi sta più in basso sta davanti)
const postoDi = k => ({ '--x': piano.value.mostri[k].x + 'px', '--y': piano.value.mostri[k].y + 'px', zIndex: piano.value.mostri[k].z })

/* ── cosa si vede di ognuno: durante il racconto le ossa e i caduti sono quelli di quel momento, non ancora quelli veri ── */
const ossaDi = m => (props.fx.attivo && props.fx.ossa[m.i] != null ? props.fx.ossa[m.i] : m.ossa)
const mortoDi = m => (props.fx.attivo ? !!props.fx.morti[m.i] : m.morto)
// come cade: i pezzi `<nome>-morto-<i>` dell'atlante (uno o due, docs/core/creature.md); chi non li ha svanisce in piedi, e il grosso pure
const restiDi = m => {
  if (m.grosso || !m.sprite) return []
  const base = m.sprite.replace(/-(fermo|corsa)-\d+$/, '')
  return [0, 1].map(i => `${base}-morto-${i}`).filter(n => PEZZI[n])
}
const aTerra = m => mortoDi(m) && restiDi(m).length > 0
const effettoDi = chi => props.fx.effetto[chi]
const classeFx = chi => (effettoDi(chi) ? 'sot-fx-' + effettoDi(chi).tipo : '')
const chiaveFx = chi => chi + '-' + (effettoDi(chi) ? effettoDi(chi).n : 0)
const numeriDi = chi => props.fx.numeri.filter(n => n.su === chi)
const pulita = m => !props.fx.attivo && !mortoDi(m)
const soloMiaUna = computed(() => props.mostri.filter(m => m.colpito).length > 1)
// gli stati addosso: durante il racconto quelli di quel momento (un'abilità li posa quando arriva), poi la verità
const statiDi = m => (props.fx.attivo && props.fx.stati[m.i] ? props.fx.stati[m.i] : m.stati)
const addosso = m => statiDi(m).map(x => 'sot-addosso-' + (x.fuoco ? 'fuoco' : x.gelo ? 'gelo' : x.chiave === 'debole' ? 'fiacco' : x.chiave))
// quanto è larga la figura (le stelle dello stordito girano in proporzione)
const largoDi = (m, k) => {
  if (!m.grosso) return (PEZZI[m.sprite] ? PEZZI[m.sprite][2] : 16) * scalaM(m, k)
  const f = figuraDelGrosso(m.grosso), p = f && PEZZI[`${f.sprite}-fermo-0`]
  return (p ? p[2] : 32) * scalaGrosso(m.grosso)
}
const protetto = computed(() => props.mie.some(x => ['parato', 'scudo'].includes(x.chiave)))
const diPietra = computed(() => props.mie.some(x => x.chiave === 'intoccabile'))
const specchiato = computed(() => props.mie.some(x => x.chiave === 'specchio'))
const guarisce = computed(() => props.mie.some(x => x.chiave === 'linfa'))
const tintaEroe = computed(() => (props.fx.nome ? { '--tinta': props.fx.nome.tinta } : null))

/* ── il tocco ──
   Durante il racconto un tocco lo accorcia. Fuori, toccare un mostro lo fa bersaglio: ma non nei primi 320 ms (il click che
   il dito si lascia dietro alla risposta atterrerebbe proprio qui, docs/core/il-dito.md) */
let liberoDa = 0
watch(() => props.fx.attivo, v => { if (!v) liberoDa = performance.now() + CIECA })
function sulDuello() { if (props.fx.attivo) emit('accorcia') }
function tocca(m) {
  if (props.fx.attivo) { emit('accorcia'); return }
  if (performance.now() < liberoDa || mortoDi(m)) return
  emit('bersaglio', m.i)
}

/* ── dove stanno le figure sul palco, per gli effetti (Scene.vue): il centro e la misura di chi agisce o prende, misurati quando servono ── */
const elEroe = ref(null)
const elC = {}
function punto(chi) {
  const d = duello.value && duello.value.getBoundingClientRect()
  const r = chi === 'eroe' ? elEroe.value && elEroe.value.getBoundingClientRect() : elC[chi] && elC[chi].getBoundingClientRect()
  if (!d || !r) return null
  return { x: r.left + r.width / 2 - d.left, y: r.top + r.height / 2 - d.top, w: r.width, h: r.height }
}
</script>

<template>
  <div class="sot-scontro">
    <div ref="duello" class="sot-duello" data-duello :data-file="posti.file" :data-mostri="quanti"
         :data-racconto="fx.attivo ? 'in-corso' : null" :class="{ 'sot-veloce': fx.veloce, 'sot-trema': fx.scuote }"
         :style="{ '--alto': piano.alto + 'px', '--barra': barra + 'px' }" @click="sulDuello">
      <Palco v-bind="palco" :larg="larg" :alto="piano.alto" />

      <!-- l'eroe, a sinistra; il posto del compagno c'è quando ci sarà il compagno -->
      <div ref="elEroe" class="sot-attore-eroe" data-eroe-scontro :style="{ '--x': piano.eroe.x + 'px', '--y': piano.eroe.y + 'px', zIndex: piano.eroe.y * 10 }">
        <i class="sot-ombra" :style="{ width: 16 * scalaEroe * 1.25 + 'px' }" aria-hidden="true"></i>
        <div :key="chiaveFx('eroe')" class="sot-figura sot-eroe-fig" :class="classeFx('eroe')" :style="tintaEroe">
          <div class="sot-corpo">
            <div class="sot-respira" :class="{ 'sot-protetto': protetto, 'sot-guarisce': guarisce, 'sot-di-pietra': diPietra, 'sot-specchiato': specchiato }">
              <Icona :sprite="eroe.sprite" :em="eroe.em" :scala="scalaEroe" :emAlto="64" />
            </div>
          </div>
        </div>
        <SegniAddosso :stati="mie" :largo="16 * scalaEroe" />
        <span v-if="fx.nome" :key="'n' + fx.nome.nome" class="sot-nome-abilita" data-abilita-usata :style="{ '--tinta': fx.nome.tinta }">
          <Glifo :nome="fx.nome.glifo" :misura="14" /> {{ fx.nome.nome }}
        </span>
        <span v-for="n in numeriDi('eroe')" :key="n.id" class="sot-numero" :class="'sot-numero-' + n.tipo" data-cifra>{{ n.testo }}</span>
      </div>
      <div v-if="compagno" class="sot-compagno" data-posto-compagno aria-hidden="true" :style="{ '--x': piano.compagno.x + 'px', '--y': piano.compagno.y + 'px' }"></div>

      <!-- i mostri: colonne sul pavimento, sfalsati; il grosso davanti e al centro (viste/campo.js, `piazza`) -->
      <div class="sot-schiera" data-campo>
        <button v-for="(m, k) in mostri" :key="m.i" type="button" class="sot-m"
                :class="{ 'sot-morto': mortoDi(m), 'sot-a-terra': aTerra(m), 'sot-m-grosso': m.grosso, 'sot-bersaglio': pulita(m) && m.bersaglio,
                          'sot-colpito-da-me': pulita(m) && m.colpito && soloMiaUna }"
                :style="[postoDi(k), { '--f': m.colpito }]" :aria-label="m.nome" :disabled="mortoDi(m)"
                data-mostro :data-variante="m.variante" :data-grado="m.grado" :data-colpisce="m.colpisce" :data-salta="m.salta ? '' : null" :data-i="m.i" :data-tipo="m.tipo" :data-nome="m.nome" :data-grande="m.grosso || null"
                :data-bersaglio="pulita(m) && m.bersaglio ? '' : null" :data-colpito="pulita(m) && m.colpito ? m.colpito : null"
                :data-morto="mortoDi(m) ? '' : null" :data-porta-chiave="m.chiave ? '' : null" @click.stop="tocca(m)">
          <span :ref="el => { elC[m.i] = el }" class="sot-m-corpo">
            <i class="sot-ombra" :style="{ width: Math.round(largoDi(m, k) * 1.25) + 'px' }" aria-hidden="true"></i>
            <span v-if="!m.grosso && !mortoDi(m) && (m.grado || m.bersaglio)" class="sot-m-nome" :class="m.grado && ['sot-grado', 'sot-grado-' + m.grado]" data-nome-mostro :data-grado="m.grado">{{ m.etichetta }}</span>
            <span :key="chiaveFx(m.i)" class="sot-figura sot-m-fig" :class="[classeFx(m.i), m.grado && 'sot-grado-' + m.grado]">
              <span class="sot-corpo">
                <span class="sot-respira" :class="addosso(m)">
                  <Grosso v-if="m.grosso" :chi="m.grosso" :scala="scala" />
                  <template v-else>
                    <Creatura :class="aTerra(m) && 'sot-resti-a'" :sprite="aTerra(m) ? restiDi(m)[0] : m.sprite" :em="m.em" :scala="scalaM(m, k)" :emAlto="48" :tipo="m.tipo" :arma="aTerra(m) ? null : m.arma" />
                    <Creatura v-if="aTerra(m) && restiDi(m)[1]" class="sot-resti-b" :sprite="restiDi(m)[1]" :em="m.em" :scala="scalaM(m, k)" :emAlto="48" :tipo="m.tipo" />
                  </template>
                </span>
              </span>
            </span>
            <SegniAddosso :stati="statiDi(m)" :largo="largoDi(m, k)" />
            <i class="sot-anello" aria-hidden="true"></i>
            <span v-if="pulita(m) && m.segni.length" class="sot-m-segni" data-segni>
              <span v-for="g in m.segni" :key="g.tipo + g.glifo" class="sot-segno-pre" :class="'sot-segno-pre-' + g.tipo" :style="{ '--tinta': g.tinta }"
                    :data-segno-pre="g.tipo" :title="g.dice">
                <Glifo :nome="g.glifo" :misura="11" />
                <svg v-if="g.tipo === 'resiste'" class="sot-freccetta" viewBox="0 0 6 6" width="6" height="6"><path d="M0.5 1H5.5L3 5.5Z" /></svg>
                <svg v-else-if="g.tipo === 'teme'" class="sot-freccetta" viewBox="0 0 6 6" width="6" height="6"><path d="M0.5 5H5.5L3 0.5Z" /></svg>
              </span>
            </span>
            <span class="sot-m-stati" data-effetti>
              <span v-for="x in statiDi(m)" :key="x.chiave" class="sot-chip" :class="'sot-chip-' + (x.fuoco ? 'fuoco' : x.chiave)"
                    :data-stato="x.chiave" :title="x.dice"><Glifo :nome="x.glifo" :misura="12" /><b v-if="x.t">{{ x.t }}</b></span>
            </span>
            <span v-for="n in numeriDi(m.i)" :key="n.id" class="sot-numero" :class="['sot-numero-' + n.tipo, n.tono && 'sot-segno-' + n.tono, n.barrato && 'sot-segno-barrato']"
                  :style="n.riga != null ? { '--riga': n.riga } : null" data-cifra><Glifo v-if="n.glifo" :nome="n.glifo" :misura="11" />{{ n.testo }}</span>
          </span>
          <span class="sot-vita" data-vita :data-ossa="ossaDi(m)"><i :style="{ width: Math.max(0, ossaDi(m) / m.ossaMax * 100) + '%' }"></i></span>
        </button>
      </div>

      <FilaDeiTurni :turni="fx.fila || turni" :mostri="mostri" :eroe="eroe" />

      <!-- gli effetti dell'abilità: quello che vola, cade, esce dal pavimento (viste/Scene.vue) -->
      <Scene :scene="fx.scene" :punto="punto" :larg="larg" />

      <!-- l'agguato e la sorpresa: una riga che si vede, poi sparisce -->
      <p v-if="fx.riga" class="sot-apertura" data-apertura>{{ fx.riga }}</p>
    </div>

    <div v-if="mie.length" class="sot-stati-mie em" data-stati-eroe>
      <span v-for="x in mie" :key="x.chiave" :data-stato="x.chiave"><Glifo :nome="x.glifo" :misura="14" /> {{ x.dice }}</span>
    </div>
  </div>
</template>
