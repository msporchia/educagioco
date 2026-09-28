// Il lessico unificato: parole, verbi e frasi di ogni lingua con gli
// stessi campi (chiave, lingua, genere, str, it, emoji, cat, famiglia,
// frase?) — vedi docs/lingue/vocaboli.md. Le chiavi non si rinominano:
// sono già nei profili dei bambini.
import { WORDS } from './words.js'
import { VERBI } from './verbi.js'
import { FRASI } from './frasi.js'
import { PAROLE_ES } from './parole-es.js'
import { VERBI_ES } from './verbi-es.js'
import { FRASI_ES } from './frasi-es.js'

// i prefissi inglesi non hanno la lingua dentro per ragioni storiche:
// c'era una lingua sola, e i profili salvati la chiamano già così
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

// i verbi hanno una categoria loro: un verbo va confuso con un altro
// verbo, non con un animale
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

// I distrattori buoni: stessa lingua, categoria e genere; se la
// categoria è piccola si allarga a tutto il genere. Il margine è il
// doppio del minimo, se no uscirebbero sempre gli stessi tre distrattori.
export function compagne(v, quante) {
  const stesse = perCat.get(v.lingua + ':' + v.genere + ':' + v.cat) || []
  if (stesse.length >= quante * 2 + 1) return stesse
  return tutteDi(v.lingua).filter(x => x.genere === v.genere)
}

export const conEmoji = v => !!v.emoji
