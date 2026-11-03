<script setup>
// L'interfaccia unica per personalizzare un personaggio, un animale o un oggetto (docs/core/personalizza.md). Una struttura sola,
// cambia il tema (`tema`: variabili CSS in personalizza.css). Dall'alto, zone ferme: testa (titolo, saldo, ✕) · anteprima che si gira
// (slot `anteprima`) · schede · griglia degli oggetti (l'unica che scorre) · pannello dell'oggetto scelto (forma, poi colore) · fondo col
// prezzo e «Acquista e indossa». CONTRATTO: un'interazione modifica solo le zone sotto (personalizza-pura.js, `unita/personalizza`).
// Il componente non sa cosa sia un cappello: riceve voci, forme, colori, prezzi e set, e manda eventi; la logica sta in personalizza-pura.js.
// Le foto le disegna chi lo usa (slot `foto`), o sono un url (`foto` della voce); senza, un riquadro grigio «foto 3D». Mai emoji.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import './personalizza.css'
import { STATO_NUOVO, MAX_SET, tocca, zone, costo, costoSet, mancantiDi, formeDi, coloriDi, valoreDi, conForma, conColore, addossoOra, apertoDi,
  vociDi, postoPerSalvare, righeDelPannello, stessoValore } from './personalizza-pura.js'

const props = defineProps({
  tema: { type: String, default: 'sotterraneo' },          // 'sotterraneo' | 'fattoria' | 'animali'
  titolo: { type: String, default: 'Personalizza' },
  chi: { type: String, default: '' },                     // chi si è, dentro l'anteprima («Maga», «Bobi»)
  valuta: { type: String, default: '' },                  // il simbolo della valuta (🪙, 💎); vuoto: un gioco senza prezzi
  saldo: { type: Number, default: null },
  livello: { type: Number, default: Infinity },
  schede: { type: Array, default: () => [] },             // [{ id, nome, tipo: 'oggetti' | 'set' }]
  voci: { type: Array, default: () => [] },               // personalizza-pura.js, in testa
  indossato: { type: Object, default: () => ({}) },       // { posto: { oggetto, forma, colore } }
  setGioco: { type: Array, default: () => [] },
  mieiSet: { type: Array, default: () => [] },            // [{ posto: 0..5, nome, pezzi }]
  giro: { type: Number, default: 0 },                     // l'anteprima a scatti di 45° (0..7): v-model:giro
  aiuto: { type: String, default: '' },                   // la riga del fondo quando non c'è niente da pagare
  avviso: { type: String, default: '' },                  // un avviso breve sopra la figura («Fatto!»), che chi lo usa cambia a ogni volta
})
const emit = defineEmits(['scegli', 'prova', 'acquista', 'annulla', 'indossa-set', 'salva-set', 'rinomina-set', 'togli-set', 'update:giro', 'chiudi'])

// ── lo stato del componente: la scheda aperta, l'oggetto aperto per scheda, la prova, i set ──
const dati = computed(() => ({ schede: props.schede, voci: props.voci, indossato: props.indossato, setGioco: props.setGioco, mieiSet: props.mieiSet, livello: props.livello, saldo: props.valuta ? props.saldo : null }))
const stato = ref(STATO_NUOVO(props.schede))
watch(() => props.schede.map(s => s.id).join(), () => { if (!props.schede.some(s => s.id === stato.value.scheda)) stato.value = STATO_NUOVO(props.schede) })
const z = computed(() => zone(dati.value, stato.value))
const scheda = computed(() => props.schede.find(s => s.id === stato.value.scheda) || props.schede[0] || null)
const ora = computed(() => addossoOra(dati.value, stato.value))
const voceDi = id => props.voci.find(v => v.id === id) || null

function fai(ev) {
  const { stato: nuovo, eventi } = tocca(dati.value, stato.value, ev)
  stato.value = nuovo
  for (const [nome, carico] of eventi) emit(nome, carico)
}

// ── le zone ──
const vociQui = computed(() => (scheda.value ? vociDi(dati.value, scheda.value.id) : []))
const aperta = computed(() => (scheda.value && scheda.value.tipo !== 'set' ? apertoDi(dati.value, stato.value) : null))
const curAperta = computed(() => (aperta.value ? valoreDi(aperta.value, ora.value[aperta.value.posto]) : null))
const suaAperta = computed(() => !!aperta.value && !!ora.value[aperta.value.posto] && ora.value[aperta.value.posto].oggetto === aperta.value.id)
const inProva = voce => !!stato.value.prova[voce.posto] && stato.value.prova[voce.posto].oggetto === voce.id
const statoCon = (posto, valore) => ({ ...ora.value, [posto]: valore })

function gettone(voce) {
  const v = valoreDi(voce, ora.value[voce.posto]), r = costo(voce, v, props.livello)
  const liv = voce.liv > props.livello ? voce.liv : 0
  const prezzo = voce.tratto || voce.posseduto ? 0 : (voce.prezzo || (formeDi(voce)[0] || {}).prezzo || 0)
  const addosso = !voce.tratto && !!props.indossato[voce.posto] && props.indossato[voce.posto].oggetto === voce.id
  return { voce, valore: v, r, liv, prezzo, addosso, prova: !voce.tratto && inProva(voce), aperto: aperta.value === voce }
}
const gettoni = computed(() => vociQui.value.map(gettone))
const forme = computed(() => {
  const voce = aperta.value
  if (!voce || voce.niente || formeDi(voce).length < 2) return []
  return formeDi(voce).map(f => {
    const valore = conForma(voce, curAperta.value, f.id), r = costo(voce, valore, props.livello)
    return { f, valore, liv: r.liv, prezzo: r.righe.filter(x => !x[0].startsWith('colore')).reduce((t, x) => t + x[1], 0), sel: suaAperta.value && curAperta.value.forma === f.id }
  })
})
const colori = computed(() => {
  const voce = aperta.value
  if (!voce || voce.niente) return []
  const cs = coloriDi(voce, curAperta.value.forma)
  if (cs.length < 2) return []
  return cs.map(c => {
    const valore = conColore(voce, curAperta.value, c.id), r = costo(voce, valore, props.livello)
    return { c, valore, liv: r.liv, prezzo: r.righe.filter(x => x[0].startsWith('colore')).reduce((t, x) => t + x[1], 0), sel: suaAperta.value && curAperta.value.colore === c.id }
  })
})
const titoloPannello = computed(() => {
  const voce = aperta.value
  if (!voce) return 'Tocca qualcosa qui sopra.'
  if (voce.niente) return voce.nome
  const fo = formeDi(voce).length > 1 ? formeDi(voce).find(f => f.id === curAperta.value.forma) : null
  const cs = coloriDi(voce, curAperta.value.forma), co = cs.length > 1 ? cs.find(c => c.id === curAperta.value.colore) : null
  return [voce.nome, fo && fo.nome, co && co.nome.toLowerCase()].filter(Boolean).join(' · ')
})

// i set
const mieiPosti = computed(() => Array.from({ length: MAX_SET }, (_, i) => props.mieiSet.find(m => m.posto === i) || null))
const conMancanti = m => (m ? mancantiDi(dati.value, m) : 0)
const mioAddosso = m => !!m && Object.entries(m.pezzi || {}).every(([p, v]) => stessoValore(props.indossato[p], v))
const postoSalva = computed(() => postoPerSalvare(dati.value, stato.value))
const mioSalva = computed(() => (postoSalva.value == null ? null : mieiPosti.value[postoSalva.value]))
const mioAperto = computed(() => (stato.value.setAperto == null ? null : mieiPosti.value[stato.value.setAperto]))
const costoDi = s => costoSet(dati.value, s)

// il conto
const c = computed(() => z.value.conto)
const dettaglio = computed(() => (c.value ? c.value.righe.filter(r => r[1]).map(r => `${r[0]} ${r[1]}`).join(' + ') + (c.value.invece ? ` (invece di ${c.value.invece})` : '') : ''))

// ── il pannello è alto uguale per tutta la scheda: le righe che servono alla voce più ricca ──
const pannello = ref(null)
const larghezza = ref(390)
let osserva = null
onMounted(() => {
  if (!pannello.value || typeof ResizeObserver === 'undefined') return
  osserva = new ResizeObserver(e => { larghezza.value = e[0].contentRect.width || larghezza.value })
  osserva.observe(pannello.value)
})
onBeforeUnmount(() => osserva && osserva.disconnect())
// una forma è larga 48 + 4, un colore 44 + 3 + 3 + 4; niente colonna coi nomi delle righe: il titolo dice cosa si è scelto, e lo spazio va ai gettoni
const RIGA_FORME = 54, RIGA_COLORI = 52
const righe = computed(() => {
  const spazio = larghezza.value
  return scheda.value ? righeDelPannello(dati.value, scheda.value.id, Math.floor((spazio + 4) / 52), Math.floor((spazio + 4) / 54)) : { forme: 1, colori: 1 }
})
const altezzaPannello = computed(() => 2 + 2 + 26 + (righe.value.forme * RIGA_FORME + 6) + (righe.value.colori * RIGA_COLORI + 6) + 4)

// ── il nome di un set ──
const nomeScritto = ref('')
watch(() => stato.value.nomina, n => { nomeScritto.value = n ? n.nome : '' })

// ── girare: col dito sull'anteprima (uno scatto ogni PASSO px, la pagina non scorre) e con le frecce ──
const PASSO = 28
let da = null
const giraDi = d => emit('update:giro', (((props.giro + d) % 8) + 8) % 8)
function giu(e) {
  if (e.target.closest('button')) return
  da = { x: e.clientX, fatti: 0 }
  e.currentTarget.setPointerCapture?.(e.pointerId)
}
function muovi(e) {
  if (!da) return
  const n = Math.trunc((e.clientX - da.x) / PASSO)
  if (n !== da.fatti) { giraDi(n > da.fatti ? -(n - da.fatti) : da.fatti - n); da.fatti = n }   // verso destra: si vede il fianco sinistro, come girando un oggetto
}
const su = () => { da = null }

// un avviso breve sopra la figura: si rimonta a ogni testo nuovo
const chiaveAvviso = ref(0)
watch(() => props.avviso, () => { chiaveAvviso.value++ })
const fotoUrl = x => (x && typeof x.foto === 'string' ? x.foto : null)
const prezzoTesto = (tot, liv) => (liv ? `liv. ${liv}` : tot ? `${tot} ${props.valuta}` : '')
</script>

<template>
  <div class="prs" :class="'prs-tema-' + tema" data-personalizza @click.self="emit('chiudi')">
    <div class="prs-foglio" role="dialog" :aria-label="titolo">
      <header class="prs-testa">
        <h2>{{ titolo }}</h2>
        <span v-if="valuta && saldo != null" class="prs-saldo" data-prs="saldo">{{ saldo }} {{ valuta }}</span>
        <button type="button" class="prs-x" data-chiudi aria-label="chiudi" @click="emit('chiudi')">✕</button>
      </header>

      <div class="prs-anteprima" data-prs="anteprima" @pointerdown="giu" @pointermove="muovi" @pointerup="su" @pointercancel="su">
        <slot name="anteprima" :stato="ora" :giro="giro" />
        <span v-if="chi" class="prs-chi" data-prs="chi">{{ chi }}</span>
        <button type="button" class="prs-gira prs-gira-sx" data-prs="gira-sx" aria-label="gira a sinistra" @click="giraDi(1)">‹</button>
        <button type="button" class="prs-gira prs-gira-dx" data-prs="gira-dx" aria-label="gira a destra" @click="giraDi(-1)">›</button>
        <span class="prs-giro" data-prs="giro" :data-giro="giro"><i v-for="i in 8" :key="i" :class="{ si: i - 1 === giro }" /></span>
        <span v-if="avviso" :key="chiaveAvviso" class="prs-avviso">{{ avviso }}</span>
      </div>

      <nav class="prs-schede" data-prs="schede">
        <button v-for="s in schede" :key="s.id" type="button" :data-prs-scheda="s.id" v-bind="s.dati" :aria-pressed="stato.scheda === s.id" @click="fai({ tipo: 'scheda', id: s.id })">{{ s.nome }}</button>
      </nav>

      <div :key="stato.scheda" class="prs-corpo" data-prs="griglia">
        <template v-if="scheda && scheda.tipo === 'set'">
          <h3 class="prs-gruppo">I miei set</h3>
          <div class="prs-griglia">
            <template v-for="(m, i) in mieiPosti" :key="'mio' + i">
              <button v-if="m" type="button" class="prs-gettone" :class="{ addosso: mioAddosso(m), aperto: stato.setAperto === i }" :data-prs-set-mio="i" @click="fai({ tipo: 'set-mio', posto: i })">
                <span class="prs-foto"><slot name="foto" zona="set" :set="m" :stato="{ ...indossato, ...m.pezzi }"><span class="prs-foto vuota">foto 3D</span></slot></span>
                <b>{{ m.nome }}</b>
                <span v-if="conMancanti(m)" class="prs-prezzo manca">{{ conMancanti(m) }} {{ conMancanti(m) > 1 ? 'mancano' : 'manca' }}</span>
              </button>
              <button v-else type="button" class="prs-gettone libero" :class="{ aperto: stato.setAperto === i }" :data-prs-set-mio="i" @click="fai({ tipo: 'set-mio', posto: i })">
                <span class="prs-foto posto">{{ i + 1 }}</span><b>Libero</b>
              </button>
            </template>
          </div>
          <template v-if="setGioco.length">
            <h3 class="prs-gruppo">Set del gioco</h3>
            <div class="prs-griglia">
              <button v-for="s in setGioco" :key="s.id" type="button" class="prs-gettone" :class="{ prova: stato.provaSet === s.id, chiuso: costoDi(s).liv }" :data-prs-set-gioco="s.id" @click="fai({ tipo: 'set-gioco', id: s.id })">
                <span class="prs-foto"><img v-if="fotoUrl(s)" :src="s.foto" alt="" draggable="false"><slot v-else name="foto" zona="set" :set="s" :stato="{ ...indossato, ...s.pezzi }"><span class="prs-foto vuota">foto 3D</span></slot></span>
                <b>{{ s.nome }}</b>
                <span v-if="prezzoTesto(costoDi(s).tot, costoDi(s).liv)" class="prs-prezzo">{{ prezzoTesto(costoDi(s).tot, costoDi(s).liv) }}</span>
              </button>
            </div>
          </template>
        </template>
        <div v-else class="prs-griglia">
          <button v-for="g in gettoni" :key="g.voce.id" type="button" class="prs-gettone" :class="{ addosso: g.addosso, aperto: g.aperto, prova: g.prova, chiuso: g.liv }"
                  :data-prs-voce="g.voce.id" :aria-pressed="g.aperto" v-bind="g.voce.dati" @click="fai({ tipo: 'voce', id: g.voce.id })">
            <span class="prs-foto"><img v-if="fotoUrl(g.voce)" :src="g.voce.foto" alt="" draggable="false"><slot v-else name="foto" zona="voce" :voce="g.voce" :valore="g.valore" :stato="statoCon(g.voce.posto, g.valore)"><span class="prs-foto vuota">foto 3D</span></slot></span>
            <b>{{ g.voce.nome }}</b>
            <span v-if="prezzoTesto(g.prezzo, g.liv)" class="prs-prezzo">{{ prezzoTesto(g.prezzo, g.liv) }}</span>
          </button>
        </div>
      </div>

      <section ref="pannello" class="prs-pannello" data-prs="pannello" :data-prs-pannello="z.pannello.tipo" :style="{ height: altezzaPannello + 'px' }">
        <template v-if="z.pannello.tipo === 'nome'">
          <div class="prs-titolo">{{ stato.nomina.modo === 'rinomina' ? 'Nuovo nome' : stato.nomina.vecchio ? `Al posto di «${stato.nomina.vecchio}»: come si chiama?` : 'Come si chiama questo set?' }}</div>
          <div class="prs-riga" :style="{ height: righe.forme * RIGA_FORME + 6 + 'px' }">
            <input v-model="nomeScritto" class="prs-nome" data-prs="nome" maxlength="16" autocomplete="off" aria-label="il nome del set">
          </div>
          <div class="prs-riga azioni" :style="{ height: righe.colori * RIGA_COLORI + 6 + 'px' }">
            <button type="button" class="prs-secondario" data-prs="nome-no" @click="fai({ tipo: 'nome-no' })">Lascia stare</button>
            <button type="button" class="prs-compra" data-prs="nome-ok" @click="fai({ tipo: 'nome-ok', nome: nomeScritto })">Salva</button>
          </div>
        </template>
        <template v-else-if="z.pannello.tipo === 'set'">
          <div class="prs-titolo">I miei set · {{ mieiSet.length }} su {{ MAX_SET }}</div>
          <div class="prs-riga azioni" :style="{ height: righe.forme * RIGA_FORME + 6 + 'px' }">
            <button v-if="postoSalva == null" type="button" class="prs-compra" disabled data-prs="salva-set">I {{ MAX_SET }} posti sono pieni: toccane uno</button>
            <button v-else type="button" class="prs-compra" data-prs="salva-set" @click="fai({ tipo: 'salva' })">{{ mioSalva ? `Salva al posto di «${mioSalva.nome}»` : 'Salva questo set' }}</button>
          </div>
          <div class="prs-riga azioni" :class="{ vuota: !mioAperto }" :style="{ height: righe.colori * RIGA_COLORI + 6 + 'px' }">
            <template v-if="mioAperto">
              <button type="button" class="prs-secondario" data-prs="rinomina" @click="fai({ tipo: 'rinomina' })">Cambia nome</button>
              <button type="button" class="prs-secondario" :class="{ attento: stato.toglie === stato.setAperto }" data-prs="togli" @click="fai({ tipo: 'togli' })">{{ stato.toglie === stato.setAperto ? 'Tocca ancora: via' : 'Togli' }}</button>
            </template>
          </div>
        </template>
        <template v-else>
          <div class="prs-titolo" data-prs="titolo">{{ titoloPannello }}</div>
          <!-- la forma: solo quelle dell'oggetto scelto; con una forma sola (o «Nessuno») la riga resta vuota, alta uguale -->
          <div class="prs-riga" :class="{ vuota: !forme.length }" data-prs="forme" :style="{ height: righe.forme * RIGA_FORME + 6 + 'px' }">
            <template v-if="forme.length">
              <div class="prs-scelte">
                <button v-for="x in forme" :key="x.f.id" type="button" class="prs-forma" :class="{ si: x.sel && !inProva(aperta), prova: x.sel && inProva(aperta), chiuso: x.liv }"
                        :data-prs-forma="x.f.id" :aria-pressed="x.sel" :aria-label="x.f.nome" v-bind="x.f.dati" @click="fai({ tipo: 'forma', id: x.f.id })">
                  <span class="prs-foto"><img v-if="fotoUrl(x.f)" :src="x.f.foto" alt="" draggable="false"><slot v-else name="foto" zona="forma" :voce="aperta" :forma="x.f" :valore="x.valore" :stato="statoCon(aperta.posto, x.valore)"><span class="prs-foto vuota">foto 3D</span></slot></span>
                  <span v-if="prezzoTesto(x.prezzo, x.liv)" class="prs-prezzo">{{ prezzoTesto(x.prezzo, x.liv) }}</span>
                </button>
              </div>
            </template>
            <i v-else-if="aperta && aperta.niente">Niente da scegliere: né forma né colore.</i>
          </div>
          <!-- il colore: quelli della forma scelta -->
          <div class="prs-riga" :class="{ vuota: !colori.length }" data-prs="colori" :style="{ height: righe.colori * RIGA_COLORI + 6 + 'px' }">
            <template v-if="colori.length">
              <div class="prs-scelte">
                <button v-for="x in colori" :key="x.c.id" type="button" class="prs-colore" :class="{ prova: x.sel && inProva(aperta), chiuso: x.liv }"
                        :style="x.c.css ? { background: x.c.css } : null" :data-prs-colore="x.c.id" :aria-pressed="x.sel" :aria-label="x.c.nome" v-bind="x.c.dati" @click="fai({ tipo: 'colore', id: x.c.id })">
                  <span v-if="!x.c.css" class="prs-foto"><slot name="foto" zona="colore" :voce="aperta" :colore="x.c" :valore="x.valore" :stato="statoCon(aperta.posto, x.valore)"><span class="prs-foto vuota">foto</span></slot></span>
                  <span v-if="prezzoTesto(x.prezzo, x.liv)" class="prs-prezzo">{{ prezzoTesto(x.prezzo, x.liv) }}</span>
                </button>
              </div>
            </template>
          </div>
        </template>
      </section>

      <div class="prs-fondo" data-prs="fondo">
        <template v-if="c">
          <!-- niente «Com'era» qui: il fondo non cambia mai le scelte sopra di lui; una prova si toglie toccando quello che si aveva, o con la ✕ -->
          <button v-if="c.liv" type="button" class="prs-compra" disabled data-prs="paga">Dal livello {{ c.liv }}</button>
          <button v-else-if="valuta && saldo != null && c.tot > saldo" type="button" class="prs-compra" disabled data-prs="paga">Ti mancano {{ c.tot - saldo }} {{ valuta }}</button>
          <button v-else type="button" class="prs-compra" data-prs="paga" @click="fai({ tipo: 'paga' })"><span>Acquista e indossa · {{ c.tot }} {{ valuta }}</span><small>{{ dettaglio }}</small></button>
        </template>
        <span v-else class="prs-muto">{{ aiuto || (valuta ? 'Tocca per provare. Quello che è tuo si mette subito; il resto si paga qui.' : 'Tocca per scegliere: si mette subito.') }}</span>
      </div>
    </div>
  </div>
</template>
