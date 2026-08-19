/* ═══════════════════════════════════════════════════════════════════
   CHI ABITA IL SOTTERRANEO

   `ossa` è la vita, `att` quanto picchia, `dif` quanto para. Il costo in
   domande **non sta qui e non ci deve stare**: è la vita divisa il tuo
   attacco, cioè cambia con quello che hai trovato. È tutto il motivo per
   cui si va a cercare una spada.

   ── LA DIFESA È LA MANOPOLA VELENOSA ─────────────────────────────
   Va tenuta bassa. Con attacco 3 e difesa 2 il colpo scende a 1, e
   abbattere un golem costa **diciotto risposte di fila**. Un numero così
   non si vede leggendo la tabella: si vede solo contando, ed è il motivo
   per cui il conto sta nel banco di prova (`motore/banco.js`) e non a
   occhio. Il tetto è: nessun mostro deve costare più di ~8 risposte a
   chi lo incontra quando è il suo momento, e `guastiDeiMostri()` lo
   controlla contro l'eroe nudo.

   ── I NOMI DEGLI SPRITE SONO QUELLI CHE IL FOGLIO SA DISEGNARE ────
   0x72 disegna goblin, scheletri, orchi e un mostro grosso, e basta: i
   mostri del gioco sono diventati quelli. È il buco che decide se un set
   basta, e va guardato **prima** di innamorarsene — vale anche per le
   armature, che infatti non ci sono (vedi `cose.js`).
   ═══════════════════════════════════════════════════════════════════ */
import { EROE } from './mondo.js'
import { ARMI_DI } from './cose.js'

export const MOSTRI = {
  goblin: {
    em: '👺', sprite: 'goblin', nome: 'Un goblin',
    ossa: 4, att: 2, dif: 0, gemme: 2,
    lascia: ['pozione-piccola'],
  },
  scheletro: {
    em: '💀', sprite: 'scheletro', nome: 'Uno scheletro',
    ossa: 8, att: 3, dif: 1, gemme: 5,
    /* le armi si chiedono per **gradino**: una famiglia nuova entra nel
       bottino senza che nessuno debba ricordarsi di aggiungerla qui */
    lascia: [...ARMI_DI(1), 'panciotto', 'pozione-piccola'],
  },
  orco: {
    em: '👹', sprite: 'orco', nome: 'Un orco',
    ossa: 12, att: 4, dif: 1, gemme: 8,
    lascia: [...ARMI_DI(2), 'corazza', 'pozione'],
  },
  gigante: {
    em: '🗿', sprite: 'mostro-grosso', nome: 'Il gigante',
    ossa: 17, att: 5, dif: 1, gemme: 12, capo: true,
    lascia: [...ARMI_DI(3), 'manto', 'amuleto-rosso'],
  },
}

export const CHIAVI_MOSTRI = Object.keys(MOSTRI)

/* Chi si incontra per strada, dal più tenero: `tipoPer()` in
   `motore/livello.js` pesca qui dentro secondo la profondità. Il
   guardiano invece è dichiarato dalla tappa, perché è **la** cosa che
   non si può aggirare. */
export const BRANCO = ['goblin', 'goblin', 'scheletro', 'orco']

/* Quante risposte costa abbattere un mostro con un dato attacco. È il
   conto vero del gioco (`Corsa.colpiPer`), qui perché possa provarlo
   anche chi guarda solo i dati. */
export const colpiPer = (m, attacco) =>
  Math.max(1, Math.ceil(m.ossa / Math.max(1, attacco - m.dif)))

export function guastiDeiMostri() {
  const g = []
  for (const [k, m] of Object.entries(MOSTRI)) {
    if (!m.sprite) g.push(`${k}: senza sprite`)
    if (m.ossa < 1) g.push(`${k}: senza ossa`)
    if (m.dif >= EROE.att) g.push(`${k}: difesa ${m.dif} contro attacco nudo ${EROE.att}, il colpo si azzera`)
    /* Il tetto è ~8 risposte di fila contro chi lo incontra **quando è
       il suo momento**: i mostri di strada si incontrano a mani nude, un
       capo dopo aver trovato almeno una spada — e infatti il suo bottino
       è quello che paga l'ascia per il capo dopo. Contarli tutti a mani
       nude direbbe che il gigante è fuori misura quando non lo è. */
    const braccio = EROE.att + (m.capo ? 2 : 0)
    const costo = colpiPer(m, braccio)
    if (costo > 8) g.push(`${k}: ${costo} risposte di fila con attacco ${braccio}, troppe`)
    for (const c of m.lascia || []) if (typeof c !== 'string') g.push(`${k}: lascia una cosa senza nome`)
  }
  for (const t of BRANCO) if (!MOSTRI[t]) g.push(`nel branco c'è "${t}", che non esiste`)
  return g
}
