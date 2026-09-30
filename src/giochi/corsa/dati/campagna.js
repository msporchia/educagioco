// Nove tappe in tre scalini: una tappa è lo stesso motore con altri
// numeri e un altro vestito. Il perché dei numeri (perché si corre
// piano, il tetto della truppa, le stelle) è in docs/corsa/regole.md.
import { CAMBIO, ORDINI } from './ordini.js'

// I tetti che i gradi sanno scrivere: 4 (solo verdi), 24 (verdi e
// rossi), 124 (col blu), 624 (col giallo).
export const TETTI = ORDINI.map((_, i) => CAMBIO ** (i + 1) - 1)

export const SCALINI = [
  { chiave: 'sentieri', nome: 'I sentieri', icona: '🌿',
    dritta: 'I cancelli sono facili: si impara a leggerli.' },
  { chiave: 'vialunga', nome: 'La via lunga', icona: '🌉',
    dritta: 'Scelte doppie, e arriva il primo boss.' },
  { chiave: 'cima', nome: 'Verso la cima', icona: '⛰️',
    dritta: 'Tutto insieme: la truppa va tenuta grossa.' },
]

// `portata` (0-100, docs/apprendimento/eta-e-portata.md): niente `scuola`
// qui, il conto a mente scelto non lo insegna la scuola, quindi la testa
// non si taglia mai per età — solo in alto.
export const CAMPAGNA = [
  { chiave: 'sentiero', nome: 'Il sentiero', veste: 'prato', scalino: 'sentieri',
    portata: 30,
    metri: 170, passo: 3.0, punta: 3.8, spinta: 0.012, fraCancelli: 21, fraScontri: 3,
    tetto: 24, truppa: 5, libri: 0.30, studio: 0.10, mira: 0.55, coni: 1,
    racconto: 'Solo verdi e rossi: guarda i numeri, non i colori.' },
  { chiave: 'campi', nome: 'I campi gialli', veste: 'grano', scalino: 'sentieri',
    portata: 34,
    metri: 210, passo: 3.1, punta: 3.9, spinta: 0.012, fraCancelli: 20, fraScontri: 3,
    tetto: 24, truppa: 5, libri: 0.32, studio: 0.18, mira: 0.60, coni: 1,
    racconto: 'Cinque verdi fanno un rosso. Guardali cambiare.' },
  { chiave: 'bosco', nome: 'Il bosco', veste: 'bosco', scalino: 'sentieri',
    portata: 38,
    metri: 250, passo: 3.2, punta: 4.0, spinta: 0.013, fraCancelli: 20, fraScontri: 3,
    tetto: 124, truppa: 8, libri: 0.34, studio: 0.28, mira: 0.62, coni: 2,
    racconto: "Arriva il blu, e il cancello d'oro col libro." },

  { chiave: 'ponte', nome: 'Il ponte lungo', veste: 'fiume', scalino: 'vialunga',
    portata: 48,
    metri: 290, passo: 3.3, punta: 4.1, spinta: 0.014, fraCancelli: 19, fraScontri: 3,
    tetto: 124, truppa: 8, libri: 0.34, studio: 0.38, mira: 0.66, coni: 2,
    racconto: 'Un cancello fa due cose: «÷5 +80» si legge in ordine.' },
  { chiave: 'dune', nome: 'Le dune', veste: 'deserto', scalino: 'vialunga',
    portata: 52,
    metri: 330, passo: 3.4, punta: 4.2, spinta: 0.014, fraCancelli: 19, fraScontri: 3,
    tetto: 124, truppa: 10, libri: 0.36, studio: 0.48, mira: 0.70, coni: 2,
    racconto: 'Il primo boss: davanti a lui si rallenta.' },
  { chiave: 'notte', nome: 'La notte', veste: 'notte', scalino: 'vialunga',
    portata: 56,
    metri: 370, passo: 3.5, punta: 4.3, spinta: 0.015, fraCancelli: 18, fraScontri: 3,
    tetto: 624, truppa: 10, libri: 0.36, studio: 0.58, mira: 0.72, coni: 3,
    racconto: 'Arriva il giallo: la truppa piena sta a 624.' },

  { chiave: 'valico', nome: 'Il valico', veste: 'neve', scalino: 'cima',
    portata: 66,
    metri: 410, passo: 3.6, punta: 4.35, spinta: 0.015, fraCancelli: 18, fraScontri: 3,
    tetto: 624, truppa: 12, libri: 0.38, studio: 0.68, mira: 0.75, coni: 3,
    racconto: 'Un mostro ogni tre cancelli. Non sbagliarne.' },
  { chiave: 'bruciata', nome: 'La terra che brucia', veste: 'lava', scalino: 'cima',
    portata: 70,
    metri: 450, passo: 3.7, punta: 4.4, spinta: 0.016, fraCancelli: 18, fraScontri: 3,
    tetto: 624, truppa: 12, libri: 0.38, studio: 0.78, mira: 0.78, coni: 3,
    racconto: 'Qui non basta sceglierne bene uno.' },
  { chiave: 'cima', nome: 'La cima', veste: 'cima', scalino: 'cima',
    portata: 74,
    metri: 490, passo: 3.8, punta: 4.4, spinta: 0.016, fraCancelli: 18, fraScontri: 3,
    tetto: 624, truppa: 14, libri: 0.40, studio: 0.88, mira: 0.80, coni: 3,
    racconto: 'Quasi cinquecento metri e due boss.' },
]

export const QUANTE_TAPPE = CAMPAGNA.length

export const tappa = indice =>
  CAMPAGNA[Math.max(0, Math.min(indice, CAMPAGNA.length - 1))]

// La corsa infinita: non è una tappa e non sta nella campagna, è quello
// che resta dopo.
export const LIBERA = {
  chiave: 'infinita', nome: 'La corsa infinita', veste: 'notte', scalino: null,
  metri: Infinity, passo: 3.4, punta: 4.4, spinta: 0.015, fraCancelli: 18, fraScontri: 3,
  tetto: 624, truppa: 12, libri: 0.36, studio: 0.55, mira: 1.1, coni: 3,
  racconto: 'Non finisce: si corre finché la truppa regge.',
}

export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)

// Quanto dura una tappa, all'incirca: si corre accelerando, quindi la
// media sta fra il passo di partenza e la punta, più vicina alla punta.
export const secondiCirca = t =>
  Number.isFinite(t.metri) ? Math.round(t.metri / (t.passo * 0.35 + t.punta * 0.65)) : Infinity

export function guastiDellaCampagna(campagna = CAMPAGNA, vesti = null) {
  const guasti = []
  const viste = new Set()
  for (const [i, t] of campagna.entries()) {
    const dove = `tappa ${i + 1} ("${t.chiave}")`
    if (viste.has(t.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.racconto) guasti.push(`${dove}: senza nome o senza racconto`)
    if (vesti && !vesti[t.veste]) guasti.push(`${dove}: la veste "${t.veste}" non esiste`)
    if (!SCALINI.some(s => s.chiave === t.scalino)) guasti.push(`${dove}: scalino "${t.scalino}" sconosciuto`)

    // il tempo di pensare: sotto i quattro secondi fra un cancello e
    // l'altro alla punta non si legge una terna, si tira a indovinare
    const respiro = t.fraCancelli / t.punta
    if (!(respiro >= 4))
      guasti.push(`${dove}: ${respiro.toFixed(1)}s fra un cancello e l'altro alla punta — non si fa in tempo a leggerli`)
    if (!(t.punta > t.passo)) guasti.push(`${dove}: la punta (${t.punta}) non è sopra il passo (${t.passo})`)
    if (!(t.passo >= 2.4 && t.punta <= 5.2))
      guasti.push(`${dove}: si corre da ${t.passo} a ${t.punta} m/s, fuori dalla fascia leggibile`)
    if (!(t.spinta >= 0 && t.spinta <= 0.05)) guasti.push(`${dove}: spinta ${t.spinta}`)

    if (Number.isFinite(t.metri)) {
      const secondi = secondiCirca(t)
      if (!(secondi >= 30 && secondi <= 180))
        guasti.push(`${dove}: ${secondi} secondi non sono una partita per un bambino`)
      const cancelli = t.metri / t.fraCancelli
      if (!(cancelli >= 6))
        guasti.push(`${dove}: solo ${cancelli.toFixed(1)} cancelli — non c'è niente da scegliere`)
    }
    if (!(t.fraScontri >= 2)) guasti.push(`${dove}: un mostro ogni ${t.fraScontri} cancelli è troppo spesso`)
    if (!(t.truppa >= 3)) guasti.push(`${dove}: si parte in ${t.truppa}, e un cancello sbagliato cancella la partita`)
    // il tetto è «quanti gradi sto imparando»: dev'essere per forza uno
    // dei massimi che i gradi sanno scrivere (4, 24, 124, 624)
    if (!TETTI.includes(t.tetto))
      guasti.push(`${dove}: tetto ${t.tetto} — i gradi scrivono ${TETTI.join(', ')}, non altro`)
    if (!(t.truppa < t.tetto / 2))
      guasti.push(`${dove}: si parte in ${t.truppa} con il tetto a ${t.tetto}: non c'è spazio per crescere`)
    if (!(t.libri > 0 && t.libri <= 0.5))
      guasti.push(`${dove}: il libro esce ${t.libri} volte su una — o non si vede mai, o diventa un pedaggio`)
    if (!(t.studio >= 0 && t.studio <= 1)) guasti.push(`${dove}: studio ${t.studio} non è una manopola da 0 a 1`)
    if (!(t.mira > 0.4 && t.mira <= 0.9))
      guasti.push(`${dove}: mira ${t.mira} — sotto il caso (0.33) è regalata, sopra 0.9 la vuole perfetta`)
    if (!(t.coni >= 0 && t.coni <= 4)) guasti.push(`${dove}: ${t.coni} coni fra un cancello e l'altro`)
  }

  for (let i = 1; i < campagna.length; i++) {
    const dove = `tappa ${i + 1}`
    if (campagna[i].metri < campagna[i - 1].metri) guasti.push(`${dove}: più corta della precedente`)
    if (campagna[i].studio < campagna[i - 1].studio) guasti.push(`${dove}: le domande sono più facili della tappa prima`)
    if (campagna[i].mira <= campagna[i - 1].mira) guasti.push(`${dove}: la terza stella costa meno della tappa prima`)
    if (campagna[i].tetto < campagna[i - 1].tetto) guasti.push(`${dove}: la truppa può diventare meno grande di prima`)
    if (campagna[i].veste === campagna[i - 1].veste)
      guasti.push(`${dove}: stesso vestito della precedente ("${campagna[i].veste}")`)
    if (campagna[i].fraCancelli > campagna[i - 1].fraCancelli)
      guasti.push(`${dove}: i cancelli sono più radi della tappa prima`)
  }
  // i gradi si presentano uno alla volta: due gradi nuovi in una tappa
  // sola sono due cose nuove da capire mentre si corre
  for (let i = 1; i < campagna.length; i++)
    if (TETTI.indexOf(campagna[i].tetto) - TETTI.indexOf(campagna[i - 1].tetto) > 1)
      guasti.push(`tappa ${i + 1}: la truppa guadagna due gradi in un colpo solo`)

  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1])) guasti.push('gli scalini non sono in fila')
  for (const s of SCALINI)
    if (!campagna.some(t => t.scalino === s.chiave))
      guasti.push(`lo scalino "${s.chiave}" non ha nemmeno una tappa`)
  if (campagna[0].metri !== Math.min(...campagna.map(t => t.metri)))
    guasti.push('la prima tappa non è la più corta')
  return guasti
}
