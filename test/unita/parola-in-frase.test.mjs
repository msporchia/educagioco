/* ═══════════════════════════════════════════════════════════════════
   LA PAROLA DENTRO LA FRASE

   Nasce da una domanda che **non aveva una risposta giusta**: «che
   parte del discorso è "lo"?», con «lo» scritto da solo in mezzo allo
   schermo. «lo» è articolo in «lo zaino» e pronome in «lo vedo», e
   siccome `pronome` non è nemmeno fra le cinque risposte, il bambino
   che leggeva la seconda si trovava davanti a una domanda senza uscita.
   Vale uguale per «la», per «gli», per «legge». In più c'era il guaio
   di sopra, che da solo bastava: nei caratteri di sistema la elle
   minuscola e la i maiuscola sono lo stesso glifo, quindi «lo» nudo si
   legge anche «Io».

   La cura è una sola per tutti e due: la parola si mostra dentro una
   frase, in rilievo. E il guasto da sorvegliare cambia natura — non più
   una domanda ambigua ma **un refuso su una frase fra trentasei**, che
   giocando non si nota (capita a una domanda su trentasei, e a schermo
   si vede una frase normalissima con una parola non evidenziata). Per
   questo il controllo sta qui e dentro `guastiDi`, e non nell'occhio di
   chi prova il gioco per un minuto.
   ═══════════════════════════════════════════════════════════════════ */
import { nota, controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { evidenziando, guastiDi, tempoDiLettura } from '../../src/quiz/nucleo/domanda.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import grammatica from '../../src/quiz/moduli/grammatica.js'

/* ══════════ 1. IL TAGLIO DELLA FRASE ══════════ */

const tre = evidenziando('Metto lo zaino in spalla.', 'lo')
uguale('quello che sta prima', tre.prima, 'Metto ')
uguale('la parola', tre.parola, 'lo')
uguale('e quello che sta dopo', tre.dopo, ' zaino in spalla.')
controlla('rimessi insieme fanno la frase di partenza',
          tre.prima + tre.parola + tre.dopo === 'Metto lo zaino in spalla.')

/* IL CONFINE DI PAROLA NON È `\b`, e sono i due casi per cui non lo è.
   In italiano l'apostrofo attacca: «l'albero» non contiene la parola
   «albero», e `\b` lo tratterebbe come uno spazio. Le accentate
   dall'altro lato sono lettere, e `\b` le prenderebbe per confini. */
uguale('una parola dentro un\'altra non conta',
       evidenziando('Il cane dorme nella cuccia.', 'cane').volte, 1)
uguale('«ne» non si pesca dentro «cane»',
       evidenziando('Il cane dorme.', 'ne').volte, 0)
uguale('l\'apostrofo attacca: «L\'albero» non contiene «albero»',
       evidenziando("L'albero perde le foglie.", 'albero').volte, 0)
uguale('un accento non è un confine',
       evidenziando('Il papà legge il giornale.', 'papà').volte, 1)

/* La parola si scrive **come compare nella frase**, maiuscole comprese:
   «Lo zaino» in testa e «lo zaino» in mezzo sono due stringhe diverse, e
   la seconda è quella che si vuole — la maiuscola d'inizio frase è metà
   del guaio tipografico che ha fatto nascere tutto questo. */
uguale('la maiuscola conta', evidenziando('Lo zaino è pesante.', 'lo').volte, 0)

/* con zero o con due occorrenze non si evidenzia niente e la frase
   resta intera: a schermo si perde il rilievo, non il testo */
const doppia = evidenziando('Ho perso il cappello e il cane.', 'il')
uguale('due volte: non si sa quale delle due si sta chiedendo', doppia.volte, 2)
uguale('e allora niente rilievo', doppia.parola, '')
uguale('ma la frase resta tutta', doppia.prima, 'Ho perso il cappello e il cane.')
const assente = evidenziando('Apro la finestra.', 'porta')
uguale('parola assente: stesso degrado', assente.parola, '')
uguale('e la frase resta tutta lo stesso', assente.prima, 'Apro la finestra.')

/* ══════════ 2. IL CONTROLLO DI FORMA LO DICE ══════════
   È l'unico posto da cui può uscire un refuso su una frase fra
   trentasei, e il banco lo fa girare su ogni domanda generata. */

const base = {
  testo: 'Che parte del discorso è «lo» in questa frase?',
  risposte: [{ testo: 'articolo' }, { testo: 'verbo' }],
  giusta: 0,
  chiave: 'gram:parti-del-discorso',
}
uguale('una frase giusta non è un guasto',
       guastiDi({ ...base, soggetto: { testo: 'Metto lo zaino in spalla.', evidenzia: 'lo' } }).length, 0)
controlla('una parola che nella frase non c\'è è un guasto',
          guastiDi({ ...base, soggetto: { testo: 'Metto lo zaino in spalla.', evidenzia: 'li' } }).length === 1)
controlla('e una che c\'è due volte anche',
          guastiDi({ ...base, soggetto: { testo: 'Ho perso il cappello e il cane.', evidenzia: 'il' } }).length === 1)
controlla('«evidenzia» vuoto è un guasto',
          guastiDi({ ...base, soggetto: { testo: 'Metto lo zaino.', evidenzia: '  ' } }).length > 0)
controlla('e «evidenzia» su un soggetto disegnato pure',
          guastiDi({ ...base, soggetto: { scena: { che: 'orologio' }, evidenzia: 'lo' } },
                   { pittori: { orologio: 1 } }).length > 0)

/* ══════════ 3. E NEL CATALOGO VERO ══════════
   Non un caso costruito: le domande che riceve il bambino, tante, tirate
   dalla stessa strada da cui le tira un gioco. */

const VOLTE = 500
const viste = new Map()
let senzaFrase = 0, fuoriConsegna = 0, conEmoji = 0, ripetute = 0
for (let i = 0; i < VOLTE; i++) {
  const d = grammatica.chiedi(3, new Sorte(31 * i + 7))
  uguale('a grado 3 esce sempre la parte del discorso', d.chiave, 'gram:parti-del-discorso')

  const s = d.soggetto || {}
  const { parola, volte } = evidenziando(s.testo, s.evidenzia)
  if (!s.testo || !s.testo.trim() || volte !== 1) senzaFrase++
  /* la parola dev'essere anche nella consegna: è quella la domanda —
     «che parte del discorso è "lo"» — e la frase è dove guardarla */
  if (parola && !d.testo.includes(`«${parola}»`)) fuoriConsegna++
  /* l'emoji c'era su tutti e otto i nomi e su nessun'altra parola: chi
     l'aveva capito rispondeva «nome» ogni volta che vedeva un disegno */
  if (s.emoji !== undefined || s.scena !== undefined) conEmoji++
  /* le due righe che si leggono dopo uno sbaglio devono dire due cose
     diverse: erano la stessa identica stringa, stampata due volte */
  for (const r of d.risposte) if (r.perche && r.perche === d.aiuto) ripetute++

  if (parola) viste.set(parola, (viste.get(parola) || 0) + 1)
}
uguale('ogni domanda porta la sua frase, con la parola dentro una volta sola',
       senzaFrase, 0)
uguale('e la parola della frase è quella che la consegna nomina', fuoriConsegna, 0)
uguale('nessuna porta più il disegno che regalava «nome»', conEmoji, 0)
uguale('il perché di uno sbaglio non ripete l\'aiuto', ripetute, 0)
nota(`${viste.size} parole diverse in ${VOLTE} tiri`)
controlla('e prima o poi escono tutte e trentasei', viste.size === 36, `${viste.size}`)

/* Il caso che ha fatto nascere tutto: «lo» non compare più da solo. */
const conLo = [...Array(VOLTE).keys()]
  .map(i => grammatica.chiedi(3, new Sorte(31 * i + 7)))
  .filter(d => d.testo.includes('«lo»'))
controlla('«lo» esce, e non è sparito insieme al difetto', conLo.length > 0)
for (const d of conLo) {
  controlla('«lo» arriva dentro una frase che lo rende un articolo',
            d.soggetto.testo === 'Metto lo zaino in spalla.', d.soggetto.testo)
  controlla('e l\'aiuto parla di quella frase, non della regola in astratto',
            d.aiuto.includes('zaino'), d.aiuto)
}

/* ══════════ 4. LA FRASE SI CONTA FRA LE COSE DA LEGGERE ══════════
   Metà della roba da leggere sta ora nel soggetto: senza contarla, la
   soglia della fretta direbbe «hai tirato a caso» a chi ha letto tutto. */
const una = grammatica.chiedi(3, new Sorte(7))
const senza = tempoDiLettura({ ...una, soggetto: undefined })
controlla('la frase alza il tempo che ci vuole a leggere la domanda',
          tempoDiLettura(una) > senza,
          `${tempoDiLettura(una).toFixed(2)} s contro ${senza.toFixed(2)}`)
controlla('un soggetto disegnato invece no: guardare non è leggere',
          tempoDiLettura({ ...una, soggetto: { scena: { che: 'orologio' } } }) === senza)

riassunto('la parola dentro la frase')
