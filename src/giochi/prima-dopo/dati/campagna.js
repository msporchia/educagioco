/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA — dieci tappe in tre scalini

   Come nel Codice Segreto: prima si mette in fila (tre vignette), poi
   la storia si allunga (quattro vignette, o un buco da riempire), poi
   si indovina (cosa viene dopo, cosa c'era prima, cosa non c'entra).
   L'ultima tappa mescola tutti e sei i verbi.

   Una tappa non elenca le storie una per una: dichiara `categorie` (a
   quali mondi può attingere) e `verbo` (come si chiede), e
   `motore/corsa.js` pesca da lì a ogni giro — così due partite della
   stessa tappa non fanno mai vedere la stessa fila di storie, e non
   c'è bisogno di scrivere venti righe di dati per ogni tappa.

   `quante` è quante storie servono per portarla a casa. Sbagliarne una
   non toglie niente: la fila giusta si accende un istante e si riprova
   — qui non si perde mai, si vede solo nelle stelle.
   ═══════════════════════════════════════════════════════════════════ */

export const SCALINI = [
  { chiave: 'facile',  nome: 'Tre figure',      icona: '🖼️',
    dritta: 'Tre vignette, da mettere in fila.' },
  { chiave: 'normale', nome: 'La storia lunga',  icona: '📜',
    dritta: 'Quattro vignette, o un buco da riempire nel mezzo.' },
  { chiave: 'tosto',   nome: 'Indovina',         icona: '🔮',
    dritta: 'Cosa viene prima, cosa viene dopo, cosa non c\'entra.' },
]

export const CAMPAGNA = [
  /* ── scalino 1: tre figure ── */
  { chiave: 'seme',        nome: 'Il seme cresce',    icona: '🌱', accento: '#2f9e44',
    portata: 4, scuola: 'sequenze',
    scalino: 'facile', verbo: 'ordina3', categorie: ['crescita'], quante: 4,
    racconto: 'Dal seme alla pianta: tre vignette da mettere in fila.' },
  { chiave: 'buongiorno',  nome: 'Buongiorno',        icona: '⏰', accento: '#e8590c',
    portata: 6, scuola: 'sequenze',
    scalino: 'facile', verbo: 'ordina3', categorie: ['routine'], quante: 4,
    racconto: 'La sveglia, la colazione, la scuola: in che ordine vengono?' },
  { chiave: 'cambia-forma', nome: 'Che forma prende', icona: '🍇', accento: '#9c36b5',
    portata: 8, scuola: 'sequenze',
    scalino: 'facile', verbo: 'ordina3', categorie: ['trasformazione', 'cucina'], quante: 5,
    racconto: 'Il latte, la mela, le patate: in cosa diventano?' },

  /* ── scalino 2: la storia lunga ── */
  { chiave: 'quattro-passi', nome: 'Quattro passi',    icona: '🚂', accento: '#1971c2',
    portata: 14, scuola: 'sequenze',
    scalino: 'normale', verbo: 'ordina4', categorie: ['routine', 'viaggio'], quante: 4,
    racconto: 'Adesso le vignette sono quattro.' },
  { chiave: 'il-buco',       nome: 'Il buco nel mezzo', icona: '🧩', accento: '#f08c00',
    portata: 16, scuola: 'sequenze',
    scalino: 'normale', verbo: 'manca', categorie: ['crescita', 'causa-effetto', 'costruzione', 'trasformazione'], quante: 5,
    racconto: "L'inizio e la fine ci sono già: cosa manca nel mezzo?" },
  { chiave: 'mondi-diversi', nome: 'Mondi diversi',    icona: '🌍', accento: '#0c8599',
    portata: 18, scuola: 'sequenze',
    scalino: 'normale', verbo: 'ordina4', categorie: ['crescita', 'trasformazione', 'routine', 'causa-effetto', 'costruzione', 'cucina', 'viaggio'], quante: 5,
    racconto: 'Le storie adesso arrivano da ovunque.' },

  /* ── scalino 3: indovina ── */
  { chiave: 'e-poi',    nome: 'E poi?',          icona: '➡️', accento: '#e64980',
    portata: 24, scuola: 'sequenze',
    scalino: 'tosto', verbo: 'dopo', categorie: ['routine', 'viaggio', 'causa-effetto'], quante: 4,
    racconto: 'Si vedono i primi due passi: cosa succede dopo?' },
  { chiave: 'e-prima',  nome: 'E prima?',        icona: '⬅️', accento: '#5c940d',
    portata: 26, scuola: 'sequenze',
    scalino: 'tosto', verbo: 'prima', categorie: ['crescita', 'trasformazione', 'cucina'], quante: 4,
    racconto: "Si vedono gli ultimi due passi: cosa c'era prima?" },
  { chiave: 'intruso',  nome: 'Chi non c\'entra', icona: '🔍', accento: '#e03131',
    portata: 28, scuola: 'sequenze',
    scalino: 'tosto', verbo: 'intruso', categorie: ['routine', 'viaggio', 'causa-effetto', 'costruzione', 'cucina'], quante: 4,
    racconto: 'Una vignetta è capitata nella storia sbagliata.' },
  { chiave: 'tutto-mescolato', nome: 'Tutto mescolato', icona: '🎲', accento: '#495057',
    portata: 32, scuola: 'sequenze',
    scalino: 'tosto', verbo: 'mescolato', categorie: ['crescita', 'trasformazione', 'routine', 'causa-effetto', 'costruzione', 'cucina', 'viaggio'], quante: 5,
    racconto: "Un po' di tutto: ordina, indovina, trova l'intruso." },
]

export const QUANTE_TAPPE = CAMPAGNA.length

export const tappa = indice => CAMPAGNA[Math.max(0, Math.min(indice, CAMPAGNA.length - 1))]

export const scalino = chiave => SCALINI.find(s => s.chiave === chiave) || SCALINI[0]

export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)

/* `storie` e `verbi` sono facoltativi: senza, si controlla solo la forma
   della campagna; con, si controlla anche che ogni tappa abbia abbastanza
   storie idonee a portarla a casa — e che le tappe facili non possano mai
   pescare una storia ambigua al contrario. */
export function guastiDellaCampagna(campagna = CAMPAGNA, storie = null, verbi = null) {
  const guasti = []
  const viste = new Set()
  for (const [i, t] of campagna.entries()) {
    const dove = `tappa ${i + 1} ("${t.chiave}")`
    if (viste.has(t.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.racconto) guasti.push(`${dove}: senza nome o senza racconto`)
    if (!t.icona || !t.accento) guasti.push(`${dove}: senza icona o senza accento`)
    if (!SCALINI.some(s => s.chiave === t.scalino))
      guasti.push(`${dove}: lo scalino "${t.scalino}" non esiste`)
    if (!Array.isArray(t.categorie) || !t.categorie.length)
      guasti.push(`${dove}: nessuna categoria dichiarata`)
    if (!(t.quante >= 4 && t.quante <= 5))
      guasti.push(`${dove}: ${t.quante} storie, ne servono fra 4 e 5`)

    if (verbi) {
      const chiaviVerbi = t.verbo === 'mescolato' ? Object.keys(verbi) : [t.verbo]
      if (t.verbo !== 'mescolato' && !verbi[t.verbo])
        guasti.push(`${dove}: il verbo "${t.verbo}" non esiste`)

      if (storie) for (const chiaveVerbo of chiaviVerbi) {
        const v = verbi[chiaveVerbo]
        if (!v) continue
        const idonee = storie.filter(s =>
          (t.categorie || []).includes(s.categoria) &&
          s.passi.length >= v.minPassi &&
          (t.scalino !== 'facile' || !s.ambiguaAlContrario))
        if (idonee.length < t.quante)
          guasti.push(`${dove}, verbo "${v.chiave}": solo ${idonee.length} storie idonee, ne servono ${t.quante}`)
      }
    }
  }

  /* gli scalini devono arrivare in fila e nessuno può restare vuoto */
  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1]))
    guasti.push('gli scalini non sono in fila: una tappa facile viene dopo una tosta')
  for (const s of SCALINI)
    if (!campagna.some(t => t.scalino === s.chiave))
      guasti.push(`lo scalino "${s.chiave}" non ha nemmeno una tappa`)

  return guasti
}
