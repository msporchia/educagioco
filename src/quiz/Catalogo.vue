<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LE DOMANDE, MESSE IN FILA RISPETTO A UN BAMBINO.

   La prima versione di questa scheda elencava le domande **per
   modulo**: sedici blocchi, dentro le classi dal grado più facile
   all'ultimo. Diceva cosa esiste, ed era già molto — prima non si
   poteva guardare l'insieme in nessun modo. Ma non rispondeva alla
   domanda che uno si fa davvero aprendo questa pagina: *a mio figlio
   cosa arriva, e cosa gli state togliendo?*

   Adesso le righe sono le stesse, ordinate in un altro modo: **per
   dove cadono rispetto a lui**. Cinque blocchi, e i due estremi sono
   le domande escluse — chiuse, ma lì, perché un elenco che nasconde
   quello che ha tolto non fa vedere *che* l'ha tolto, ed è esattamente
   la cosa che un grande deve poter smentire.

     [troppo facili] [facili] [nel segno] [difficili] [troppo difficili]

   IN CIMA L'ETÀ, e sposta tutto il gruppo insieme: è la manopola
   grossa, quella che si tocca una volta sola. Di fianco a ogni riga
   due frecce, ed è la manopola fine: **riclassificano quella domanda**
   di mezzo anno per volta, e la riga cambia blocco sotto il dito. Il
   feedback è quello — si vede il mazzo muoversi mentre si decide.

   Nessuna delle due cose spegne niente: spegnere è un'altra
   affermazione («a scuola non l'ha ancora fatto») e sta nella scheda
   «Cosa sa», che è anche dove le domande spente si riaccendono. Qui
   restano in fondo, in un blocco loro, perché sparire del tutto le
   renderebbe impossibili da ritrovare.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted } from 'vue'
import { fasceDelBambino, giudiziDelQuaderno } from './catalogo.js'
import { etaDelBambino, scegliEta, ritoccoSapere, ritocca,
         quantiRitocchi, azzeraRitocchi, accendiSapere } from '../store/profile.js'
import { VERDETTI } from '../store/giudizi.js'
import { anniDelLivello } from './nucleo/classi.js'

defineProps({
  /* il nome del bambino di cui si stanno guardando le domande */
  chi: { type: String, default: 'lui' },
})
const emit = defineEmits(['prova'])

/* I giudizi arrivano dall'archivio, che è asincrono: l'elenco si vede
   subito e le faccine compaiono un istante dopo. Non si aspetta niente
   per disegnare — un elenco che resta bianco mezzo secondo sembra
   rotto, e i giudizi sono un di più. */
const giudizi = ref([])
onMounted(async () => { giudizi.value = await giudiziDelQuaderno() })

/* Il contatore che rifà il conto dopo un ritocco. `settings` è
   reattivo, ma qui si legge anche l'età e si costruiscono le fasce da
   zero: una dipendenza esplicita è più onesta che sperare che la
   reattività arrivi fin qui. */
const giro = ref(0)
const eta = computed(() => (giro.value, etaDelBambino()))
const fasce = computed(() =>
  (giro.value, fasceDelBambino({ eta: eta.value, giudizi: giudizi.value })))
const quante = computed(() => fasce.value.reduce((n, f) => n + f.righe.length, 0))

/* Le due fasce escluse (e le spente) nascono chiuse: sono la maggior
   parte delle righe, e chi apre questa pagina vuole vedere prima quello
   che arriva. */
const CHIUSE = ['sotto', 'sopra', 'spenta']
const aperte = ref([])
const eAperta = f => !CHIUSE.includes(f.chiave) || aperte.value.includes(f.chiave)
const apri = f => {
  if (!CHIUSE.includes(f.chiave)) return
  aperte.value = aperte.value.includes(f.chiave)
    ? aperte.value.filter(x => x !== f.chiave)
    : [...aperte.value, f.chiave]
}

const anni = l => String(Math.round(anniDelLivello(l) * 10) / 10).replace('.', ',')
const cambiaEta = passo => {
  const nuova = Math.round((eta.value + passo) * 2) / 2
  if (nuova < 4 || nuova > 12) return
  scegliEta(nuova)
  giro.value++
}

/* ── le frecce di una riga ──
   Ritoccano la **tipologia**, non il gruppo: qui si guarda una domanda
   per volta, e chi la sposta sta dicendo una cosa su quella. Chi vuole
   muovere un gruppo intero lo fa da «Cosa sa».

   ▼ vuol dire «per lui è più facile di così»: la riga scende, e le
   domande di quella tipologia cominciano ad arrivare quando il gioco
   chiede poco. ▲ il contrario. */
function sposta(riga, verso) {
  const chiave = riga.tipo || riga.chiave
  const ora = ritoccoSapere(chiave)
  const n = Math.max(-3, Math.min(3, ora + verso))
  if (n === ora) return
  ritocca(chiave, n)
  giro.value++
}

const ritoccate = computed(() => (giro.value, quantiRitocchi()))
function rimettiTutto() {
  azzeraRitocchi()
  giro.value++
}

/* ── il ✕: «a scuola non l'ha fatto» ──
   Spegne **il gruppo**, non la riga, e per una ragione che non si vede
   da qui: i saperi li leggono anche i giochi — il castello guarda «Le
   divisioni» per decidere se chiedere una divisione, il laboratorio
   delle pozioni guarda «Le conversioni» per esistere. Spegnere la
   singola tipologia lascerebbe quei giochi a chiedere esattamente
   quello che il genitore ha appena detto di non chiedere.

   Quindi il tasto dice sempre quante domande porta via, e quali: chi lo
   tocca deve sapere che ne spegne otto, non una. */
function spegni(c) {
  if (!c.gruppo) return
  accendiSapere(c.gruppo, false)
  giro.value++
}
function riaccendi(c) {
  if (!c.gruppo) return
  accendiSapere(c.gruppo, true)
  giro.value++
}

const provaClasse = c => emit('prova', {
  nome: c.nome, sorgente: c.sorgente,
  dettaglio: `${c.icona} ${c.nomeModulo} · grado ${c.grado} di ${c.gradi}`,
})
const provaFascia = f => emit('prova', {
  nome: `Domande ${f.nome.toLowerCase()}`, eta: eta.value,
})
/* il giro: le domande di un blocco una per una, col contatore. Serve a
   una domanda diversa da «cosa gli capita» — «le ho viste tutte?», che
   è quella di chi deve giudicarle e non vuole scoprire fra un mese che
   una era storta */
const scorriFascia = f => emit('prova', {
  nome: `${f.nome}, una per una`, giro: f.righe,
})

const iconaVerdetto = id => VERDETTI.find(v => v.id === id)?.ico || ''
</script>

<template>
  <div class="catalogo">
    <!-- ══ la manopola grossa: l'età ══ -->
    <div class="eta-scelta">
      <button type="button" class="eta-tasto" data-eta="giu"
              :disabled="eta <= 4" aria-label="un semestre in meno"
              @click="cambiaEta(-0.5)">−</button>
      <div class="eta-chi">
        <b>{{ String(eta).replace('.', ',') }} anni</b>
        <i>l'età con cui il gioco sceglie le domande di {{ chi }}</i>
      </div>
      <button type="button" class="eta-tasto" data-eta="su"
              :disabled="eta >= 12" aria-label="un semestre in più"
              @click="cambiaEta(0.5)">+</button>
    </div>

    <!-- si vede solo quando c'è qualcosa da rimettere a posto -->
    <button v-if="ritoccate" type="button" class="rimetti" data-azzera-ritocchi
            @click="rimettiTutto">
      ↺ {{ ritoccate }} {{ ritoccate === 1 ? 'domanda spostata' : 'domande spostate' }} a mano ·
      <b>rimettile com'erano</b>
    </button>

    <p class="mini">Le {{ quante }} domande che i giochi sanno fare, in fila rispetto
      a {{ chi }}. Le frecce di una riga la spostano di mezzo anno: cambia blocco
      sotto il dito, e da lì in poi gli arriva più o meno spesso.</p>

    <!-- ══ i cinque blocchi, più le spente ══ -->
    <div v-for="f in fasce" :key="f.chiave" class="blocco" :data-fascia="f.chiave"
         :class="[f.chiave, { chiuso: !eAperta(f) }]">
      <button type="button" class="blocco-testa" :data-apri="f.chiave" @click="apri(f)">
        <b>{{ f.nome }}</b>
        <span class="conta">{{ f.righe.length }}</span>
        <i>{{ f.che }}</i>
        <span v-if="CHIUSE.includes(f.chiave)" class="freccia">{{ eAperta(f) ? '▴' : '▾' }}</span>
      </button>

      <template v-if="eAperta(f) && f.righe.length">
        <div v-for="c in f.righe" :key="c.chiave" class="riga" :data-classe="c.chiave">
          <span class="chi">
            <b>{{ c.icona }} {{ c.nome }}</b>
            <i>{{ c.nomeModulo }} · grado {{ c.grado }} di {{ c.gradi }}<template
              v-if="f.chiave === 'spenta' && c.gruppoNome"> · spenta con «{{ c.gruppoNome }}»</template><template
              v-else-if="c.scaletta"> · {{ c.scaletta }}</template></i>
            <em>{{ anni(c.visto) }} anni<template v-if="c.ritocco"> · spostata
              di {{ c.ritocco > 0 ? '−' : '+' }}{{ Math.abs(c.ritocco) / 2 }}</template></em>
            <!-- quello che il bambino ha già detto rispondendo: il conto
                 vale più di qualunque numero che le abbiamo dato noi -->
            <em v-if="c.consiglio" class="dice" :data-consiglio="c.chiave">
              {{ c.consiglio.detto }} —
              <button type="button" class="fai" :data-fai="c.chiave"
                      @click="sposta(c, c.consiglio.verso > 0 ? -1 : 1)">{{
                c.consiglio.verso < 0 ? 'spostala più in là' : 'spostala più in qua'
              }}</button>
            </em>
          </span>
          <span v-if="c.detti" class="detti" :data-detti="c.chiave">
            <template v-for="v in ['facile', 'difficile', 'storta']" :key="v">
              <span v-if="c.detti[v]">{{ iconaVerdetto(v) }}{{ c.detti[v] }}</span>
            </template>
          </span>
          <span class="tasti">
            <button type="button" class="tondo" :data-giu="c.chiave"
                    :disabled="c.ritocco >= 3" aria-label="per lui è più facile"
                    @click="sposta(c, 1)">▼</button>
            <button type="button" class="tondo" :data-su="c.chiave"
                    :disabled="c.ritocco <= -3" aria-label="per lui è più difficile"
                    @click="sposta(c, -1)">▲</button>
            <button type="button" class="tondo prova" :data-prova-classe="c.chiave"
                    :aria-label="'prova ' + c.nome" @click="provaClasse(c)">▶</button>
            <button v-if="f.chiave !== 'spenta'" type="button" class="tondo spegni"
                    :data-spegni="c.chiave" :disabled="!c.gruppo"
                    :aria-label="'togli le domande su ' + c.gruppoNome"
                    :title="c.gruppo ? `toglie tutte e ${c.gruppoQuante} le domande su «${c.gruppoNome}»` : ''"
                    @click="spegni(c)">✕</button>
            <button v-else type="button" class="tondo riaccendi" :data-riaccendi="c.chiave"
                    :aria-label="'rimetti le domande su ' + c.gruppoNome"
                    @click="riaccendi(c)">↺</button>
          </span>
        </div>
        <div class="in-fondo">
          <button v-if="!CHIUSE.includes(f.chiave)" type="button" class="tasto-prova"
                  :data-fascia-pesca="f.chiave" @click="provaFascia(f)">
            ▶ pescane una come farebbe un gioco
          </button>
          <button type="button" class="tasto-prova" :data-fascia-giro="f.chiave"
                  @click="scorriFascia(f)">≡ scorrile tutte</button>
        </div>
      </template>
      <p v-else-if="eAperta(f)" class="vuoto">niente qui dentro</p>
    </div>
  </div>
</template>

<style scoped>
.catalogo { display: flex; flex-direction: column; gap: 10px }
.mini { font-size: 12px; color: var(--tenue); text-align: center; margin: 0; max-width: 40ch;
        align-self: center; line-height: 1.4 }

/* ── l'età, in cima e grossa: è la manopola che si tocca una volta ── */
.eta-scelta { display: flex; align-items: center; gap: 10px; padding: 10px 12px;
              border-radius: 16px; background: #fff; box-shadow: inset 0 0 0 2px #e3e8ef }
.eta-chi { flex: 1; text-align: center }
.eta-chi b { display: block; font-size: 19px; font-weight: 850; color: var(--viola-scuro) }
.eta-chi i { font-style: normal; font-size: 11px; color: var(--tenue) }
.eta-tasto { width: 44px; height: 44px; border: none; border-radius: 50%; cursor: pointer;
             font-size: 22px; font-weight: 800; font-family: inherit; color: #fff;
             background: linear-gradient(180deg, var(--viola), var(--viola-scuro)) }
.eta-tasto:disabled { opacity: .35 }
.eta-tasto:active { transform: translateY(1px) }

/* ── i blocchi ── */
.blocco { border-radius: 16px; background: #fff; overflow: hidden;
          box-shadow: inset 0 0 0 2px #e9edf3 }
.blocco.medie { box-shadow: inset 0 0 0 3px var(--viola) }
.blocco.sotto, .blocco.sopra, .blocco.spenta { background: #f6f7fa }
.blocco-testa { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
                border: none; background: none; font-family: inherit; cursor: pointer;
                padding: 11px 13px }
.blocco-testa b { flex: none; font-size: 15px; font-weight: 850; color: var(--viola-scuro) }
.blocco-testa i { flex: 1; font-style: normal; font-size: 11px; color: var(--tenue);
                  line-height: 1.3 }
.blocco-testa .conta { font-size: 12px; font-weight: 800; color: #fff; background: var(--viola);
                       border-radius: 999px; padding: 2px 9px; min-width: 26px; text-align: center }
.blocco.sotto .conta, .blocco.sopra .conta, .blocco.spenta .conta { background: #9aa5b8 }
.blocco-testa .freccia { font-size: 13px; color: var(--tenue) }

/* ── una riga ── */
.riga { display: flex; align-items: center; gap: 8px; padding: 8px 13px;
        border-top: 1px solid #eef1f6 }
.riga .chi { flex: 1; min-width: 0; text-align: left }
.riga .chi b { display: block; font-size: 13.5px; font-weight: 750; color: var(--viola-scuro) }
.riga .chi i { font-style: normal; font-size: 10.5px; color: var(--tenue) }
.riga .chi em { display: block; font-style: normal; font-size: 10.5px; font-weight: 750;
                color: var(--viola) }
.riga .chi em.dice { color: var(--viola-scuro); font-weight: 650 }
.fai { border: none; background: none; font-family: inherit; font-size: 10.5px;
       font-weight: 800; color: var(--viola); text-decoration: underline; cursor: pointer;
       padding: 0 }
.detti { display: flex; gap: 3px; font-size: 11px; color: var(--tenue) }
.tasti { display: flex; gap: 4px; flex: none }
.tondo { width: 34px; height: 34px; border: none; border-radius: 10px; cursor: pointer;
         font-size: 12px; font-family: inherit; color: var(--viola); background: #eef2ff }
.tondo.prova { color: #fff; background: linear-gradient(180deg, var(--viola), var(--viola-scuro)) }
.tondo.spegni { color: #b23a5a; background: #fdeef2 }
.tondo.riaccendi { color: #2f9e6f; background: #e9f7f0 }
.tondo:disabled { opacity: .3 }
.tondo:active { transform: translateY(1px) }

.rimetti { border: none; border-radius: 12px; cursor: pointer; font-family: inherit;
           font-size: 12px; color: var(--viola-scuro); background: #fff5d6;
           padding: 9px 12px; align-self: center }
.rimetti b { font-weight: 800; color: var(--viola) }
.rimetti:active { transform: translateY(1px) }

.in-fondo { display: flex; gap: 1px; background: #e9edf3 }
.tasto-prova { flex: 1; border: none; cursor: pointer; font-family: inherit;
               font-size: 12.5px; font-weight: 750; color: var(--viola);
               background: #f4f6fb; padding: 10px }
.tasto-prova:active { background: #eaeef7 }
.vuoto { font-size: 11.5px; color: var(--tenue); text-align: center; padding: 0 0 10px; margin: 0 }
</style>
