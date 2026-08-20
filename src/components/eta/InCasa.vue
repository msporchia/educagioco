<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA TACCA DI UN GIOCO — ◀ Come dice l'età ▶

   La sorella di `Taratura.vue`, per le righe del blocco «In casa». Un
   pezzo di scuola si sposta di mezzo anno per volta; un gioco no: o c'è
   o non c'è, e quello che si sceglie è **chi decide**.

   Tre posizioni, e la prima è quella che mancava:

     · **Non ce l'ha** — spento a mano (`settings.giochi[k] = false`).
     · **Come dice l'età** — nessuna eccezione, la riga torna a seguire
       la portata. È il ripristino di una riga sola, e senza di lui
       l'unico modo di tornare indietro era ricordarsi com'era.
     · **Ce l'ha** — tenuto in casa anche se l'età dice di no
       (`= true`). Serve al caso in cui l'età sbaglia: il Dungeon
       dichiarato dai sette anni e un bambino di sei che ci gioca col
       fratello, o un gioco «già passato» che in casa si apre ancora.

   Sotto, sempre, **cosa succede adesso**: «a otto anni arriva più
   avanti». Perché la scelta di mezzo è muta per definizione — non dice
   niente da sé — e senza quella riga «Come dice l'età» sarebbe una
   posizione che non si sa dove porta.

   Non salva niente, come tutte le tacche di questa cartella: manda su
   cosa ha deciso e chi la usa scrive.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { anniInLettere } from './lettere.js'

const props = defineProps({
  nome: { type: String, required: true },
  /* `si` · `no` · `difetto`, com'è messo adesso */
  scelto: { type: String, default: 'difetto' },
  /* cosa farebbe l'età da sola: `qui` · `passato` · `avanti` · `spento` */
  difetto: { type: String, default: 'qui' },
  /* dove si è, adesso: serve solo a scrivere la riga in fondo */
  stato: { type: String, default: 'qui' },
  eta: { type: Number, default: null },
  chiave: { type: String, default: '' },
})
const emit = defineEmits(['applica', 'chiudi'])

const SCELTE = [
  { chiave: 'no', nome: 'Non ce l\'ha', che: 'sparisce dalla home, i progressi restano' },
  { chiave: 'difetto', nome: 'Come dice l\'età', che: 'decide la sua età, come per tutti' },
  { chiave: 'si', nome: 'Ce l\'ha', che: 'resta in home anche se l\'età dice di no' },
]
const dove = ref(Math.max(0, SCELTE.findIndex(x => x.chiave === props.scelto)))
const ora = computed(() => SCELTE[dove.value])

/* Cosa vuol dire «come dice l'età», detto per questo gioco e a
   quest'età: è l'unica delle tre che non si spiega da sé. */
const PERCHE = {
  qui: 'a quest\'età ce l\'ha',
  passato: 'a quest\'età l\'ha già passato',
  avanti: 'a quest\'età arriva più avanti',
  spento: 'non si può accendere: è tutto di un pezzo di scuola che hai tolto',
}
const inLettere = anniInLettere
const spiega = computed(() => {
  const eta = props.eta != null ? ` (${inLettere(props.eta)})` : ''
  if (ora.value.chiave !== 'difetto') return ora.value.che
  return (PERCHE[props.difetto] || PERCHE.qui) + eta
})

/* Un gioco che non si può accendere perché gli manca un pezzo di
   scuola non si forza: la carta aprirebbe domande da indovinare. È la
   stessa regola di `giocoGiocabile`, e qui si vede come una posizione
   che non si raggiunge. */
const bloccato = computed(() => props.difetto === 'spento')
const cambiata = computed(() => ora.value.chiave !== props.scelto)
const muovi = passo => {
  const n = dove.value + passo
  if (n < 0 || n >= SCELTE.length) return
  if (SCELTE[n].chiave === 'si' && bloccato.value) return
  dove.value = n
}
</script>

<template>
  <!-- `.stop`: vive dentro una riga che si apre al tocco -->
  <div class="in-casa" :data-in-casa="chiave" @click.stop>
    <p class="dice">In casa di chi gioca:</p>

    <div class="tacca">
      <button type="button" class="freccia" data-gioco-tara="giu" :disabled="dove === 0"
              aria-label="verso non ce l'ha" @click="muovi(-1)">◀</button>
      <span class="valore">
        <b data-gioco-ora>{{ ora.nome }}</b>
        <em>{{ spiega }}</em>
      </span>
      <button type="button" class="freccia" data-gioco-tara="su"
              :disabled="dove === SCELTE.length - 1 || (dove === 1 && bloccato)"
              aria-label="verso ce l'ha" @click="muovi(1)">▶</button>
    </div>

    <div class="puntini">
      <span v-for="(s, i) in SCELTE" :key="s.chiave"
            :class="{ ora: i === dove, casa: s.chiave === 'difetto' }"></span>
    </div>

    <div class="riga">
      <button type="button" class="bottone chiaro" data-gioco-tara="lascia"
              @click="emit('chiudi')">Lascia stare</button>
      <button type="button" class="bottone" data-gioco-tara="applica" :disabled="!cambiata"
              @click="emit('applica', ora.chiave)">Conferma</button>
    </div>
  </div>
</template>

<style scoped>
.in-casa { display:flex; flex-direction:column; gap:7px; margin:6px 0 2px;
           background:#f7f5ff; border-radius:13px; padding:9px 10px }
.dice { margin:0; font-size:10.5px; color:#8a8a99; text-align:center }

.tacca { display:flex; align-items:center; gap:8px; background:#fff; border-radius:12px;
         padding:6px 7px; box-shadow:0 1px 4px #0000000f }
.freccia { border:none; background:#f0eaff; color:#5b3fa8; font-size:15px; line-height:1;
           width:38px; height:38px; border-radius:12px; cursor:pointer; font-family:inherit;
           flex:none }
.freccia:disabled { opacity:.28; cursor:default }
.freccia:active:not(:disabled) { transform:translateY(1px) }
.valore { flex:1; min-width:0; text-align:center; display:flex; flex-direction:column; gap:1px }
.valore b { font-size:14px; font-weight:850; color:var(--viola-scuro) }
.valore em { font-style:normal; font-size:10.5px; color:#7a7a8a; line-height:1.25 }

.puntini { display:flex; align-items:center; justify-content:center; gap:5px }
.puntini span { width:6px; height:6px; border-radius:50%; background:#ded8ee }
.puntini span.casa { background:#fff; box-shadow:inset 0 0 0 2px #b9b0d6 }
.puntini span.ora { background:var(--viola); box-shadow:none; transform:scale(1.35) }

.riga { display:flex; gap:6px }
.bottone { flex:1; border:none; border-radius:12px; padding:9px 6px; font-family:inherit;
           font-size:12.5px; font-weight:800; cursor:pointer; color:#fff;
           background:linear-gradient(180deg, var(--viola), var(--viola-scuro)) }
.bottone.chiaro { color:var(--viola-scuro); background:#eee9fb }
.bottone:disabled { opacity:.35; cursor:default }
.bottone:active:not(:disabled) { transform:translateY(1px) }
</style>
