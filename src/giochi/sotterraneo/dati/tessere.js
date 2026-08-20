/* ═══════════════════════════════════════════════════════════════════
   QUALE PEZZO PER QUALE FORMA — le tavole del sotterraneo

   Dato puro: chiave della forma → nome dello sprite. Chi le legge è
   `scena/tela.js`, chi le chiavi le calcola è `grafica/tessere.js`
   (`bordoOtto`, `pezzoPer`), che di sprite non sa niente e infatti gira
   in Node. Aggiungere una forma è **aggiungere una riga qui**, mai un
   `if` in mezzo al disegno.

   ── SI LEGGE «DOVE FINISCE LA ROCCIA» ─────────────────────────────
   La chiave elenca i lati che NON sono roccia: `S` vuol dire che sotto
   c'è il pavimento, cioè questa cella è la parete che si vede di fronte;
   `SE` che la stanza gira anche a destra. È lo stesso verso di lettura
   di `fettaDi`, che guarda da che parte una zona finisce.

   ── QUELLO CHE NON C'È NELLA TAVOLA NON SI DISEGNA ────────────────
   Un buco si nota, una tessera a caso no — e una tessera a caso è il
   modo in cui i muri diventano un mosaico che nessuno capisce. Il set
   ha delle colonne per i fianchi est e ovest, pensate per essere
   impilate in un'altra geometria: infilate qui lasciavano strisce che
   non combaciavano con niente, e sono state tolte. Meglio un muro
   semplice e giusto che uno ricco e storto.
   ═══════════════════════════════════════════════════════════════════ */

import { EROI } from './eroi.js'

/* Il pavimento: otto varianti tutte di pietra crepata, nessuna a tinta
   piatta. `suolo-0` ripetuto è il modo di dire «le altre spuntano di
   rado»: a varianti equiprobabili il pavimento si legge come un motivo
   che si ripete, cioè come una tabella invece che come pietra. */
export const SUOLI = ['suolo-0', 'suolo-1', 'suolo-2', 'suolo-3', 'suolo-4',
                      'suolo-0', 'suolo-0', 'suolo-5', 'suolo-6', 'suolo-7']

/* Il riempimento: ogni roccia che tocca il pavimento, anche solo per un
   angolo, è mattoni. Prima si riempie e poi si rifinisce — il primo
   tentativo metteva solo i pezzi «giusti» per ogni bordo e le pareti
   venivano bucate proprio dove il pavimento le sfiora in diagonale. Una
   parete bucata non sembra uno stile, sembra un guasto. */
export const MATTONI = 'muro-basso-centro'

/* La parete vista di fronte, e il suo coronamento una cella più su. */
export const FACCE = {
  S: 'muro-basso-centro',
  SE: 'muro-basso-estremita-dx',
  SO: 'muro-basso-estremita-sx',
  SOE: 'muro-basso-centro',
}
export const CIME = {
  S: 'muro-alto-centro',
  SE: 'muro-alto-estremita-dx',
  SO: 'muro-alto-estremita-sx',
  SOE: 'muro-alto-centro',
}

/* Il lato di sotto della stanza: da lì si vede il coronamento del muro,
   non la sua faccia. */
export const CORONA = 'muro-alto-centro'

/* Le cose che non sono terreno: il nome del pezzo, o `null` per «questo
   il foglio non ce l'ha, resta l'emoji». La fontana e il mercante sono
   i due casi: 0x72 ha bracieri e fontane decorative ma nessuna che
   funzioni come una fonte, e di mercanti non ne ha affatto. */
export const PEZZO_DI = {
  scala: () => 'scala-giu',
  /* l'arredo porta il suo pezzo addosso: è dato deciso quando il piano
     è nato (`motore/livello.js`), e qui non si sceglie niente */
  arredo: r => r.pezzo,
  forziere: r => (r.aperto ? 'forziere-aperto' : 'forziere-chiuso'),
  porta: r => (r.aperta ? 'porta-aperta' : 'porta-chiusa'),
  gemme: (r, t) => `moneta-${((t * 8) | 0) % 4}`,
  /* la curiosità porta il suo pezzo addosso, come l'arredo: quale sia
     lo ha deciso il piano quando è nato */
  curiosita: r => r.pezzo,
  fonte: () => null,
  mercante: () => null,
}

/* Chi cammina: tre o quattro fotogrammi per posa, e le pose guardano a
   **destra** — la sinistra è la stessa specchiata, la convenzione di
   tutto il repo. */
export const pezzoAndante = (chi, posa, fr) => `${chi}-${posa}-${fr % 4}`

/* I nomi arrivano **da fuori**: questo file non importa l'atlante, che è
   generato e pesa dieci chilobyte di base64 — e i dati di un gioco non
   devono tirarsi dietro la grafica, o il motore smette di girare in Node
   senza schermo. Chi controlla (il test) legge i nomi dall'atlante e li
   passa di qui. */
export function guastiDelleTessere(nomi = null) {
  const g = []
  const ha = n => !nomi || nomi.includes(n)
  const chiedi = (n, dove) => { if (n && !ha(n)) g.push(`${dove}: nell'atlante non c'è "${n}"`) }

  for (const s of SUOLI) chiedi(s, 'suoli')
  chiedi(MATTONI, 'mattoni')
  chiedi(CORONA, 'corona')
  for (const [k, n] of Object.entries(FACCE)) chiedi(n, `faccia ${k}`)
  for (const [k, n] of Object.entries(CIME)) chiedi(n, `cima ${k}`)
  for (const k of Object.keys(FACCE))
    if (!CIME[k]) g.push(`la faccia ${k} non ha il suo coronamento`)
  if (nomi) {
    /* i quattro eroi si chiedono alla loro tabella: aggiungerne uno non
       deve voler dire ricordarsi di scriverlo anche qui */
    for (const chi of [...EROI.map(e => e.sprite), 'goblin', 'scheletro', 'orco', 'mostro-grosso'])
      for (const posa of ['fermo', 'corsa'])
        for (let i = 0; i < 4; i++) chiedi(pezzoAndante(chi, posa, i), `${chi} ${posa}`)
  }
  return g
}
