/* ═══════════════════════════════════════════════════════════════════
   GRAMMATICA — l'analisi grammaticale elementare: come sono fatte le
   parole e come stanno insieme in una frase.

   Cinque gradi che non sono uno il seguito dell'altro ma cinque angoli
   diversi sulla stessa lingua che un bambino già parla: il genere e il
   numero delle parole, l'articolo che gli va davanti, che «mestiere»
   fa una parola (nome, verbo, aggettivo…), l'accordo fra nome e
   aggettivo, e infine la frase — chi fa l'azione e qual è l'azione.

   I FALSI SONO GLI ERRORI VERI. Non lettere a caso ma le cose che un
   bambino scrive o dice davvero: «i braccii» invece di «le braccia»,
   «gli zaino» invece di «lo zaino», «le mano» invece di «le mani»,
   l'aggettivo lasciato al maschile singolare quando il nome è
   femminile plurale. I plurali irregolari (braccio, uovo, dito, mano,
   uomo, ala, bue…) sono presi uno per uno: sbagliarli qui vorrebbe
   dire insegnare la cosa sbagliata.

   L'ARTICOLO ha una regola vera dietro: s+consonante, gn, ps, z, x
   vogliono «lo» (e «gli» al plurale); una vocale accorcia l'articolo
   in «l'» (tranne «le», che al plurale non si accorcia mai — «le
   amiche», non «l'amiche», ed è proprio lì che un bambino inciampa).
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

/* ── i plurali irregolari veri ──
   Controllati uno per uno: qui un errore insegnerebbe la cosa
   sbagliata. `errori` è sempre [una forma regolare sbagliata, la
   parola invariata] — i due modi in cui un bambino la sbaglia. */
const IRREGOLARI = [
  { s: 'braccio', p: 'braccia', errori: ['bracci', 'braccio'], em: '💪' },
  { s: 'uovo', p: 'uova', errori: ['uovi', 'uovo'], em: '🥚' },
  { s: 'dito', p: 'dita', errori: ['diti', 'dito'], em: '👆' },
  { s: 'mano', p: 'mani', errori: ['mano', 'mane'], em: '✋' },
  { s: 'uomo', p: 'uomini', errori: ['uomi', 'uomo'], em: '🧑' },
  { s: 'ala', p: 'ali', errori: ['ale', 'ala'], em: '🪽' },
  { s: 'bue', p: 'buoi', errori: ['bui', 'bue'], em: '🐂' },
  { s: 'ginocchio', p: 'ginocchia', errori: ['ginocchi', 'ginocchio'] },
  { s: 'orecchio', p: 'orecchie', errori: ['orecchi', 'orecchio'], em: '👂' },
  { s: 'paio', p: 'paia', errori: ['pai', 'paio'] },
  { s: 'centinaio', p: 'centinaia', errori: ['centinai', 'centinaio'] },
]

/* ── i plurali regolari, con l'errore che si sente davvero: la
   vocale finale scambiata con quella dell'altro genere («bambine»
   per il plurale di «bambino»), e la parola lasciata invariata. */
const REGOLARI = [
  { s: 'bambino', p: 'bambini', errori: ['bambino', 'bambine'], em: '👦' },
  { s: 'gatto', p: 'gatti', errori: ['gatto', 'gatte'], em: '🐱' },
  { s: 'nonno', p: 'nonni', errori: ['nonno', 'nonne'], em: '👴' },
  { s: 'topo', p: 'topi', errori: ['topo', 'tope'], em: '🐭' },
  { s: 'libro', p: 'libri', errori: ['libro', 'libre'], em: '📖' },
  { s: 'albero', p: 'alberi', errori: ['albero', 'albere'], em: '🌳' },
  { s: 'quaderno', p: 'quaderni', errori: ['quaderno', 'quaderne'], em: '📓' },
  { s: 'gomma', p: 'gomme', errori: ['gomma', 'gommi'], em: '🧽' },
  { s: 'penna', p: 'penne', errori: ['penna', 'penni'], em: '🖊️' },
  { s: 'sedia', p: 'sedie', errori: ['sedia', 'sedii'] },
  { s: 'casa', p: 'case', errori: ['casa', 'casi'], em: '🏠' },
  { s: 'porta', p: 'porte', errori: ['porta', 'porti'], em: '🚪' },
  { s: 'mela', p: 'mele', errori: ['mela', 'meli'], em: '🍎' },
  { s: 'torta', p: 'torte', errori: ['torta', 'torti'], em: '🎂' },
  { s: 'matita', p: 'matite', errori: ['matita', 'matiti'] },
]

/* ── il maschile e il femminile della stessa parola ──
   `mp`/`fp` sono i plurali (usati anche come distrattore: l'errore
   più comune è cambiare il NUMERO pensando di cambiare il genere).
   Le parole con un suffisso vero e proprio (-essa, -trice) hanno
   anche l'errore di chi prova a inventarselo. */
const COPPIE_GENERE = [
  { m: 'maestro', mp: 'maestri', f: 'maestra', fp: 'maestre', em: '👨‍🏫' },
  { m: 'bambino', mp: 'bambini', f: 'bambina', fp: 'bambine', em: '👦' },
  { m: 'gatto', mp: 'gatti', f: 'gatta', fp: 'gatte', em: '🐱' },
  { m: 'nonno', mp: 'nonni', f: 'nonna', fp: 'nonne', em: '👴' },
  { m: 'zio', mp: 'zii', f: 'zia', fp: 'zie' },
  { m: 'amico', mp: 'amici', f: 'amica', fp: 'amiche' },
  { m: 'cuoco', mp: 'cuochi', f: 'cuoca', fp: 'cuoche', em: '👨‍🍳' },
  { m: 'studente', mp: 'studenti', f: 'studentessa', fp: 'studentesse', erroreF: 'studenta', erroreM: 'studento', em: '🎓' },
  { m: 'professore', mp: 'professori', f: 'professoressa', fp: 'professoresse', erroreF: 'professora', erroreM: 'professoro', em: '🧑‍🏫' },
  { m: 'dottore', mp: 'dottori', f: 'dottoressa', fp: 'dottoresse', erroreF: 'dottora', erroreM: 'dottoro', em: '⚕️' },
  { m: 'attore', mp: 'attori', f: 'attrice', fp: 'attrici', erroreF: 'attora', erroreM: 'attoro', em: '🎭' },
  { m: 'principe', mp: 'principi', f: 'principessa', fp: 'principesse', erroreF: 'principa', erroreM: 'principo', em: '🤴' },
  { m: 'leone', mp: 'leoni', f: 'leonessa', fp: 'leonesse', erroreF: 'leona', erroreM: 'leono', em: '🦁' },
]

/* ── l'articolo giusto ──
   `tipo` è la categoria che decide l'articolo: `normale` (consonante
   qualunque), `vocale` (accorcia in l'/gli), `z-gn-ps-x` (s+consonante,
   gn, ps, z, x — vuole lo/gli). */
const ARTICOLI = [
  { parola: 'cane', genere: 'm', numero: 's', tipo: 'normale', em: '🐶' },
  { parola: 'gatto', genere: 'm', numero: 's', tipo: 'normale', em: '🐱' },
  { parola: 'topo', genere: 'm', numero: 's', tipo: 'normale', em: '🐭' },
  { parola: 'libro', genere: 'm', numero: 's', tipo: 'normale', em: '📖' },
  { parola: 'pane', genere: 'm', numero: 's', tipo: 'normale', em: '🍞' },
  { parola: 'sole', genere: 'm', numero: 's', tipo: 'normale', em: '☀️' },
  { parola: 'tavolo', genere: 'm', numero: 's', tipo: 'normale' },
  { parola: 'letto', genere: 'm', numero: 's', tipo: 'normale' },
  { parola: 'divano', genere: 'm', numero: 's', tipo: 'normale' },
  { parola: 'quadro', genere: 'm', numero: 's', tipo: 'normale' },
  { parola: 'pesce', genere: 'm', numero: 's', tipo: 'normale', em: '🐟' },
  { parola: 'fiume', genere: 'm', numero: 's', tipo: 'normale', em: '🌊' },
  { parola: 'ponte', genere: 'm', numero: 's', tipo: 'normale' },
  { parola: 'treno', genere: 'm', numero: 's', tipo: 'normale', em: '🚂' },
  { parola: 'vaso', genere: 'm', numero: 's', tipo: 'normale' },
  { parola: 'cappello', genere: 'm', numero: 's', tipo: 'normale', em: '🎩' },
  { parola: 'amico', genere: 'm', numero: 's', tipo: 'vocale' },
  { parola: 'albero', genere: 'm', numero: 's', tipo: 'vocale', em: '🌳' },
  { parola: 'elefante', genere: 'm', numero: 's', tipo: 'vocale', em: '🐘' },
  { parola: 'orso', genere: 'm', numero: 's', tipo: 'vocale', em: '🐻' },
  { parola: 'orologio', genere: 'm', numero: 's', tipo: 'vocale', em: '⏰' },
  { parola: 'ombrello', genere: 'm', numero: 's', tipo: 'vocale', em: '☂️' },
  { parola: 'uccello', genere: 'm', numero: 's', tipo: 'vocale', em: '🐦' },
  { parola: 'armadio', genere: 'm', numero: 's', tipo: 'vocale' },
  { parola: 'anello', genere: 'm', numero: 's', tipo: 'vocale', em: '💍' },
  { parola: 'animale', genere: 'm', numero: 's', tipo: 'vocale', em: '🐾' },
  { parola: 'ospedale', genere: 'm', numero: 's', tipo: 'vocale' },
  { parola: 'asino', genere: 'm', numero: 's', tipo: 'vocale' },
  { parola: 'zaino', genere: 'm', numero: 's', tipo: 'z-gn-ps-x', em: '🎒' },
  { parola: 'zio', genere: 'm', numero: 's', tipo: 'z-gn-ps-x' },
  { parola: 'gnomo', genere: 'm', numero: 's', tipo: 'z-gn-ps-x', em: '🧙' },
  { parola: 'psicologo', genere: 'm', numero: 's', tipo: 'z-gn-ps-x' },
  { parola: 'xilofono', genere: 'm', numero: 's', tipo: 'z-gn-ps-x', em: '🎼' },
  { parola: 'stivale', genere: 'm', numero: 's', tipo: 'z-gn-ps-x', em: '👢' },
  { parola: 'specchio', genere: 'm', numero: 's', tipo: 'z-gn-ps-x' },
  { parola: 'scoiattolo', genere: 'm', numero: 's', tipo: 'z-gn-ps-x', em: '🐿️' },
  { parola: 'sbaglio', genere: 'm', numero: 's', tipo: 'z-gn-ps-x' },
  { parola: 'zucchero', genere: 'm', numero: 's', tipo: 'z-gn-ps-x', em: '🍬' },
  { parola: 'gnocco', genere: 'm', numero: 's', tipo: 'z-gn-ps-x' },
  { parola: 'pneumatico', genere: 'm', numero: 's', tipo: 'z-gn-ps-x' },
  { parola: 'yogurt', genere: 'm', numero: 's', tipo: 'z-gn-ps-x', em: '🥣' },
  { parola: 'sport', genere: 'm', numero: 's', tipo: 'z-gn-ps-x', em: '⚽' },
  { parola: 'spazio', genere: 'm', numero: 's', tipo: 'z-gn-ps-x' },
  { parola: 'stadio', genere: 'm', numero: 's', tipo: 'z-gn-ps-x', em: '🏟️' },
  { parola: 'sciame', genere: 'm', numero: 's', tipo: 'z-gn-ps-x' },
  { parola: 'cani', genere: 'm', numero: 'p', tipo: 'normale', em: '🐶' },
  { parola: 'gatti', genere: 'm', numero: 'p', tipo: 'normale', em: '🐱' },
  { parola: 'libri', genere: 'm', numero: 'p', tipo: 'normale' },
  { parola: 'tavoli', genere: 'm', numero: 'p', tipo: 'normale' },
  { parola: 'letti', genere: 'm', numero: 'p', tipo: 'normale' },
  { parola: 'pesci', genere: 'm', numero: 'p', tipo: 'normale', em: '🐟' },
  { parola: 'fiumi', genere: 'm', numero: 'p', tipo: 'normale', em: '🌊' },
  { parola: 'vasi', genere: 'm', numero: 'p', tipo: 'normale' },
  { parola: 'cappelli', genere: 'm', numero: 'p', tipo: 'normale', em: '🎩' },
  { parola: 'amici', genere: 'm', numero: 'p', tipo: 'vocale' },
  { parola: 'alberi', genere: 'm', numero: 'p', tipo: 'vocale', em: '🌳' },
  { parola: 'elefanti', genere: 'm', numero: 'p', tipo: 'vocale', em: '🐘' },
  { parola: 'orologi', genere: 'm', numero: 'p', tipo: 'vocale', em: '⏰' },
  { parola: 'uccelli', genere: 'm', numero: 'p', tipo: 'vocale', em: '🐦' },
  { parola: 'armadi', genere: 'm', numero: 'p', tipo: 'vocale' },
  { parola: 'anelli', genere: 'm', numero: 'p', tipo: 'vocale', em: '💍' },
  { parola: 'animali', genere: 'm', numero: 'p', tipo: 'vocale', em: '🐾' },
  { parola: 'zaini', genere: 'm', numero: 'p', tipo: 'z-gn-ps-x', em: '🎒' },
  { parola: 'gnomi', genere: 'm', numero: 'p', tipo: 'z-gn-ps-x', em: '🧙' },
  { parola: 'stivali', genere: 'm', numero: 'p', tipo: 'z-gn-ps-x', em: '👢' },
  { parola: 'specchi', genere: 'm', numero: 'p', tipo: 'z-gn-ps-x' },
  { parola: 'gnocchi', genere: 'm', numero: 'p', tipo: 'z-gn-ps-x' },
  { parola: 'pneumatici', genere: 'm', numero: 'p', tipo: 'z-gn-ps-x' },
  { parola: 'spazi', genere: 'm', numero: 'p', tipo: 'z-gn-ps-x' },
  { parola: 'stadi', genere: 'm', numero: 'p', tipo: 'z-gn-ps-x', em: '🏟️' },
  { parola: 'casa', genere: 'f', numero: 's', tipo: 'normale', em: '🏠' },
  { parola: 'penna', genere: 'f', numero: 's', tipo: 'normale', em: '🖊️' },
  { parola: 'sedia', genere: 'f', numero: 's', tipo: 'normale' },
  { parola: 'strada', genere: 'f', numero: 's', tipo: 'normale' },
  { parola: 'zia', genere: 'f', numero: 's', tipo: 'normale' },
  { parola: 'tavola', genere: 'f', numero: 's', tipo: 'normale' },
  { parola: 'borsa', genere: 'f', numero: 's', tipo: 'normale', em: '👜' },
  { parola: 'camicia', genere: 'f', numero: 's', tipo: 'normale', em: '👔' },
  { parola: 'matita', genere: 'f', numero: 's', tipo: 'normale', em: '✏️' },
  { parola: 'gonna', genere: 'f', numero: 's', tipo: 'normale', em: '👗' },
  { parola: 'valigia', genere: 'f', numero: 's', tipo: 'normale', em: '🧳' },
  { parola: 'barca', genere: 'f', numero: 's', tipo: 'normale', em: '⛵' },
  { parola: 'torre', genere: 'f', numero: 's', tipo: 'normale' },
  { parola: 'amica', genere: 'f', numero: 's', tipo: 'vocale' },
  { parola: 'ape', genere: 'f', numero: 's', tipo: 'vocale', em: '🐝' },
  { parola: 'isola', genere: 'f', numero: 's', tipo: 'vocale' },
  { parola: 'erba', genere: 'f', numero: 's', tipo: 'vocale' },
  { parola: 'aula', genere: 'f', numero: 's', tipo: 'vocale' },
  { parola: 'automobile', genere: 'f', numero: 's', tipo: 'vocale', em: '🚗' },
  { parola: 'infermiera', genere: 'f', numero: 's', tipo: 'vocale', em: '👩‍⚕️' },
  { parola: 'ombra', genere: 'f', numero: 's', tipo: 'vocale' },
  { parola: 'oca', genere: 'f', numero: 's', tipo: 'vocale', em: '🦢' },
  { parola: 'arancia', genere: 'f', numero: 's', tipo: 'vocale', em: '🍊' },
  { parola: 'unghia', genere: 'f', numero: 's', tipo: 'vocale' },
  { parola: 'case', genere: 'f', numero: 'p', tipo: 'normale', em: '🏠' },
  { parola: 'penne', genere: 'f', numero: 'p', tipo: 'normale', em: '🖊️' },
  { parola: 'tavole', genere: 'f', numero: 'p', tipo: 'normale' },
  { parola: 'borse', genere: 'f', numero: 'p', tipo: 'normale', em: '👜' },
  { parola: 'camicie', genere: 'f', numero: 'p', tipo: 'normale', em: '👔' },
  { parola: 'matite', genere: 'f', numero: 'p', tipo: 'normale', em: '✏️' },
  { parola: 'gonne', genere: 'f', numero: 'p', tipo: 'normale', em: '👗' },
  { parola: 'barche', genere: 'f', numero: 'p', tipo: 'normale', em: '⛵' },
  { parola: 'amiche', genere: 'f', numero: 'p', tipo: 'vocale' },
  { parola: 'api', genere: 'f', numero: 'p', tipo: 'vocale', em: '🐝' },
  { parola: 'isole', genere: 'f', numero: 'p', tipo: 'vocale' },
  { parola: 'automobili', genere: 'f', numero: 'p', tipo: 'vocale', em: '🚗' },
  { parola: 'infermiere', genere: 'f', numero: 'p', tipo: 'vocale', em: '👩‍⚕️' },
  { parola: 'ombre', genere: 'f', numero: 'p', tipo: 'vocale' },
  { parola: 'arance', genere: 'f', numero: 'p', tipo: 'vocale', em: '🍊' },
]

const ARTICOLO_GIUSTO = {
  'm-s-normale': 'il', 'm-s-vocale': "l'", 'm-s-z-gn-ps-x': 'lo',
  'm-p-normale': 'i', 'm-p-vocale': 'gli', 'm-p-z-gn-ps-x': 'gli',
  'f-s-normale': 'la', 'f-s-vocale': "l'",
  'f-p-normale': 'le', 'f-p-vocale': 'le',
}
/* i soli errori che un bambino fa davvero — non ogni articolo che
   esiste, ma quello per cui inciampa proprio quella parola */
const CONFUSIONI_ARTICOLO = {
  'm-s-normale': ['lo'],
  'm-s-vocale': ['il', 'lo'],
  'm-s-z-gn-ps-x': ['il'],
  'm-p-normale': ['gli'],
  'm-p-vocale': ['i'],
  'm-p-z-gn-ps-x': ['i'],
  'f-s-normale': ['il'],
  'f-s-vocale': ['la'],
  'f-p-normale': ['gli'],
  'f-p-vocale': ["l'"],
}
const REGOLA_ARTICOLO = {
  normale: 'davanti a una consonante normale si usa il/la, i/le al plurale',
  vocale: "davanti a una vocale l'articolo si accorcia: l'amico, l'amica — ma «le» non si accorcia mai, nemmeno al plurale",
  'z-gn-ps-x': 'davanti a s+consonante, gn, ps, z, x si usa lo, gli al plurale',
}
/* compone l'articolo con la parola, senza spazio se finisce in apostrofo */
const componi = (art, parola) => (art.endsWith("'") ? art + parola : `${art} ${parola}`)

/* il verso inverso di CONFUSIONI_ARTICOLO: per ogni articolo, le
   categorie di parole per cui QUELL'articolo è l'errore tipico —
   serve al formato «per quale di queste parole ci vuole "lo"?» */
const CONFUSIONE_INVERSA = {}
for (const [categoria, sbagli] of Object.entries(CONFUSIONI_ARTICOLO))
  for (const art of sbagli) (CONFUSIONE_INVERSA[art] ??= []).push(categoria)

/* ── che parte del discorso è ── */
const PARTI = ['nome', 'verbo', 'aggettivo', 'articolo', 'preposizione']
const AIUTO_PARTI = {
  nome: 'il nome indica una persona, un animale o una cosa',
  verbo: 'il verbo dice che cosa fa qualcuno o qualcosa',
  aggettivo: "l'aggettivo dice com'è il nome: il colore, la grandezza, l'umore",
  articolo: "l'articolo va sempre davanti al nome: il, lo, la, un…",
  preposizione: 'la preposizione lega le parole della frase: di, a, da, in, con, su, per, tra',
}
const PAROLE_PARTI = [
  { parola: 'gatto', parte: 'nome', em: '🐱' },
  { parola: 'cane', parte: 'nome', em: '🐶' },
  { parola: 'albero', parte: 'nome', em: '🌳' },
  { parola: 'scuola', parte: 'nome', em: '🏫' },
  { parola: 'bambino', parte: 'nome', em: '👦' },
  { parola: 'sole', parte: 'nome', em: '☀️' },
  { parola: 'mare', parte: 'nome', em: '🌊' },
  { parola: 'libro', parte: 'nome', em: '📖' },
  { parola: 'corre', parte: 'verbo' },
  { parola: 'mangia', parte: 'verbo' },
  { parola: 'salta', parte: 'verbo' },
  { parola: 'dorme', parte: 'verbo' },
  { parola: 'gioca', parte: 'verbo' },
  { parola: 'canta', parte: 'verbo' },
  { parola: 'legge', parte: 'verbo' },
  { parola: 'nuota', parte: 'verbo' },
  { parola: 'bello', parte: 'aggettivo' },
  { parola: 'grande', parte: 'aggettivo' },
  { parola: 'piccolo', parte: 'aggettivo' },
  { parola: 'veloce', parte: 'aggettivo' },
  { parola: 'rosso', parte: 'aggettivo' },
  { parola: 'felice', parte: 'aggettivo' },
  { parola: 'alto', parte: 'aggettivo' },
  { parola: 'simpatico', parte: 'aggettivo' },
  { parola: 'il', parte: 'articolo' },
  { parola: 'la', parte: 'articolo' },
  { parola: 'un', parte: 'articolo' },
  { parola: 'gli', parte: 'articolo' },
  { parola: 'una', parte: 'articolo' },
  { parola: 'lo', parte: 'articolo' },
  { parola: 'con', parte: 'preposizione' },
  { parola: 'su', parte: 'preposizione' },
  { parola: 'per', parte: 'preposizione' },
  { parola: 'tra', parte: 'preposizione' },
  { parola: 'di', parte: 'preposizione' },
  { parola: 'da', parte: 'preposizione' },
]

/* ── la concordanza: nome e aggettivo devono avere lo stesso genere
   e numero — ma un aggettivo giusto per genere e numero può essere
   assurdo per significato («una mela lenta»). Ogni soggetto ha una
   `categoria` (chi/che cosa è) e ogni aggettivo le `categorie` a cui
   può riferirsi davvero: si accoppiano solo quelle compatibili.
   Ogni aggettivo ha le sue quattro forme scritte a mano — «bianco»
   fa «bianchi» con l'acca, «simpatico» fa «simpatici» senza: dedurle
   da una regola sola le avrebbe scritte storte. */
const SOGGETTI_CONCORDANZA = [
  { testo: 'Il bambino', genere: 'm', numero: 's', categoria: 'persone', em: '👦' },
  { testo: 'La bambina', genere: 'f', numero: 's', categoria: 'persone', em: '👧' },
  { testo: 'I bambini', genere: 'm', numero: 'p', categoria: 'persone', em: '👦' },
  { testo: 'Le bambine', genere: 'f', numero: 'p', categoria: 'persone', em: '👧' },
  { testo: 'Il gatto', genere: 'm', numero: 's', categoria: 'animali', em: '🐱' },
  { testo: 'La gatta', genere: 'f', numero: 's', categoria: 'animali', em: '🐈' },
  { testo: 'I gatti', genere: 'm', numero: 'p', categoria: 'animali', em: '🐱' },
  { testo: 'Le gatte', genere: 'f', numero: 'p', categoria: 'animali', em: '🐈' },
  { testo: 'Il cane', genere: 'm', numero: 's', categoria: 'animali', em: '🐶' },
  { testo: 'I cani', genere: 'm', numero: 'p', categoria: 'animali', em: '🐶' },
  { testo: 'La casa', genere: 'f', numero: 's', categoria: 'luoghi', em: '🏠' },
  { testo: 'Le case', genere: 'f', numero: 'p', categoria: 'luoghi', em: '🏠' },
  { testo: 'Il fiore', genere: 'm', numero: 's', categoria: 'piante', em: '🌸' },
  { testo: 'I fiori', genere: 'm', numero: 'p', categoria: 'piante', em: '🌸' },
  { testo: 'La torta', genere: 'f', numero: 's', categoria: 'dolce', em: '🎂' },
  { testo: 'Le torte', genere: 'f', numero: 'p', categoria: 'dolce', em: '🎂' },
  { testo: 'Il libro', genere: 'm', numero: 's', categoria: 'oggetti', em: '📖' },
  { testo: 'I libri', genere: 'm', numero: 'p', categoria: 'oggetti', em: '📖' },
  { testo: 'La mela', genere: 'f', numero: 's', categoria: 'frutta', em: '🍎' },
  { testo: 'Le mele', genere: 'f', numero: 'p', categoria: 'frutta', em: '🍎' },
  { testo: 'Il nonno', genere: 'm', numero: 's', categoria: 'persone', em: '👴' },
  { testo: 'I nonni', genere: 'm', numero: 'p', categoria: 'persone', em: '👴' },
  { testo: 'La maestra', genere: 'f', numero: 's', categoria: 'persone', em: '👩‍🏫' },
  { testo: 'Le maestre', genere: 'f', numero: 'p', categoria: 'persone', em: '👩‍🏫' },
]
const AGGETTIVI = [
  { ms: 'contento', fs: 'contenta', mp: 'contenti', fp: 'contente', categorie: ['persone', 'animali'] },
  { ms: 'alto', fs: 'alta', mp: 'alti', fp: 'alte', categorie: ['persone', 'luoghi', 'piante'] },
  { ms: 'basso', fs: 'bassa', mp: 'bassi', fp: 'basse', categorie: ['persone', 'luoghi', 'piante'] },
  { ms: 'piccolo', fs: 'piccola', mp: 'piccoli', fp: 'piccole', categorie: ['persone', 'animali', 'frutta', 'dolce', 'oggetti', 'luoghi', 'piante'] },
  { ms: 'bello', fs: 'bella', mp: 'belli', fp: 'belle', categorie: ['persone', 'animali', 'frutta', 'dolce', 'oggetti', 'luoghi', 'piante'] },
  { ms: 'cattivo', fs: 'cattiva', mp: 'cattivi', fp: 'cattive', categorie: ['persone', 'animali'] },
  { ms: 'buono', fs: 'buona', mp: 'buoni', fp: 'buone', categorie: ['persone', 'animali', 'frutta', 'dolce'] },
  { ms: 'allegro', fs: 'allegra', mp: 'allegri', fp: 'allegre', categorie: ['persone', 'animali'] },
  { ms: 'simpatico', fs: 'simpatica', mp: 'simpatici', fp: 'simpatiche', categorie: ['persone', 'animali'] },
  { ms: 'rosso', fs: 'rossa', mp: 'rossi', fp: 'rosse', categorie: ['animali', 'frutta', 'dolce', 'oggetti', 'luoghi', 'piante'] },
  { ms: 'nero', fs: 'nera', mp: 'neri', fp: 'nere', categorie: ['animali', 'oggetti', 'luoghi', 'piante'] },
  { ms: 'bianco', fs: 'bianca', mp: 'bianchi', fp: 'bianche', categorie: ['animali', 'dolce', 'oggetti', 'luoghi', 'piante'] },
  { ms: 'giallo', fs: 'gialla', mp: 'gialli', fp: 'gialle', categorie: ['frutta', 'dolce', 'oggetti', 'luoghi', 'piante'] },
  { ms: 'magro', fs: 'magra', mp: 'magri', fp: 'magre', categorie: ['persone', 'animali'] },
  { ms: 'grasso', fs: 'grassa', mp: 'grassi', fp: 'grasse', categorie: ['persone', 'animali'] },
  { ms: 'lento', fs: 'lenta', mp: 'lenti', fp: 'lente', categorie: ['persone', 'animali'] },
  { ms: 'timido', fs: 'timida', mp: 'timidi', fp: 'timide', categorie: ['persone', 'animali'] },
  { ms: 'coraggioso', fs: 'coraggiosa', mp: 'coraggiosi', fp: 'coraggiose', categorie: ['persone', 'animali'] },
  { ms: 'generoso', fs: 'generosa', mp: 'generosi', fp: 'generose', categorie: ['persone'] },
  { ms: 'curioso', fs: 'curiosa', mp: 'curiosi', fp: 'curiose', categorie: ['persone', 'animali'] },
  { ms: 'goloso', fs: 'golosa', mp: 'golosi', fp: 'golose', categorie: ['persone', 'animali'] },
  { ms: 'pigro', fs: 'pigra', mp: 'pigri', fp: 'pigre', categorie: ['persone', 'animali'] },
  { ms: 'stanco', fs: 'stanca', mp: 'stanchi', fp: 'stanche', categorie: ['persone', 'animali'] },
  { ms: 'sporco', fs: 'sporca', mp: 'sporchi', fp: 'sporche', categorie: ['persone', 'animali', 'oggetti', 'luoghi', 'frutta'] },
  { ms: 'maturo', fs: 'matura', mp: 'maturi', fp: 'mature', categorie: ['frutta'] },
  { ms: 'comodo', fs: 'comoda', mp: 'comodi', fp: 'comode', categorie: ['luoghi', 'oggetti'] },
]

/* ── la frase: soggetto, predicato, e le altre parole che confondono
   (un complemento, un avverbio) — sono i falsi veri di questa
   domanda, non parole a caso. */
const FRASI = [
  { frase: 'Il cane abbaia forte.', soggetto: 'Il cane', predicato: 'abbaia', altre: ['forte'], em: '🐶' },
  { frase: 'La mamma cucina la pasta.', soggetto: 'La mamma', predicato: 'cucina', altre: ['la pasta'], em: '🍝' },
  { frase: 'I bambini giocano nel parco.', soggetto: 'I bambini', predicato: 'giocano', altre: ['nel parco'], em: '⚽' },
  { frase: 'Il gatto dorme sul divano.', soggetto: 'Il gatto', predicato: 'dorme', altre: ['sul divano'], em: '🐱' },
  { frase: 'Marco legge un libro.', soggetto: 'Marco', predicato: 'legge', altre: ['un libro'], em: '📖' },
  { frase: 'Le foglie cadono in autunno.', soggetto: 'Le foglie', predicato: 'cadono', altre: ['in autunno'], em: '🍂' },
  { frase: 'La maestra spiega la lezione.', soggetto: 'La maestra', predicato: 'spiega', altre: ['la lezione'], em: '👩‍🏫' },
  { frase: 'Il sole scalda la terra.', soggetto: 'Il sole', predicato: 'scalda', altre: ['la terra'], em: '☀️' },
  { frase: 'Gli uccelli volano alti.', soggetto: 'Gli uccelli', predicato: 'volano', altre: ['alti'], em: '🐦' },
  { frase: 'La nonna prepara la torta.', soggetto: 'La nonna', predicato: 'prepara', altre: ['la torta'], em: '🎂' },
  { frase: 'I pesci nuotano nel mare.', soggetto: 'I pesci', predicato: 'nuotano', altre: ['nel mare'], em: '🐟' },
  { frase: 'Luca corre veloce.', soggetto: 'Luca', predicato: 'corre', altre: ['veloce'], em: '🏃' },
  { frase: 'Le api volano sui fiori.', soggetto: 'Le api', predicato: 'volano', altre: ['sui fiori'], em: '🐝' },
  { frase: 'Il vento soffia forte.', soggetto: 'Il vento', predicato: 'soffia', altre: ['forte'], em: '🌬️' },
  { frase: 'I bambini cantano una canzone.', soggetto: 'I bambini', predicato: 'cantano', altre: ['una canzone'], em: '🎵' },
]
/* nomi propri e comuni: i propri vogliono la maiuscola perché
   indicano proprio uno, non un tipo qualunque */
const NOMI_PROPRI = ['Marco', 'Sara', 'Luca', 'Anna', 'Giulia', 'Paolo', 'Francesca', 'Matteo', 'Chiara', 'Sofia', 'Elena', 'Davide', 'Roma', 'Milano', 'Napoli', 'Torino', 'Venezia', 'Italia']
const NOMI_COMUNI = ['bambino', 'cane', 'gatto', 'scuola', 'città', 'fiume', 'montagna', 'maestra', 'pizza', 'gelato', 'albero', 'fiore', 'libro', 'sole', 'mare', 'casa']

const SCALETTA = [
  'plurale e genere delle parole',
  "l'articolo giusto",
  'che parte del discorso è',
  'la concordanza fra nome e aggettivo',
  'la frase: soggetto, predicato e nomi propri',
]

/* Le tipologie, con il peso che hanno a ogni grado. Il taglio fra i due
   saperi è netto e sta tutto qui: `flessione` è quello che un bambino
   che parla italiano sente («il cane è bello» stona da solo),
   `analisi` è la parte che o l'hai fatta a scuola o non c'è verso —
   dare un NOME alla parte del discorso, dire qual è il soggetto. */
const TIPI = [
  { chiave: 'gram:plurale', nome: 'Singolare e plurale', sa: 'flessione', gradi: { 1: 0.5 } },
  { chiave: 'gram:genere', nome: 'Maschile e femminile', sa: 'flessione', gradi: { 1: 0.5 } },
  { chiave: 'gram:articolo', nome: "L'articolo giusto", sa: 'flessione', gradi: { 2: 1 } },
  { chiave: 'gram:parti-del-discorso', nome: 'Che parte del discorso è', sa: 'analisi', gradi: { 3: 1 } },
  { chiave: 'gram:concordanza', nome: 'Il nome e il suo aggettivo', sa: 'flessione', gradi: { 4: 1 } },
  { chiave: 'gram:soggetto-predicato', nome: 'Soggetto e predicato', sa: 'analisi', gradi: { 5: 0.75 } },
  { chiave: 'gram:nome-proprio', nome: 'Nomi propri e nomi comuni', sa: 'analisi', gradi: { 5: 0.25 } },
]

class Grammatica extends Modulo {
  constructor() {
    super({
      id: 'grammatica',
      nome: 'Grammatica',
      icona: '🔤',
      materia: 'italiano',
      chiaro: 'riconoscere nomi, verbi, articoli e aggettivi, e le regole di genere, numero e concordanza',
      scaletta: SCALETTA,
      /* plurali, generi, articoli e concordanza li sa chi parla
         italiano — «il cane è bello» si sente. Dare il NOME alla parte
         del discorso, o dire qual è il soggetto, è analisi
         grammaticale: quella o l'hai fatta a scuola o no. */
      tipi: TIPI,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'gram:genere': return this.genereSwitch(sorte)
      case 'gram:articolo': return this.articolo(sorte)
      case 'gram:parti-del-discorso': return this.partiDelDiscorso(sorte)
      case 'gram:concordanza': return this.concordanza(sorte)
      case 'gram:soggetto-predicato':
        return sorte.forse(0.53) ? this.fraseSoggetto(sorte) : this.frasePredicato(sorte)
      case 'gram:nome-proprio': return this.nomeProprio(sorte)
      default: return this.plurale(sorte)
    }
  }

  /* il plurale — diretto («il plurale di X?») o inverso («il
     singolare di X?»): la stessa regola vista dai due lati */
  plurale(sorte) {
    const irregolare = sorte.forse(0.55)
    const v = sorte.uno(irregolare ? IRREGOLARI : REGOLARI)
    const dritta = irregolare
      ? `il plurale di «${v.s}» è «${v.p}»: non segue la regola normale`
      : `il plurale si forma cambiando la vocale finale: ${v.s} → ${v.p}`
    if (sorte.forse(0.3)) {
      const pool = [...new Set([...v.errori, v.p])].filter(e => e !== v.s)
      return domanda({
        testo: `Qual è il singolare di «${v.p}»?`,
        soggetto: v.em ? { emoji: v.em } : undefined,
        buona: testo(v.s),
        falsi: sorte.alcuni(pool, Math.min(2, pool.length)).map(e => testo(e, dritta)),
        chiave: 'gram:plurale',
        aiuto: dritta,
        sorte,
      })
    }
    return domanda({
      testo: `Qual è il plurale di «${v.s}»?`,
      soggetto: v.em ? { emoji: v.em } : undefined,
      buona: testo(v.p),
      falsi: sorte.alcuni(v.errori, Math.min(2, v.errori.length)).map(e => testo(e, dritta)),
      chiave: 'gram:plurale',
      aiuto: dritta,
      sorte,
    })
  }

  /* il genere — maschile/femminile della stessa parola, nei due
     versi. L'errore vero non è solo la finale sbagliata: è scambiare
     il cambio di genere con un plurale. */
  genereSwitch(sorte) {
    const c = sorte.uno(COPPIE_GENERE)
    const versoFemminile = sorte.forse(0.5)
    const dritta = 'il maschile e il femminile sono due parole diverse: cambia la finale, non il numero'
    if (versoFemminile) {
      return domanda({
        testo: `Qual è il femminile di «${c.m}»?`,
        soggetto: c.em ? { emoji: c.em } : undefined,
        buona: testo(c.f),
        falsi: [testo(c.m, dritta), testo(c.erroreF || c.fp, dritta)],
        chiave: 'gram:genere',
        aiuto: dritta,
        sorte,
      })
    }
    return domanda({
      testo: `Qual è il maschile di «${c.f}»?`,
      soggetto: c.em ? { emoji: c.em } : undefined,
      buona: testo(c.m),
      falsi: [testo(c.f, dritta), testo(c.erroreM || c.mp, dritta)],
      chiave: 'gram:genere',
      aiuto: dritta,
      sorte,
    })
  }

  /* l'articolo giusto — diretto o inverso, alternati */
  articolo(sorte) {
    return sorte.forse(0.35) ? this.articoloInverso(sorte) : this.articoloDiretto(sorte)
  }

  /* composto con la parola: si vede subito se «lo zaino» suona bene
     o no, cosa che «lo» da solo non dice */
  articoloDiretto(sorte) {
    const v = sorte.uno(ARTICOLI)
    const chiaveTipo = `${v.genere}-${v.numero}-${v.tipo}`
    const buonaArt = ARTICOLO_GIUSTO[chiaveTipo]
    const confusioni = CONFUSIONI_ARTICOLO[chiaveTipo]
    const dritta = REGOLA_ARTICOLO[v.tipo]
    return domanda({
      testo: `Qual è l'articolo giusto per «${v.parola}»?`,
      soggetto: v.em ? { emoji: v.em } : undefined,
      buona: testo(componi(buonaArt, v.parola)),
      falsi: sorte.alcuni(confusioni, Math.min(2, confusioni.length)).map(a => testo(componi(a, v.parola), dritta)),
      chiave: 'gram:articolo',
      aiuto: dritta,
      sorte,
    })
  }

  /* dato un articolo, quale parola lo vuole: i falsi sono parole di
     categorie per cui QUELL'articolo è proprio l'errore tipico */
  articoloInverso(sorte) {
    const artPossibili = Object.keys(CONFUSIONE_INVERSA)
    const art = sorte.uno(artPossibili)
    const categorieGiuste = Object.keys(ARTICOLO_GIUSTO).filter(k => ARTICOLO_GIUSTO[k] === art)
    const categorieSbagliate = CONFUSIONE_INVERSA[art]
    const paroleGiuste = ARTICOLI.filter(v => categorieGiuste.includes(`${v.genere}-${v.numero}-${v.tipo}`))
    const buonaParola = sorte.uno(paroleGiuste)
    const paroleSbagliate = ARTICOLI.filter(v =>
      categorieSbagliate.includes(`${v.genere}-${v.numero}-${v.tipo}`) && v.parola !== buonaParola.parola)
    const dritta = REGOLA_ARTICOLO[buonaParola.tipo]
    return domanda({
      testo: `Quale di queste parole vuole «${art}»?`,
      buona: testo(buonaParola.parola),
      falsi: sorte.alcuni(paroleSbagliate, Math.min(2, paroleSbagliate.length)).map(p => testo(p.parola, dritta)),
      chiave: 'gram:articolo',
      aiuto: dritta,
      sorte,
    })
  }

  /* che parte del discorso è una parola: i falsi sono le altre
     categorie, perché è proprio lì che un bambino esita */
  partiDelDiscorso(sorte) {
    const v = sorte.uno(PAROLE_PARTI)
    const altre = PARTI.filter(p => p !== v.parte)
    return domanda({
      testo: `Che parte del discorso è «${v.parola}»?`,
      soggetto: v.em ? { emoji: v.em } : undefined,
      buona: testo(v.parte),
      falsi: sorte.alcuni(altre, Math.min(3, altre.length)).map(p => testo(p, AIUTO_PARTI[v.parte])),
      chiave: 'gram:parti-del-discorso',
      aiuto: AIUTO_PARTI[v.parte],
      sorte,
    })
  }

  /* la concordanza: il nome dice genere e numero, l'aggettivo li
     deve seguire — i falsi sono le altre tre forme dello stesso
     aggettivo, l'errore più diretto che ci sia */
  concordanza(sorte) {
    const sogg = sorte.uno(SOGGETTI_CONCORDANZA)
    const aggPossibili = AGGETTIVI.filter(a => a.categorie.includes(sogg.categoria))
    const agg = sorte.uno(aggPossibili)
    const chiaveForma = sogg.genere + sogg.numero
    const verbo = sogg.numero === 's' ? 'è' : 'sono'
    const altreForme = ['ms', 'fs', 'mp', 'fp'].filter(k => k !== chiaveForma).map(k => agg[k])
    const dritta = "l'aggettivo si accorda al nome: stesso genere, stesso numero"
    return domanda({
      testo: `${sogg.testo} ${verbo} ___.`,
      soggetto: sogg.em ? { emoji: sogg.em } : undefined,
      buona: testo(agg[chiaveForma]),
      falsi: sorte.alcuni(altreForme, 2).map(f => testo(f, dritta)),
      chiave: 'gram:concordanza',
      aiuto: dritta,
      sorte,
    })
  }

  /* chi fa l'azione e qual è l'azione sono la stessa domanda vista dai
     due lati, e per un genitore sono una voce sola: stanno sotto la
     stessa chiave, e qui dentro si alternano */
  fraseSoggetto(sorte) {
    const f = sorte.uno(FRASI)
    const falsiPool = [f.predicato, ...f.altre]
    return domanda({
      testo: sorte.forse(0.5)
        ? `Chi fa l'azione in questa frase? «${f.frase}»`
        : `Qual è il soggetto di questa frase? «${f.frase}»`,
      soggetto: f.em ? { emoji: f.em } : undefined,
      buona: testo(f.soggetto),
      falsi: sorte.alcuni(falsiPool, Math.min(2, falsiPool.length)).map(x => testo(x)),
      chiave: 'gram:soggetto-predicato',
      aiuto: "il soggetto è chi o che cosa fa l'azione",
      sorte,
    })
  }

  frasePredicato(sorte) {
    const f = sorte.uno(FRASI)
    const falsiPool = [f.soggetto, ...f.altre]
    return domanda({
      testo: `Qual è il predicato (il verbo) di questa frase? «${f.frase}»`,
      soggetto: f.em ? { emoji: f.em } : undefined,
      buona: testo(f.predicato),
      falsi: sorte.alcuni(falsiPool, Math.min(2, falsiPool.length)).map(x => testo(x)),
      chiave: 'gram:soggetto-predicato',
      aiuto: 'il predicato è il verbo: dice che cosa fa il soggetto',
      sorte,
    })
  }

  nomeProprio(sorte) {
    const daPropri = sorte.forse(0.5)
    const parola = sorte.uno(daPropri ? NOMI_PROPRI : NOMI_COMUNI)
    const buonaEt = daPropri ? 'proprio' : 'comune'
    const falsaEt = daPropri ? 'comune' : 'proprio'
    const dritta = daPropri
      ? 'i nomi propri si scrivono con la lettera maiuscola: indicano uno in particolare'
      : 'i nomi comuni indicano un tipo, non uno in particolare, e si scrivono minuscoli'
    return domanda({
      testo: `«${parola}» è un nome proprio o comune?`,
      buona: testo(buonaEt),
      falsi: [testo(falsaEt, dritta)],
      chiave: 'gram:nome-proprio',
      aiuto: dritta,
      sorte,
    })
  }
}

export default new Grammatica()
