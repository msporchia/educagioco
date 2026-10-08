// Il terreno di ogni scenario: quanti ostacoli e di che tipo. Un
// ostacolo non si attraversa (né l'eroe né i mostri); le frecce ci
// volano sopra. Le regole e i numeri: docs/survivors/terreno.md.
//   ostacoli  quanti per riquadro, in media, dove la zona è a metà:
//             le zone fitte ne hanno il doppio, quelle aperte quasi niente
//   tipi      quanto spesso esce ogni tipo (bosco, rocce, acqua)
//   macchie   gli altri posti che si trovano girando: una macchia di neve
//             in mezzo al prato, una pozza di lava nel deserto. Dentro una
//             macchia valgono gli ostacoli di quel posto

export const TERRENO = {
  prato:   { ostacoli: 0.2,  tipi: { bosco: 2, rocce: 1,   acqua: 2 },
             macchie: ['palude', 'neve', 'deserto'] },
  bosco:   { ostacoli: 0.6,  tipi: { bosco: 5, rocce: 1,   acqua: 1 },
             macchie: ['palude', 'neve', 'grotta'] },
  palude:  { ostacoli: 0.55, tipi: { bosco: 1.5, rocce: 0.5, acqua: 2.5 },
             macchie: ['bosco', 'deserto', 'neve'] },
  grotta:  { ostacoli: 0.6,  tipi: { bosco: 0.7, rocce: 3, acqua: 2 },
             macchie: ['neve', 'deserto', 'palude'] },
  deserto: { ostacoli: 0.5,  tipi: { bosco: 0.3, rocce: 3, acqua: 0.6 },
             macchie: ['grotta', 'palude', 'prato'] },
  neve:    { ostacoli: 0.7,  tipi: { bosco: 3, rocce: 2,   acqua: 1.5 },
             macchie: ['bosco', 'grotta', 'palude'] },
  notte:   { ostacoli: 0.5,  tipi: { bosco: 3, rocce: 1.5, acqua: 1.5 },
             macchie: ['palude', 'neve', 'deserto', 'grotta'] },
}

export const TIPI_OSTACOLO = ['bosco', 'rocce', 'acqua']

export const terrenoDi = chiave => TERRENO[chiave] || TERRENO.prato

export function guastiDelTerreno(terreno = TERRENO, scenari = null) {
  const guasti = []
  for (const [chiave, t] of Object.entries(terreno)) {
    const dove = `terreno "${chiave}"`
    if (!(t.ostacoli >= 0 && t.ostacoli <= 2)) guasti.push(`${dove}: ostacoli ${t.ostacoli}`)
    const pesi = Object.entries(t.tipi || {})
    if (!pesi.length) guasti.push(`${dove}: nessun tipo di ostacolo`)
    for (const [k, p] of pesi) {
      if (!TIPI_OSTACOLO.includes(k)) guasti.push(`${dove}: tipo "${k}" sconosciuto`)
      if (!(p > 0)) guasti.push(`${dove}: peso ${p} per "${k}"`)
    }
    for (const m of t.macchie || [])
      if (!terreno[m] || m === chiave) guasti.push(`${dove}: macchia "${m}"`)
  }
  if (scenari) for (const k of Object.keys(scenari))
    if (!terreno[k]) guasti.push(`scenario "${k}" senza terreno`)
  return guasti
}
