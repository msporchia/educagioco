/* Coniugare i verbi italiani, dal presente ai tempi che si sbagliano davvero.
   I falsi sono errori veri e per lo più si costruiscono da regole (vedi
   `regolarizza`, gli scambi -isc-/-evo-ivo/vocale del futuro) invece di
   scrivere ogni domanda a mano; il passato prossimo (PARTICIPI) resta
   scritto a mano perché lì non c'è una regola da applicare male. Tre
   formati alternati con `sorte.forse()`: frase col buco, domanda diretta,
   frase intera da riconoscere. I tempi (non solo le persone) si oppongono
   in `tempo-giusto`/`riconosci-tempo`, in cima alla scaletta. I tempi che
   arrivano dopo (condizionale, congiuntivo, imperativo, i composti)
   nascono spenti in data/saperi.js. */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

// le desinenze delle quattro famiglie (la quarta è -ire con -isc-: capire, non dormire); servono anche a regolarizza()
const DESINENZE = {
  are: ['o', 'i', 'a', 'iamo', 'ate', 'ano'],
  ere: ['o', 'i', 'e', 'iamo', 'ete', 'ono'],
  ire: ['o', 'i', 'e', 'iamo', 'ite', 'ono'],
  ireIsc: ['isco', 'isci', 'isce', 'iamo', 'ite', 'iscono'],
}
const PRONOMI = ['io', 'tu', 'lui', 'noi', 'voi', 'loro']

const formeRegolari = (infinito, tipo) => {
  const radice = infinito.slice(0, infinito.length - 3)
  return DESINENZE[tipo].map(fin => radice + fin)
}

const REGOLARI = {
  are: {
    dritta: 'i verbi in -are al presente fanno: -o, -i, -a, -iamo, -ate, -ano',
    verbi: ['mangiare', 'giocare', 'parlare', 'cantare', 'saltare', 'guardare', 'ascoltare',
      'disegnare', 'lavare', 'portare', 'aiutare', 'chiamare', 'cucinare', 'comprare',
      'lavorare', 'nuotare', 'volare', 'suonare'],
  },
  ere: {
    dritta: 'i verbi in -ere al presente fanno: -o, -i, -e, -iamo, -ete, -ono',
    verbi: ['credere', 'vedere', 'leggere', 'scrivere', 'correre', 'ridere', 'prendere',
      'chiudere', 'mettere', 'perdere', 'vivere', 'ripetere', 'temere', 'vendere'],
  },
  ire: {
    dritta: 'i verbi in -ire (quelli semplici) al presente fanno: -o, -i, -e, -iamo, -ite, -ono',
    verbi: ['dormire', 'partire', 'aprire', 'sentire', 'seguire', 'offrire', 'servire',
      'vestire', 'coprire', 'soffrire'],
  },
  ireIsc: {
    dritta: 'molti verbi in -ire mettono -isc- in mezzo: capire fa capisco, non capo',
    verbi: ['capire', 'finire', 'preferire', 'pulire', 'costruire', 'spedire', 'unire',
      'colpire', 'guarire', 'agire', 'punire', 'gestire'],
  },
}

const IRREGOLARI = [
  { infinito: 'essere', forme: ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'] },
  { infinito: 'avere', forme: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'] },
  { infinito: 'andare', forme: ['vado', 'vai', 'va', 'andiamo', 'andate', 'vanno'] },
  { infinito: 'fare', forme: ['faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno'] },
  { infinito: 'dare', forme: ['do', 'dai', 'dà', 'diamo', 'date', 'danno'] },
  { infinito: 'stare', forme: ['sto', 'stai', 'sta', 'stiamo', 'state', 'stanno'] },
  { infinito: 'venire', forme: ['vengo', 'vieni', 'viene', 'veniamo', 'venite', 'vengono'] },
  { infinito: 'dire', forme: ['dico', 'dici', 'dice', 'diciamo', 'dite', 'dicono'] },
  { infinito: 'uscire', forme: ['esco', 'esci', 'esce', 'usciamo', 'uscite', 'escono'] },
  { infinito: 'potere', forme: ['posso', 'puoi', 'può', 'possiamo', 'potete', 'possono'] },
  { infinito: 'volere', forme: ['voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono'] },
  { infinito: 'sapere', forme: ['so', 'sai', 'sa', 'sappiamo', 'sapete', 'sanno'] },
]

// un irregolare trattato come regolare («io ando», non «vado»): può coincidere col vero, chi chiama controlla sempre
const regolarizza = (infinito, idx) => {
  const tipo = infinito.slice(-3)
  const radice = infinito.slice(0, infinito.length - 3)
  return radice + DESINENZE[tipo][idx]
}

// compl (solo dove si presta a una frase intera) costruisce «Luca ___ (andare) al parco»; irregolare = tappa più dura
const PARTICIPI = [
  { infinito: 'andare', participio: 'andato', ausiliare: 'essere', errori: ['anduto', 'andito'], compl: 'al parco', emoji: '🚶', irregolare: false },
  { infinito: 'venire', participio: 'venuto', ausiliare: 'essere', errori: ['venito', 'veniuto'], compl: 'a casa nostra', emoji: '🏠', irregolare: false },
  { infinito: 'tornare', participio: 'tornato', ausiliare: 'essere', errori: ['tornuto', 'tornito'], compl: 'a casa', irregolare: false },
  { infinito: 'uscire', participio: 'uscito', ausiliare: 'essere', errori: ['usciuto', 'uscato'], compl: 'con gli amici', irregolare: false },
  { infinito: 'entrare', participio: 'entrato', ausiliare: 'essere', errori: ['entruto', 'entrito'], compl: 'in classe', irregolare: false },
  { infinito: 'partire', participio: 'partito', ausiliare: 'essere', errori: ['partuto', 'partato'], compl: 'per il mare', emoji: '✈️', irregolare: false },
  { infinito: 'arrivare', participio: 'arrivato', ausiliare: 'essere', errori: ['arrivuto', 'arrivito'], compl: 'in ritardo', irregolare: false },
  { infinito: 'cadere', participio: 'caduto', ausiliare: 'essere', errori: ['cadito', 'cadato'], compl: 'dalle scale', irregolare: false },
  { infinito: 'nascere', participio: 'nato', ausiliare: 'essere', errori: ['nasciuto', 'nascuto'], compl: 'in inverno', emoji: '👶', irregolare: true },
  { infinito: 'rimanere', participio: 'rimasto', ausiliare: 'essere', errori: ['rimanuto', 'rimanato'], compl: 'a casa', irregolare: true },
  { infinito: 'diventare', participio: 'diventato', ausiliare: 'essere', errori: ['diventuto', 'diventito'], compl: 'famoso', agg: true, irregolare: false },
  { infinito: 'stare', participio: 'stato', ausiliare: 'essere', errori: ['stauto', 'statito'], compl: 'zitto', agg: true, irregolare: true },
  { infinito: 'essere', participio: 'stato', ausiliare: 'essere', errori: ['essuto', 'essato'], compl: 'contento', agg: true, irregolare: true },
  { infinito: 'mangiare', participio: 'mangiato', ausiliare: 'avere', errori: ['mangiuto', 'mangito'], compl: 'la pizza', emoji: '🍕', irregolare: false },
  { infinito: 'guardare', participio: 'guardato', ausiliare: 'avere', errori: ['guarduto', 'guardito'], compl: 'un film', emoji: '📺', irregolare: false },
  { infinito: 'leggere', participio: 'letto', ausiliare: 'avere', errori: ['legguto', 'leggato'], compl: 'un libro', emoji: '📖', irregolare: true },
  { infinito: 'scrivere', participio: 'scritto', ausiliare: 'avere', errori: ['scrivuto', 'scrivato'], compl: 'una lettera', emoji: '✍️', irregolare: true },
  { infinito: 'prendere', participio: 'preso', ausiliare: 'avere', errori: ['prenduto', 'prendato'], compl: 'il pallone', emoji: '⚽', irregolare: true },
  { infinito: 'vedere', participio: 'visto', ausiliare: 'avere', errori: ['vedato', 'vedito'], compl: 'un film', emoji: '👀', irregolare: true },
  { infinito: 'fare', participio: 'fatto', ausiliare: 'avere', errori: ['fato', 'faciuto'], compl: 'i compiti', emoji: '📝', irregolare: true },
  { infinito: 'dire', participio: 'detto', ausiliare: 'avere', errori: ['dito', 'diciuto'], compl: 'la verità', irregolare: true },
  { infinito: 'comprare', participio: 'comprato', ausiliare: 'avere', errori: ['compruto', 'comprito'], compl: 'un gelato', emoji: '🍦', irregolare: false },
  { infinito: 'giocare', participio: 'giocato', ausiliare: 'avere', errori: ['giocuto', 'giocito'], compl: 'a calcio', emoji: '⚽', irregolare: false },
  { infinito: 'rompere', participio: 'rotto', ausiliare: 'avere', errori: ['romputo', 'rompato'], irregolare: true },
  { infinito: 'chiudere', participio: 'chiuso', ausiliare: 'avere', errori: ['chiuduto', 'chiudato'], irregolare: true },
  { infinito: 'aprire', participio: 'aperto', ausiliare: 'avere', errori: ['aprito', 'apruto'], irregolare: true },
  { infinito: 'mettere', participio: 'messo', ausiliare: 'avere', errori: ['mettuto', 'mettato'], irregolare: true },
  { infinito: 'perdere', participio: 'perso', ausiliare: 'avere', errori: ['perdito', 'perdato'], irregolare: true },
  { infinito: 'chiedere', participio: 'chiesto', ausiliare: 'avere', errori: ['chiedito', 'chiedato'], irregolare: true },
  { infinito: 'rispondere', participio: 'risposto', ausiliare: 'avere', errori: ['rispondito', 'rispondato'], irregolare: true },
  { infinito: 'decidere', participio: 'deciso', ausiliare: 'avere', errori: ['decidito', 'decidato'], irregolare: true },
  { infinito: 'vincere', participio: 'vinto', ausiliare: 'avere', errori: ['vinciuto', 'vincuto'], irregolare: true },
  { infinito: 'scegliere', participio: 'scelto', ausiliare: 'avere', errori: ['sceglito', 'scegliuto'], irregolare: true },
  { infinito: 'correre', participio: 'corso', ausiliare: 'avere', errori: ['corruto', 'correto'], irregolare: true },
  { infinito: 'offrire', participio: 'offerto', ausiliare: 'avere', errori: ['offrito', 'offruto'], irregolare: true },
  { infinito: 'dormire', participio: 'dormito', ausiliare: 'avere', errori: ['dormuto', 'dormato'], irregolare: false },
  { infinito: 'credere', participio: 'creduto', ausiliare: 'avere', errori: ['credato', 'credito'], irregolare: false },
  { infinito: 'ascoltare', participio: 'ascoltato', ausiliare: 'avere', errori: ['ascoltuto', 'ascoltito'], irregolare: false },
  { infinito: 'pulire', participio: 'pulito', ausiliare: 'avere', errori: ['pulato', 'puluto'], irregolare: false },
  { infinito: 'vendere', participio: 'venduto', ausiliare: 'avere', errori: ['vendato', 'vendito'], irregolare: false },
  { infinito: 'finire', participio: 'finito', ausiliare: 'avere', errori: ['finato', 'finuto'], irregolare: false },
  { infinito: 'temere', participio: 'temuto', ausiliare: 'avere', errori: ['temato', 'temito'], irregolare: false },
  { infinito: 'bere', participio: 'bevuto', ausiliare: 'avere', errori: ['beuto', 'bevato'], irregolare: true },
  { infinito: 'saltare', participio: 'saltato', ausiliare: 'avere', errori: ['saltuto', 'saltito'], irregolare: false },
  { infinito: 'cantare', participio: 'cantato', ausiliare: 'avere', errori: ['cantuto', 'cantito'], emoji: '🎤', irregolare: false },
  { infinito: 'lavare', participio: 'lavato', ausiliare: 'avere', errori: ['lavuto', 'lavito'], irregolare: false },
  { infinito: 'portare', participio: 'portato', ausiliare: 'avere', errori: ['portuto', 'portito'], irregolare: false },
  { infinito: 'aiutare', participio: 'aiutato', ausiliare: 'avere', errori: ['aiututo', 'aiutito'], irregolare: false },
  { infinito: 'chiamare', participio: 'chiamato', ausiliare: 'avere', errori: ['chiamuto', 'chiamito'], irregolare: false },
  { infinito: 'cucinare', participio: 'cucinato', ausiliare: 'avere', errori: ['cucinuto', 'cucinito'], emoji: '🍳', irregolare: false },
  { infinito: 'lavorare', participio: 'lavorato', ausiliare: 'avere', errori: ['lavoruto', 'lavorito'], irregolare: false },
  { infinito: 'nuotare', participio: 'nuotato', ausiliare: 'avere', errori: ['nuotuto', 'nuotito'], emoji: '🏊', irregolare: false },
  { infinito: 'volare', participio: 'volato', ausiliare: 'avere', errori: ['voluto', 'volito'], emoji: '🕊️', irregolare: false },
  { infinito: 'suonare', participio: 'suonato', ausiliare: 'avere', errori: ['suonuto', 'suonito'], emoji: '🎸', irregolare: false },
  { infinito: 'disegnare', participio: 'disegnato', ausiliare: 'avere', errori: ['disegnuto', 'disegnito'], emoji: '🎨', irregolare: false },
  { infinito: 'guidare', participio: 'guidato', ausiliare: 'avere', errori: ['guiduto', 'guidito'], irregolare: false },
  { infinito: 'telefonare', participio: 'telefonato', ausiliare: 'avere', errori: ['telefonuto', 'telefonito'], emoji: '📞', irregolare: false },
  { infinito: 'cambiare', participio: 'cambiato', ausiliare: 'avere', errori: ['cambiuto', 'cambiito'], irregolare: false },
  { infinito: 'pensare', participio: 'pensato', ausiliare: 'avere', errori: ['pensuto', 'pensito'], irregolare: false },
  { infinito: 'sperare', participio: 'sperato', ausiliare: 'avere', errori: ['speruto', 'sperito'], irregolare: false },
  { infinito: 'marciare', participio: 'marciato', ausiliare: 'avere', errori: ['marciuto', 'marciito'], irregolare: false },
  { infinito: 'sentire', participio: 'sentito', ausiliare: 'avere', errori: ['sentuto', 'sentato'], irregolare: false },
  { infinito: 'servire', participio: 'servito', ausiliare: 'avere', errori: ['servuto', 'servato'], irregolare: false },
  { infinito: 'seguire', participio: 'seguito', ausiliare: 'avere', errori: ['seguuto', 'seguato'], irregolare: false },
  { infinito: 'vestire', participio: 'vestito', ausiliare: 'avere', errori: ['vestuto', 'vestato'], irregolare: false },
  { infinito: 'spedire', participio: 'spedito', ausiliare: 'avere', errori: ['speduto', 'spedato'], emoji: '📦', irregolare: false },
  { infinito: 'costruire', participio: 'costruito', ausiliare: 'avere', errori: ['costruuto', 'costruato'], irregolare: false },
  { infinito: 'colpire', participio: 'colpito', ausiliare: 'avere', errori: ['colputo', 'colpato'], irregolare: false },
  { infinito: 'punire', participio: 'punito', ausiliare: 'avere', errori: ['punuto', 'punato'], irregolare: false },
  { infinito: 'gestire', participio: 'gestito', ausiliare: 'avere', errori: ['gestuto', 'gestato'], irregolare: false },
  { infinito: 'ripetere', participio: 'ripetuto', ausiliare: 'avere', errori: ['ripetato', 'ripetito'], irregolare: false },
  { infinito: 'potere', participio: 'potuto', ausiliare: 'avere', errori: ['potato', 'potito'], irregolare: false },
  { infinito: 'dovere', participio: 'dovuto', ausiliare: 'avere', errori: ['dovato', 'dovito'], irregolare: false },
  { infinito: 'sapere', participio: 'saputo', ausiliare: 'avere', errori: ['sapato', 'sapito'], irregolare: false },
  { infinito: 'vivere', participio: 'vissuto', ausiliare: 'avere', errori: ['vivuto', 'vivato'], irregolare: true },
  { infinito: 'morire', participio: 'morto', ausiliare: 'avere', errori: ['morito', 'moruto'], irregolare: true },
  { infinito: 'scendere', participio: 'sceso', ausiliare: 'avere', errori: ['scenduto', 'scendato'], emoji: '🪜', irregolare: true },
  { infinito: 'spendere', participio: 'speso', ausiliare: 'avere', errori: ['spenduto', 'spendato'], emoji: '💸', irregolare: true },
  { infinito: 'accendere', participio: 'acceso', ausiliare: 'avere', errori: ['accenduto', 'accendato'], emoji: '💡', irregolare: true },
  { infinito: 'spegnere', participio: 'spento', ausiliare: 'avere', errori: ['spegnuto', 'spegnato'], irregolare: true },
  { infinito: 'piangere', participio: 'pianto', ausiliare: 'avere', errori: ['pianguto', 'piangato'], emoji: '😢', irregolare: true },
  { infinito: 'convincere', participio: 'convinto', ausiliare: 'avere', errori: ['convincuto', 'convincato'], irregolare: true },
  { infinito: 'proteggere', participio: 'protetto', ausiliare: 'avere', errori: ['protegguto', 'proteggato'], emoji: '🛡️', irregolare: true },
  { infinito: 'muovere', participio: 'mosso', ausiliare: 'avere', errori: ['muovuto', 'muovato'], irregolare: true },
  { infinito: 'nascondere', participio: 'nascosto', ausiliare: 'avere', errori: ['nasconduto', 'nascondato'], emoji: '🙈', irregolare: true },
  { infinito: 'ridere', participio: 'riso', ausiliare: 'avere', errori: ['riduto', 'ridato'], emoji: '😂', irregolare: true },
  { infinito: 'sorridere', participio: 'sorriso', ausiliare: 'avere', errori: ['sorriduto', 'sorridato'], emoji: '😊', irregolare: true },
  { infinito: 'dividere', participio: 'diviso', ausiliare: 'avere', errori: ['dividuto', 'dividato'], emoji: '➗', irregolare: true },
  { infinito: 'friggere', participio: 'fritto', ausiliare: 'avere', errori: ['frigguto', 'friggato'], irregolare: true },
  { infinito: 'cuocere', participio: 'cotto', ausiliare: 'avere', errori: ['cuocuto', 'cuocato'], emoji: '🍲', irregolare: true },
  { infinito: 'raggiungere', participio: 'raggiunto', ausiliare: 'avere', errori: ['raggiunguto', 'raggiungato'], emoji: '🏁', irregolare: true },
  { infinito: 'spingere', participio: 'spinto', ausiliare: 'avere', errori: ['spinguto', 'spingato'], irregolare: true },
  { infinito: 'stringere', participio: 'stretto', ausiliare: 'avere', errori: ['stringuto', 'stringato'], emoji: '🤝', irregolare: true },
  { infinito: 'dipingere', participio: 'dipinto', ausiliare: 'avere', errori: ['dipinguto', 'dipingato'], emoji: '🖼️', irregolare: true },
  { infinito: 'appendere', participio: 'appeso', ausiliare: 'avere', errori: ['appenduto', 'appendato'], irregolare: true },
  { infinito: 'comprendere', participio: 'compreso', ausiliare: 'avere', errori: ['comprenduto', 'comprendato'], irregolare: true },
  { infinito: 'sorprendere', participio: 'sorpreso', ausiliare: 'avere', errori: ['sorprenduto', 'sorprendato'], emoji: '😲', irregolare: true },
  { infinito: 'coprire', participio: 'coperto', ausiliare: 'avere', errori: ['coprito', 'copruto'], irregolare: true },
  { infinito: 'scoprire', participio: 'scoperto', ausiliare: 'avere', errori: ['scoprito', 'scopruto'], emoji: '🔍', irregolare: true },
  { infinito: 'soffrire', participio: 'sofferto', ausiliare: 'avere', errori: ['soffrito', 'soffruto'], irregolare: true },
  { infinito: 'commuovere', participio: 'commosso', ausiliare: 'avere', errori: ['commuovuto', 'commuovato'], irregolare: true },
]
const CON_COMPLEMENTO = PARTICIPI.filter(v => v.compl)
const femminile = p => p.slice(0, -1) + 'a'
const SOGGETTI = [{ nome: 'Luca', genere: 'm' }, { nome: 'Marta', genere: 'f' }]

// con essere si accorda tutto quello che segue (participio, falso compreso, e il complemento se è un aggettivo)
const accorda = (parola, v, sog) =>
  v.ausiliare === 'essere' && sog.genere === 'f' ? femminile(parola) : parola
const complementoDi = (v, sog) => (v.agg ? accorda(v.compl, v, sog) : v.compl)

// gli irregolari veri a imperfetto e futuro (andare/-are in genere sono regolari qui, solo la radice cambia)
const IMPERFETTO_IRR = [
  { infinito: 'essere', forme: ['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano'] },
  { infinito: 'fare', forme: ['facevo', 'facevi', 'faceva', 'facevamo', 'facevate', 'facevano'] },
  { infinito: 'dire', forme: ['dicevo', 'dicevi', 'diceva', 'dicevamo', 'dicevate', 'dicevano'] },
  { infinito: 'bere', forme: ['bevevo', 'bevevi', 'beveva', 'bevevamo', 'bevevate', 'bevevano'] },
]
const FUTURO_IRR = [
  { infinito: 'essere', forme: ['sarò', 'sarai', 'sarà', 'saremo', 'sarete', 'saranno'] },
  { infinito: 'avere', forme: ['avrò', 'avrai', 'avrà', 'avremo', 'avrete', 'avranno'] },
  { infinito: 'andare', forme: ['andrò', 'andrai', 'andrà', 'andremo', 'andrete', 'andranno'] },
  { infinito: 'fare', forme: ['farò', 'farai', 'farà', 'faremo', 'farete', 'faranno'] },
  { infinito: 'venire', forme: ['verrò', 'verrai', 'verrà', 'verremo', 'verrete', 'verranno'] },
  { infinito: 'potere', forme: ['potrò', 'potrai', 'potrà', 'potremo', 'potrete', 'potranno'] },
  { infinito: 'vedere', forme: ['vedrò', 'vedrai', 'vedrà', 'vedremo', 'vedrete', 'vedranno'] },
  { infinito: 'sapere', forme: ['saprò', 'saprai', 'saprà', 'sapremo', 'saprete', 'sapranno'] },
  { infinito: 'dovere', forme: ['dovrò', 'dovrai', 'dovrà', 'dovremo', 'dovrete', 'dovranno'] },
  { infinito: 'volere', forme: ['vorrò', 'vorrai', 'vorrà', 'vorremo', 'vorrete', 'vorranno'] },
  { infinito: 'stare', forme: ['starò', 'starai', 'starà', 'staremo', 'starete', 'staranno'] },
]
const IMPERFETTO_END = {
  are: ['avo', 'avi', 'ava', 'avamo', 'avate', 'avano'],
  ere: ['evo', 'evi', 'eva', 'evamo', 'evate', 'evano'],
  ire: ['ivo', 'ivi', 'iva', 'ivamo', 'ivate', 'ivano'],
}
const FUTURO_END = ['ò', 'ai', 'à', 'emo', 'ete', 'anno']
const futuroStem = (infinito, tipo) => {
  const radice = infinito.slice(0, infinito.length - 3)
  return tipo === 'ire' ? radice + 'ir' : radice + 'er'
}

// manca la riga `ere`: i regolari in -ere hanno due forme buone al remoto, ogni falso rischierebbe di essere onesto
const REMOTO_END = {
  are: ['ai', 'asti', 'ò', 'ammo', 'aste', 'arono'],
  ire: ['ii', 'isti', 'ì', 'immo', 'iste', 'irono'],
}
const REMOTO_ERE_FINTE = ['ei', 'esti', 'é', 'emmo', 'este', 'erono'] // solo per costruire l'errore («cuocei»)

// 1ª, 3ª, 6ª cambiano tema (cossi/cosse/cossero), le altre restano regolari (cocesti): distinguerle È l'esercizio
const REMOTO_FORTI = [0, 2, 5]
const REMOTO_IRR = [
  { infinito: 'essere', forme: ['fui', 'fosti', 'fu', 'fummo', 'foste', 'furono'] },
  { infinito: 'avere', forme: ['ebbi', 'avesti', 'ebbe', 'avemmo', 'aveste', 'ebbero'] },
  { infinito: 'fare', forme: ['feci', 'facesti', 'fece', 'facemmo', 'faceste', 'fecero'] },
  { infinito: 'dire', forme: ['dissi', 'dicesti', 'disse', 'dicemmo', 'diceste', 'dissero'] },
  { infinito: 'stare', forme: ['stetti', 'stesti', 'stette', 'stemmo', 'steste', 'stettero'] },
  { infinito: 'dare', forme: ['diedi', 'desti', 'diede', 'demmo', 'deste', 'diedero'] },
  { infinito: 'venire', forme: ['venni', 'venisti', 'venne', 'venimmo', 'veniste', 'vennero'] },
  { infinito: 'tenere', forme: ['tenni', 'tenesti', 'tenne', 'tenemmo', 'teneste', 'tennero'] },
  { infinito: 'volere', forme: ['volli', 'volesti', 'volle', 'volemmo', 'voleste', 'vollero'] },
  { infinito: 'sapere', forme: ['seppi', 'sapesti', 'seppe', 'sapemmo', 'sapeste', 'seppero'] },
  { infinito: 'vedere', forme: ['vidi', 'vedesti', 'vide', 'vedemmo', 'vedeste', 'videro'] },
  { infinito: 'cuocere', forme: ['cossi', 'cocesti', 'cosse', 'cocemmo', 'coceste', 'cossero'] },
  { infinito: 'chiedere', forme: ['chiesi', 'chiedesti', 'chiese', 'chiedemmo', 'chiedeste', 'chiesero'] },
  { infinito: 'rispondere', forme: ['risposi', 'rispondesti', 'rispose', 'rispondemmo', 'rispondeste', 'risposero'] },
  { infinito: 'scrivere', forme: ['scrissi', 'scrivesti', 'scrisse', 'scrivemmo', 'scriveste', 'scrissero'] },
  { infinito: 'leggere', forme: ['lessi', 'leggesti', 'lesse', 'leggemmo', 'leggeste', 'lessero'] },
  { infinito: 'prendere', forme: ['presi', 'prendesti', 'prese', 'prendemmo', 'prendeste', 'presero'] },
  { infinito: 'mettere', forme: ['misi', 'mettesti', 'mise', 'mettemmo', 'metteste', 'misero'] },
  { infinito: 'chiudere', forme: ['chiusi', 'chiudesti', 'chiuse', 'chiudemmo', 'chiudeste', 'chiusero'] },
  { infinito: 'perdere', forme: ['persi', 'perdesti', 'perse', 'perdemmo', 'perdeste', 'persero'] },
  { infinito: 'decidere', forme: ['decisi', 'decidesti', 'decise', 'decidemmo', 'decideste', 'decisero'] },
  { infinito: 'vincere', forme: ['vinsi', 'vincesti', 'vinse', 'vincemmo', 'vinceste', 'vinsero'] },
  { infinito: 'correre', forme: ['corsi', 'corresti', 'corse', 'corremmo', 'correste', 'corsero'] },
  { infinito: 'rompere', forme: ['ruppi', 'rompesti', 'ruppe', 'rompemmo', 'rompeste', 'ruppero'] },
  { infinito: 'nascere', forme: ['nacqui', 'nascesti', 'nacque', 'nascemmo', 'nasceste', 'nacquero'] },
  { infinito: 'vivere', forme: ['vissi', 'vivesti', 'visse', 'vivemmo', 'viveste', 'vissero'] },
  { infinito: 'bere', forme: ['bevvi', 'bevesti', 'bevve', 'bevemmo', 'beveste', 'bevvero'] },
  { infinito: 'scegliere', forme: ['scelsi', 'scegliesti', 'scelse', 'scegliemmo', 'sceglieste', 'scelsero'] },
  { infinito: 'conoscere', forme: ['conobbi', 'conoscesti', 'conobbe', 'conoscemmo', 'conosceste', 'conobbero'] },
  { infinito: 'rimanere', forme: ['rimasi', 'rimanesti', 'rimase', 'rimanemmo', 'rimaneste', 'rimasero'] },
]

// il condizionale sta sullo stesso tema del futuro (parlerò → parlerei): riusa FUTURO_IRR, non si riscrive la tabella
const CONDIZIONALE_END = ['ei', 'esti', 'ebbe', 'emmo', 'este', 'ebbero']
const temaDalFuturo = forme => forme[0].slice(0, -1) // «sarò» → «sar-»: la 1ª persona finisce in una vocale sola

// il congiuntivo presente ha una faccia sola per io/tu/lui: si chiede solo su noi/voi/loro, dove la forma è unica
const CONG_PRES_END = {
  are: ['i', 'i', 'i', 'iamo', 'iate', 'ino'],
  ere: ['a', 'a', 'a', 'iamo', 'iate', 'ano'],
  ire: ['a', 'a', 'a', 'iamo', 'iate', 'ano'],
  ireIsc: ['isca', 'isca', 'isca', 'iamo', 'iate', 'iscano'],
}
const CONG_IMPF_END = {
  are: ['assi', 'assi', 'asse', 'assimo', 'aste', 'assero'],
  ere: ['essi', 'essi', 'esse', 'essimo', 'este', 'essero'],
  ire: ['issi', 'issi', 'isse', 'issimo', 'iste', 'issero'],
}
const CONG_PRES_IRR = [
  { infinito: 'essere', forme: ['sia', 'sia', 'sia', 'siamo', 'siate', 'siano'] },
  { infinito: 'avere', forme: ['abbia', 'abbia', 'abbia', 'abbiamo', 'abbiate', 'abbiano'] },
  { infinito: 'andare', forme: ['vada', 'vada', 'vada', 'andiamo', 'andiate', 'vadano'] },
  { infinito: 'fare', forme: ['faccia', 'faccia', 'faccia', 'facciamo', 'facciate', 'facciano'] },
  { infinito: 'dare', forme: ['dia', 'dia', 'dia', 'diamo', 'diate', 'diano'] },
  { infinito: 'stare', forme: ['stia', 'stia', 'stia', 'stiamo', 'stiate', 'stiano'] },
  { infinito: 'venire', forme: ['venga', 'venga', 'venga', 'veniamo', 'veniate', 'vengano'] },
  { infinito: 'dire', forme: ['dica', 'dica', 'dica', 'diciamo', 'diciate', 'dicano'] },
  { infinito: 'uscire', forme: ['esca', 'esca', 'esca', 'usciamo', 'usciate', 'escano'] },
  { infinito: 'potere', forme: ['possa', 'possa', 'possa', 'possiamo', 'possiate', 'possano'] },
  { infinito: 'volere', forme: ['voglia', 'voglia', 'voglia', 'vogliamo', 'vogliate', 'vogliano'] },
  { infinito: 'sapere', forme: ['sappia', 'sappia', 'sappia', 'sappiamo', 'sappiate', 'sappiano'] },
]
const CONG_IMPF_IRR = [
  { infinito: 'essere', forme: ['fossi', 'fossi', 'fosse', 'fossimo', 'foste', 'fossero'] },
  { infinito: 'fare', forme: ['facessi', 'facessi', 'facesse', 'facessimo', 'faceste', 'facessero'] },
  { infinito: 'dire', forme: ['dicessi', 'dicessi', 'dicesse', 'dicessimo', 'diceste', 'dicessero'] },
  { infinito: 'bere', forme: ['bevessi', 'bevessi', 'bevesse', 'bevessimo', 'beveste', 'bevessero'] },
  { infinito: 'dare', forme: ['dessi', 'dessi', 'desse', 'dessimo', 'deste', 'dessero'] },
  { infinito: 'stare', forme: ['stessi', 'stessi', 'stesse', 'stessimo', 'steste', 'stessero'] },
]

// tre persone (tu/noi/voi), non sei: le forme di cortesia sono congiuntivo travestito, fuori di qui.
// il negativo alla 2ª persona vuole l'infinito: «Non correre!», mai «non corri!»
const IMPERATIVO_END = {
  are: ['a', 'iamo', 'ate'],
  ere: ['i', 'iamo', 'ete'],
  ire: ['i', 'iamo', 'ite'],
  ireIsc: ['isci', 'iamo', 'ite'],
}
const IMPERATIVO_IRR = [
  { infinito: 'essere', forme: ['sii', 'siamo', 'siate'] },
  { infinito: 'avere', forme: ['abbi', 'abbiamo', 'abbiate'] },
  { infinito: 'sapere', forme: ['sappi', 'sappiamo', 'sappiate'] },
  { infinito: 'venire', forme: ['vieni', 'veniamo', 'venite'] },
  { infinito: 'tenere', forme: ['tieni', 'teniamo', 'tenete'] },
  { infinito: 'uscire', forme: ['esci', 'usciamo', 'uscite'] },
  { infinito: 'andare', forme: ["va'", 'andiamo', 'andate'] },
  { infinito: 'fare', forme: ["fa'", 'facciamo', 'fate'] },
  { infinito: 'dare', forme: ["da'", 'diamo', 'date'] },
  { infinito: 'stare', forme: ["sta'", 'stiamo', 'state'] },
  { infinito: 'dire', forme: ["di'", 'diciamo', 'dite'] },
]
// questi cinque hanno la 2ª persona buona in due modi («va'»/«vai»): a loro si chiede solo noi/voi, mai il negativo
const IMPERATIVO_DUE_FORME = ['andare', 'fare', 'dare', 'stare', 'dire']
const PRONOMI_IMP = ['tu', 'noi', 'voi']
const POSTO_IMP = [1, 3, 4] // dov'è la stessa persona nella tabella dei sei
// chi si comanda fissa la persona: senza, «___ (parlare) piano!» si risponde giusto in tre modi
const VOCATIVO = {
  tu: ['Marta', 'Luca', 'Nina', 'Bruno'],
  noi: ['Dai', 'Su', 'Forza'],
  voi: ['Bambini', 'Ragazzi', 'Bambine'],
}

function imperativoDi(infinito) {
  const irr = tabellaDi(IMPERATIVO_IRR, infinito)
  if (irr) return irr
  const fin = infinito.slice(-3)
  return IMPERATIVO_END[ISC.has(infinito) ? 'ireIsc' : fin].map(f => radiceDi(infinito) + f)
}

// tempi composti: due parole, il tempo lo dà la prima (ho/avevo/avrò/ebbi/avrei mangiato); il participio non si muove.
// i falsi cambiano SOLO l'ausiliare; solo verbi con «avere» (con «essere» porterebbero l'accordo, altra lezione)
const COME_AUSILIARE = {
  trapassato: "all'imperfetto",
  'futuro-anteriore': 'al futuro',
  'trapassato-remoto': 'al passato remoto',
  'condizionale-passato': 'al condizionale',
}
const COMPOSTO_FALSI = { // gli altri due composti che confondono, in ordine: il primo è quello che si sbaglia davvero
  trapassato: ['prossimo', 'futuro-anteriore'],
  'futuro-anteriore': ['prossimo', 'trapassato'],
  'trapassato-remoto': ['trapassato', 'prossimo'],
  'condizionale-passato': ['futuro-anteriore', 'trapassato'],
}
const VERBI_COMPOSTI = PARTICIPI.filter(p => p.ausiliare === 'avere')

// «sicuri» a imperfetto/futuro: niente -ciare/-giare/-care/-gare, che al futuro cambiano ortografia (giocherò con la h)
const ARE_SICURI = ['parlare', 'cantare', 'saltare', 'guardare', 'ascoltare', 'lavare', 'portare',
  'aiutare', 'chiamare', 'comprare', 'lavorare', 'nuotare', 'suonare', 'guidare', 'cucinare',
  'disegnare', 'aspettare']
const ERE_SICURI = ['credere', 'leggere', 'scrivere', 'prendere', 'chiudere', 'mettere', 'perdere',
  'ripetere', 'temere', 'vendere', 'correre']
const IRE_SICURI = ['dormire', 'partire', 'sentire', 'seguire', 'servire', 'coprire', 'vestire',
  'capire', 'finire', 'preferire', 'pulire', 'spedire', 'unire', 'colpire', 'guarire', 'punire',
  'gestire']

// un verbo, un tempo, sei forme: tabella se c'è, regola se no. Torna null se non è sicuro: chi chiama filtra
const ISC = new Set(REGOLARI.ireIsc.verbi)
const tabellaDi = (lista, infinito) => (lista.find(v => v.infinito === infinito) || {}).forme || null
const radiceDi = infinito => infinito.slice(0, infinito.length - 3)

function formeDi(infinito, tempo) {
  const fin = infinito.slice(-3)
  const radice = radiceDi(infinito)
  const famiglia = ISC.has(infinito) ? 'ireIsc' : fin
  switch (tempo) {
    case 'presente':
      return tabellaDi(IRREGOLARI, infinito) || formeRegolari(infinito, famiglia)
    case 'imperfetto':
      return tabellaDi(IMPERFETTO_IRR, infinito) || IMPERFETTO_END[fin].map(f => radice + f)
    case 'futuro':
      return tabellaDi(FUTURO_IRR, infinito) || FUTURO_END.map(f => futuroStem(infinito, fin) + f)
    case 'remoto':
      return tabellaDi(REMOTO_IRR, infinito) ||
        (REMOTO_END[fin] ? REMOTO_END[fin].map(f => radice + f) : null)
    case 'condizionale': {
      const fut = tabellaDi(FUTURO_IRR, infinito)
      const tema = fut ? temaDalFuturo(fut) : futuroStem(infinito, fin)
      return CONDIZIONALE_END.map(f => tema + f)
    }
    case 'congiuntivo':
      return tabellaDi(CONG_PRES_IRR, infinito) || CONG_PRES_END[famiglia].map(f => radice + f)
    case 'congiuntivo-imperfetto':
      return tabellaDi(CONG_IMPF_IRR, infinito) || CONG_IMPF_END[fin].map(f => radice + f)
    default:
      return null
  }
}

// «dovere» resta fuori di proposito: il futuro ce l'ha in tabella ma il presente («devo») no, la regola direbbe «dovo»
const IRR_COMPLETI = ['essere', 'avere', 'andare', 'fare', 'dire', 'venire', 'stare',
  'potere', 'volere', 'sapere', 'vedere', 'uscire']
const VERBI_TEMPI = [...ARE_SICURI, ...ERE_SICURI, ...IRE_SICURI, ...IRR_COMPLETI]

// «avere» in ognuno dei suoi tempi (la prima parola di ogni composto), sempre dalle tabelle vere: è irregolare quasi ovunque
const AVERE_PRESENTE = formeDi('avere', 'presente')
const AVERE_IMPERFETTO = formeDi('avere', 'imperfetto')
const AUSILIARE = {
  prossimo: AVERE_PRESENTE,
  trapassato: AVERE_IMPERFETTO,
  'futuro-anteriore': formeDi('avere', 'futuro'),
  'trapassato-remoto': formeDi('avere', 'remoto'),
  'condizionale-passato': formeDi('avere', 'condizionale'),
}

const VERBI_IMPERATIVO = VERBI_TEMPI.filter(v => v !== 'potere' && v !== 'volere') // un imperativo non ce l'hanno
// al passato remoto i regolari sono -are e -ire: i -ere hanno due forme buone e stanno solo negli irregolari
const REMOTO_REGOLARI = [...REGOLARI.are.verbi, ...REGOLARI.ire.verbi, ...REGOLARI.ireIsc.verbi]

// il remoto come lo scriverebbe chi applica la regola a un verbo che non la segue; null se la radice è troppo corta
function remotoRegolarizzato(infinito, idx) {
  const fin = infinito.slice(-3)
  const radice = radiceDi(infinito)
  if (radice.length < 3) return null
  const fine = fin === 'ere' ? REMOTO_ERE_FINTE[idx] : (REMOTO_END[fin] || [])[idx]
  return fine ? radice + fine : null
}

// i falsi in ordine di preferenza: [forma, perché], si scarta da sé il nullo, l'uguale alla giusta, il già preso
function raccogli(formaGiusta, candidati) {
  const presi = []
  for (const c of candidati) {
    if (!c || !c[0] || c[0] === formaGiusta) continue
    if (presi.some(p => p[0] === c[0])) continue
    presi.push(c)
    if (presi.length === 2) break
  }
  return presi.map(([forma, perche]) => testo(forma, perche))
}

// come si chiama un tempo in una consegna, contro l'etichetta come risposta (senza articolo)
const NOME_TEMPO = {
  presente: 'il presente',
  imperfetto: "l'imperfetto",
  futuro: 'il futuro',
  prossimo: 'il passato prossimo',
  trapassato: 'il trapassato prossimo',
  remoto: 'il passato remoto',
  'futuro-anteriore': 'il futuro anteriore',
  'trapassato-remoto': 'il trapassato remoto',
  condizionale: 'il condizionale',
  'condizionale-passato': 'il condizionale passato',
  congiuntivo: 'il congiuntivo',
  'congiuntivo-imperfetto': 'il congiuntivo imperfetto',
  imperativo: "l'imperativo",
}
const ETICHETTA = {
  presente: 'presente',
  imperfetto: 'imperfetto',
  futuro: 'futuro',
  prossimo: 'passato prossimo',
  trapassato: 'trapassato prossimo',
  remoto: 'passato remoto',
}
const SPIEGA = { // a cosa serve quel tempo, detto a un bambino: l'aiuto quando sbaglia, dice perché era quello
  presente: 'quello che si fa adesso',
  imperfetto: 'quello che si faceva una volta, e durava',
  futuro: 'quello che si farà',
  prossimo: 'quello che si è fatto da poco',
  trapassato: "quello che si era già fatto prima d'allora",
  remoto: 'quello che si fece tanto tempo fa',
  'futuro-anteriore': 'quello che si sarà già fatto a un certo punto',
  'trapassato-remoto': 'quello che si ebbe già fatto, in un racconto',
  'condizionale-passato': 'quello che si sarebbe fatto e non si è fatto',
}

// il *quando* deve lasciare in piedi UN tempo solo: «Ieri»/«Ogni giorno» sono fuori (valgono per due tempi)
const QUANDO = {
  presente: ['Adesso', 'In questo momento', 'Proprio ora'],
  imperfetto: ['Una volta', 'In quegli anni', 'Tanti anni fa', "Quell'estate"],
  futuro: ['Domani', "L'anno prossimo", 'Fra poco', 'Il prossimo mese'],
}

const SCALETTA = [
  'il presente dei verbi regolari (-are, -ere, -ire)',
  'il presente dei verbi irregolari di ogni giorno',
  'il passato prossimo: ausiliare e participio',
  'imperfetto e futuro',
  'riconoscere il tempo e scegliere quello che la frase chiede',
  'i participi duri, il passato remoto e i modi che si fanno dopo',
]

// prefisso coniug: e non verbo:, già preso dai verbi inglesi in store/progressi.js (gonfierebbe la loro padronanza)
const TIPI = [
  { chiave: 'coniug:presente-regolare', nome: 'Il presente dei verbi regolari', sa: 'presente', gradi: { 1: 0.75 } },
  { chiave: 'coniug:presente-isc', livello: 56, nome: 'I verbi in -isc (finire, capire)', sa: 'presente', gradi: { 1: 0.25 } },
  { chiave: 'coniug:presente-irregolare', nome: 'Il presente dei verbi irregolari', sa: 'presente', gradi: { 2: 1 } },
  { chiave: 'coniug:ausiliare', nome: 'Essere o avere nel passato prossimo', sa: 'tempi-verbali', gradi: { 3: 0.5, 5: 0.2, 6: 0.1 } },
  { chiave: 'coniug:participio', nome: 'Il participio passato regolare', sa: 'tempi-verbali', gradi: { 3: 0.25 } },
  { chiave: 'coniug:participio-irregolare', nome: 'I participi irregolari (preso, scritto)', sa: 'tempi-verbali', gradi: { 3: 0.25, 6: 0.25 } },
  { chiave: 'coniug:imperfetto', nome: "L'imperfetto", sa: 'tempi-verbali', gradi: { 4: 0.5 } },
  { chiave: 'coniug:futuro', nome: 'Il futuro', sa: 'tempi-verbali', gradi: { 4: 0.5 } },
  // le due che oppongono i tempi (non le persone) stanno in alto: un gradino sopra scegliere fra le persone
  { chiave: 'coniug:tempo-giusto', nome: 'Scegliere il tempo che la frase chiede', sa: 'tempi-verbali', gradi: { 5: 0.5, 6: 0.1 } },
  { chiave: 'coniug:riconosci-tempo', nome: 'Riconoscere il tempo di un verbo', sa: 'tempi-verbali', gradi: { 5: 0.3, 6: 0.05 } },
  // i tempi che a scuola arrivano dopo: spenti finché un genitore non dice sì (difetto: false in data/saperi.js)
  { chiave: 'coniug:passato-remoto', nome: 'Il passato remoto (andò, cossi, mangiammo)', sa: 'passato-remoto', gradi: { 6: 0.2 } },
  { chiave: 'coniug:composti', nome: 'Trapassato prossimo e futuro anteriore (avevo/avrò mangiato)', sa: 'tempi-composti', gradi: { 6: 0.12 } },
  // l'unico tipo che chiede due saperi: è un composto ma la prima parola è al passato remoto («ebbi mangiato»)
  { chiave: 'coniug:trapassato-remoto', nome: 'Il trapassato remoto (ebbi mangiato)', sa: ['tempi-composti', 'passato-remoto'], gradi: { 6: 0.06 } },
  { chiave: 'coniug:condizionale', nome: 'Il condizionale (vorrei, avrei voluto)', sa: 'condizionale', gradi: { 6: 0.12 } },
  { chiave: 'coniug:congiuntivo', nome: 'Il congiuntivo (che io sia, se io fossi)', sa: 'congiuntivo', gradi: { 6: 0.12 } },
  // l'unico dei tardivi che si affaccia già al grado 5: non ha bisogno di nessun altro tempo per stare in piedi
  { chiave: 'coniug:imperativo', nome: "L'imperativo (parla!, andiamo!, non correre!)", sa: 'imperativo', gradi: { 5: 0.15, 6: 0.1 } },
]

// due forme diverse dalla giusta, prese da `lista` (le altre persone della stessa tabella)
function altreDue(lista, giusta, sorte, scarta) {
  const buone = lista.filter(f => f !== giusta && f !== scarta)
  const scelte = sorte.alcuni(buone, 2)
  while (scelte.length < 2) scelte.push(sorte.uno(buone.length ? buone : lista))
  return scelte
}

// avverbio/nomeTempo fissano il TEMPO nella consegna: senza, «lui ___ (vendere)» si risponde giusto anche al presente
function domandaPersona({ sorte, pronome, infinito, formaGiusta, falsi, chiave, aiuto,
  avverbio, nomeTempo, soloDiretta }) {
  const buco = !soloDiretta && sorte.forse(0.55)
  return domanda({
    testo: buco
      ? (avverbio ? `${cap(avverbio)} ${pronome} ___ (${infinito}).` : `${cap(pronome)} ___ (${infinito}).`)
      : (nomeTempo ? `Qual è ${nomeTempo} di «${infinito}» con «${pronome}»?` : `Qual è la forma di «${infinito}» con «${pronome}»?`),
    buona: testo(formaGiusta),
    // un falso può arrivare già confezionato (testo(forma, perché)) quando serve dire che tempo era, non l'aiuto generale
    falsi: falsi.map(f => (typeof f === 'string' ? testo(f, aiuto) : f)),
    chiave,
    aiuto,
    sorte,
  })
}

class Coniugazione extends Modulo {
  constructor() {
    super({
      id: 'coniugazione',
      nome: 'Coniugazione',
      icona: '🗣️',
      materia: 'italiano',
      chiaro: 'coniugare i verbi italiani: presente, passato, imperfetto e futuro',
      scaletta: SCALETTA,
      livelli: [38, 44, 56, 63, 75, 95], // scala 0-100 comune a tutte le materie, vedi docs/apprendimento/quiz-livelli.md
      tipi: TIPI,
    })
  }

  // l'ausiliare si chiede in due modi (grado 3 col buco, grado 5 la frase intera): stessa chiave, cambia il costo
  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'coniug:presente-isc': return this.presenteRegolare(sorte, true)
      case 'coniug:presente-irregolare': return this.presenteIrregolare(sorte)
      case 'coniug:ausiliare': return grado >= 5 ? this.fraseIntera(sorte) : this.ausiliareFrase(sorte)
      case 'coniug:participio': return this.participioDiretto(sorte, false)
      case 'coniug:participio-irregolare': return this.participioDiretto(sorte, true)
      case 'coniug:imperfetto': return this.imperfetto(sorte)
      case 'coniug:futuro': return this.futuro(sorte)
      case 'coniug:tempo-giusto': return this.tempoGiusto(sorte)
      case 'coniug:riconosci-tempo': return this.riconosciTempo(sorte)
      case 'coniug:passato-remoto': return this.passatoRemoto(sorte)
      case 'coniug:composti': return this.composto(sorte,
        sorte.forse(0.55) ? 'trapassato' : 'futuro-anteriore', 'coniug:composti')
      case 'coniug:trapassato-remoto': return this.composto(sorte, 'trapassato-remoto', tipo)
      case 'coniug:condizionale': return this.condizionale(sorte)
      case 'coniug:congiuntivo': return this.congiuntivo(sorte)
      case 'coniug:imperativo': return this.imperativo(sorte)
      default: return this.presenteRegolare(sorte, false)
    }
  }

  presenteRegolare(sorte, soloIsc) {
    const tipo = soloIsc ? 'ireIsc' : sorte.uno(['are', 'ere', 'ire'])
    const dati = REGOLARI[tipo]
    const infinito = sorte.uno(dati.verbi)
    const idx = sorte.fra(0, 5)
    const forme = formeRegolari(infinito, tipo)
    const formaGiusta = forme[idx]

    let falsi
    if (tipo === 'ireIsc' && [0, 1, 2, 5].includes(idx) && sorte.forse(0.5)) {
      // l'errore che si sente di più: dimenticare -isc-
      const radice = infinito.slice(0, infinito.length - 3)
      const senzaIsc = radice + DESINENZE.ire[idx]
      falsi = [senzaIsc, ...altreDue(forme, formaGiusta, sorte, senzaIsc)].slice(0, 2)
    } else {
      falsi = altreDue(forme, formaGiusta, sorte)
    }

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi,
      chiave: tipo === 'ireIsc' ? 'coniug:presente-isc' : 'coniug:presente-regolare',
      aiuto: dati.dritta,
    })
  }

  presenteIrregolare(sorte) {
    const v = sorte.uno(IRREGOLARI)
    const idx = sorte.fra(0, 5)
    const formaGiusta = v.forme[idx]
    const reg = regolarizza(v.infinito, idx)

    const candidati = []
    if (reg !== formaGiusta) candidati.push(reg)
    for (const f of altreDue(v.forme, formaGiusta, sorte, reg)) {
      if (candidati.length < 2 && !candidati.includes(f)) candidati.push(f)
    }
    let falsi = candidati.slice(0, 2)

    // l'errore che si sente per davvero su «venire»
    if (v.infinito === 'venire' && idx === 1 && sorte.forse(0.5) && !falsi.includes('venghi')) {
      falsi = ['venghi', falsi[0]]
    }

    const aiuto = `«${v.infinito}» è irregolare al presente: ` +
      PRONOMI.map((p, i) => `${p} ${v.forme[i]}`).join(', ')
    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito: v.infinito, formaGiusta, falsi,
      chiave: 'coniug:presente-irregolare', aiuto,
    })
  }

  // regolari e irregolari sono due tipologie diverse: «mangiato» si ricava dalla regola, «preso» si sa o non si sa
  participioDiretto(sorte, irregolari) {
    const pool = PARTICIPI.filter(v => !!v.irregolare === !!irregolari)
    const v = sorte.uno(pool)
    const aiuto = `il passato di «${v.infinito}» è «${v.participio}»`
    return domanda({
      testo: `Qual è il passato di «${v.infinito}»?`,
      soggetto: v.emoji ? { emoji: v.emoji } : undefined,
      buona: testo(v.participio),
      falsi: v.errori.map(e => testo(e, aiuto)),
      chiave: v.irregolare ? 'coniug:participio-irregolare' : 'coniug:participio',
      aiuto,
      sorte,
    })
  }

  ausiliareFrase(sorte) {
    const v = sorte.uno(CON_COMPLEMENTO)
    const sog = sorte.uno(SOGGETTI)
    const partForma = accorda(v.participio, v, sog)
    const giusto = v.ausiliare === 'essere' ? 'è' : 'ha'
    const sbagliato = v.ausiliare === 'essere' ? 'ha' : 'è'
    const erroreParticipio = accorda(sorte.uno(v.errori), v, sog)

    const aiuto = `«${v.infinito}» vuole «${v.ausiliare}»: ${v.ausiliare === 'essere' ? 'sono, sei, è…' : 'ho, hai, ha…'}`
    return domanda({
      testo: `Ieri ${sog.nome} ___ (${v.infinito}) ${complementoDi(v, sog)}.`,
      soggetto: v.emoji ? { emoji: v.emoji } : undefined,
      buona: testo(`${giusto} ${partForma}`),
      falsi: [
        testo(`${sbagliato} ${partForma}`, `«${v.infinito}» vuole «${v.ausiliare}», non «${v.ausiliare === 'essere' ? 'avere' : 'essere'}»`),
        testo(`${giusto} ${erroreParticipio}`, aiuto),
      ],
      chiave: 'coniug:ausiliare',
      aiuto,
      sorte,
    })
  }

  fraseIntera(sorte) {
    const v = sorte.uno(CON_COMPLEMENTO)
    const sog = sorte.uno(SOGGETTI)
    const partForma = accorda(v.participio, v, sog)
    const giusto = v.ausiliare === 'essere' ? 'è' : 'ha'
    const sbagliato = v.ausiliare === 'essere' ? 'ha' : 'è'
    const erroreParticipio = accorda(sorte.uno(v.errori), v, sog)

    const compl = complementoDi(v, sog)
    const corretta = `Ieri ${sog.nome} ${giusto} ${partForma} ${compl}.`
    const ausiliareStorto = `Ieri ${sog.nome} ${sbagliato} ${partForma} ${compl}.`
    const participioStorto = `Ieri ${sog.nome} ${giusto} ${erroreParticipio} ${compl}.`

    return domanda({
      testo: 'Quale frase è scritta giusta?',
      buona: testo(corretta),
      falsi: [
        testo(ausiliareStorto, `«${v.infinito}» vuole «${v.ausiliare}», non «${v.ausiliare === 'essere' ? 'avere' : 'essere'}»`),
        testo(participioStorto, `il passato di «${v.infinito}» è «${v.participio}»`),
      ],
      chiave: 'coniug:ausiliare',
      aiuto: `«${v.infinito}» vuole «${v.ausiliare}» e il passato è «${v.participio}»`,
      sorte,
    })
  }

  imperfetto(sorte) {
    let infinito, forme, aiuto
    if (sorte.forse(0.35)) {
      const v = sorte.uno(IMPERFETTO_IRR)
      infinito = v.infinito
      forme = v.forme
      aiuto = `«${infinito}» è irregolare all'imperfetto: ` + PRONOMI.map((p, i) => `${p} ${forme[i]}`).join(', ')
    } else {
      const tipo = sorte.uno(['are', 'ere', 'ire'])
      const lista = tipo === 'are' ? ARE_SICURI : tipo === 'ere' ? ERE_SICURI : IRE_SICURI
      infinito = sorte.uno(lista)
      const radice = infinito.slice(0, infinito.length - 3)
      forme = IMPERFETTO_END[tipo].map(fin => radice + fin)
      aiuto = `l'imperfetto dei verbi in -${tipo} fa: ${IMPERFETTO_END[tipo].join(', ')}`
    }
    const idx = sorte.fra(0, 5)
    const formaGiusta = forme[idx]

    let falsi = null
    if (formaGiusta.includes('ev') && sorte.forse(0.55)) {
      const scambiato = formaGiusta.replace('ev', 'iv')
      if (scambiato !== formaGiusta) falsi = [scambiato, ...altreDue(forme, formaGiusta, sorte, scambiato)].slice(0, 2)
    }
    if (!falsi) falsi = altreDue(forme, formaGiusta, sorte)

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi, chiave: 'coniug:imperfetto', aiuto,
      avverbio: sorte.uno(QUANDO.imperfetto), nomeTempo: "l'imperfetto",
    })
  }

  futuro(sorte) {
    let infinito, forme, aiuto
    if (sorte.forse(0.35)) {
      const v = sorte.uno(FUTURO_IRR)
      infinito = v.infinito
      forme = v.forme
      aiuto = `«${infinito}» è irregolare al futuro: ` + PRONOMI.map((p, i) => `${p} ${forme[i]}`).join(', ')
    } else {
      const tipo = sorte.uno(['are', 'ere', 'ire'])
      const lista = tipo === 'are' ? ARE_SICURI : tipo === 'ere' ? ERE_SICURI : IRE_SICURI
      infinito = sorte.uno(lista)
      const stem = futuroStem(infinito, tipo)
      forme = FUTURO_END.map(fin => stem + fin)
      aiuto = `il futuro dei verbi in -${tipo} fa: ${FUTURO_END.join(', ')} sul tema «${stem}-»`
    }
    const idx = sorte.fra(0, 5)
    const formaGiusta = forme[idx]

    let falsi = null
    if (infinito.endsWith('are')) {
      // l'errore più sentito: tenere la vocale dell'infinito («parlarò» invece di «parlerò»)
      const radice = infinito.slice(0, infinito.length - 3)
      const erroreVocale = radice + 'ar' + FUTURO_END[idx]
      if (erroreVocale !== formaGiusta) falsi = [erroreVocale, ...altreDue(forme, formaGiusta, sorte, erroreVocale)].slice(0, 2)
    }
    if (!falsi) falsi = altreDue(forme, formaGiusta, sorte)

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi, chiave: 'coniug:futuro', aiuto,
      avverbio: sorte.uno(QUANDO.futuro), nomeTempo: 'il futuro',
    })
  }

  // verbo e persona restano fermi, cambia solo il tempo: i gradi 1-4 non lo fanno mai (lì i falsi sono le persone)
  tempoGiusto(sorte) {
    const TERNA = ['presente', 'imperfetto', 'futuro']
    const infinito = sorte.uno(VERBI_TEMPI)
    const idx = sorte.fra(0, 5)
    const pron = PRONOMI[idx]
    const forma = {}
    for (const t of TERNA) forma[t] = formeDi(infinito, t)[idx]

    const quale = sorte.uno(TERNA)
    const formaGiusta = forma[quale]
    const aiuto = `con «${pron}»: adesso ${forma.presente}, una volta ${forma.imperfetto}, domani ${forma.futuro}`

    const falsi = raccogli(formaGiusta, [
      ...TERNA.filter(t => t !== quale)
        .map(t => [forma[t], `«${forma[t]}» è ${NOME_TEMPO[t]}: ${SPIEGA[t]}`]),
      // tappo: se due tempi dessero mai la stessa forma, resterebbe una domanda con due risposte sole
      ...altreDue(formeDi(infinito, quale), formaGiusta, sorte).map(f => [f, aiuto]),
    ])

    return domandaPersona({
      sorte, pronome: pron, infinito, formaGiusta, falsi,
      chiave: 'coniug:tempo-giusto', aiuto,
      avverbio: sorte.uno(QUANDO[quale]), nomeTempo: NOME_TEMPO[quale],
    })
  }

  // la strada inversa: forma già coniugata, il nome è la risposta; il prossimo entra solo con «avere» (niente accordo)
  riconosciTempo(sorte) {
    const scelte = ['presente', 'imperfetto', 'futuro', 'prossimo']
    const quale = sorte.uno(scelte)
    const idx = sorte.fra(0, 5)
    let forma
    if (quale === 'prossimo') {
      const v = sorte.uno(PARTICIPI.filter(p => p.ausiliare === 'avere'))
      forma = `${AVERE_PRESENTE[idx]} ${v.participio}`
    } else {
      forma = formeDi(sorte.uno(VERBI_TEMPI), quale)[idx]
    }
    const dettoBene = `${PRONOMI[idx]} ${forma}`
    const aiuto = `«${dettoBene}» è ${NOME_TEMPO[quale]}: ${SPIEGA[quale]}`

    return domanda({
      testo: `Che tempo è «${dettoBene}»?`,
      buona: testo(ETICHETTA[quale]),
      falsi: sorte.alcuni(scelte.filter(t => t !== quale), 2).map(t => testo(ETICHETTA[t], aiuto)),
      chiave: 'coniug:riconosci-tempo',
      aiuto,
      sorte,
    })
  }

  // sempre in forma diretta: «Molti anni fa noi ___» accetterebbe onestamente anche l'imperfetto
  passatoRemoto(sorte) {
    const irregolare = sorte.forse(0.7)
    const infinito = irregolare ? sorte.uno(REMOTO_IRR).infinito : sorte.uno(REMOTO_REGOLARI)
    const forme = formeDi(infinito, 'remoto')
    // le persone forti insegnano qualcosa, ma le altre si chiedono lo stesso: «noi cocemmo» resta regolare
    const idx = irregolare && sorte.forse(0.6) ? sorte.uno(REMOTO_FORTI) : sorte.fra(0, 5)
    const formaGiusta = forme[idx]

    const aiuto = `il passato remoto di «${infinito}» fa: ` +
      PRONOMI.map((p, i) => `${p} ${forme[i]}`).join(', ')
    const regolare = remotoRegolarizzato(infinito, idx)
    const imperfetto = formeDi(infinito, 'imperfetto')[idx]
    const falsi = raccogli(formaGiusta, [
      forme.includes(regolare) ? null
        : [regolare, `«${infinito}» al passato remoto non segue la regola: fa «${formaGiusta}»`],
      [imperfetto, `«${imperfetto}» è l'imperfetto: quello che si faceva, non quello che si fece`],
      ...altreDue(forme, formaGiusta, sorte).map(f => [f, aiuto]),
    ])

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi,
      chiave: 'coniug:passato-remoto', aiuto,
      nomeTempo: 'il passato remoto', soloDiretta: true,
    })
  }

  // quattro composti, stessa domanda: il participio sta fermo, cambia solo l'ausiliare (un metodo solo, tempo da fuori)
  composto(sorte, quale, chiave) {
    const v = sorte.uno(VERBI_COMPOSTI)
    const idx = sorte.fra(0, 5)
    const altra = sorte.uno([0, 1, 2, 3, 4, 5].filter(i => i !== idx))
    const con = (tempo, persona = idx) => `${AUSILIARE[tempo][persona]} ${v.participio}`
    const formaGiusta = con(quale)

    const aiuto = `${cap(NOME_TEMPO[quale])} si fa con «avere» ${COME_AUSILIARE[quale]}: ` +
      `${PRONOMI[idx]} ${formaGiusta}`
    const falsi = raccogli(formaGiusta, [
      ...COMPOSTO_FALSI[quale].map(t => [con(t), `«${con(t)}» è ${NOME_TEMPO[t]}: ${SPIEGA[t]}`]),
      [con(quale, altra), `con «${PRONOMI[idx]}» ci vuole «${AUSILIARE[quale][idx]}»`],
    ])

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito: v.infinito, formaGiusta, falsi,
      chiave, aiuto, nomeTempo: NOME_TEMPO[quale], soloDiretta: true,
    })
  }

  // un ordine vero e un vocativo (non è colore: fissa la persona, senza la frase avrebbe tre risposte buone)
  imperativo(sorte) {
    const infinito = sorte.uno(VERBI_IMPERATIVO)
    const forme = imperativoDi(infinito)
    const dueForme = IMPERATIVO_DUE_FORME.includes(infinito)
    // il negativo vive solo alla 2ª persona, l'unica dove cambia forma: «non correre!», non «non corri!»
    const negativo = !dueForme && sorte.forse(0.3)
    const i = negativo ? 0 : (dueForme ? sorte.uno([1, 2]) : sorte.fra(0, 2))
    const chi = PRONOMI_IMP[i]
    const formaGiusta = negativo ? infinito : forme[i]
    const indicativo = formeDi(infinito, 'presente')[POSTO_IMP[i]]

    const aiuto = negativo
      ? `dopo «non» ci vuole l'infinito: non ${infinito}!`
      : `l'imperativo di «${infinito}» fa: ${PRONOMI_IMP.map((p, n) => `${p} ${forme[n]}`).join(', ')}`
    const falsi = raccogli(formaGiusta, negativo
      ? [
        [forme[0], `«${forme[0]}!» è l'ordine senza «non»: con «non» ci vuole «${infinito}»`],
        [indicativo, `«${indicativo}» racconta quello che fa, non comanda`],
        // per -ere/-ire i due sopra sono la stessa parola: senza un terzo resterebbero due risposte in tutto
        [formeDi(infinito, 'presente')[2], 'questo racconta quello che fa qualcun altro'],
      ]
      : [
        // per -are questo è IL falso («parli»); negli altri due gruppi coincide con la giusta e si scarta da sé
        [indicativo, `«${indicativo}» racconta quello che fa; per comandare ci vuole «${formaGiusta}»`],
        ...PRONOMI_IMP.map((p, n) => [forme[n], `«${forme[n]}!» è l'ordine per «${p}»`]),
      ])

    return domanda({
      testo: negativo
        ? `${sorte.uno(VOCATIVO.tu)}, non ___ (${infinito})!`
        : `${sorte.uno(VOCATIVO[chi])}, ___ (${infinito})!`,
      buona: testo(formaGiusta),
      falsi,
      chiave: 'coniug:imperativo',
      aiuto,
      sorte,
    })
  }

  // stesso tema del futuro (parlerò → parlerei): il falso giusto è il futuro. Il passato passa dai composti, stessa chiave
  condizionale(sorte) {
    if (sorte.forse(0.35)) return this.composto(sorte, 'condizionale-passato', 'coniug:condizionale')
    const infinito = sorte.uno(VERBI_TEMPI)
    const idx = sorte.fra(0, 5)
    const forme = formeDi(infinito, 'condizionale')
    const formaGiusta = forme[idx]
    const futuro = formeDi(infinito, 'futuro')[idx]

    const aiuto = `il condizionale di «${infinito}» fa: ` +
      PRONOMI.map((p, i) => `${p} ${forme[i]}`).join(', ')
    const falsi = raccogli(formaGiusta, [
      [futuro, `«${futuro}» è il futuro: quello che si farà, non quello che si farebbe`],
      ...altreDue(forme, formaGiusta, sorte).map(f => [f, aiuto]),
    ])

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi,
      chiave: 'coniug:condizionale', aiuto,
      nomeTempo: 'il condizionale', soloDiretta: true,
    })
  }

  // «Penso che»/«Vorrei che» reggono solo il congiuntivo; le persone si scelgono dove la forma non si sovrappone
  congiuntivo(sorte) {
    const passato = sorte.forse(0.45)
    const tempo = passato ? 'congiuntivo-imperfetto' : 'congiuntivo'
    const infinito = sorte.uno(VERBI_TEMPI)
    const forme = formeDi(infinito, tempo)
    const idx = sorte.uno(passato ? [2, 3, 4, 5] : [4, 5])
    const formaGiusta = forme[idx]
    const indicativo = formeDi(infinito, passato ? 'imperfetto' : 'presente')[idx]
    const regge = passato ? 'vorrei che' : 'penso che'

    const aiuto = `dopo «${regge}» ci vuole il congiuntivo: ` +
      PRONOMI.map((p, i) => `che ${p} ${forme[i]}`).slice(passato ? 2 : 4).join(', ')
    const falsi = raccogli(formaGiusta, [
      [indicativo, `«${indicativo}» è l'indicativo: dopo «${regge}» ci vuole «${formaGiusta}»`],
      ...altreDue([...new Set(forme)], formaGiusta, sorte).map(f => [f, aiuto]),
    ])

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi,
      chiave: 'coniug:congiuntivo', aiuto,
      avverbio: passato ? 'Vorrei che' : 'Penso che',
      nomeTempo: passato ? 'il congiuntivo imperfetto' : 'il congiuntivo',
    })
  }
}

export default new Coniugazione()
