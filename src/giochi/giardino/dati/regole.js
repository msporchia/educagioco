// Le misure del campo e i numeri che non sono di una pianta né di uno zombi.
// Dato puro: il motore le legge, nessuno qui gioca. Vedi docs/giardino/regole.md.

// Il campo è verticale (lo zombi scende, la pianta spara in su). Le coordinate
// sono di mondo: la tela si adatta, i numeri no.
export const CAMPO = {
  colonne: 5,
  righe: 8,
  cella: 64,
  rigaMin: 2,     // sopra questa riga non si pianta: gli zombi arrivano da lì
  casa: 24,       // la striscia con le case, in fondo
}
export const ALTEZZA = CAMPO.righe * CAMPO.cella      // dove comincia la casa

// i soli che cadono dal cielo, oltre a quelli dei girasoli
export const CIELO = { primo: 6, ogni: 11, vale: 25, dura: 9, caduta: 60 }

export const COLPO = { velocita: 320, danno: 1, raggio: 24 }
export const FRONTE = 22        // quanto sporge davanti allo zombi quello che lo ferma
export const MANGIA = 1.2       // vita al secondo che uno zombi toglie alla pianta che mangia
export const GELO = { fattore: 0.5, dura: 3 }
export const PASSO_MAX = 0.05   // il motore avanza a passi non più lunghi di così

// quanto pesa un conto: il prezzo della pianta decide la grandezza dei numeri
// (bravura.js dell'arena: un grado ogni due di peso sopra il terzo)
export const pesoDi = costo => 1 + costo / 40

export function guastiDelleRegole() {
  const g = []
  if (!(CAMPO.rigaMin >= 1 && CAMPO.rigaMin < CAMPO.righe)) g.push('rigaMin fuori dal campo')
  for (const k of ['primo', 'ogni', 'vale', 'dura', 'caduta'])
    if (!(CIELO[k] > 0)) g.push(`CIELO.${k} deve essere positivo`)
  if (!(GELO.fattore > 0 && GELO.fattore < 1)) g.push('GELO.fattore va fra 0 e 1')
  return g
}
