// Il procedimento: quello che si fa con la roba comprata. La ricetta è un
// testo, e da lì si ricava cosa pestare insieme, cosa versare, quando
// mescolare e scaldare. Puro: il caso arriva da fuori. Le regole in
// docs/pozioni/procedimento.md.

export const MORTAIO = -1       // nel `cosa` di una versata: quello che è stato pestato
export const TAGLIERE = -2      // e quello che è stato sminuzzato
export const GRATTATO = -3      // e quello che è caduto nel ciotolino

// le azioni, e come si dicono sul cartello del pasticcio
export const AZIONI = {
  metti: { fare: 'Metterlo nel mortaio' },
  pesta: { fare: 'Pestare' },
  appoggia: { fare: 'Metterlo sul tagliere' },
  sminuzza: { fare: 'Sminuzzare' },
  gratta: { fare: 'Grattugiare' },
  versa: { fare: 'Versare' },
  mescola: { fare: 'Mescolare' },
  scalda: { fare: 'Accendere il fuoco' },
  agita: { fare: 'Fare l\'incantesimo' },
  diluisci: { fare: 'Diluire' },
  sale: { fare: 'Aggiungere il sale' },
  pepe: { fare: 'Aggiungere il pepe' },
  imbottiglia: { fare: 'Riempire la fiala' },
}

// gli attrezzi sul tavolo, per le azioni di una tappa
export const ATTREZZI = { pesta: ['mortaio', 'pestello'], sminuzza: ['tagliere', 'coltello'], gratta: ['grattugia', 'ciotolino'], mescola: ['mestolo'],
                          scalda: ['fiammifero'], agita: ['bacchetta'], diluisci: ['brocca'],
                          sale: ['sale'], pepe: ['pepe'], imbottiglia: ['fiala'] }

// cosa vuol dire portare un attrezzo su un'altra cosa: «attrezzo:dove»
export const MOSSE = {
  'pestello:mortaio': ['pesta', []],
  'mortaio:calderone': ['versa', [MORTAIO]],
  'coltello:tagliere': ['sminuzza', []],
  'tagliere:calderone': ['versa', [TAGLIERE]],
  'mestolo:calderone': ['mescola', []],
  'fiammifero:legna': ['scalda', []],
  'ciotolino:calderone': ['versa', [GRATTATO]],
  'bacchetta:calderone': ['agita', []],
  'brocca:calderone': ['diluisci', []],
  'sale:calderone': ['sale', []],
  'pepe:calderone': ['pepe', []],
  'mestolo:fiala': ['imbottiglia', []],
}
// e cosa vuol dire portarci la roba
export const ROBA_SU = { calderone: 'versa', mortaio: 'metti', tagliere: 'appoggia', grattugia: 'gratta' }

// sminuzza e gratta dipendono dalla roba: senza niente da tagliare il tagliere non si tira fuori
const LAVORI = ['sminuzza', 'gratta']
export const attrezziDi = (azioni, ingredienti) => azioni
  .filter(a => !LAVORI.includes(a) || ingredienti.some(g => g.lavoro === a))
  .flatMap(a => ATTREZZI[a] || [])

// la mossa che manca per il passo `p`: { da, su }, per il suggerimento. `manca`: la roba che il passo aspetta ancora
export function prossimaMossa(p, manca) {
  if (!p) return null
  const roba = `roba:${manca[0]}`
  if (p.azione === 'pesta') return manca.length ? { da: roba, su: 'mortaio' } : { da: 'pestello', su: 'mortaio' }
  if (p.azione === 'sminuzza') return manca.length ? { da: roba, su: 'tagliere' } : { da: 'coltello', su: 'tagliere' }
  if (p.azione === 'gratta') return { da: roba, su: 'grattugia' }
  if (p.azione === 'versa') return { da: p.cosa.includes(MORTAIO) ? 'mortaio' : p.cosa.includes(TAGLIERE) ? 'tagliere' : p.cosa.includes(GRATTATO) ? 'ciotolino' : roba, su: 'calderone' }
  const [da, su] = Object.keys(MOSSE).find(k => MOSSE[k][0] === p.azione).split(':')
  return { da, su }
}

// come arriva sul bancone quello che si è misurato: quello che stava sulla bilancia in una
// ciotola, il liquido in un bicchiere. Resta intero quello che ha una forma, e quello che si gratta
export function recipiente(g, i, passi) {
  if (g.famiglia === 'capacita') return 'bicchiere'
  return g.famiglia === 'massa' && !passi.some(p => p.azione === 'gratta' && p.cosa.includes(i)) ? 'ciotola' : null
}

const inFila = (rnd, lista) => lista.map(x => [rnd(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1])
const elenco = nomi => (nomi.length < 2 ? nomi.join('') : `${nomi.slice(0, -1).join(', ')} e ${nomi.at(-1)}`)

const TETTO = 10                // i passi di una ricetta: oltre, la pergamena copre il calderone
const RIGHE = 8                 // e i punti della pergamena: se no se ne mettono due insieme

// `livello` (dati/campagna.js): 1 versa, mescola e accendi il fuoco, 2 uguale
// ma con più attrezzi, 3 si pesta, 4 si diluisce, 5 come il 4 ma col testo
// intrecciato. `azioni`: quelle della tappa, che portano il resto. Si mescola
// sempre prima di scaldare e la fiala chiude; il resto cambia posto, se no si
// impara una filastrocca e la ricetta non si legge.
export function ricetta(rnd, ingredienti, livello, azioni = []) {
  const tutti = ingredienti.map((_, i) => i)
  const duri = tutti.filter(i => ingredienti[i].famiglia !== 'capacita')
  const lavora = i => azioni.includes(ingredienti[i].lavoro)
  const passi = []
  if (livello >= 3 && duri.length) {
    // nel mortaio prima quello che non si taglia e non si gratta, così gli altri attrezzi servono
    const insieme = [...inFila(rnd, duri.filter(i => !lavora(i))), ...inFila(rnd, duri.filter(lavora))].slice(0, 2)
    const resto = tutti.filter(i => !insieme.includes(i))
    const taglia = resto.find(i => ingredienti[i].lavoro === 'sminuzza' && lavora(i))
    const gratta = resto.find(i => ingredienti[i].lavoro === 'gratta' && lavora(i))
    const sfusi = resto.filter(i => i !== taglia && i !== gratta)
    passi.push({ azione: 'pesta', cosa: insieme.sort() }, { azione: 'versa', cosa: [MORTAIO] })
    if (taglia != null) passi.push({ azione: 'sminuzza', cosa: [taglia] }, { azione: 'versa', cosa: [TAGLIERE] })
    if (gratta != null) passi.push({ azione: 'gratta', cosa: [gratta] }, { azione: 'versa', cosa: [GRATTATO] })
    if (sfusi.length) passi.push({ azione: 'versa', cosa: sfusi })
  } else passi.push({ azione: 'versa', cosa: tutti })
  passi.push({ azione: 'mescola', cosa: [] }, { azione: 'scalda', cosa: [] })
  if (livello >= 4) passi.splice(passi.length - (rnd() < 0.5 ? 0 : 1), 0, { azione: 'diluisci', cosa: [] })
  // da un passo in poi, in un punto a caso
  const dopo = (da, nuovo) => passi.splice(da + Math.floor(rnd() * (passi.length - da + 1)), 0, { azione: nuovo, cosa: [] })
  const fiala = azioni.includes('imbottiglia')
  const ceStaAncora = () => passi.length < TETTO - (fiala ? 1 : 0)
  // la bacchetta: dopo il mestolo
  if (azioni.includes('agita') && ceStaAncora()) dopo(passi.findIndex(p => p.azione === 'mescola') + 1, 'agita')
  // il pizzico: appena c'è tutto nel calderone, e solo se ci sta
  const pizzichi = ['sale', 'pepe'].filter(x => azioni.includes(x))
  if (pizzichi.length && ceStaAncora()) dopo(passi.findLastIndex(p => p.azione === 'versa') + 1, pizzichi[Math.floor(rnd() * pizzichi.length)])
  if (fiala) passi.push({ azione: 'imbottiglia', cosa: [] })
  return passi
}

// la bacchetta non si agita e basta: c'è la formula, che cambia con quello che c'è nel calderone
const FORMULE = ['sussurra: «Stelle e vapore, cambia colore!»', 'grida: «Bolli, ribolli, brilla!»', 'sussurra: «Zolfo e rugiada, la magia vada!»',
                 'grida: «Uno, due, tre, magia per me!»', 'sussurra: «Luna e radice, fammi felice!»', 'grida: «Fumo e scintilla, la pozione brilla!»']
const formula = ingredienti => FORMULE[ingredienti.reduce((n, g) => n + g.nome.length, 0) % FORMULE.length]

// la cosa con l'articolo, per chi la lavora: «sminuzza il ramo di quercia»
const con = g => `${g.art || ''}${g.nome}`

// una frase per passo, senza maiuscola né punto
export function frase(p, ingredienti) {
  const nomi = p.cosa.filter(i => i >= 0).map(i => ingredienti[i].nome)
  if (p.azione === 'pesta') return nomi.length > 1 ? `pesta insieme ${elenco(nomi)}` : `pesta ${nomi[0]}`
  if (p.azione === 'sminuzza') return `sminuzza ${con(ingredienti[p.cosa[0]])}`
  if (p.azione === 'gratta') return `gratta ${con(ingredienti[p.cosa[0]])}`
  if (p.azione === 'versa') return p.cosa.includes(MORTAIO) ? 'versa il pestato nel calderone' : p.cosa.includes(TAGLIERE) ? 'versa il tritato nel calderone' : p.cosa.includes(GRATTATO) ? 'versa il grattato nel calderone' : `versa ${elenco(nomi)} nel calderone`
  if (p.azione === 'agita') return `agita la bacchetta sul calderone e ${formula(ingredienti)}`
  return { mescola: 'mescola bene', scalda: 'accendi il fuoco', diluisci: 'diluisci con l\'acqua',
           sale: 'aggiungi un pizzico di sale', pepe: 'aggiungi un pizzico di pepe', imbottiglia: 'riempi la fiala col mestolo' }[p.azione]
}

const Maiuscola = t => t[0].toUpperCase() + t.slice(1)

// Il testo della pergamena, un punto per riga: [{ testo, passi: [indici] }].
// Ogni tanto due passi stanno nello stesso punto («versa e scalda»), e bisogna
// leggere fino in fondo. Si legge come parlerebbe una persona: provato a girare
// una coppia a caso, «versa il pestato, ma prima pesta» non si poteva leggere.
// Al contrario si dicono solo le mosse sul calderone («accendi il fuoco dopo
// aver mescolato bene»), e pesta e versa diventano «versa X e Y pestati insieme».
const INSIEME = 0.4, GIRATA = 0.6, DENTRO = ' nel calderone'
const SUL_CALDERONE = ['mescola', 'scalda', 'diluisci', 'sale', 'pepe']
const FATTO = { mescola: 'mescolato bene', scalda: 'acceso il fuoco', diluisci: 'diluito con l\'acqua', sale: 'aggiunto il sale', pepe: 'aggiunto il pepe' }
// «sminuzza il ramo e versalo», «gratta le ghiande e versale»: il pronome va con l'articolo
const PRONOME = { 'il ': 'lo', 'lo ': 'lo', 'la ': 'la', 'l\'': 'lo', 'i ': 'li', 'le ': 'le' }
export function testo(rnd, passi, ingredienti, intrecciato) {
  const girabili = passi.slice(1).flatMap((p, k) => (SUL_CALDERONE.includes(p.azione) && SUL_CALDERONE.includes(passi[k].azione) ? [k] : []))
  const girata = intrecciato && girabili.length && rnd() < GIRATA ? girabili[Math.floor(rnd() * girabili.length)] : -1
  const detto = k => frase(passi[k], ingredienti)
  const pestaEVersa = k => passi[k].azione === 'pesta' && passi[k].cosa.length === 2 && passi[k + 1]?.cosa.includes(MORTAIO)
  const incanto = k => passi[k].azione === 'agita'     // l'incantesimo ha una riga tutta sua
  const lavoraEVersa = k => (passi[k].azione === 'sminuzza' && passi[k + 1]?.cosa.includes(TAGLIERE)) || (passi[k].azione === 'gratta' && passi[k + 1]?.cosa.includes(GRATTATO))
  const righe = []
  for (let k = 0; k < passi.length; k++) {
    if (k === girata) righe.push({ testo: `${Maiuscola(detto(k + 1))} dopo aver ${FATTO[passi[k].azione]}.`, passi: [k, ++k] })
    else if (intrecciato && pestaEVersa(k)) {
      const cose = passi[k].cosa.map(i => ingredienti[i])
      righe.push({ testo: `Versa nel calderone ${elenco(cose.map(g => g.nome))} ${cose.every(g => g.f) ? 'pestate' : 'pestati'} insieme.`, passi: [k, ++k] })
    } else if (lavoraEVersa(k)) righe.push({ testo: `${Maiuscola(detto(k))} e versa${PRONOME[ingredienti[passi[k].cosa[0]].art]} nel calderone.`, passi: [k, ++k] })
    else if (k + 1 < passi.length && k + 1 !== girata && !lavoraEVersa(k + 1) && !incanto(k) && !incanto(k + 1) && (rnd() < INSIEME || righe.length + passi.length - k > RIGHE))
      // «nel calderone» una volta sola
      righe.push({ testo: `${Maiuscola(detto(k + 1).endsWith(DENTRO) ? detto(k).replace(DENTRO, '') : detto(k))} e ${detto(k + 1)}.`, passi: [k, ++k] })
    else righe.push({ testo: incanto(k) ? Maiuscola(detto(k)) : `${Maiuscola(detto(k))}.`, passi: [k] })
  }
  return righe
}

export const stesse = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join()
