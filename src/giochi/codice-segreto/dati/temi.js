/* ═══════════════════════════════════════════════════════════════════
   I TEMI — cosa si vede sul tabellone

   Un tema è una tavolozza di otto disegni più un colore. Il gioco non
   cambia mai: cambia chi ci sta dentro. È quello che fa di nove tappe
   nove posti diversi invece della stessa schermata nove volte — e a un
   bambino «adesso tocca al mare» dice molto più di «adesso tocca al
   livello 4».

   Come si sceglie un disegno nuovo, in ordine di importanza:

   1. **si distingue da lontano e da piccolo.** Il codice si guarda in
      una casella di quaranta pixel: due musi arancioni vicini sono lo
      stesso muso, e un codice sbagliato perché non si vedono i simboli
      non insegna niente.
   2. **è un oggetto intero, non un dettaglio.** 🦊 sì, 🐾 no.
   3. **c'è su tutti i telefoni.** Le emoji arrivate da poco (🪼, 🪈) su un
      telefono di quattro anni fa sono un rettangolo vuoto, e otto
      rettangoli vuoti non sono un gioco.

   Otto per tema perché lo scaglione più duro ne chiede sette: uno di
   scorta e non si va a cercare il tema che non basta.
   ═══════════════════════════════════════════════════════════════════ */

export const TEMI = {
  /* Il nome dice **cosa è disegnato**, non dove si gioca: sulla mappa sta
     sotto il nome della tappa, e «L'officina · officina» non aggiunge
     niente mentre «L'officina · mezzi» dice cosa ci si trova. */
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

/* Quanti disegni servono al più esigente degli scaglioni. Sotto questo
   numero un tema non è utilizzabile e il test lo dice. */
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
    /* Lo stesso disegno in due temi non è un guasto in sé, ma se càpita
       spesso i temi cominciano ad assomigliarsi: meglio saperlo. */
    for (const s of t.simboli || []) {
      if (visti.has(s)) guasti.push(`${dove}: ${s} è già nel tema "${visti.get(s)}"`)
      else visti.set(s, chiave)
    }
  }
  return guasti
}
