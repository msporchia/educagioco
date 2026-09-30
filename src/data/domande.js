// I tipi di domanda: un meccanismo solo (bersaglio, risposte, se ne
// tocca una), tanti modi di chiedere — la tabella degli otto tipi e i
// tre livelli (riconoscere/capire/tirare fuori) sono in
// docs/lingue/vocaboli.md. Vale per ogni lingua: qui non si sa mai se
// `str` è inglese o spagnolo.
import { compagne, tutteDi } from './lessico.js'

const mescola = a => a.slice().sort(() => Math.random() - 0.5)

// `quante` voci diverse dalla giusta, senza doppioni di ciò che si vedrà
// scritto. Con `conFamiglia`, due emoji della stessa FAMIGLIA VISIVA
// (`v.famiglia`) non escono mai insieme; se la famiglia del bersaglio
// occupa quasi tutta la sua categoria, si allarga a tutta la lingua.
// `fonti` (elenchi di voci, in ordine) prende il posto di categoria e
// lingua: chi le passa sa di che argomento è la domanda, e non si esce da
// lì nemmeno se restano poche risposte (l'inglese a mondi, docs/lingue/mondi.md).
function distrattori(v, quante, mostra, ammessa = () => true, viste = new Set(), conFamiglia = false,
                     fonti = null) {
  viste.add(mostra(v))
  const famiglie = new Set(conFamiglia && v.famiglia ? [v.famiglia] : [])
  const out = []
  const prova = fonte => {
    for (const c of fonte) {
      if (out.length >= quante) return
      if (c.chiave === v.chiave || !ammessa(c)) continue
      if (conFamiglia && c.famiglia && famiglie.has(c.famiglia)) continue
      const testo = mostra(c)
      if (!testo || viste.has(testo)) continue
      viste.add(testo); out.push(c)
      if (conFamiglia && c.famiglia) famiglie.add(c.famiglia)
    }
  }
  if (fonti) {
    for (const f of fonti) if (out.length < quante) prova(mescola(f))
    return out
  }
  prova(mescola(compagne(v, quante + 2)))
  if (out.length < quante)
    prova(mescola(tutteDi(v.lingua).filter(x => x.genere === v.genere)))
  return out
}

// i `falsi`/`falsiIt` scritti a mano nei file delle frasi sono i
// distrattori migliori (sbagliano di poco); si scarta la frase gemella
// se è già fra quelli, per non farla uscire due volte.
function frasiVicine(v, quante, lato) {
  const viste = new Set([v[lato]])
  const out = []
  for (const t of (lato === 'str' ? v.frase.falsi : v.frase.falsiIt) || []) {
    if (out.length >= quante || viste.has(t)) continue
    viste.add(t); out.push(t)
  }
  if (out.length < quante)
    for (const c of distrattori(v, quante - out.length, x => x[lato], () => true, viste))
      out.push(c[lato])
  return out
}

const opz = (testo, giusta = false) => ({ testo, giusta })
const opzEmoji = (v, giusta = false) => ({ emoji: v.emoji, testo: v.emoji, giusta })

export const TIPI = {
  figura: {
    livello: 0, quante: 6, figure: true, etichetta: () => 'Che cos’è?',
    puoUsare: (v, ha) => v.genere !== 'frase' && !!v.emoji,
    costruisci(v, fonti) {
      return {
        domanda: { testo: v.str },
        opzioni: mescola([opzEmoji(v, true),
                          ...distrattori(v, 5, x => x.emoji, x => !!x.emoji, new Set(), true, fonti)
                            .map(x => opzEmoji(x))]),
      }
    },
  },

  // un gradino sopra `figura`: si toglie il testo solo quando la parola
  // è già nota (vedi docs/lingue/vocaboli.md, "il testo è una stampella")
  ascoltoFigura: {
    livello: 1, quante: 6, figure: true, etichetta: () => 'Ascolta e scegli',
    puoUsare: (v, ha) => v.genere !== 'frase' && !!v.emoji && ha(v.str),
    costruisci(v, fonti) {
      return {
        domanda: { ascolta: v.str, svela: v.str },
        opzioni: mescola([opzEmoji(v, true),
                          ...distrattori(v, 5, x => x.emoji, x => !!x.emoji, new Set(), true, fonti)
                            .map(x => opzEmoji(x))]),
      }
    },
  },

  tradIt: {
    livello: 1, quante: 5, etichetta: () => 'Che vuol dire?',
    puoUsare: v => v.genere !== 'frase',
    costruisci(v, fonti) {
      return {
        domanda: { testo: v.str, ascolta: v.str },
        opzioni: mescola([opz(v.it, true),
                          ...distrattori(v, 4, x => x.it, undefined, undefined, false, fonti).map(x => opz(x.it))]),
      }
    },
  },

  // la più tosta insieme a `tradStra`: niente testo né figura
  ascoltoIt: {
    livello: 2, quante: 5, etichetta: () => 'Ascolta: che vuol dire?',
    puoUsare: (v, ha) => v.genere !== 'frase' && ha(v.str),
    costruisci(v, fonti) {
      return {
        domanda: { ascolta: v.str, svela: v.str },
        opzioni: mescola([opz(v.it, true),
                          ...distrattori(v, 4, x => x.it, undefined, undefined, false, fonti).map(x => opz(x.it))]),
      }
    },
  },

  tradStra: {
    livello: 2, quante: 5, etichetta: l => `Come si dice in ${l}?`,
    puoUsare: v => v.genere !== 'frase',
    costruisci(v, fonti) {
      return {
        domanda: { testo: v.it, italiano: true },
        opzioni: mescola([opz(v.str, true),
                          ...distrattori(v, 4, x => x.str, undefined, undefined, false, fonti).map(x => opz(x.str))]),
      }
    },
  },

  fraseIt: {
    livello: 0, quante: 4, lunghe: true, etichetta: () => 'Che vuol dire?',
    puoUsare: v => v.genere === 'frase',
    costruisci(v) {
      return {
        domanda: { testo: v.str, grande: false },
        opzioni: mescola([opz(v.it, true), ...frasiVicine(v, 3, 'it').map(t => opz(t))]),
      }
    },
  },

  fraseStra: {
    livello: 1, quante: 4, lunghe: true, etichetta: l => `Come si dice in ${l}?`,
    puoUsare: v => v.genere === 'frase',
    costruisci(v) {
      return {
        domanda: { testo: v.it, italiano: true },
        opzioni: mescola([opz(v.str, true), ...frasiVicine(v, 3, 'str').map(t => opz(t))]),
      }
    },
  },

  // livello 1 e non 2: le quattro parole sono lì da scegliere, è
  // riconoscere una regola e non produrre
  buco: {
    livello: 1, quante: 4, etichetta: () => 'Quale parola ci va?',
    puoUsare: v => v.genere === 'frase' && !!v.frase.buco,
    costruisci(v) {
      const b = v.frase.buco
      return {
        domanda: { testo: b.testo, aiuto: v.it },
        opzioni: mescola([opz(b.giusta, true), ...b.falsi.slice(0, 3).map(t => opz(t))]),
      }
    },
  },
}

/* i tipi dal più facile al più difficile. L'ordine conta: è quello con
   cui le tappe li aprono, ed è il modo di dire "tutti" al gioco libero. */
export const NOMI_TIPI = ['figura', 'ascoltoFigura', 'tradIt', 'ascoltoIt', 'tradStra',
                          'fraseIt', 'fraseStra', 'buco']

/* Fin dove può spingersi una voce, vista la sua forza nel motore.
   0..1 = appena conosciuta, 4+ = imparata (è la soglia `masterS`). */
export const livelloDaForza = s => (s <= 1 ? 0 : s <= 3 ? 1 : 2)

// Sceglie il tipo fra quelli aperti, preferendo i più difficili ammessi
// dalla forza — senza escludere i facili, che ritornano ogni tanto.
export function scegliTipo(v, { aperti, forza, haVoce }) {
  const massimo = livelloDaForza(forza)
  const usabili = aperti.filter(t => TIPI[t] && TIPI[t].puoUsare(v, haVoce))
  if (!usabili.length) return null
  const ammessi = usabili.filter(t => TIPI[t].livello <= massimo)
  // niente all'altezza: si prende il più facile che c'è, meglio del nulla
  if (!ammessi.length)
    return usabili.reduce((a, b) => (TIPI[a].livello <= TIPI[b].livello ? a : b))

  const pesi = ammessi.map(t => 1 + TIPI[t].livello * 1.5)
  let r = Math.random() * pesi.reduce((a, b) => a + b, 0)
  for (let i = 0; i < ammessi.length; i++) { r -= pesi[i]; if (r <= 0) return ammessi[i] }
  return ammessi[ammessi.length - 1]
}

// Il turno pronto da mostrare. `nomeLingua` finisce solo nell'etichetta:
// l'unico punto in cui il gioco sa che lingua sta insegnando. `fonti`:
// da dove prendere le risposte sbagliate delle parole (vedi `distrattori`).
export function componi(v, tipo, nomeLingua = 'inglese', { fonti = null } = {}) {
  const def = TIPI[tipo]
  const { domanda, opzioni } = def.costruisci(v, fonti)
  return {
    tipo, chiave: v.chiave, voce: v,
    etichetta: def.etichetta(nomeLingua),
    figure: !!def.figure,
    lunghe: !!def.lunghe,
    domanda, opzioni,
  }
}
