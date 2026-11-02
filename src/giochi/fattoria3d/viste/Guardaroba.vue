<script setup>
// Il guardaroba: il ritratto 3D del contadino (o della contadina) e, sotto, le scelte a gettoni per categoria. Un tocco PROVA il pezzo sul
// ritratto (la bozza); se tutta la bozza è gratis o già tua si indossa subito, se c'è un pezzo con 🪙 resta in prova finché non si preme «Acquista e
// indossa»: niente si compra con un tocco solo. I pezzi speciali sono velati col lucchetto finché non arriva il loro livello. Chi si è (contadino o contadina) viene dal
// profilo, come nella fattoria di sempre: qui si può cambiare con la stessa scelta della mappa. ✕ in alto a destra.
// Le regole stanno in dati/abiti.js, il ritratto lo fotografa `scena3d/anteprime.js` (tipo `contadino:<chiave>`).
import { ref, computed, watch, onMounted } from 'vue'
import { CATEGORIE, PERSONE_ABITO, etichettaDi, scelteDi, statoDelPezzo, daComprare, chiaveAbito, abitoDiSerie, nomeDelContadino } from '../dati/abiti.js'
import Personalizza from '../../../components/personalizza/Personalizza.vue'
import '../stile-guardaroba.css'

const props = defineProps({
  abito: { type: Object, required: true },        // l'abito di adesso, con la persona
  livello: { type: Number, default: 1 },
  monete: { type: Number, default: 0 },
  armadio: { type: Object, default: () => ({}) }, // i pezzi a pagamento comprati: { 'cappello:cilindro': true }
  stagione: { type: String, default: '' },        // la festa in corso: i pezzi di festa si comprano solo allora
  messaggio: { type: String, default: '' },       // l'esito dell'ultimo acquisto, detto da Gioco.vue
  aspetto: { type: String, default: '' },         // il personaggio del profilo ('bambina' | 'bimbo')
  anteprima: { type: Function, required: true },  // tipo → Promise<dataURL|null>
  anteprimaPronta: { type: Function, required: true },
})
const emit = defineEmits(['indossa', 'aspetto', 'chiudi'])

const scheda = ref('cappello')                   // `persona` («Chi sei») è una scheda come le altre: due gettoni con la foto (contadina / contadino)
const scelto = ref('')                            // il pezzo velato toccato, per dire a che livello arriva
const bozza = ref({ ...props.abito })           // quello che si sta provando: il ritratto lo mostra, il mondo no finché non si indossa
watch(() => chiaveAbito(props.abito), () => { bozza.value = { ...props.abito } })
const giro = ref(0)                              // l'anteprima si gira a scatti di 45° (0..7): una foto per angolo, `contadino:<chiave>:r<n>`
const tipo = computed(() => 'contadino:' + chiaveAbito(bozza.value) + (giro.value ? ':r' + giro.value : ''))
const ritratto = ref('')
let ultimo = ''
async function disegna() {
  const t = tipo.value; ultimo = t
  const pronta = props.anteprimaPronta(t)
  if (pronta) { ritratto.value = pronta; return }
  const url = await props.anteprima(t)
  if (url && ultimo === t) ritratto.value = url             // se nel frattempo ha scelto un altro pezzo, vale l'ultimo
}
watch(tipo, disegna)
onMounted(disegna)

const chi = computed(() => props.abito.persona)
const ctx = computed(() => ({ livello: props.livello, armadio: props.armadio, stagione: props.stagione }))
const PERSONE_SCELTA = { contadina: { nome: 'Contadina', aspetto: 'bambina' }, contadino: { nome: 'Contadino', aspetto: 'bimbo' } }
const personeScelta = computed(() => PERSONE_ABITO.map(p => ({ id: p, nome: PERSONE_SCELTA[p].nome, st: 'libero', libero: true, c: 1, sel: chi.value === p, addosso: chi.value === p,
  foto: 'capo:collo:' + abitoDiSerie(p).collo + ':' + p })))                    // il mezzobusto di serie: si riconosce chi è
const voci = computed(() => scheda.value === 'persona' ? personeScelta.value : scelteDi(scheda.value, chi.value, ctx.value).map(o => {
  const st = statoDelPezzo(scheda.value, o, ctx.value)
  return { ...o, st, foto: ['capo', scheda.value, o.id, chi.value].join(':'), libero: st !== 'bloccato', sel: bozza.value[scheda.value] === o.id, addosso: props.abito[scheda.value] === o.id }
}))
// le foto dei gettoni: il pezzo vero in 3D (scena3d/anteprime.js, tipo `capo:<categoria>:<id>:<persona>`), una per fotogramma; finché non arriva c'è il colore
const foto = ref({})
async function caricaFoto() {
  for (const v of voci.value) {
    const pronta = props.anteprimaPronta(v.foto)
    if (pronta) { foto.value[v.foto] = pronta; continue }
    props.anteprima(v.foto).then(url => { if (url) foto.value[v.foto] = url })
  }
}
watch(voci, caricaFoto, { immediate: true })
const da = computed(() => daComprare(bozza.value, props.armadio))                 // i pezzi della bozza ancora da pagare
const costo = computed(() => da.value.reduce((n, o) => n + o.prezzo, 0))
const cambiata = computed(() => chiaveAbito(bozza.value) !== chiaveAbito(props.abito))
const manca = computed(() => Math.max(0, costo.value - props.monete))
const schede = computed(() => [{ id: 'persona', nome: 'Chi sei' }, ...CATEGORIE.map(c => ({ id: c, ...etichettaDi(c, chi.value) }))])
const riga = computed(() => {
  const v = voci.value.find(x => x.id === scelto.value)
  if (v && !v.libero) return `${v.nome}: si sblocca al livello ${v.liv}.`
  if (da.value.length) return manca.value ? `In prova: ${da.value.map(o => o.nome).join(', ')}. Costa 🪙${costo.value}: ti mancano 🪙${manca.value}.`
    : `In prova: ${da.value.map(o => o.nome).join(', ')}. Costa 🪙${costo.value}: tocca «Acquista e indossa» per averlo.`
  return props.messaggio || 'Tocca un pezzo per provarlo. Quelli con 🪙 si comprano una volta sola e sono tuoi per sempre.'
})
function tocca(v) {
  if (scheda.value === 'persona') { scelto.value = ''; if (!v.sel) emit('aspetto', PERSONE_SCELTA[v.id].aspetto); return }
  if (!v.libero) { scelto.value = v.id; return }
  scelto.value = ''
  bozza.value = { ...bozza.value, [scheda.value]: v.id }
  if (cambiata.value && !da.value.length) emit('indossa', { ...bozza.value })            // gratis o già tuo: si indossa subito, come sempre
}
function compra() { if (da.value.length && !manca.value) emit('indossa', { ...bozza.value }) }
function annulla() { bozza.value = { ...props.abito } }
function cambia(id) { scheda.value = id; scelto.value = '' }
// i dati nella forma del componente comune (components/personalizza/Personalizza.vue): foto 3D del pezzo, colore finché non arriva, prezzo e livello come nota
const schedeP = computed(() => schede.value.map(s => ({ id: s.id, nome: s.nome, dati: { 'data-scheda-abito': s.id } })))
const vociP = computed(() => voci.value.map(v => ({
  id: v.id, nome: v.nome, sel: !!v.sel, bloccato: !v.libero, foto: foto.value[v.foto] || '', colore: v.c ? '#' + v.c.toString(16).padStart(6, '0') : '',
  nota: !v.libero ? 'Livello ' + v.liv : v.st === 'mio' ? '✓ tuo' : '', prezzo: v.st === 'in-vendita' ? '🪙' + v.prezzo : '', dati: { 'data-capo': scheda.value + ':' + v.id }, voce: v,
})))
</script>

<template>
  <Personalizza tema="fattoria" titolo="Guardaroba" :schede="schedeP" :scheda="scheda" :voci="vociP" :riga="riga" data-f3="guardaroba" ruotabile
                @giro="d => (giro = (giro + d + 8) % 8)" @scheda="cambia" @scegli="(_, v) => tocca(v.voce)" @chiudi="$emit('chiudi')">
    <template #anteprima>
      <div class="f3-gua-ritratto" data-f3="guardaroba-ritratto">
        <img v-if="ritratto" :src="ritratto" :alt="'Ritratto ' + nomeDelContadino(abito, 'del')" draggable="false">
      </div>
    </template>
    <template #chi><p class="f3-gua-nome" data-f3="guardaroba-chi">Sei {{ nomeDelContadino(abito, 'il') }}</p></template>
    <template #fondo>
      <div v-if="cambiata && da.length" class="f3-gua-compra" data-f3="guardaroba-compra">
        <button type="button" class="f3-gua-acquista" :class="{ manca: manca > 0 }" data-f3="guardaroba-acquista" :aria-disabled="manca > 0 || null" @click="compra">🛒 Acquista e indossa 🪙{{ costo }}</button>
        <button type="button" class="f3-gua-annulla" data-f3="guardaroba-annulla" @click="annulla">Annulla</button>
      </div>
    </template>
  </Personalizza>
</template>
