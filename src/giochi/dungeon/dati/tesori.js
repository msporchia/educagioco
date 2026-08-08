/* ═══════════════════════════════════════════════════════════════════
   L'EQUIPAGGIAMENTO — quello che rende l'eroe più forte

   Due caselle, **una arma e una armatura**, e tre gradi per ognuna.
   Non è un inventario: sono due emoji nella fascia in cima, e prendere
   qualcosa vuol dire lasciare quello che c'era.

     ⚔️ in mano   +attacco  → i mostri cadono in meno scambi
     🛡️ addosso   +difesa   → sbagliare costa meno vita

   ── PERCHÉ I GRADI, E PERCHÉ SONO TRE ──
   Un grado è la faccia visibile del patto di tutto il gioco: **i
   mostri difficili lasciano roba migliore**. Il topo lascia lo
   spadino, il mostro grosso la spada di ferro, lo scrigno in fondo al
   secondo piano la lama del drago. Chi gira largo dai mostri grossi
   arriva al guardiano con lo spadino e lo vede scendere di un punto
   per volta: nessuno glielo dice, lo legge sulla barra.

   Tre e non cinque perché una scala si deve poter tenere a mente
   guardando un'emoji: 🗡️ meno di ⚔️ meno di 🔱, e si è capito tutto
   senza numeri. I numeri ci sono lo stesso, in piccolo, per chi li
   guarda.

   ── QUANDO CADONO: PRESTO ──
   Una spada trovata alla penultima stanza non è un premio, è una
   notifica. La regola sta in `motore/corsa.js` e in `dati/stanze.js`,
   ma nasce qui: il bottino buono si incontra nel **primo e secondo
   piano**, perché il terzo è dove lo si usa. Al terzo piano si trovano
   cure e gemme, non armi nuove.

   Le GEMME 💎 restano i soldi del dungeon e non ne escono: si spendono
   dal mercante e a fine discesa spariscono, come l'equipaggiamento.
   Quello che passa la notte è solo l'eroe di base (`eroe.js`), che
   cresce con le tappe portate a casa.
   ═══════════════════════════════════════════════════════════════════ */

export const CASELLE = ['mano', 'addosso']

/* Come si chiama un grado quando lo si mostra, e di che colore è. Le
   tre parole sono quelle che userebbe un bambino, non quelle di un
   gioco di ruolo: «buono» e non «raro», «del drago» e non «epico». */
export const GRADI = {
  1: { nome: 'roba trovata', colore: '#9aa3b2' },
  2: { nome: 'roba buona', colore: '#6fc6ff' },
  3: { nome: 'roba da leggenda', colore: '#ffd23f' },
}

/* Gli effetti che non sono un numero: sono parole che il motore
   conosce, e `guastiDeiTesori()` controlla che non ne compaia una che
   il motore non sa fare. */
export const EFFETTI = ['lontano']

/* `desc` è quello che si legge sul banco del mercante, dove si sta
   scegliendo e serve il numero. `fa` è quello che si legge nel cartello
   del bottino, appena l'hai preso, dove serve **cosa cambia per te** —
   «i mostri cadono prima», non «+2 attacco». Sono due momenti diversi e
   vogliono due frasi diverse: al mercante si confronta, dopo si
   festeggia. */
export const TESORI = {
  /* ── in mano: l'attacco, cioè quanto in fretta cade un mostro ── */
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

  /* ── addosso: la difesa, cioè quanto costa uno sbaglio ── */
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

  /* ── né in mano né addosso: non competono con niente ──
     Obbligare a scegliere fra «vedo la strada» e «ho più vita» sarebbe
     una scelta finta, fatta di due cose che non si assomigliano. */
  bistecca: {
    em: '🍖', nome: 'Bistecca gigante', casella: null, grado: 1, vitaMax: 6,
    desc: 'Sei punti di vita in più, e te li riempie.', prezzo: 12, ripetibile: true,
    fa: 'Resisti più a lungo prima di finire a terra.',
  },
  /* La lanterna non aggiunge un numero, e per un po' è sembrata inutile
     per questo. Serve alla cosa che questo gioco è davvero — **scegliere
     la strada** — perché al buio si vedono solo due file avanti e si
     decide alla cieca; con lei si vede dove sono gli scrigni e il
     mercante, e si può puntare quelli invece di sperarci. Sta a grado 1
     apposta: se stesse in alto ruberebbe il posto a un'arma vera nei
     forzieri buoni, e il suo valore non è quello. */
  lanterna: {
    em: '🏮', nome: 'Lanterna', casella: null, grado: 1, effetto: 'lontano',
    desc: 'Illumina tutto: vedi dove sono scrigni e mercanti.', prezzo: 11,
    fa: 'Adesso vedi tutta la discesa e scegli dove andare.',
  },
}

export const CHIAVI_TESORI = Object.keys(TESORI)

export const tesoro = chiave => TESORI[chiave] || null

/* La pozione non è equipaggiamento: è un servizio, e succede subito.
   Sta qui perché è roba che si compra, ma non si tiene in tasca. */
export const POZIONE = {
  em: '🧪', nome: 'Pozione rossa', desc: 'Ti rimette in sesto: +22 vita.',
  cura: 22, prezzo: 10,
}

/* ── chi porta cosa ──
   `avuti` è quello che si ha addosso adesso: `{ mano: 'spada',
   addosso: null, presi: { lanterna: true } }`. */
export const inCasella = (avuti, casella) =>
  (avuti && avuti[casella]) ? TESORI[avuti[casella]] : null

/* Quanto valgono adesso le due caselle, da sommare alle statistiche
   di base. È l'unico posto dove si sommano: chi vuole sapere quanto
   picchia l'eroe chiede qui e non va a guardare dentro `TESORI`. */
export function bonusDi(avuti = {}) {
  const mano = inCasella(avuti, 'mano')
  const addosso = inCasella(avuti, 'addosso')
  return {
    attacco: mano?.attacco || 0,
    difesa: addosso?.difesa || 0,
  }
}

/* Vale la pena raccoglierlo? Un oggetto senza casella sì, se non si ha
   già (o se è ripetibile); uno con casella solo se **batte quello che
   c'è**. Serve al bottino automatico e al giocatore finto del banco:
   regalare uno spadino a chi impugna la lama del drago è un premio che
   suona come una presa in giro. */
export function meglioDi(chiave, avuti = {}) {
  const t = TESORI[chiave]
  if (!t) return false
  if (!t.casella) return t.ripetibile || !avuti.presi?.[chiave]
  const addosso = inCasella(avuti, t.casella)
  return !addosso || t.grado > addosso.grado
}

/* Quali oggetti può lasciare una stanza, dato il grado massimo che
   quella stanza si può permettere e quello che si ha già. Se non
   resta niente che valga, chi chiama trasforma il premio in gemme:
   un premio che non arriva è peggio di un premio piccolo. */
export function tesoriPossibili(avuti = {}, gradoMax = 3) {
  return CHIAVI_TESORI.filter(k => TESORI[k].grado <= gradoMax && meglioDi(k, avuti))
}

export function guastiDeiTesori(tesori = TESORI, gradi = GRADI) {
  const guasti = []
  const perCasella = {}
  for (const [chiave, t] of Object.entries(tesori)) {
    const dove = `tesoro "${chiave}"`
    if (!t.em || !t.nome || !t.desc) guasti.push(`${dove}: senza icona, nome o spiegazione`)
    /* senza `fa`, il cartello del bottino mostrerebbe un oggetto e
       nessuna ragione per essere contenti di averlo preso */
    if (!t.fa) guasti.push(`${dove}: non sa dire cosa cambia per chi lo prende`)
    else if (t.fa.length > 60) guasti.push(`${dove}: la frase del bottino è troppo lunga`)
    if (!(t.prezzo > 0)) guasti.push(`${dove}: prezzo ${t.prezzo}`)
    if (!gradi[t.grado]) guasti.push(`${dove}: il grado ${t.grado} non esiste`)
    /* la spiegazione la legge un bambino di sei anni davanti al
       mercante: se non ci sta in una riga, non la legge */
    if ((t.desc || '').length > 62) guasti.push(`${dove}: la spiegazione è troppo lunga`)
    if (t.effetto && !EFFETTI.includes(t.effetto))
      guasti.push(`${dove}: l'effetto "${t.effetto}" il motore non lo conosce`)

    if (t.casella) {
      if (!CASELLE.includes(t.casella)) guasti.push(`${dove}: la casella "${t.casella}" non esiste`)
      /* una casella porta un numero, o non si capisce cosa cambia */
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
    /* sotto i tre gradi la scala non è una scala, e «i mostri duri
       lasciano roba migliore» non ha niente da promettere */
    if (roba.length < 3) guasti.push(`la casella "${casella}" ha meno di tre gradi`)
    for (let i = 1; i < roba.length; i++) {
      const [prima, dopo] = [roba[i - 1], roba[i]]
      if (dopo.grado === prima.grado) guasti.push(`"${dopo.chiave}" e "${prima.chiave}" hanno lo stesso grado`)
      const quanto = o => casella === 'mano' ? o.attacco : o.difesa
      /* LE DUE MONETE DEVONO DIRE LA STESSA COSA: se un oggetto di
         grado più alto desse meno, o costasse meno, il grado sarebbe
         una decorazione e il bottino del mostro grosso una fregatura */
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
