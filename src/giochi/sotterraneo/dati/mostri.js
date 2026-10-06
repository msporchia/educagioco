// Chi abita il sotterraneo. `ossa`/`att`/`dif`: il costo in domande non sta qui, è vita/attacco, e cambia
// con quello che hai trovato (docs/sotterraneo/regole.md, "il branco a fasce"). La difesa è la manopola
// velenosa: il tetto (~8 risposte contro l'eroe nudo, `guastiDeiMostri`) si vede solo contando, non a occhio.
// `unaPosa: true`: il foglio disegna solo il respiro, niente corsa separata (scena/tela.js non cerca `-corsa-`).
// Ogni mostro dichiara `droppa` (quanto spesso lascia qualcosa): un mostro comune non deve intasare lo zaino.
import { EROE } from './mondo.js'
import { ARMI_DI } from './cose.js'

export const MOSTRI = {
  goblin: {
    em: '👺', sprite: 'goblin', nome: 'Un goblin',
    ossa: 4, att: 2, dif: 0, gemme: 2,
    droppa: 0.22,
    lascia: ['pozione-piccola'],
  },
  scheletro: {
    em: '💀', sprite: 'scheletro', nome: 'Uno scheletro',
    ossa: 8, att: 3, dif: 1, gemme: 5,
    droppa: 0.45,
    lascia: [...ARMI_DI(1), 'panciotto', 'pozione-piccola'],   // le armi per gradino: una famiglia nuova entra da sé
  },
  orco: {
    em: '👹', sprite: 'orco', nome: 'Un orco',
    ossa: 12, att: 4, dif: 1, gemme: 8,
    droppa: 0.6,
    // saio + corazza (ferro): un mago che batte un orco deve ricavarne qualcosa da mettersi addosso, misurato dal banco
    lascia: [...ARMI_DI(2), 'corazza', 'saio', 'pozione'],
  },
  gigante: {
    em: '🗿', sprite: 'mostro-grosso', nome: 'Il gigante',
    ossa: 17, att: 5, dif: 1, gemme: 12, capo: true,
    droppa: 0.85,
    lascia: [...ARMI_DI(3), 'manto', 'amuleto-rosso'],
  },

  // undici creature dai due fogli nuovi, lette per fascia (BRANCO): dentro una fascia si equivalgono, cambia
  // solo la forma (poca vita e picchia forte, para e lascia scudi...) mai la quantità

  // la fascia dei piccoli, accanto al goblin
  ratto: {
    em: '🐀', sprite: 'ratto', nome: 'Un ratto', unaPosa: true,
    ossa: 3, att: 2, dif: 0, gemme: 2,
    droppa: 0.22,
    lascia: ['pozione-piccola'],
  },
  pipistrello: {
    em: '🦇', sprite: 'pipistrello', nome: 'Un pipistrello', unaPosa: true,
    ossa: 3, att: 1, dif: 0, gemme: 2,
    droppa: 0.22,   // l'unico che lascia la torcia: trovarla solo comprandola non insegnerebbe a guardarsi intorno
    lascia: ['torcia', 'pozione-piccola'],
  },
  melma: {
    em: '🟢', sprite: 'melma', nome: 'Una melma', unaPosa: true,
    ossa: 6, att: 1, dif: 0, gemme: 3,
    droppa: 0.22,
    lascia: ['pozione-piccola'],
  },

  // la fascia di mezzo, accanto allo scheletro
  fantasma: {
    em: '👻', sprite: 'fantasma', nome: 'Un fantasma', unaPosa: true,
    ossa: 5, att: 2, dif: 0, gemme: 4,
    droppa: 0.22,
    lascia: ['torcia', 'pozione-piccola'],
  },
  vespa: {
    em: '🐝', sprite: 'vespa', nome: 'Un vespone', unaPosa: true,
    ossa: 7, att: 3, dif: 0, gemme: 5,   // poca vita, puntura da orco: conviene toglierlo di mezzo subito
    droppa: 0.45,
    lascia: [...ARMI_DI(1), 'panciotto', 'pozione-piccola'],
  },
  fungo: {
    em: '🍄', sprite: 'fungo', nome: 'Un fungo che morde', unaPosa: true,
    ossa: 9, att: 2, dif: 0, gemme: 5,
    droppa: 0.45,
    lascia: ['panciotto', 'pozione', 'pozione-piccola'],
  },

  // la fascia tosta, accanto all'orco
  lupo: {
    em: '🐺', sprite: 'lupo', nome: 'Un lupo', unaPosa: true,
    ossa: 13, att: 4, dif: 0, gemme: 7,
    droppa: 0.6,
    lascia: [...ARMI_DI(2), 'corazza', 'saio', 'pozione'],
  },
  granchio: {
    em: '🦀', sprite: 'granchio', nome: 'Un granchio', unaPosa: true,
    ossa: 12, att: 3, dif: 1, gemme: 7,   // para come un orco e lascia scudi: unico posto dove la mano debole si riempie senza il banco
    droppa: 0.6,
    lascia: [...ARMI_DI(2), 'corazza', 'scudo-legno', 'scudo-borchiato', 'pozione'],
  },
  serpente: {
    em: '🐍', sprite: 'serpente', nome: 'Un serpente', unaPosa: true,
    ossa: 10, att: 4, dif: 0, gemme: 7,
    droppa: 0.6,
    lascia: [...ARMI_DI(2), 'saio', 'corazza', 'pozione'],
  },

  // la fascia che serviva all'abisso: BRANCO finiva sull'orco, dal quinto piano in giù cambiavano solo le
  // cifre. Il golem sta fra l'orco e un capo: sette risposte a mani nude, dentro il tetto
  golem: {
    em: '🪨', sprite: 'golem', nome: 'Un golem', unaPosa: true,
    ossa: 14, att: 5, dif: 1, gemme: 10,
    droppa: 0.7,
    lascia: [...ARMI_DI(2), 'corazza', 'scudo-ferro'],
  },

  // un secondo capo (non potenza in più): con uno solo, le ultime tre discese finivano tutte con lo stesso gigante
  troll: {
    em: '🧌', sprite: 'troll', nome: 'Il troll', unaPosa: true,
    ossa: 15, att: 5, dif: 1, gemme: 11, capo: true,
    droppa: 0.8,
    lascia: [...ARMI_DI(3), 'scudo-crociato', 'amuleto-osso'],
  },
}

export const CHIAVI_MOSTRI = Object.keys(MOSTRI)

// chi si incontra per strada, dal più tenero: tipoPer() in motore/livello.js pesca qui secondo la
// profondità. Ogni riga è una fascia di forza (dentro una fascia si equivalgono, sceglie il caso); l'ordine
// dentro una riga non conta, l'ordine DELLE righe sì (docs/sotterraneo/regole.md)
export const BRANCO = [
  ['ratto', 'pipistrello'],
  ['goblin', 'melma', 'fantasma'],
  ['scheletro', 'fungo', 'vespa'],
  ['orco', 'lupo', 'serpente', 'granchio'],
  ['golem'],
]

// una costante propria (non BRANCO.length * 0.6): legarla al numero di fasce ritarava anche la scalinata
// ogni volta che se ne aggiungeva una in fondo (misurato: la scala sommersa passava da 36 a 58 risposte obbligate)
export const PASSO_DEL_BRANCO = 2.4

export const NEL_BRANCO = [...new Set(BRANCO.flat())]

// nell'abisso ogni posto ha il suo branco (TRATTI_DELL_ABISSO in dati/campagna.js): stesse cinque fasce, e
// ogni mostro nella fascia che ha in BRANCO, così il posto cambia le facce e non la fatica. Il golem sta in
// tutti e due finché la quinta fascia ha un mostro solo. Vedi docs/sotterraneo/abisso.md.
export const BRANCHI = {
  cantine: [['ratto'], ['goblin', 'melma'], ['fungo', 'vespa'], ['granchio', 'serpente'], ['golem']],
  cripta: [['pipistrello'], ['fantasma'], ['scheletro'], ['orco', 'lupo'], ['golem']],
  fornace: [['pipistrello'], ['goblin', 'melma'], ['scheletro', 'vespa'], ['orco', 'serpente'], ['golem']],
}

// lo stesso conto di Corsa.colpiPer, qui perché possa provarlo anche chi guarda solo i dati
export const colpiPer = (m, attacco) =>
  Math.max(1, Math.ceil(m.ossa / Math.max(1, attacco - m.dif)))

export function guastiDeiMostri() {
  const g = []
  for (const [k, m] of Object.entries(MOSTRI)) {
    if (!m.sprite) g.push(`${k}: senza sprite`)
    if (m.ossa < 1) g.push(`${k}: senza ossa`)
    if (m.dif >= EROE.att) g.push(`${k}: difesa ${m.dif} contro attacco nudo ${EROE.att}, il colpo si azzera`)
    // un capo si incontra dopo aver trovato almeno una spada: contarlo a mani nude direbbe che è fuori misura quando non lo è
    const braccio = EROE.att + (m.capo ? 2 : 0)
    const costo = colpiPer(m, braccio)
    if (costo > 8) g.push(`${k}: ${costo} risposte di fila con attacco ${braccio}, troppe`)
    for (const c of m.lascia || []) if (typeof c !== 'string') g.push(`${k}: lascia una cosa senza nome`)
    if (m.droppa == null) g.push(`${k}: non dice quanto spesso lascia qualcosa`)
    else if (m.droppa < 0 || m.droppa > 1) g.push(`${k}: droppa ${m.droppa}, e non è una probabilità`)
  }
  for (const t of NEL_BRANCO) if (!MOSTRI[t]) g.push(`nel branco c'è "${t}", che non esiste`)
  for (const [k, b] of Object.entries(BRANCHI)) {
    if (b.length !== BRANCO.length) g.push(`il branco ${k} ha ${b.length} fasce invece di ${BRANCO.length}`)
    b.forEach((f, i) => {
      if (!f.length) g.push(`il branco ${k}: la fascia ${i + 1} è vuota`)
      for (const t of f)
        if (!(BRANCO[i] || []).includes(t)) g.push(`il branco ${k}: "${t}" non sta nella fascia ${i + 1} di BRANCO`)
    })
  }
  // dentro una riga i mostri devono equivalersi (costo a mani nude), o il piano diventa una lotteria
  BRANCO.forEach((fascia, i) => {
    if (!fascia.length) return g.push(`la fascia ${i + 1} del branco è vuota`)
    const costi = fascia.filter(t => MOSTRI[t]).map(t => colpiPer(MOSTRI[t], EROE.att))
    const largo = Math.max(...costi) - Math.min(...costi)
    if (largo > 2)
      g.push(`la fascia ${i + 1} del branco va da ${Math.min(...costi)} a ${Math.max(...costi)} ` +
             'risposte: non è una fascia, è due')
    for (const t of fascia)
      if (MOSTRI[t] && MOSTRI[t].capo) g.push(`"${t}" è un capo e sta anche per strada`)
  })
  // le fasce devono salire: due di fila uguali sono la stessa fascia scritta due volte
  const scala = BRANCO.map(f => Math.max(...f.filter(t => MOSTRI[t])
    .map(t => colpiPer(MOSTRI[t], EROE.att))))
  for (let i = 1; i < scala.length; i++)
    if (scala[i] <= scala[i - 1])
      g.push(`la fascia ${i + 1} del branco non chiede più della ${i}`)
  return g
}
