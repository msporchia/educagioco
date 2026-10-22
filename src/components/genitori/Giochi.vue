<script setup>
// I giochi nelle impostazioni dei grandi, come li vede il bambino (docs/genitori/giochi.md): lo stesso carosello della home con i
// giochi che in home non ci sono in grigio, e sotto le impostazioni di quello che sta in mezzo: «Nella home» (default, oppure acceso o
// spento a mano), il tempo che ci passa, le monete di questo gioco e le domande che chiede, ognuna con dove altro vale.
import { ref, computed, onMounted, watch } from 'vue'
import Carosello from '../home/Carosello.vue'
import { GIOCHI, serveA } from '../../data/giochi.js'
import { state, nomeCorrente, etaDelBambino, giocoAcceso, fissaGioco, sapereAcceso, accendiSapere, saperiCheMancano,
         sperimentaliAccesi, ritoccoSapere, ritocca } from '../../store/profile.js'
import { inCasa } from '../../data/portata-giochi.js'
import { giochiDiUnEta, PASSATO } from '../../data/quadro.js'
import { eccezioniPerEta } from '../../data/partenze.js'
import { sapereDi } from '../../data/saperi.js'
import { pescaDaTutte } from '../../data/domande-dei-giochi.js'
import { insegnaDi } from '../../data/cosa-insegna.js'
import { saperiDelGioco, giochiCheChiedono } from '../../quiz/saperi.js'
import { leggiSessioni, perGiornoDi, perGioco } from '../../store/sessioni.js'

const emit = defineEmits(['vai'])
const chiave = ref(null)
const gioco = computed(() => GIOCHI.find(g => g.chiave === chiave.value) || null)
const chi = computed(() => nomeCorrente() || 'lui')

/* ── «In casa»: tre posizioni ──
   Salvato `true` = acceso comunque; `false` che l'età non si aspetta = spento da un grande; il resto (niente, o `false` come l'età
   vuole) = come dice l'età. Stessa lettura di `fissaGioco` (store/profile.js). */
const salvato = k => (state.profile.settings.giochi || {})[k]
const spentoDallEta = k => eccezioniPerEta(etaDelBambino()).giochi[k] === false
const modo = k => (salvato(k) === true ? 'acceso' : salvato(k) === false && !spentoDallEta(k) ? 'spento' : 'segui')
const COME = { segui: 'difetto', acceso: 'si', spento: 'no' }
// toccare di nuovo quello già scelto torna al default: due scelte sole, e si capisce subito quale è
const imposta = m => fissaGioco(chiave.value, COME[modo(chiave.value) === m && m !== 'segui' ? 'segui' : m])
const MODI = [{ k: 'acceso', nome: 'Acceso' }, { k: 'spento', nome: 'Spento' }]

// i grigi del carosello: quelli che in casa non ci sono, comunque sia andata
const spenti = computed(() => GIOCHI.filter(g => !inCasa(g.chiave)).map(g => g.chiave))

const esito = computed(() => {
  const k = chiave.value
  if (!k) return ''
  const m = modo(k)
  const eta = etaDelBambino()
  if (g_serve(k).length) return `Non compare in home: gli serve ${g_serve(k).join(', ')}, che è spento.`
  if (!sperimentaliAccesi() && gioco.value?.sperimentale) return 'È un gioco in prova: compare solo se li accendi in Impostazioni › Avanzate.'
  if (m === 'spento') return `Non compare in home. I progressi di ${chi.value} restano.`
  if (m === 'acceso') return spentoDallEta(k) ? `Compare in home anche se a ${eta} anni non sarebbe adatto.` : 'Compare sempre in home.'
  if (inCasa(k)) return `A ${eta} anni è adatto, quindi compare in home. Se l'età cambia, cambia da solo.`
  // fuori dalla home per l'età: o è già troppo facile (i giochi per i piccoli) o è per più avanti
  const { [k]: _, ...altri } = state.profile.settings.giochi || {}
  const stato = giochiDiUnEta({ eta, giochi: altri, sa: state.profile.settings.sa || {}, sperimentali: sperimentaliAccesi() }).find(g => g.chiave === k)?.stato
  return stato === PASSATO ? `A ${eta} anni è troppo facile, quindi non compare in home. Si può accendere a mano.`
    : `È per più grandi: a ${eta} anni non compare ancora, e arriva in home quando cresce.`
})
const g_serve = k => saperiCheMancano(k).map(c => (sapereDi(c) || {}).nome || c)

/* ── il tempo ── */
const voci = ref([])
async function carica() { voci.value = await leggiSessioni(state.player) }
onMounted(carica)
watch(() => state.player, carica)
const giorni = computed(() => (chiave.value ? perGiornoDi(voci.value, chiave.value, { quanti: 7 }) : []))
const settimana = computed(() => giorni.value.reduce((n, d) => n + d.secondi, 0))
const cima = computed(() => Math.max(60, ...giorni.value.map(d => d.secondi)))
const daSempre = computed(() => (perGioco(voci.value).find(x => x.gioco === chiave.value) || { secondi: 0 }).secondi)
const giorniGiocati = computed(() => giorni.value.filter(d => d.secondi > 0).length)
const piuLungo = computed(() => Math.max(0, ...giorni.value.map(d => d.secondi)))
function detto(s) {
  if (s < 60) return s ? `${Math.round(s)} s` : '0 min'
  const m = Math.round(s / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`
}
const GG = ['D', 'L', 'M', 'M', 'G', 'V', 'S']
const segno = d => GG[new Date(d.quando).getDay()]

/* ── le domande ── */
const tutte = computed(() => pescaDaTutte(chiave.value))
const insegna = computed(() => insegnaDi(chiave.value))
// il ritocco: una tacca di mezzo anno sopra o sotto la taratura, al massimo tre per parte (docs/genitori/ritocchi.md); più è alto, più facili
const testoRitocco = n => (n === 0 ? 'come dice l\'età' : `${Math.abs(n)} ${Math.abs(n) === 1 ? 'tacca' : 'tacche'} ${n > 0 ? 'più facili' : 'più difficili'}`)
const saperi = computed(() => saperiDelGioco(chiave.value).map(k => {
  const s = sapereDi(k)
  return { chiave: k, nome: s ? s.nome : k, ex: s ? s.esempio : '', serve: serveA(chiave.value).includes(k), anche: giochiCheChiedono(k, chiave.value).map(x => (GIOCHI.find(g => g.chiave === x) || {}).nome).filter(Boolean) }
}))
</script>

<template>
  <div class="giochi-impostazioni" data-giochi-impostazioni>
    <p class="mini">I giochi come li vede {{ chi }}: quelli in grigio in home non ci sono. Scorri e tocca per le impostazioni di quello in mezzo.</p>
    <Carosello imposta :giochi="GIOCHI" :spenti="spenti" :in-mezzo="chiave" @cambia="k => chiave = k" @apri="() => {}" />

    <div v-if="gioco" class="pannello" :data-pannello-gioco="gioco.chiave">
      <h3><span aria-hidden="true">{{ gioco.ico }}</span> {{ gioco.nome }}</h3>
      <p class="mini che">{{ gioco.che }}</p>

      <div class="blocco">
        <b>Nella home di {{ chi }}</b>
        <div class="scelte" role="group" aria-label="Nella home">
          <button type="button" class="seg1" :class="{ su: modo(chiave) === 'segui' }" :aria-pressed="modo(chiave) === 'segui'"
                  data-gioco-modo="segui" @click="imposta('segui')">Default</button>
          <div class="seg">
            <button v-for="m in MODI" :key="m.k" type="button" :class="{ su: modo(chiave) === m.k }" :aria-pressed="modo(chiave) === m.k"
                    :data-gioco-modo="m.k" @click="imposta(m.k)">{{ m.nome }}</button>
          </div>
        </div>
        <p class="esito" data-gioco-esito>{{ esito }}</p>
      </div>

      <div class="blocco" data-gioco-tempo>
        <b>Il tempo che ci passa</b>
        <p class="grande">{{ detto(settimana) }} <small>negli ultimi 7 giorni</small></p>
        <div class="barre">
          <div v-for="d in giorni" :key="d.giorno" class="col" :title="`${d.giorno}: ${detto(d.secondi)}`">
            <div class="asta"><i :style="{ height: Math.round(d.secondi / cima * 100) + '%' }" :class="{ niente: !d.secondi }"></i></div>
            <span>{{ segno(d) }}</span>
          </div>
        </div>
        <div class="num">
          <div><b>{{ detto(daSempre) }}</b><small>da quando gioca</small></div>
          <div><b>{{ detto(piuLungo) }}</b><small>giorno più lungo</small></div>
          <div><b>{{ giorniGiocati }} su 7</b><small>giorni</small></div>
        </div>
      </div>

      <div class="blocco" data-gioco-domande>
        <b>{{ !tutte && insegna ? insegna.titolo : 'Le domande di questo gioco' }}</b>
        <p v-if="!tutte && insegna" class="mini insegna" data-gioco-insegna>{{ insegna.testo }}</p>
        <p v-if="tutte" class="mini">Pesca da tutte le domande dei quiz, già tarate sull'età: di solito non c'è niente da fare. Se una gli va male la trovi in <b>Come va › Difficili</b>, e lì si può spostare o non chiedergliela più.</p>
        <template v-else-if="saperi.length">
          <p class="mini">Sono tarate sull'età: di solito non c'è niente da fare. Se una gli va male la trovi in <b>Come va › Difficili</b>, e lì si può spostare o spegnere.</p>
          <details class="tutte" data-gioco-tutte>
          <summary>Vedi e ritocca tutte ({{ saperi.length }})</summary>
          <ul class="domande">
            <li v-for="s in saperi" :key="s.chiave" :class="{ spenta: !sapereAcceso(s.chiave) }" :data-gioco-sapere="s.chiave">
              <span class="testo"><b>{{ s.nome }}</b><i v-if="s.ex">{{ s.ex }}</i>
                <em v-if="s.anche.length">vale anche in: {{ s.anche.join(', ') }}</em>
                <em v-if="s.serve" class="serve">senza questa il gioco non c'è in home</em>
                <span class="diff" :data-gioco-difficolta="s.chiave">
                  <button type="button" aria-label="più difficili" data-diff="giu" @click="ritocca(s.chiave, ritoccoSapere(s.chiave) - 1)">−</button>
                  <i data-diff-testo>{{ testoRitocco(ritoccoSapere(s.chiave)) }}</i>
                  <button type="button" aria-label="più facili" data-diff="su" @click="ritocca(s.chiave, ritoccoSapere(s.chiave) + 1)">＋</button>
                </span></span>
              <button type="button" class="tasto" :class="{ su: sapereAcceso(s.chiave) }" :aria-pressed="sapereAcceso(s.chiave)"
                      :aria-label="s.nome" data-gioco-sapere-tasto @click="accendiSapere(s.chiave, !sapereAcceso(s.chiave))"></button>
            </li>
          </ul>
          <p class="mini">Le domande sono le stesse in ogni gioco che le usa: spegnerne una vale per tutti, e lo dice accanto.</p>
          </details>
        </template>
        <p v-else-if="!insegna" class="mini">{{ gioco.che }}.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.giochi-impostazioni { display:flex; flex-direction:column; align-items:center; gap:10px; width:100%; max-width:440px; margin:0 auto; box-sizing:border-box; overflow-x:clip }
.giochi-impostazioni > .mini { align-self:stretch }
.pannello { align-self:stretch; display:flex; flex-direction:column; gap:12px; padding:14px; border-radius:16px; background:#fff; text-align:left }
.pannello h3 { margin:0; font-size:18px }
.che { margin:-8px 0 0 }
.blocco { display:flex; flex-direction:column; gap:6px }
.blocco > b { font-size:12px; text-transform:uppercase; letter-spacing:.05em; color:#8a8576 }
.scelte { display:flex; gap:8px; align-items:center }
.seg1 { flex:none; min-height:46px; padding:0 16px; border:2px solid #ece6d8; border-radius:999px; background:none; font:inherit; font-size:13px; color:#6c6757; touch-action:manipulation }
.seg1.su { background:#fff; border-color:#6c8cff; color:#2b2a33; font-weight:700 }
.seg { flex:1; display:flex; gap:2px; padding:3px; border-radius:999px; background:#ece6d8 }
.seg button { flex:1; min-height:40px; border:0; border-radius:999px; background:none; font:inherit; font-size:13px; color:#6c6757; touch-action:manipulation }
.seg button.su { background:#fff; color:#2b2a33; font-weight:700; box-shadow:0 1px 2px #0002 }
.esito { margin:0; padding:7px 10px; border-radius:10px; background:#f4f0ff; color:#4a3fd1; font-size:13px }
.grande { margin:0; font-size:24px; font-weight:800 }
.grande small { font-size:12px; font-weight:500; color:#8a8576 }
.barre { display:flex; gap:6px; align-items:flex-end; height:92px }
.col { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; height:100%; font-size:10px; color:#8a8576 }
.asta { flex:1; width:100%; display:flex; align-items:flex-end }
.asta i { display:block; width:100%; border-radius:4px 4px 2px 2px; background:#6c8cff; min-height:3px }
.asta i.niente { background:#e5e0d3 }
.num { display:flex; gap:8px }
.num div { flex:1; padding:6px; border-radius:10px; background:#f7f2e8; text-align:center }
.num b { display:block; font-size:14px }
.num small { font-size:10px; color:#8a8576 }
.insegna { margin:0; font-size:13.5px; line-height:1.45; color:#4a4638 }
.tutte > summary { min-height:40px; display:flex; align-items:center; font-size:13px; font-weight:700; color:#4a3fd1; cursor:pointer }
.domande { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px }
.domande li { display:flex; align-items:flex-start; gap:10px; padding:8px 0; border-bottom:1px solid #f1ebdf }
.domande li:last-child { border-bottom:0 }
.testo { flex:1; display:flex; flex-direction:column; gap:1px }
.testo i { font-style:normal; font-size:12px; color:#6c6757 }
.testo em { align-self:flex-start; margin-top:3px; padding:2px 7px; border-radius:8px; background:#fff1d6; color:#8a5a00; font-style:normal; font-size:11px }
.domande li.spenta .testo b, .domande li.spenta .testo i { opacity:.45; text-decoration:line-through }
.testo em.serve { background:#fde5e5; color:#9a2b2b }
.diff { display:flex; align-items:center; gap:6px; margin-top:6px }
.diff button { width:36px; height:32px; border:0; border-radius:10px; background:#ece6d8; font:inherit; font-size:16px; font-weight:700; touch-action:manipulation }
.diff i { font-style:normal; font-size:12px; color:#6c6757; min-width:110px; text-align:center }
.tasto { flex:none; position:relative; width:46px; height:28px; border:0; border-radius:14px; background:#cfc9b8; touch-action:manipulation }
.tasto::after { content:""; position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:#fff; transition:left .15s }
.tasto.su { background:#2f9e5b }
.tasto.su::after { left:21px }
</style>
