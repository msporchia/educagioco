<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LE DOMANDE, TUTTE — la terza scheda della pagina dei grandi.

   Nasce da una cosa che urtava: le domande si potevano guardare **solo
   una alla volta e a caso**. Il tasto «prova» apriva quella che
   capitava, e per farsi un'idea di una tipologia bisognava insistere
   finché non ricapitava — senza mai sapere quante ce n'erano, né a che
   difficoltà stessero, né se una che si era vista era la regola o
   l'eccezione. Giudicare una domanda così è impossibile: manca
   l'insieme.

   Qui l'insieme c'è. Un blocco per modulo, e dentro le sue classi dal
   grado più facile all'ultimo, **ognuna con la difficoltà che le
   abbiamo assegnato** — che non è un'etichetta scritta a mano ma lo
   stesso 0..1 con cui i giochi pescano (`nucleo/catalogo.js`). Due
   moduli con un numero di gradi diverso si possono finalmente
   confrontare, perché quel numero è normalizzato.

   DUE MODI DI PROVARE, e sono due domande diverse:

     ▶ come le vede il bambino — si pesca a quella difficoltà come
       farebbe un gioco vero, campana e saperi spenti compresi. Risponde
       a «cosa gli capita davvero», che dall'elenco non si deduce:
       l'elenco dice cosa esiste, non con che frequenza esce.
     ≡ scorrile tutte — il giro dell'elenco, una per una, col contatore.
       Risponde a «le ho viste tutte?», che è la domanda di chi deve
       giudicare e non vuole scoprire fra un mese che una era storta.

   NON SPEGNE NIENTE. Come il pannello di prova: si guarda e basta. Gli
   interruttori stanno nella scheda «Cosa sa», e quello che è spento qui
   si vede — sbiadito, con la sua etichetta — perché un catalogo che
   nasconde quello che è spento non fa più vedere *che* è spento.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted } from 'vue'
import { catalogo, giroDi, giudiziDelQuaderno, FASCE } from './catalogo.js'
import { VERDETTI } from '../store/giudizi.js'

const props = defineProps({
  /* il nome del bambino di cui si stanno guardando le domande: cambia
     solo le parole dei tasti, non cosa esce */
  chi: { type: String, default: 'lui' },
})
const emit = defineEmits(['prova'])

/* I giudizi arrivano dall'archivio, che è asincrono: l'elenco si vede
   subito e le faccine compaiono un istante dopo. Non si aspetta niente
   per disegnare — un catalogo che resta bianco mezzo secondo sembra
   rotto, e i giudizi sono un di più. */
const giudizi = ref([])
onMounted(async () => { giudizi.value = await giudiziDelQuaderno() })

const cat = computed(() => catalogo({ giudizi: giudizi.value }))
const quante = computed(() => cat.value.reduce((n, m) => n + m.classi.length, 0))

/* raggruppati per materia, come la scheda «Cosa sa»: sedici moduli in
   fila alfabetica sono un elenco in cui si cerca, per materia sono un
   elenco in cui si trova — e chi apre questa scheda ha in testa «voglio
   vedere la matematica», non «voglio vedere il modulo lessico» */
const perMateria = computed(() => {
  const fuori = []
  for (const m of cat.value) {
    let gruppo = fuori.find(x => x.nome === m.materia)
    if (!gruppo) fuori.push(gruppo = { nome: m.materia, moduli: [] })
    gruppo.moduli.push(m)
  }
  return fuori
})

/* quante classi per fascia: il numero sul tasto, che è anche l'unica
   cosa che dice se una fascia è magra */
const perFascia = computed(() => FASCE.map(f => ({
  ...f,
  quante: cat.value.flatMap(m => m.classi).filter(c => c.fascia === f.chiave && !c.spenta).length,
})))

/* un modulo per volta, e chiuso di suo: sedici moduli aperti sono
   centoquarantaquattro righe, cioè di nuovo nessun insieme */
const aperto = ref('')
const apri = id => { aperto.value = aperto.value === id ? '' : id }

/* la difficoltà si legge in due modi insieme, e non è un lusso: la
   barretta si coglie con la coda dell'occhio scorrendo venti righe, il
   numero serve quando due righe sembrano uguali e si vuole sapere quale
   delle due sta più in alto. */
const percento = d => Math.round(d * 100)
/* le stesse tre tinte delle fasce: verde quello che si impara per
   primo, rosso l'ultimo */
const tinta = d => (d < 0.34 ? '#38c172' : d < 0.67 ? '#ffb020' : '#b23a5a')

const provaClasse = c => emit('prova', {
  nome: c.nome, sorgente: c.sorgente,
  dettaglio: `${c.icona} ${c.nomeModulo} · grado ${c.grado} di ${c.gradi}`,
})
const scorriModulo = m => emit('prova', {
  nome: `${m.icona} ${m.nome}`,
  giro: m.classi.filter(c => !c.spenta),
})
const provaFascia = f => emit('prova', { nome: `Domande ${f.nome.toLowerCase()}`, difficolta: f.difficolta })
const scorriFascia = f => emit('prova', { nome: `${f.nome}, una per una`, giro: giroDi(f.chiave) })

const iconaVerdetto = id => VERDETTI.find(v => v.id === id)?.ico || ''
</script>

<template>
  <div class="catalogo">
    <p class="mini">
      Tutte le domande che i giochi sanno fare, {{ quante }} in tutto, con la difficoltà
      che gli abbiamo dato: <b>0</b> è la prima cosa che si impara, <b>100</b> l'ultima.
      Guardare non spegne niente — gli interruttori stanno in «Cosa sa».
    </p>

    <!-- ══ le tre fasce ══ -->
    <div class="fasce">
      <div v-for="f in perFascia" :key="f.chiave" class="fascia" :data-fascia="f.chiave">
        <div class="fascia-chi">
          <b>{{ f.nome }}</b>
          <i>{{ f.quante }} domande</i>
        </div>
        <div class="fascia-tasti">
          <button type="button" class="tasto-prova" :data-fascia-pesca="f.chiave"
                  @click="provaFascia(f)">▶ come le vede {{ chi }}</button>
          <button type="button" class="tasto-scorri" :data-fascia-giro="f.chiave"
                  @click="scorriFascia(f)">≡ scorrile tutte</button>
        </div>
      </div>
    </div>

    <!-- ══ un blocco per modulo, dentro la sua materia ══ -->
    <template v-for="g in perMateria" :key="g.nome">
    <h3 class="materia">{{ g.nome }}</h3>
    <div class="moduli">
      <template v-for="m in g.moduli" :key="m.id">
        <button type="button" class="modulo" :class="{ ora: aperto === m.id }"
                :data-modulo="m.id" @click="apri(m.id)">
          <span class="ico">{{ m.icona }}</span>
          <span class="modulo-chi">
            <b>{{ m.nome }}</b>
            <i>{{ m.classi.length }} domande · {{ m.gradi }} gradi · {{ m.materia }}<template
              v-if="m.spente"> · <em>{{ m.spente }} spente</em></template></i>
          </span>
          <span class="freccia">{{ aperto === m.id ? '▴' : '▾' }}</span>
        </button>

        <div v-if="aperto === m.id" class="classi" :data-classi="m.id">
          <div v-for="c in m.classi" :key="c.chiave" class="classe"
               :class="{ spenta: c.spenta }" :data-classe="c.chiave">
            <span class="grado" :aria-label="'grado ' + c.grado">{{ c.grado }}</span>
            <span class="classe-chi">
              <b>{{ c.nome }}</b>
              <i v-if="c.scaletta">{{ c.scaletta }}</i>
              <em v-if="c.spenta">spenta: {{ c.sa.join(', ') }}</em>
            </span>
            <span class="dif" :aria-label="'difficoltà ' + percento(c.difficolta)">
              <span class="asta"><span :style="{ width: percento(c.difficolta) + '%',
                                                  background: tinta(c.difficolta) }"></span></span>
              <b>{{ percento(c.difficolta) }}</b>
            </span>
            <!-- cosa ne è stato detto giocando: vale più del numero che
                 le abbiamo assegnato noi -->
            <span v-if="c.detti" class="detti" :data-detti="c.chiave">
              <template v-for="v in ['facile', 'difficile', 'storta']" :key="v">
                <span v-if="c.detti[v]">{{ iconaVerdetto(v) }}{{ c.detti[v] }}</span>
              </template>
            </span>
            <button type="button" class="tasto-prova solo-segno" :data-prova-classe="c.chiave"
                    :aria-label="'prova ' + c.nome" @click="provaClasse(c)">▶</button>
          </div>

          <button type="button" class="tasto-scorri tutto" :data-modulo-giro="m.id"
                  @click="scorriModulo(m)">≡ scorri tutte le domande di {{ m.nome }}</button>
        </div>
      </template>
    </div>
    </template>
  </div>
</template>

<style scoped>
.mini { font-size: 12.5px; color: var(--tenue); margin: 0 0 12px; line-height: 1.45 }
.mini b { color: var(--viola-scuro) }

/* ── le fasce ──
   In cima e larghe: sono la risposta alla domanda «fammi vedere le
   domande facili», che è il motivo per cui uno apre questa scheda. */
.fasce { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px }
.fascia {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: var(--carta); border-radius: 16px; padding: 10px 12px;
}
.fascia-chi { flex: 1 1 100px; min-width: 0; text-align: left }
.fascia-chi b { display: block; font-size: 15px; font-weight: 800; color: var(--viola-scuro) }
.fascia-chi i { font-style: normal; font-size: 12px; color: var(--tenue) }
.fascia-tasti { display: flex; gap: 6px; flex-wrap: wrap }

/* I due tasti che aprono una domanda. Grandi abbastanza da leggersi e
   da centrarli col pollice: prima erano scrittine da 12px senza sfondo,
   e una scrittina non si legge come un tasto — la si scavalca. */
.tasto-prova, .tasto-scorri {
  min-height: 40px; padding: 8px 14px; border-radius: 999px; cursor: pointer;
  border: none; font: inherit; font-size: 13px; font-weight: 750;
}
.tasto-prova { background: #7c5cff1f; color: var(--viola) }
.tasto-scorri { background: #8593a81f; color: var(--viola-scuro) }
.tasto-prova:active, .tasto-scorri:active { transform: translateY(1px) }

/* ── un blocco per modulo ── */
.materia {
  margin: 16px 0 8px; font-size: 12px; font-weight: 800; letter-spacing: .08em;
  text-transform: uppercase; color: var(--tenue); text-align: left;
}
.moduli { display: flex; flex-direction: column; gap: 8px }
.modulo {
  display: flex; align-items: center; gap: 12px; width: 100%; cursor: pointer;
  background: var(--carta); border: none; border-radius: 16px; padding: 12px 14px;
  text-align: left; font: inherit;
}
.modulo.ora { border-bottom-left-radius: 4px; border-bottom-right-radius: 4px }
.modulo .ico { flex: none; font-size: 26px }
.modulo-chi { flex: 1; min-width: 0 }
.modulo-chi b { display: block; font-size: 15px; font-weight: 800; color: var(--viola-scuro) }
.modulo-chi i { font-style: normal; font-size: 12px; color: var(--tenue) }
.modulo-chi em { font-style: normal; font-weight: 700; color: #b23a5a }
.modulo .freccia { flex: none; font-size: 16px; color: var(--tenue) }

/* ── le classi dentro un modulo ──
   Rientrate e su fondo tenue, come il dettaglio della scheda «Cosa sa»:
   si devono leggere come «dentro questo», non come altre carte. */
.classi {
  display: flex; flex-direction: column; gap: 1px;
  margin: -6px 0 4px 14px; border-radius: 14px; overflow: hidden; background: #8593a81a;
}
/* a sinistra, sempre: la schermata dei grandi centra il testo, e un
   elenco centrato non si scorre — l'occhio deve trovare l'inizio di
   ogni riga nello stesso punto */
.classe {
  display: flex; align-items: center; gap: 8px; text-align: left;
  background: var(--carta); padding: 9px 8px 9px 10px;
}
.classe.spenta { opacity: .55 }
.grado {
  flex: none; width: 24px; height: 24px; border-radius: 8px; background: #8593a824;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; color: var(--tenue);
}
.classe-chi { flex: 1; min-width: 0 }
.classe-chi b { display: block; font-size: 13.5px; font-weight: 750; color: var(--viola-scuro) }
.classe-chi i, .classe-chi em {
  display: block; font-style: normal; font-size: 11.5px; color: var(--tenue);
}
.classe-chi em { color: #b23a5a; font-weight: 700 }

/* la difficoltà: barretta per l'occhio che scorre, numero per l'occhio
   che confronta */
.dif { flex: none; display: flex; align-items: center; gap: 5px }
.dif .asta {
  display: block; width: 34px; height: 6px; border-radius: 999px; background: #8593a82e;
  overflow: hidden;
}
/* tinta piena, non sfumatura: serve a raggruppare con l'occhio mentre
   si scorre, e tre colori si distinguono di sguardo — una sfumatura
   continua no. Il minimo di 3px è perché la classe più facile ha
   difficoltà 0, e una barra larga zero sembra un guasto. */
.dif .asta span { display: block; height: 100%; min-width: 3px; border-radius: 999px }
.dif b { font-size: 11.5px; font-weight: 800; color: var(--tenue); width: 20px; text-align: right }

.detti { flex: none; display: flex; gap: 4px; font-size: 11px; font-weight: 700; color: var(--tenue) }

.tasto-prova.solo-segno {
  flex: none; min-height: 38px; padding: 8px 12px; border-radius: 12px;
  background: #7c5cff14; font-size: 13px;
}
.tasto-scorri.tutto { border-radius: 0; width: 100%; justify-content: center }
</style>
