// La difficoltà, tutta in dato: aggiungere uno scaglione è aggiungere una
// riga. Il perché dei numeri (prove tarate al 40%, soglie delle stelle
// assolute e non frazioni) è in docs/codice-segreto/regole.md.

export const SCAGLIONI = [
  { chiave: 'facile',  nome: 'facile',  icona: '🐣',
    caselle: 3, simboli: 4, prove: 9, ripetizioni: false, premio: 2,
    perfetto: 3, bene: 4 },
  { chiave: 'normale', nome: 'normale', icona: '🐨',
    caselle: 4, simboli: 5, prove: 10, ripetizioni: true, premio: 3,
    perfetto: 4, bene: 5 },
  { chiave: 'tosto',   nome: 'tosto',   icona: '🦁',
    caselle: 4, simboli: 6, prove: 11, ripetizioni: true, premio: 4,
    perfetto: 4, bene: 6 },
  { chiave: 'esperto', nome: 'esperto', icona: '🐉',
    caselle: 5, simboli: 7, prove: 12, ripetizioni: true, premio: 6,
    perfetto: 5, bene: 7 },
]

export const PREDEFINITO = 'normale'

export const scaglione = chiave =>
  SCAGLIONI.find(s => s.chiave === chiave) ||
  SCAGLIONI.find(s => s.chiave === PREDEFINITO)

export function stellePer(scaglione, usate) {
  if (usate <= scaglione.perfetto) return 3
  if (usate <= scaglione.bene) return 2
  return 1
}

// Quanti codici diversi esistono con queste regole: il metro con cui si
// dice che uno scaglione è più duro di un altro davvero.
export function quantiCodici({ simboli, caselle, ripetizioni }) {
  if (ripetizioni) return Math.pow(simboli, caselle)
  let n = 1
  for (let i = 0; i < caselle; i++) n *= (simboli - i)
  return n
}

export function guastiDegliScaglioni(scaglioni = SCAGLIONI, quantiSimboli = 8) {
  const guasti = []
  const viste = new Set()
  for (const s of scaglioni) {
    const dove = `scaglione "${s.chiave}"`
    if (viste.has(s.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(s.chiave)
    if (!(s.caselle >= 2)) guasti.push(`${dove}: ${s.caselle} caselle non fanno un codice`)
    if (!(s.prove >= 3)) guasti.push(`${dove}: ${s.prove} prove sono troppo poche`)
    if (!(s.simboli >= 2)) guasti.push(`${dove}: ${s.simboli} disegni non fanno un codice`)
    if (s.simboli > quantiSimboli)
      guasti.push(`${dove}: chiede ${s.simboli} disegni, i temi ne hanno ${quantiSimboli}`)
    if (!s.ripetizioni && s.simboli < s.caselle)
      guasti.push(`${dove}: senza doppioni ${s.simboli} disegni non riempiono ${s.caselle} caselle`)
    if (!(s.premio > 0)) guasti.push(`${dove}: premio ${s.premio}`)
    if (!s.icona || !s.nome) guasti.push(`${dove}: senza nome o senza icona`)
    if (!(s.perfetto >= 1)) guasti.push(`${dove}: tre stelle in ${s.perfetto} prove`)
    if (!(s.bene >= s.perfetto)) guasti.push(`${dove}: due stelle (${s.bene}) prima di tre (${s.perfetto})`)
    if (s.bene >= s.prove)
      guasti.push(`${dove}: due stelle fino a ${s.bene} prove su ${s.prove} concesse, una stella non capita mai`)
  }
  for (let i = 1; i < scaglioni.length; i++) {
    if (quantiCodici(scaglioni[i]) <= quantiCodici(scaglioni[i - 1]))
      guasti.push(`"${scaglioni[i].chiave}" non è più duro di "${scaglioni[i - 1].chiave}"`)
    if (scaglioni[i].prove < scaglioni[i - 1].prove)
      guasti.push(`"${scaglioni[i].chiave}" è più duro di "${scaglioni[i - 1].chiave}" ` +
                  `ma concede meno prove (${scaglioni[i].prove} contro ${scaglioni[i - 1].prove})`)
  }
  if (!scaglioni.some(s => s.chiave === PREDEFINITO))
    guasti.push(`il predefinito "${PREDEFINITO}" non è nella tabella`)
  return guasti
}
