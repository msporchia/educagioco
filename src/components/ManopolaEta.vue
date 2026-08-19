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
const provaClasse = r => emit('prova', { sorgente: r.sorgente, nome: r.nome })
const provaSapere = x => emit('prova', { chiave: x.chiave, nome: x.nome })

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

const etichetta = computed(() => inLettere(props.anni))
const fascia = computed(() => partenzaPerEta(props.anni))

/* Solo i primi, e quanti ne restano: un riassunto che elenca trenta
   voci non è più un riassunto. Il resto si apre col dito, e per i
   giochi è la cosa che serve di più al primo avvio — dodici emoji in
   fila non le sa leggere nessuno che non conosca già i giochi. */
const TRE = 3
const primi = (elenco, quanti = TRE) => elenco.slice(0, quanti)
const restanti = (elenco, quanti = TRE) => Math.max(0, elenco.length - quanti)

/* L'assaggio di un gruppo chiuso: tre righe di **materie diverse**.
   Prendendo le prime tre e basta uscivano tre tempi verbali di fila —
   vero, perché l'elenco è ordinato per difficoltà e l'italiano sta in
   cima, ma racconta una materia sola invece di far vedere di cosa è
   fatto il gruppo. Aperto l'ordine resta quello vero. */
const vetrina = righe => {
  const visti = new Set()
  const fuori = righe.filter(r => !visti.has(r.modulo) && visti.add(r.modulo))
  return (fuori.length >= TRE ? fuori : righe).slice(0, TRE)
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
  facili: { nome: 'Le sa fare, ma le ripassa',
            che: 'escono quando il gioco chiede poco' },
  medie: { nome: 'Sta studiando queste',
           che: 'la sua misura: sono quelle che vede più spesso' },
  toste: { nome: 'Difficili ma fattibili',
           che: 'un gradino sopra, quando il gioco chiede molto' },
  sotto: { nome: 'Non gliele chiediamo più',
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
      <!-- ══ SEI BLOCCHI, UNA FORMA SOLA ══
           Titolo · quanti sono · cosa vuol dire · l'assaggio, e si apre
           toccandolo in qualunque punto. Erano due forme diverse — i
           giochi e quello che si dà per scontato da una parte, i gruppi
           di domande dall'altra, con un sottotitolo solo su questi
           ultimi — e due forme fanno sembrare due cose diverse quello
           che è lo stesso gesto ripetuto sei volte.

           Si tocca **tutto il riquadro** e non la parolina «quali»:
           quella è larga due centimetri su un telefono, e chi prova a
           premere il titolo — cioè chiunque — non ottiene niente e
           conclude che non si apre. -->

      <!-- i giochi, tutti, con lo stato addosso: chi c'è, chi il
           bambino ha già passato, cosa arriva più avanti -->
      <div class="voce apribile" :class="{ aperta: eAperto('giochi') }"
           data-apri="giochi" role="button" tabindex="0"
           @click="apri('giochi')" @keydown.enter="apri('giochi')">
        <span class="tit">
          <span>In casa</span>
          <b>{{ quantiQui }} su {{ quadro.giochi.length }}</b>
          <em>{{ eAperto('giochi') ? '▴' : '▾' }}</em>
        </span>
        <i class="spiega">i giochi che trova in home a quest'età</i>

        <span v-if="!eAperto('giochi')" class="chip-riga">
          <span v-for="g in quadro.giochi" :key="g.chiave" class="chip"
                :class="g.stato" :title="`${g.nome} — ${stato(g).testo}`">{{ g.ico }}</span>
        </span>
        <ul v-else class="elenco">
          <li v-for="g in quadro.giochi" :key="g.chiave" :class="g.stato">
            <span class="ico">{{ g.ico }}</span>
            <span class="testo"><b>{{ g.nome }}</b><i>{{ g.che }}</i></span>
            <em :class="stato(g).cls">{{ stato(g).testo }}</em>
          </li>
        </ul>
      </div>

      <!-- quello che si dà per scontato, al positivo: si scorre, e
           appena ci si legge dentro una cosa che il bambino non sa, si
           è saliti troppo. Detto al negativo bisognava ricostruire per
           differenza le altre trenta, che non erano scritte da nessuna
           parte — ed è così che per un pezzo il gioco ha dato per
           scontato che a quattro anni si sapesse leggere. -->
      <div class="voce apribile" :class="{ aperta: eAperto('sa') }"
           data-apri="sa" role="button" tabindex="0"
           @click="apri('sa')" @keydown.enter="apri('sa')">
        <span class="tit">
          <span>Dà per scontato che sappia</span>
          <b>{{ quadro.sa.length }}</b>
          <em>{{ eAperto('sa') ? '▴' : '▾' }}</em>
        </span>
        <i class="spiega">le domande partono da qui: se ci leggi qualcosa che non sa, sei salito troppo</i>
        <b v-if="!eAperto('sa')" class="frase">{{
          primi(quadro.sa).map(x => giu(x.nome)).join(' · ')
        }}<template v-if="restanti(quadro.sa)"> · e altre {{ restanti(quadro.sa) }}</template></b>
        <ul v-else class="elenco fitta">
          <li v-for="x in quadro.sa" :key="x.chiave">
            <span class="testo"><b>{{ x.nome }}</b></span>
            <button type="button" class="prova" :data-prova="x.chiave"
                    :aria-label="'prova ' + x.nome"
                    @click.stop="provaSapere(x)">▶</button>
          </li>
        </ul>
      </div>

      <!-- e le domande, negli stessi quattro gruppi di sempre -->
      <div v-for="g in quadro.gruppi.filter(x => x.righe.length)" :key="g.chiave"
           class="voce apribile" :class="{ aperta: eAperto(g.chiave) }"
           :data-apri="g.chiave" role="button" tabindex="0"
           @click="apri(g.chiave)" @keydown.enter="apri(g.chiave)">
        <span class="tit">
          <span>{{ GRUPPI[g.chiave].nome }}</span>
          <b>{{ g.righe.length }}</b>
          <em>{{ eAperto(g.chiave) ? '▴' : '▾' }}</em>
        </span>
        <i class="spiega">{{ GRUPPI[g.chiave].che }}</i>
        <b v-if="!eAperto(g.chiave)" class="frase">{{
          vetrina(g.righe).map(r => giu(r.nome)).join(' · ')
        }}<template v-if="restanti(g.righe)"> · e altre {{ restanti(g.righe) }}</template></b>
        <ul v-else class="elenco fitta">
          <li v-for="r in g.righe" :key="r.chiave">
            <span class="ico">{{ r.icona }}</span>
            <span class="testo"><b>{{ r.nome }}</b><i>{{ r.modulo }}</i></span>
            <button type="button" class="prova" :data-prova="r.chiave"
                    :aria-label="'prova ' + r.nome"
                    @click.stop="provaClasse(r)">▶</button>
          </li>
        </ul>
      </div>
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
.voce { display:flex; flex-direction:column; gap:3px; background:#fff; border-radius:14px;
        padding:9px 12px; box-shadow:0 2px 8px #0000000d }
/* La testata di un blocco: nome · quanti · la freccina. Uguale per
   tutti e sei — erano due forme diverse, e due forme fanno sembrare due
   cose diverse quello che è lo stesso gesto ripetuto. */
.tit { display:flex; align-items:baseline; gap:7px;
       font-size:11px; text-transform:uppercase; letter-spacing:.4px; color:#8a8a99;
       font-weight:800 }
.tit > span:first-child { flex:1 }
.tit > b { font-size:13px; font-weight:800; color:var(--viola-scuro);
           text-transform:none; letter-spacing:0 }
.tit > em { font-style:normal; font-size:13px; font-weight:800; color:var(--viola) }
.voce b { font-size:14px; font-weight:700 }

.frase { font-size:13.5px; font-weight:650; line-height:1.4 }
.spiega { font-style:normal; font-size:11px; color:#9a9aa8; line-height:1.3; margin:-1px 0 3px }

/* Si tocca tutto il riquadro, non la parolina in fondo alla riga:
   quella è larga due centimetri su un telefono, e chi prova a premere
   il titolo — cioè chiunque — non otterrebbe niente e concluderebbe
   che non si apre. */
.voce.apribile { cursor:pointer; -webkit-tap-highlight-color:transparent }
.voce.apribile:active { transform:scale(.995) }
.voce.apribile.aperta { box-shadow:0 2px 10px #0000001a, inset 0 0 0 2px #f0eaff }

.chip-riga { display:flex; flex-wrap:wrap; gap:3px; margin-top:4px }
.chip { font-size:17px; line-height:1.1 }
/* chi non c'è resta nella fila, sbiadito: una fila che mostra solo gli
   accesi non fa vedere *che* manca qualcosa — e quanto manca è metà di
   quello che la manopola deve raccontare */
.chip.passato, .chip.avanti, .chip.spento { opacity:.28; filter:grayscale(1) }

.elenco { list-style:none; margin:5px 0 0; padding:0; display:flex;
          flex-direction:column; gap:5px }
.elenco li { display:flex; align-items:center; gap:8px }
.elenco li .ico { font-size:18px; line-height:1; width:22px; text-align:center }
.elenco li .testo { flex:1; display:flex; flex-direction:column; gap:0 }
.elenco li .testo b { font-size:13px; font-weight:750 }
.elenco li .testo i { font-style:normal; font-size:11px; color:#8a8a99; line-height:1.3 }
.elenco li em { font-style:normal; font-size:10.5px; font-weight:800; white-space:nowrap;
                padding:2px 7px; border-radius:8px }
.elenco li em.si { color:#2f6b3f; background:#dff0d8 }
.elenco li em.giu { color:#7a6a2f; background:#f3eed6 }
.elenco li em.su { color:#5b3fa8; background:#eee7ff }
.elenco li em.off { color:#8a4a4a; background:#f5e3e3 }
.elenco li.passato .testo b, .elenco li.avanti .testo b,
.elenco li.spento .testo b { color:#7a7a8a }
.elenco.fitta li .testo b { font-weight:650 }
/* Il ▶ di una riga: piccolo ma con un bersaglio vero sotto — 34 px è
   il minimo che un dito prende senza mirare. */
.prova { border:none; background:#f0eaff; color:var(--viola); cursor:pointer;
         font-family:inherit; font-size:11px; line-height:1;
         width:34px; height:34px; border-radius:11px; flex:none }
.prova:active { transform:translateY(1px) }

/* La differenza sta FUORI dai riquadri e non dentro: è quello che è
   appena successo, non parte del quadro — e appiccicata sotto la voce
   che riguarda si legge come una didascalia invece che come una riga
   in più da confrontare. */
.delta { margin:-4px 0 2px; padding:0 12px; font-size:12.5px; line-height:1.35 }
.delta.piu { color:#2f6b3f }
.delta.meno { color:#8a4a2f }
</style>
