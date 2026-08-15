/* ═══════════════════════════════════════════════════════════════════
   L'AUTO-BORDO — un confine fra due materie, non un contorno attorno a una sola

   `dati/terreni.js` tiene la tabella (`TERRENI`, `bordiFra`): quali
   tessere separano l'acqua dal prato, domani l'acqua dalla roccia, la
   strada da sé stessa agli incroci. Questo file non sa cosa sia
   l'acqua: guarda i quattro vicini di una cella, chiede la LORO
   materia con `materiaDi(x,y)`, e per ognuno chiede a `bordiFra()` le
   nove tessere giuste — la stessa funzione vale per l'acqua, la
   strada e quello che verrà, perché il problema è sempre lo stesso
   («chi c'è intorno a me, e cosa gli si affaccia contro?») e non uno
   diverso per ogni materia.

   ── LA REGOLA PER IL CONFINE FRA TRE MATERIE ──────────────────────
   Una cella d'acqua può avere prato a nord e roccia a ovest insieme:
   un angolo dove le materie diverse dalla mia sono DUE, non una. Una
   sola tessera non può rendere contemporaneamente due bordi diversi —
   non esiste una tessera "riva-verso-prato-e-anche-verso-roccia" — e
   quindi bisogna scegliere una delle due. La scelta qui è: **vince il
   lato con la priorità più alta nell'ordine fisso N, S, E, O** — lo
   stesso ordine che decide anche quale bordo usare quando i lati
   mancanti non formano un angolo pulito (vedi sotto). Non è "la
   scelta esteticamente giusta": non esiste, a parità di informazione.
   È una scelta arbitraria ma SEMPRE LA STESSA: la stessa cella,
   disegnata due volte, dà sempre lo stesso risultato, ed è quello che
   conta per non vedere uno stagno "sfarfallare" fra due rese diverse.

   ── LE SEDICI COMBINAZIONI, LE NOVE TESSERE ───────────────────────
   Da strumenti/sprite/FORMATO.md: sedici combinazioni di vicini (per
   materia), nove tessere. Le rientranze a tre lati, i lati opposti
   mancanti insieme, la cella isolata: casi che il set non copre con
   una tessera dedicata, e che la specifica dice di risolvere con UN
   bordo solo — quello del primo lato diverso nell'ordine N, S, E, O.
   A 16 px di distanza non si nota.
   ═══════════════════════════════════════════════════════════════════ */
import { bordiFra, BASE } from '../dati/terreni.js'
export { guastiDeiTerreni } from '../dati/terreni.js'

/* Le tessere del bordo fra `materia` (la cella in esame) e `vicino`
   (chi le sta di fronte in quel punto), per il lato `lato`. Passa
   sempre da `bordiFra()`: è lì che vive il ripiego su `'*'`, e questa
   funzione non lo deve ripetere. */
function tessera(materia, vicino, lato) {
  const b = bordiFra(materia, vicino)
  return b ? b[lato] : null
}

/* Il pittore per materia. `materiaDi(x,y)` è il predicato nuovo — al
   posto del vecchio `dentro(x,y)→bool` c'è una funzione che RISPONDE
   CON LA MATERIA della cella, così questa funzione può distinguere
   «vicino diverso da me» da «vicino diverso da me, ED È ROCCIA»: la
   prima cosa decide la FORMA (centro/bordo/angolo), la seconda decide
   QUALE tabella di tessere usare.

   Ritorna il nome della tessera, o `null` se non c'è niente da
   disegnare lì — la cella è prato (il fondo, non ha un bordo suo) o
   la materia non ha ancora un bordo dichiarato verso quel vicino (è il
   caso di `strada` e `roccia` oggi, annunciate e senza tessere in
   `dati/terreni.js`): meglio niente che una tessera a caso. */
export function tesseraDi(materiaDi, x, y) {
  const materia = materiaDi(x, y)
  if (materia === BASE) return null            // il prato è il fondo, non un bordo

  const nN = materiaDi(x, y - 1), nS = materiaDi(x, y + 1)
  const nE = materiaDi(x + 1, y), nO = materiaDi(x - 1, y)
  const mN = nN !== materia, mS = nS !== materia
  const mE = nE !== materia, mO = nO !== materia

  /* Circondata da sé stessa: nessun vicino da cui prendere il bordo,
     quindi si usa BASE come vicino convenzionale — è la materia che,
     per definizione (vedi `dati/mondo.js`), sta ovunque non si sia
     dipinto altro, ed è sempre dichiarata per chi è dipingibile
     davvero (`dipingibili()` lo richiede). */
  if (!mN && !mS && !mE && !mO) return tessera(materia, BASE, 'centro')

  if (mN && mO && !mS && !mE) return tessera(materia, nN, 'no')
  if (mN && mE && !mS && !mO) return tessera(materia, nN, 'ne')
  if (mS && mO && !mN && !mE) return tessera(materia, nS, 'so')
  if (mS && mE && !mN && !mO) return tessera(materia, nS, 'se')

  if (mN) return tessera(materia, nN, 'n')
  if (mS) return tessera(materia, nS, 's')
  if (mE) return tessera(materia, nE, 'e')
  return tessera(materia, nO, 'o')             // arrivare qui vuol dire che mO è vero
}
