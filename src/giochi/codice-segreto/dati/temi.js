// Un tema è otto disegni più un colore: cambia il vestito, non il gioco.
// Come si sceglie un disegno nuovo: docs/codice-segreto/regole.md.

export const TEMI = {
  animali:  { nome: 'cuccioli',        icona: '🐾', accento: '#f0900e',
              simboli: ['🐶', '🐱', '🐰', '🦊', '🐼', '🐸', '🐷', '🦉'] },
  frutta:   { nome: 'frutta',          icona: '🧺', accento: '#e2467a',
              simboli: ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍐', '🍉'] },
  giardino: { nome: 'fiori e insetti', icona: '🌱', accento: '#16a34a',
              simboli: ['🌻', '🌵', '🍄', '🌲', '🐝', '🦋', '🐞', '🌷'] },
  mare:     { nome: 'pesci',           icona: '🌊', accento: '#0e9bbd',
              simboli: ['🐠', '🐙', '🦀', '🐳', '🐢', '🦈', '🦑', '🐬'] },
  dolci:    { nome: 'dolci',           icona: '🎂', accento: '#c2410c',
              simboli: ['🍩', '🍪', '🧁', '🍫', '🍭', '🍦', '🍰', '🍮'] },
  veicoli:  { nome: 'mezzi',           icona: '🔧', accento: '#2563eb',
              simboli: ['🚗', '🚌', '🚂', '🚁', '✈️', '🚲', '🚜', '🛵'] },
  sport:    { nome: 'palloni',         icona: '🏆', accento: '#dc2626',
              simboli: ['⚽', '🏀', '🎾', '🏈', '🏐', '🎱', '🏓', '🥊'] },
  faccine:  { nome: 'facce buffe',     icona: '🎭', accento: '#ca8a04',
              simboli: ['😀', '😎', '😡', '😱', '🥶', '🤢', '🤠', '🥳'] },
  spazio:   { nome: 'razzi e pianeti', icona: '🌌', accento: '#7c3aed',
              simboli: ['🚀', '🪐', '🌙', '👽', '🛸', '☄️', '🌟', '🔭'] },
}

export const CHIAVI_TEMI = Object.keys(TEMI)

export const tema = chiave => TEMI[chiave] || TEMI[CHIAVI_TEMI[0]]

// Quanti disegni servono al più esigente degli scaglioni.
export const MINIMO_SIMBOLI = 7

export function guastiDeiTemi(temi = TEMI) {
  const guasti = []
  const visti = new Map()
  for (const [chiave, t] of Object.entries(temi)) {
    const dove = `tema "${chiave}"`
    if (!t.nome || !t.icona) guasti.push(`${dove}: senza nome o senza icona`)
    if (!/^#[0-9a-f]{6}$/i.test(t.accento || '')) guasti.push(`${dove}: accento "${t.accento}" non è un colore`)
    if (!Array.isArray(t.simboli) || t.simboli.length < MINIMO_SIMBOLI)
      guasti.push(`${dove}: ${t.simboli?.length || 0} disegni, ne servono almeno ${MINIMO_SIMBOLI}`)
    if (new Set(t.simboli).size !== (t.simboli || []).length)
      guasti.push(`${dove}: c'è un disegno ripetuto dentro al tema`)
    for (const s of t.simboli || []) {
      if (visti.has(s)) guasti.push(`${dove}: ${s} è già nel tema "${visti.get(s)}"`)
      else visti.set(s, chiave)
    }
  }
  return guasti
}
