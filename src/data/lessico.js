/* ═══════════════════════════════════════════════════════════════════
   IL LESSICO UNIFICATO — parole, verbi e frasi di ogni lingua visti
   tutti allo stesso modo, così il gioco ne maneggia uno solo.

   Le chiavi inglesi restano quelle di sempre (`en:dog`, `verbo:run`,
   `frase:e-cat-1`) perché sono già nel profilo dei bambini: cambiarle
   vorrebbe dire buttare via mesi di ripassi. Lo spagnolo, che è
   arrivato dopo, ha le sue (`es:perro`, `verbo-es:correr`,
   `frase-es:e-gato-1`): due lingue non si mescolano mai nel motore di
   apprendimento, sapere «gatto» in inglese non vuol dire saperlo in
   spagnolo.

   Ogni voce ha sempre gli stessi campi, qualunque cosa sia:
     chiave   quella del motore di apprendimento
     lingua   'en' | 'es' — decide fra quali compagne pescare i falsi
     genere   'parola' | 'verbo' | 'frase'
     str      la parola nella lingua straniera
     it       l'italiano
     emoji    '' se non ce l'ha
     cat      categoria, per pescare distrattori affini
     famiglia '' di norma: la dichiara solo chi rischia di essere confusa
              a colpo d'occhio con un'altra emoji (vedi `words.js`).
              `domande.js` non ne pesca due della stessa in una domanda.
     frase    solo per le frasi: la voce intera del file delle frasi
   ═══════════════════════════════════════════════════════════════════ */
import { WORDS } from './words.js'
import { VERBI } from './verbi.js'
import { FRASI } from './frasi.js'
import { PAROLE_ES } from './parole-es.js'
import { VERBI_ES } from './verbi-es.js'
import { FRASI_ES } from './frasi-es.js'

/* I prefissi delle chiavi, uno solo posto dove sono scritti. Quelli
   inglesi non hanno la lingua dentro per ragioni storiche: c'era una
   lingua sola, e i profili salvati la chiamano così. */
export const PREFISSI = {
  en: { parola: 'en:',    verbo: 'verbo:',    frase: 'frase:' },
  es: { parola: 'es:',    verbo: 'verbo-es:', frase: 'frase-es:' },
}

export const chiaveParolaDi = lingua => s => PREFISSI[lingua].parola + s
export const chiaveVerboDi = lingua => s => PREFISSI[lingua].verbo + s
export const chiaveFraseDi = lingua => id => PREFISSI[lingua].frase + id

const voci = new Map()                    // chiave -> voce, di tutte le lingue
const perLingua = new Map()               // 'en' -> [voci]
const perCat = new Map()                  // 'en:parola:a' -> [voci]

function aggiungi(v) {
  voci.set(v.chiave, v)
  if (!perLingua.has(v.lingua)) perLingua.set(v.lingua, [])
  perLingua.get(v.lingua).push(v)
  const k = v.lingua + ':' + v.genere + ':' + v.cat
  if (!perCat.has(k)) perCat.set(k, [])
  perCat.get(k).push(v)
}

/* Registra una lingua intera. I verbi hanno una categoria loro: un
   verbo va confuso con un altro verbo, non con un animale. */
function registra(lingua, { parole, verbi, frasi }) {
  const pre = PREFISSI[lingua]
  for (const [str, it, emoji, cat, famiglia] of parole)
    aggiungi({ chiave: pre.parola + str, lingua, genere: 'parola', str, it, emoji, cat,
               famiglia: famiglia || '' })
  for (const [str, it, emoji] of verbi)
    aggiungi({ chiave: pre.verbo + str, lingua, genere: 'verbo', str, it, emoji, cat: 'v',
               famiglia: '' })
  for (const f of frasi)
    aggiungi({ chiave: pre.frase + f.id, lingua, genere: 'frase',
               str: f[lingua], it: f.it, emoji: '', cat: f.tema, famiglia: '', frase: f })
}

registra('en', { parole: WORDS, verbi: VERBI, frasi: FRASI })
registra('es', { parole: PAROLE_ES, verbi: VERBI_ES, frasi: FRASI_ES })

export const LESSICO = voci
export const voceDi = k => voci.get(k) || null
export const TUTTE = [...voci.values()]
export const tutteDi = lingua => perLingua.get(lingua) || []

/* Le compagne di una voce: quelle della stessa lingua, della stessa
   categoria e dello stesso genere, che sono i distrattori buoni — un
   animale si confonde con un animale, non con un giorno della
   settimana, e mai con una parola di un'altra lingua.

   Se la categoria è piccola si allarga a tutto il genere. Il margine è
   il doppio di quante ne servono, non il minimo indispensabile: con
   l'osso del collo uscirebbero sempre gli stessi tre distrattori, e un
   bambino impara in fretta a rispondere per esclusione invece che per
   averlo capito. */
export function compagne(v, quante) {
  const stesse = perCat.get(v.lingua + ':' + v.genere + ':' + v.cat) || []
  if (stesse.length >= quante * 2 + 1) return stesse
  return tutteDi(v.lingua).filter(x => x.genere === v.genere)
}

export const conEmoji = v => !!v.emoji
