<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MANOPOLA DELL'ETÀ, CHE DICE COSA FA

   ── DA DOVE VIENE ────────────────────────────────────────────────
   C'erano due manopole per la stessa cosa, e in due posti diversi:
   quattro carte con scritto «prima o seconda / terza elementare» — che
   riscrivevano giochi, saperi ed età in blocco — e, dieci pixel più
   sopra, un `− 7,5 anni +` che spostava solo l'età. Niente le
   distingueva a guardarle, e la prima cancellava senza dirlo tutto
   quello che il grande aveva sistemato a mano.

   Il difetto vero però era un altro, e le carte lo nascondevano invece
   di risolverlo: **la tacca non diceva cosa fa**. «Terza elementare» ti
   dice a chi è rivolta la scelta, mai cosa cambia scegliendola — e
   siccome l'effetto (quali carte in home, quali domande) si vedeva solo
   uscendo e andando a guardare da un'altra parte, nessuno lo verificava.

   ── COS'È ADESSO ─────────────────────────────────────────────────
   Una manopola sola, in anni — che è l'unità vera di tutto il sistema:
   12,5 punti per anno, la stessa scala delle domande e delle campagne.
   Sotto, il quadro di quell'età (`data/quadro.js`): quante carte in
   home, cosa non si dà per scontato, come si spartiscono le domande. E
   appena si muove, **cosa è cambiato rispetto alla tacca di prima** —
   che è la riga che si legge davvero, perché nessuno confronta due
   elenchi: si guarda cosa si è mosso.

   ── DUE MESTIERI, UN COMPONENTE ──────────────────────────────────
   Lo usano il primo avvio (`Benvenuto.vue`, dove il bambino non esiste
   ancora) e la schermata dei grandi (dove esiste e ha le sue
   impostazioni). La differenza sta tutta in cosa gli si passa: le
   eccezioni di adesso, o niente. Il conto di cosa diventerebbero lo fa
   `spostandoLEta` in `data/partenze.js`, che è **la stessa funzione**
   che poi le scrive — se il riassunto lo calcolasse per conto suo
   direbbe una cosa e il salvataggio ne farebbe un'altra, e sarebbe
   peggio di nessun riassunto.

   ── NON SALVA NIENTE ─────────────────────────────────────────────
   Emette `scegli` e basta. Chi lo usa decide: il primo avvio se lo
   tiene in un ref finché non si preme «Si gioca!», la schermata dei
   grandi lo scrive nel profilo (e, se serve, lo fa confermare prima).
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import Blocco from './quadro/Blocco.vue'
import Riga from './quadro/Riga.vue'
import { quadroDi } from '../data/quadro.js'
import { partenzaPerEta } from '../data/partenze.js'
import { classiNude } from '../quiz/catalogo.js'

const props = defineProps({
  /* gli anni di adesso, o `null` se non sono ancora stati scelti: è il
     caso del primo avvio, dove una risposta già data si premerebbe
     senza leggerla */
  anni: { type: Number, default: null },
  /* le eccezioni che il bambino ha adesso, nella forma di `settings` */
  giochi: { type: Object, default: () => ({}) },
  sa: { type: Object, default: () => ({}) },
  sperimentali: { type: Boolean, default: false },
  /* Dove atterra la **prima tacca**, quando un'età ancora non c'è. In
     fondo alla scala e non in mezzo: chi apre questa schermata sta
     aggiungendo un bambino, e un bambino che si aggiunge è quasi sempre
     il più piccolo di casa — il grande il gioco ce l'ha già. Partendo
     da metà si sale e si scende a caso; partendo da quattro si sale e
     basta, e si smette quando l'elenco comincia a dare per scontato
     qualcosa che non sa. */
  partenza: { type: Number, default: 4 },
})
const emit = defineEmits(['scegli', 'prova'])

/* ── PROVARE UNA VOCE DELL'ELENCO ──
   Un nome non basta, e non è colpa del nome: «le analogie fra figure»
   non dice a un grande che aspetto abbia la domanda, e senza vederla
   non può giudicare se sia roba da suo figlio. Il ▶ apre la domanda
   vera, generata dallo stesso modulo che la darebbe in partita — non
   una scritta a mano, che invecchierebbe da sola
   (`quiz/nucleo/esempi.js`).

   Chi lo mostra non apre niente: passa su. Il pannello è uno solo
   (`quiz/Prova.vue`) e vive nella schermata, perché la messa in scena
   di una domanda dev'essere la stessa da qualunque parte si arrivi.

   `.stop` non è pignoleria: il riquadro intero si apre e si chiude al
   tocco, quindi senza fermarlo il ▶ aprirebbe la domanda e nello
   stesso gesto richiuderebbe l'elenco da cui è stata chiesta. */
/* L'età viaggia con l'evento, e non è un di più: una classe è una
   domanda sola e si mostra com'è, ma un **gruppo di sapere** è largo —
   dal colpo d'occhio sui pallini ai numeri a tre cifre — e senza sapere
   di chi stiamo parlando il pannello pescherebbe in tutto il gruppo. A
   quattro anni usciva una domanda dichiarata otto e mezzo, cioè si
   chiedeva a un grande di giudicare se suo figlio sappia una cosa
   mostrandogli quello che a suo figlio non arriverà per anni. */
const provaClasse = r => emit('prova', { sorgente: r.sorgente, nome: r.nome, eta: props.anni })
/* Il ▶ di un pezzo di scuola non pesca in tutto il gruppo: scorre **le
   sue domande di questa fascia**, che sono quelle che la riga sta
   dichiarando. È lo stesso `giro` della scheda delle domande — una
   lista di classi col contatore — e non un secondo modo di mostrare le
   stesse cose. Se pescasse nel gruppo intero, il ▶ della riga «sta
   imparando» aprirebbe anche quelle toste, e il riquadro direbbe una
   cosa mentre il tasto ne apre un'altra. */
const provaSapere = s => emit('prova', { giro: s.classi, nome: s.nome, eta: props.anni })

const MIN = 4
const MAX = 12
const PASSO = 0.5

/* Le classi non cambiano mai durante la vita della schermata — sono la
   scaletta delle domande, non uno stato — e costruirle è il pezzo caro
   del quadro: si chiedono una volta sola. */
const classi = classiNude()

/* Le impostazioni sono quelle che gli passa chi lo usa, e non se le
   ricalcola: nelle due situazioni sono due cose diverse e solo il padre
   sa quale. Nella schermata dei grandi sono quelle vere del bambino,
   già scritte nel profilo; nel primo avvio sono quelle che quell'età
   darebbe a un bambino che ancora non esiste (`eccezioniPerEta`).
   Provare a indovinarlo qui era il difetto: `spostandoLEta({ da:
   props.anni, a: props.anni })` è sempre «stessa fascia», quindi il
   wizard mostrava il quadro di un bambino con tutto acceso — tredici
   giochi in casa a otto anni, e niente dato per scontato. */
const quadro = computed(() => props.anni == null ? null : quadroDi(
  { eta: props.anni, giochi: props.giochi, sa: props.sa, sperimentali: props.sperimentali },
  { classi }))

/* ── PERCHÉ NON C'È UNA RIGA CHE DICE COSA È CAMBIATO ──
   C'era, e diceva «＋ arriva La bancarella», «＋ da qui in poi dà per
   scontato anche le divisioni». Sembrava il pezzo più utile e non lo
   era: **raccontava il movimento a chi stava già guardando la manopola
   muoversi**, e da fermo non diceva niente — chi apriva la schermata
   senza toccare nulla non lo vedeva mai.

   In cambio costava una forma in più fra i riquadri, e metteva in fila
   due modi di dire la stessa cosa: «arriva la bancarella» sopra un
   elenco in cui la bancarella era già lì, con scritto «c'è». Adesso i
   blocchi sono sei e sono tutti uguali: dicono **come stanno le cose**
   a quell'età, e il movimento si vede perché si muovono loro. */

function muovi (passo) {
  const ora = props.anni == null ? props.partenza - passo : props.anni
  const nuova = Math.round((ora + passo) * 2) / 2
  if (nuova < MIN || nuova > MAX) return
  emit('scegli', nuova)
}

/* «7 anni e mezzo», non «7,5 anni»: è come lo direbbe chiunque, e
   questa riga la legge un genitore, non un foglio di calcolo. */
const inLettere = a => a == null ? '—'
  : (a % 1 ? `${Math.floor(a)} anni e mezzo` : `${a} ann${a === 1 ? 'o' : 'i'}`)

/* l'età di una domanda, arrotondata al mezzo anno: il catalogo la dà a
   un decimale («7,4 anni») e nessun genitore giudica un decimale */
const etaDella = a => inLettere(Math.round((a || 0) * 2) / 2)

const etichetta = computed(() => inLettere(props.anni))
const fascia = computed(() => partenzaPerEta(props.anni))

/* ── L'ASSAGGIO DI UN BLOCCO CHIUSO ──
   Tre pezzi di scuola e quanti ne restano: un riassunto che elenca
   trenta voci non è più un riassunto. Sono i **gruppi** e non le
   classi, che è la stessa unità che si trova aprendo — prima l'assaggio
   mostrava i nomi delle domande e dentro c'era dell'altro, e due
   elenchi diversi sotto lo stesso titolo fanno credere di aver
   sbagliato a premere. */
const TRE = 3
const assaggioDi = g => {
  const nomi = g.saperi.slice(0, TRE).map(s => giu(s.nome))
  const restanti = g.saperi.length - nomi.length
  return nomi.join(' · ') + (restanti > 0 ? ` · e altri ${restanti}` : '')
}

/* Un solo aperto per volta non serve: sono blocchi corti e chi apre
   due elenchi li sta confrontando. Basta ricordarsi quali. */
const aperti = ref([])
const eAperto = k => aperti.value.includes(k)
const apri = k => { aperti.value = eAperto(k)
  ? aperti.value.filter(x => x !== k) : [...aperti.value, k] }

/* ── COME SI CHIAMANO I QUATTRO GRUPPI ──
   Le chiavi sono quelle di sempre (`FASCE_ETA` in
   `quiz/nucleo/catalogo.js`): qui cambia solo **come si dicono**, e
   cambia perché il momento è un altro. Nell'elenco delle domande della
   scheda «Giochi» un grande sta tarando riga per riga, e «Facili ·
   Nel segno · Difficili» è il vocabolario giusto per farlo. Qui sta
   decidendo un'età con una manopola in mano, e la domanda che si fa è
   sul bambino, non sulle domande: *cosa sa già, cosa sta imparando,
   cosa gli chiediamo di provare.*

   Due altre formulazioni che dicono la stessa cosa, se questa non
   suona — si scambiano cambiando queste quattro righe:

     asciutta   Da ripasso · Ci sta lavorando · La sfida · Superate
     didascalica  Le sa già, ma ripassa · Sta studiando queste ·
                  Difficili ma fattibili · Troppo facili, tolte */
const GRUPPI = {
  facili: { nome: 'Queste le sa fare',
            che: 'roba che sa già: esce quando il gioco chiede poco' },
  medie: { nome: 'Sta imparando queste',
           che: 'la sua misura: sono quelle che vede più spesso' },
  toste: { nome: 'Difficili, ma ce la può fare',
           che: 'un gradino sopra, quando il gioco chiede molto' },
  sotto: { nome: 'Superfluo chiedergliele',
           che: 'per lui sono ovvie: le indovinerebbe senza pensarci' },
}

/* ── COME SI DICE UNO STATO ──
   Quattro frasi corte, e la differenza fra le ultime tre è tutta la
   ragione per cui l'elenco si mostra intero invece che come due righe
   di «arriva» e «non compare più»: quelle raccontavano il movimento a
   chi stava già guardando la manopola muoversi, questo dice **come
   stanno le cose** e si legge anche da fermi. */
const STATI = {
  qui: { testo: 'c\'è', cls: 'si' },
  passato: { testo: 'l\'ha già passato', cls: 'giu' },
  avanti: { testo: 'arriva più avanti', cls: 'su' },
  spento: { testo: 'l\'hai spento tu', cls: 'off' },
}
const stato = g => STATI[g.stato] || STATI.qui
const quantiQui = computed(() =>
  quadro.value ? quadro.value.giochi.filter(g => g.stato === 'qui').length : 0)

/* «Survivors, il Dungeon e il sotterraneo»: la virgola fino al
   penultimo e la «e» in fondo, come si parla */
const ARTICOLI = ['il', 'lo', 'la', 'i', 'gli', 'le', "l'"]
/* «con Survivors, il Dungeon e il sotterraneo»: dentro una frase
   l'articolo va minuscolo, il nome proprio no — abbassare tutto darebbe
   «survivors», tenere tutto darebbe «Il Dungeon» in mezzo a una riga */
const inFrase = nome => {
  const [prima, ...resto] = String(nome || '').split(' ')
  return ARTICOLI.includes(prima.toLowerCase()) && resto.length
    ? [prima.toLowerCase(), ...resto].join(' ') : nome
}
const elencoDi = nomi => {
  const x = (nomi || []).map(inFrase)
  return x.length < 2 ? (x[0] || '') : `${x.slice(0, -1).join(', ')} e ${x[x.length - 1]}`
}

/* minuscolo perché finisce dentro una frase e non a capo di una riga:
   «le divisioni», non «Le divisioni» */
const giu = n => String(n || '').charAt(0).toLowerCase() + String(n || '').slice(1)

</script>

<template>
  <div class="manopola" data-manopola>
    <div class="tacca">
      <button type="button" class="freccia" data-eta="giu"
              :disabled="anni != null && anni <= MIN"
              aria-label="mezzo anno in meno" @click="muovi(-PASSO)">◀</button>
      <span class="numero">
        <b data-eta-ora>{{ etichetta }}</b>
        <em v-if="fascia">come in {{ fascia.come }}</em>
        <em v-else>muovi la manopola</em>
      </span>
      <button type="button" class="freccia" data-eta="su"
              :disabled="anni != null && anni >= MAX"
              aria-label="mezzo anno in più" @click="muovi(PASSO)">▶</button>
    </div>

    <!-- Finché non si è scelto non si mostra un quadro: sarebbe il
         quadro di un'età che nessuno ha deciso, e uno che lo legge
         crederebbe di aver già risposto. -->
    <p v-if="!quadro" class="invito">Sposta la manopola per vedere cosa cambia.</p>

    <div v-else class="quadro">
      <!-- ══ CINQUE BLOCCHI, UNA FORMA SOLA ══
           Titolo · quanti sono · cosa vuol dire · l'assaggio, e si apre
           toccandolo in qualunque punto. La forma sta in
           `quadro/Blocco.vue` e la riga in `quadro/Riga.vue`: erano
           scritte a mano una per blocco, ed è così che due di loro
           erano finite diverse dalle altre senza che nessuno l'avesse
           deciso. -->

      <!-- i giochi, tutti, con lo stato addosso: chi c'è, chi il
           bambino ha già passato, cosa arriva più avanti -->
      <Blocco data-apri="giochi" titolo="In casa"
              :conta="`${quantiQui} su ${quadro.giochi.length}`"
              spiega="i giochi che trova in home a quest'età"
              :aperto="eAperto('giochi')" @apri="apri('giochi')">
        <template #chiuso>
          <span class="chip-riga">
            <span v-for="g in quadro.giochi" :key="g.chiave" class="chip"
                  :class="g.stato" :title="`${g.nome} — ${stato(g).testo}`">{{ g.ico }}</span>
          </span>
        </template>
        <ul class="elenco">
          <Riga v-for="g in quadro.giochi" :key="g.chiave"
                :ico="g.ico" :nome="g.nome" :sotto="g.che" :stato="stato(g)" />
        </ul>
      </Blocco>

      <!-- ══ QUANDO LE DOMANDE NON LE CHIEDE NESSUNO ══
           Da quattro a cinque anni e mezzo in casa ci sono tre giochi e
           nessuno pesca dai moduli di quiz: i blocchi elencavano undici
           classi coi nomi e col tastino per provarle, e un grande le
           leggeva come «ecco cosa gli chiederemo». Non gliele avremmo
           chieste mai. Una riga sola al posto di quattro elenchi, e dice
           anche da quando cambia — che è l'unica cosa utile lì: cosa si
           guadagna salendo ancora. -->
      <Blocco v-if="!quadro.domande.chiedono" data-domande="nessuna"
              titolo="Le domande" conta="nessuna" :apribile="false"
              spiega="a quest'età nessun gioco gliele chiede: quelli che ha in casa hanno le loro"
              :assaggio="quadro.domande.da
                ? `Arrivano a ${inLettere(quadro.domande.da)}, con ${elencoDi(quadro.domande.quali)}`
                : ''" />

      <!-- ══ E LE DOMANDE, NELLA SCALA CHE ESISTE GIÀ ══
           Quattro blocchi, e sono quattro livelli di padronanza rispetto
           a **questo** bambino: le sa fare · sta imparando · difficili
           ma ce la può fare · non gliele chiediamo più. Il quinto —
           impossibili — non si mostra, perché non gli arrivano.

           Dentro, i **pezzi di scuola**, e sotto ognuno le sue domande
           di quella fascia. Lo stesso pezzo può stare in due blocchi, ed
           è il punto: le figure piane sono roba che sta imparando per
           due domande e roba tosta per una terza. Prima c'era un blocco
           a parte, «dà per scontato che sappia», fatto di gruppi mentre
           questi erano fatti di classi: due unità di misura per la
           stessa roba, e nessuna delle due diceva l'altra. -->
      <Blocco v-for="g in (quadro.domande.chiedono ? quadro.gruppi.filter(x => x.quante) : [])"
              :key="g.chiave" :data-apri="g.chiave"
              :titolo="GRUPPI[g.chiave].nome" :conta="String(g.quante)"
              :spiega="GRUPPI[g.chiave].che"
              :assaggio="assaggioDi(g)"
              :aperto="eAperto(g.chiave)" @apri="apri(g.chiave)">
        <ul class="elenco">
          <template v-for="s in g.saperi" :key="s.chiave">
            <!-- il pezzo di scuola, col suo ▶: scorre le sue domande di
                 questa fascia e nient'altro. Si apre a sua volta, perché
                 a otto anni un blocco solo ha cinquantasette domande in
                 venti pezzi di scuola — mostrarle tutte insieme non è un
                 elenco, è un muro. -->
            <Riga :ico="s.ico" :nome="s.nome" :chiave="s.chiave"
                  :sotto="s.quante === 1 ? '1 domanda' : `${s.quante} domande`"
                  prova apribile :aperto="eAperto(`${g.chiave}:${s.chiave}`)"
                  @prova="provaSapere(s)" @apri="apri(`${g.chiave}:${s.chiave}`)" />
            <!-- sotto una domanda va **a che età serve**, non il nome del
                 modulo: dentro il suo pezzo di scuola il modulo lo
                 ripete quasi sempre («Coniugazione» sotto «I verbi al
                 presente»), mentre gli anni sono la sola cosa che un
                 grande può giudicare guardandola -->
            <Riga v-for="(r, i) in (eAperto(`${g.chiave}:${s.chiave}`) ? s.classi : [])"
                  :key="r.chiave" dentro :ultima="i === s.classi.length - 1"
                  :nome="r.nome" :sotto="etaDella(r.anni)" :chiave="r.chiave"
                  prova @prova="provaClasse(r)" />
          </template>
        </ul>
      </Blocco>
    </div>
  </div>
</template>

<style scoped>
.manopola { width:100%; display:flex; flex-direction:column; gap:10px }

.tacca { display:flex; align-items:center; gap:10px; justify-content:space-between;
         background:#fff; border-radius:16px; padding:8px 10px;
         box-shadow:0 2px 8px #0000000f }
.freccia { border:none; background:#f0eaff; color:#5b3fa8; font-size:20px; line-height:1;
           width:46px; height:46px; border-radius:14px; cursor:pointer; font-family:inherit }
.freccia:disabled { opacity:.3; cursor:default }
.freccia:active:not(:disabled) { transform:translateY(1px) }
.numero { flex:1; text-align:center; display:flex; flex-direction:column; gap:1px }
.numero b { font-size:19px }
.numero em { font-style:normal; font-size:11px; color:#7a7a8a }

.invito { margin:0; text-align:center; font-size:13px; color:#7a7a8a }

.quadro { display:flex; flex-direction:column; gap:8px; text-align:left }
.chip-riga { display:flex; flex-wrap:wrap; gap:3px; margin-top:4px }
.chip { font-size:17px; line-height:1.1 }
/* chi non c'è resta nella fila, sbiadito: una fila che mostra solo gli
   accesi non fa vedere *che* manca qualcosa — e quanto manca è metà di
   quello che la manopola deve raccontare */
.chip.passato, .chip.avanti, .chip.spento { opacity:.28; filter:grayscale(1) }

.elenco { list-style:none; margin:5px 0 0; padding:0; display:flex;
          flex-direction:column; gap:5px }
</style>
