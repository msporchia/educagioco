/* ═══════════════════════════════════════════════════════════════════
   I TIPI DI DOMANDA — un meccanismo solo, tanti modi di chiedere.

   Il gioco fa sempre la stessa cosa: mostra un bersaglio, mette lì
   alcune risposte, se ne tocca una. Non cambia mai. Quello che cambia è
   cosa c'è nel bersaglio e cosa c'è nelle risposte, e da lì viene tutta
   la progressione: si comincia riconoscendo una figura e si finisce a
   scegliere fra «il mio fratello è simpatico» e «il mio fratello sta
   simpatico».

   Vale per ogni lingua: le voci del lessico hanno il campo `str` — la
   parola straniera, inglese o spagnola che sia — e qui dentro non si sa
   né serve sapere quale delle due è. L'unica cosa che cambia è il nome
   da scrivere nell'etichetta, e arriva da fuori.

   Tenerli qui, fuori dalla schermata di gioco, serve a una cosa sola:
   aggiungere un tipo domani deve essere aggiungere una voce a questa
   tabella, non mettere le mani nel gioco.

   ── Il livello di un tipo ──
   0 RICONOSCERE  la parola è lì scritta e la risposta è una figura
   1 CAPIRE       serve sapere cosa vuol dire — o riconoscerla a orecchio,
                  che è la stessa domanda senza la stampella del testo
   2 TIRARE FUORI si parte dall'italiano, o si ha solo la voce: niente
                  più appigli, o la parola c'è o non c'è

   Quale tocca a una parola non lo decide la tappa ma la FORZA di quella
   parola nel motore di apprendimento. Una parola incontrata ieri si
   chiede con la figura; la stessa parola, saputa da un mese, si chiede
   al contrario. Così la difficoltà segue chi gioca invece di seguire il
   calendario, e nessuno si trova a tradurre dall'italiano una parola
   che ha visto una volta sola.
   ═══════════════════════════════════════════════════════════════════ */
import { compagne } from './lessico.js'

const mescola = a => a.slice().sort(() => Math.random() - 0.5)

/* prende `quante` voci diverse dalla giusta, senza doppioni di ciò che
   si vedrà scritto: due opzioni identiche sarebbero due risposte giuste */
function distrattori(v, quante, mostra, ammessa = () => true, viste = new Set()) {
  viste.add(mostra(v))
  const fonte = mescola(compagne(v, quante + 2))
  const out = []
  for (const c of fonte) {
    if (out.length >= quante) break
    if (c.chiave === v.chiave || !ammessa(c)) continue
    const testo = mostra(c)
    if (!testo || viste.has(testo)) continue
    viste.add(testo); out.push(c)
  }
  return out
}

/* le stesse frasi vengono usate come distrattori l'una dell'altra: sono
   già scritte a mano nei campi `falsi` e `falsiIt` dei file delle frasi,
   e quelle sono le migliori perché sbagliano di poco.

   Le viste si tengono da conto: una coppia domanda/affermazione ha come
   falso proprio la frase gemella, che è anche fra quelle pescabili — e
   uscirebbe due volte nella stessa domanda. */
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
    costruisci(v) {
      return {
        domanda: { testo: v.str },
        opzioni: mescola([opzEmoji(v, true),
                          ...distrattori(v, 5, x => x.emoji, x => !!x.emoji).map(x => opzEmoji(x))]),
      }
    },
  },

  /* Un gradino sopra `figura`, e non alla pari: leggere `dog` è facile
     anche il primo giorno, riconoscerlo all'orecchio no. Così la parola si
     impara prima con gli occhi, e quando la si sa le si toglie il testo —
     che è poi l'unico modo di allenare l'ascolto, la cosa che a scuola
     manca e che da adulti serve per prima. */
  ascoltoFigura: {
    livello: 1, quante: 6, figure: true, etichetta: () => 'Ascolta e scegli',
    puoUsare: (v, ha) => v.genere !== 'frase' && !!v.emoji && ha(v.str),
    costruisci(v) {
      return {
        domanda: { ascolta: v.str, svela: v.str },
        opzioni: mescola([opzEmoji(v, true),
                          ...distrattori(v, 5, x => x.emoji, x => !!x.emoji).map(x => opzEmoji(x))]),
      }
    },
  },

  tradIt: {
    livello: 1, quante: 5, etichetta: () => 'Che vuol dire?',
    puoUsare: v => v.genere !== 'frase',
    costruisci(v) {
      return {
        domanda: { testo: v.str, ascolta: v.str },
        opzioni: mescola([opz(v.it, true),
                          ...distrattori(v, 4, x => x.it).map(x => opz(x.it))]),
      }
    },
  },

  /* la più tosta di tutte insieme a `tradStra`: niente testo E niente
     figura, solo la voce e cinque parole italiane */
  ascoltoIt: {
    livello: 2, quante: 5, etichetta: () => 'Ascolta: che vuol dire?',
    puoUsare: (v, ha) => v.genere !== 'frase' && ha(v.str),
    costruisci(v) {
      return {
        domanda: { ascolta: v.str, svela: v.str },
        opzioni: mescola([opz(v.it, true),
                          ...distrattori(v, 4, x => x.it).map(x => opz(x.it))]),
      }
    },
  },

  tradStra: {
    livello: 2, quante: 5, etichetta: l => `Come si dice in ${l}?`,
    puoUsare: v => v.genere !== 'frase',
    costruisci(v) {
      return {
        domanda: { testo: v.it, italiano: true },
        opzioni: mescola([opz(v.str, true),
                          ...distrattori(v, 4, x => x.str).map(x => opz(x.str))]),
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

  /* livello 1 e non 2: riempire il buco sembra la domanda più difficile, ma
     le quattro parole sono lì da scegliere — è riconoscere una regola, non
     produrre. A livello 2 sarebbe uscito solo su frasi già consolidate,
     cioè quasi mai, e la grammatica non si sarebbe vista. */
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

/* Sceglie il tipo di domanda per una voce, fra quelli che la tappa ha
   aperto. Preferisce i più difficili fra quelli consentiti — altrimenti
   una parola saputa resterebbe per sempre alla figurina — ma senza
   escludere i facili, perché rivedere l'immagine ogni tanto fa bene. */
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

/* Il turno pronto da mostrare: bersaglio, opzioni, e come vanno disegnate.
   `nomeLingua` finisce solo nell'etichetta — "Come si dice in spagnolo?" —
   ed è l'unico punto in cui il gioco sa che lingua sta insegnando. */
export function componi(v, tipo, nomeLingua = 'inglese') {
  const def = TIPI[tipo]
  const { domanda, opzioni } = def.costruisci(v)
  return {
    tipo, chiave: v.chiave, voce: v,
    etichetta: def.etichetta(nomeLingua),
    figure: !!def.figure,
    lunghe: !!def.lunghe,
    domanda, opzioni,
  }
}
