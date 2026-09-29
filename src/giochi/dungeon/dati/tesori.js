// L'equipaggiamento: due caselle (mano/addosso), tre gradi ciascuna — perché
// i gradi lasciano roba migliore i mostri difficili, e perché tre e non
// cinque, vedi COMBATTIMENTO.md. Il bottino buono cade nei primi due piani.

export const CASELLE = ['mano', 'addosso']

// nomi da bambino, non da gioco di ruolo: «buono» non «raro», «del drago» non «epico»
export const GRADI = {
  1: { nome: 'roba trovata', colore: '#9aa3b2' },
  2: { nome: 'roba buona', colore: '#6fc6ff' },
  3: { nome: 'roba da leggenda', colore: '#ffd23f' },
}

export const EFFETTI = ['lontano']

// `desc` è per il mercante (si confronta, serve il numero); `fa` è per il
// cartello del bottino appena preso (si festeggia, serve cosa cambia)
export const TESORI = {
  spadino: {
    em: '🗡️', nome: 'Spadino', casella: 'mano', grado: 1, attacco: 1,
    desc: 'Piccolo ma affilato. +1 attacco.', prezzo: 10,
    fa: 'Adesso i mostri cadono un po\' prima.',
  },
  spada: {
    em: '⚔️', nome: 'Spada di ferro', casella: 'mano', grado: 2, attacco: 2,
    desc: 'Pesante al punto giusto. +2 attacco.', prezzo: 18,
    fa: 'Ogni tua risposta giusta fa molto più male.',
  },
  lama: {
    em: '🔱', nome: 'Lama del drago', casella: 'mano', grado: 3, attacco: 3,
    desc: 'Scalda la mano di chi la impugna. +3 attacco.', prezzo: 28,
    fa: 'Anche i mostri più grossi cadranno in pochi colpi.',
  },

  panciotto: {
    em: '🦺', nome: 'Panciotto di cuoio', casella: 'addosso', grado: 1, difesa: 1,
    desc: 'Vecchio, ma para. +1 difesa.', prezzo: 9,
    fa: 'Quando sbagli, i colpi fanno un po\' meno male.',
  },
  corazza: {
    em: '🛡️', nome: 'Corazza di ferro', casella: 'addosso', grado: 2, difesa: 2,
    desc: 'I colpi rimbalzano. +2 difesa.', prezzo: 17,
    fa: 'Quando sbagli, i colpi fanno molto meno male.',
  },
  manto: {
    em: '🧥', nome: 'Manto di scaglie', casella: 'addosso', grado: 3, difesa: 3,
    desc: 'Scaglie di drago, cucite a mano. +3 difesa.', prezzo: 26,
    fa: 'Adesso sbagliare non fa quasi più male.',
  },

  // né in mano né addosso: non competono con niente (una scelta fra "vedo
  // la strada" e "ho più vita" sarebbe finta)
  bistecca: {
    em: '🍖', nome: 'Bistecca gigante', casella: null, grado: 1, vitaMax: 6,
    desc: 'Sei punti di vita in più, e te li riempie.', prezzo: 12, ripetibile: true,
    fa: 'Resisti più a lungo prima di finire a terra.',
  },
  // niente numero: serve a scegliere la strada (si vedono scrigni e mercante
  // invece che due file al buio). Grado 1 apposta, o ruberebbe il posto a un'arma vera
  lanterna: {
    em: '🏮', nome: 'Lanterna', casella: null, grado: 1, effetto: 'lontano',
    desc: 'Illumina tutto: vedi dove sono scrigni e mercanti.', prezzo: 11,
    fa: 'Adesso vedi tutta la discesa e scegli dove andare.',
  },
}

export const CHIAVI_TESORI = Object.keys(TESORI)

export const tesoro = chiave => TESORI[chiave] || null

// non è equipaggiamento: è un servizio che succede subito
export const POZIONE = {
  em: '🧪', nome: 'Pozione rossa', desc: 'Ti rimette in sesto: +22 vita.',
  cura: 22, prezzo: 10,
}

// `avuti`: { mano: 'spada', addosso: null, presi: { lanterna: true } }
export const inCasella = (avuti, casella) =>
  (avuti && avuti[casella]) ? TESORI[avuti[casella]] : null

// unico posto dove le due caselle si sommano alle statistiche di base
export function bonusDi(avuti = {}) {
  const mano = inCasella(avuti, 'mano')
  const addosso = inCasella(avuti, 'addosso')
  return {
    attacco: mano?.attacco || 0,
    difesa: addosso?.difesa || 0,
  }
}

// vale la pena raccoglierlo? senza casella sì (o se ripetibile); con
// casella solo se batte quello che c'è già
export function meglioDi(chiave, avuti = {}) {
  const t = TESORI[chiave]
  if (!t) return false
  if (!t.casella) return t.ripetibile || !avuti.presi?.[chiave]
  const addosso = inCasella(avuti, t.casella)
  return !addosso || t.grado > addosso.grado
}

// se non resta niente che valga, chi chiama trasforma il premio in gemme
export function tesoriPossibili(avuti = {}, gradoMax = 3) {
  return CHIAVI_TESORI.filter(k => TESORI[k].grado <= gradoMax && meglioDi(k, avuti))
}

export function guastiDeiTesori(tesori = TESORI, gradi = GRADI) {
  const guasti = []
  const perCasella = {}
  for (const [chiave, t] of Object.entries(tesori)) {
    const dove = `tesoro "${chiave}"`
    if (!t.em || !t.nome || !t.desc) guasti.push(`${dove}: senza icona, nome o spiegazione`)
    if (!t.fa) guasti.push(`${dove}: non sa dire cosa cambia per chi lo prende`)
    else if (t.fa.length > 60) guasti.push(`${dove}: la frase del bottino è troppo lunga`)
    if (!(t.prezzo > 0)) guasti.push(`${dove}: prezzo ${t.prezzo}`)
    if (!gradi[t.grado]) guasti.push(`${dove}: il grado ${t.grado} non esiste`)
    if ((t.desc || '').length > 62) guasti.push(`${dove}: la spiegazione è troppo lunga`)
    if (t.effetto && !EFFETTI.includes(t.effetto))
      guasti.push(`${dove}: l'effetto "${t.effetto}" il motore non lo conosce`)

    if (t.casella) {
      if (!CASELLE.includes(t.casella)) guasti.push(`${dove}: la casella "${t.casella}" non esiste`)
      const quanto = t.casella === 'mano' ? t.attacco : t.difesa
      if (!(quanto > 0)) guasti.push(`${dove}: sta in una casella ma non aggiunge niente`)
      if (t.casella === 'mano' && t.difesa) guasti.push(`${dove}: un'arma che dà difesa confonde le due caselle`)
      if (t.casella === 'addosso' && t.attacco) guasti.push(`${dove}: un'armatura che dà attacco confonde le due caselle`)
      ;(perCasella[t.casella] ||= []).push({ chiave, ...t })
    } else if (t.attacco || t.difesa) {
      guasti.push(`${dove}: aggiunge attacco o difesa senza occupare una casella`)
    }
  }

  for (const casella of CASELLE) {
    const roba = (perCasella[casella] || []).sort((a, b) => a.grado - b.grado)
    if (roba.length < 3) guasti.push(`la casella "${casella}" ha meno di tre gradi`)
    for (let i = 1; i < roba.length; i++) {
      const [prima, dopo] = [roba[i - 1], roba[i]]
      if (dopo.grado === prima.grado) guasti.push(`"${dopo.chiave}" e "${prima.chiave}" hanno lo stesso grado`)
      const quanto = o => casella === 'mano' ? o.attacco : o.difesa
      // un grado più alto deve dare di più E costare di più, o è una decorazione
      if (quanto(dopo) <= quanto(prima))
        guasti.push(`"${dopo.chiave}" è di grado più alto di "${prima.chiave}" ma non dà di più`)
      if (dopo.prezzo <= prima.prezzo)
        guasti.push(`"${dopo.chiave}" è di grado più alto di "${prima.chiave}" ma costa meno`)
    }
  }

  if (!(POZIONE.cura > 0)) guasti.push('la pozione non cura niente')
  if (!(POZIONE.prezzo > 0)) guasti.push(`la pozione costa ${POZIONE.prezzo}`)
  return guasti
}
