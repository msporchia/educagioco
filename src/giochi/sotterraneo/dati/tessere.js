/* ═══════════════════════════════════════════════════════════════════
   QUALE PEZZO PER QUALE COSA — le tavole del sotterraneo

   Dato puro: nome della cosa → nome dello sprite. Chi le legge è
   `scena/tela.js`; *quale forma* ha una cella di muro lo decide
   `scena/muri.js`, che di sprite non sa niente e infatti gira in Node.
   Aggiungere un pezzo è **aggiungere una riga qui**, mai un `if` in
   mezzo al disegno.

   ── LO SCENARIO ─────────────────────────────────────────────────
   Il vestito intero di un piano — pavimenti, tetto, facce, bordi,
   porte, scala, fontana, mercante e le cose per terra — sta in una voce
   di `SCENARI`, e tutte le voci hanno **le stesse chiavi**: è quello che
   permette di cambiare vestito a una discesa senza toccare la tela. Uno
   scenario nuovo nasce da un blocco di prompt
   (`strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-scenario.md`):
   si genera la scena, poi il foglio dei pezzi, si ritaglia col suo
   foglietto e si aggiunge una voce qui. Per ora ce n'è uno solo, le
   cantine, e lo indossano tutte le discese.

   ── QUELLO CHE NON C'È NELLA TAVOLA NON SI DISEGNA ────────────────
   Un buco si nota, una tessera a caso no. `guastiDelleTessere` chiede
   all'atlante ogni nome di ogni scenario: uno scenario a cui manca un
   pezzo è rosso nei test, non un muro invisibile in partita.
   ═══════════════════════════════════════════════════════════════════ */

import { EROI } from './eroi.js'
import { MOSTRI } from './mostri.js'

export const SCENARI = {
  cantine: {
    /* i fondi sono quadrati di 4×4 celle, non piastrelle: ogni cella
       prende il suo pezzo del quadrato, e il pavimento non si legge più
       come una tabella. La stanza e il corridoio hanno due disegni
       diversi perché è la prima cosa che dice dove si è. */
    pavimento: { stanza: 'cantine-pav-stanze', corridoio: 'cantine-pav-corridoi' },
    /* il mosaico non si ripete: è un medaglione di 3×3 celle, e va
       sotto la fontana — si vede da lontano dov'è la stanza della fonte */
    medaglione: 'cantine-medaglione',
    /* il tetto ha la sua trama solo vicino a dove si cammina; lontano è
       roccia quasi piatta, del colore che ha nella scena generata
       (`sotterraneo_1.png`). Ripetuta dappertutto, la trama di sassi e
       radici faceva carta da parati sui muri spessi. */
    tetto: 'cantine-tetto',
    colori: { roccia: '#25201d' },
    /* la fila di facce è una striscia di sei celle; le varianti sono una
       cella l'una e ci si mettono in mezzo */
    faccia: 'cantine-faccia-fila',
    torcia: 'cantine-faccia-torcia',
    varianti: ['cantine-faccia-grata', 'cantine-faccia-arco', 'cantine-faccia-liscia',
               'cantine-faccia-toppa', 'cantine-faccia-mensola'],
    capi: { sx: 'cantine-capo-sx', dx: 'cantine-capo-dx' },
    /* i bordi del tetto, uno per lato, e il blocco d'angolo */
    bordi: { n: 'cantine-bordo-n', o: 'cantine-bordo-o', e: 'cantine-bordo-e',
             angolo: 'cantine-bordo-angolo' },
    /* ── la pelle di una porta dice cosa c'è dietro ──
       Il segno sopra la porta lo dice con un'emoji (`SEGNI` in
       `dati/cose.js`); la pelle lo ripete **col disegno**, che è la
       lingua che un bambino legge per prima. Dietro il teschio c'è la
       guardia, dietro l'oro la roba buona, e come prima non mentono mai.
       Due versi: di fronte nella fila delle facce, di taglio in un muro
       che va dall'alto in basso (`versoDellaPorta` in `scena/muri.js`). */
    porte: {
      davanti: { guardia: 'cantine-porta-teschio', tesoro: 'cantine-porta-oro',
                 mercante: 'cantine-porta-chiara', fonte: 'cantine-porta-ferro',
                 vuoto: 'cantine-porta-semplice', aperta: 'cantine-porta-aperta' },
      fianco: { guardia: 'cantine-fianco-teschio', tesoro: 'cantine-fianco-oro',
                mercante: 'cantine-fianco-chiara', fonte: 'cantine-fianco-ferro',
                vuoto: 'cantine-fianco-semplice', aperta: 'cantine-fianco-aperta' },
    },
    /* la scala è chiusa da una grata finché la chiave del piano non è
       presa: è la cosa che non si può aggirare, e adesso si vede */
    scala: { aperta: 'cantine-scala-aperta', chiusa: 'cantine-scala-chiusa' },
    /* la fonte bevuta resta dov'era, asciutta: sparire faceva di una
       stanza con qualcosa una stanza vuota */
    fontana: { piena: 'cantine-fontana-piena', asciutta: 'cantine-fontana-asciutta' },
    mercante: ['cantine-mercante-0', 'cantine-mercante-1'],
    perTerra: ['cantine-terriccio', 'cantine-sassolini', 'cantine-radice'],
    ragnatele: { sx: 'cantine-ragnatela-sx', dx: 'cantine-ragnatela-dx' },
  },
}

/* Quello che indossano tutte le discese, finché ce n'è uno solo. Il
   giorno che ce ne sono due, la tappa dichiara il suo (`scenario:` in
   `dati/campagna.js`) e questo resta il ripiego. */
export const SCENARIO = 'cantine'

/* ── quanto luccica quello che c'è per terra ──
   Una monetina, una moneta grossa, un mucchio: la figura dice **quanto
   vale** prima di raccoglierlo, e scostarsi dalla strada per tre gemme
   o per dodici non è la stessa decisione. Sotto le cinque resta
   l'animazione della monetina, che gira e si fa notare. */
export const pezzoDelleGemme = (quante, t) =>
  (quante >= 12 ? 'mucchio-monete'
    : quante >= 6 ? 'moneta-grossa'
      : `moneta-${((t * 8) | 0) % 4}`)

/* Il pezzo di una cosa in scena. Ricevono la cosa, l'orologio, lo
   scenario e quello che la tela sa del posto (`verso` di una porta,
   `chiusa` per la scala): una funzione per genere, e nessuna sa di
   canvas. */
export const PEZZO_DI = {
  scala: (r, t, sc, { chiusa } = {}) => (chiusa ? sc.scala.chiusa : sc.scala.aperta),
  /* l'arredo porta il suo pezzo addosso: è dato deciso quando il piano
     è nato (`motore/livello.js`), e qui non si sceglie niente */
  arredo: r => r.pezzo,
  /* il forziere porta la sua pelle addosso, decisa quando il piano è
     nato: quello d'oro è raro, e vedendolo da lontano si decide se vale
     la strada. Mezzo e aperto restano i due di sempre — le altre
     famiglie il foglio le disegna solo chiuse. */
  forziere: r => (r.aperto ? 'forziere-aperto' : (r.pelle || 'forziere-chiuso')),
  porta: (r, t, sc, { verso = 'davanti' } = {}) => {
    const pelli = sc.porte[verso]
    return r.aperta ? pelli.aperta : (pelli[r.segno] || pelli.vuoto)
  },
  gemme: (r, t) => pezzoDelleGemme(r.quante, t),
  /* la curiosità porta il suo pezzo addosso, come l'arredo: quale sia
     lo ha deciso il piano quando è nato */
  curiosita: r => r.pezzo,
  fonte: (r, t, sc) => (r.morto ? sc.fontana.asciutta : sc.fontana.piena),
  /* il mercante saluta ogni tanto: un secondo ogni sei, e ognuno col suo
     tempo, così due mercanti in due stanze non salutano insieme */
  mercante: (r, t, sc) => sc.mercante[((t + r.x * 0.7 + r.y * 1.3) % 6) > 5 ? 1 : 0],
}

/* Chi cammina: tre o quattro fotogrammi per posa, e le pose guardano a
   **destra** — la sinistra è la stessa specchiata, la convenzione di
   tutto il repo. */
export const pezzoAndante = (chi, posa, fr) => `${chi}-${posa}-${fr % 4}`

/* Tutti i nomi che uno scenario chiede all'atlante: le foglie della sua
   voce, qualunque forma abbiano (stringa, elenco, tabella di tabelle),
   tranne `colori`, che sono colori e non pezzi. */
export function pezziDelloScenario(sc) {
  const fuori = []
  const giu = v => {
    if (typeof v === 'string') fuori.push(v)
    else if (Array.isArray(v)) v.forEach(giu)
    else if (v && typeof v === 'object') Object.values(v).forEach(giu)
  }
  for (const [k, v] of Object.entries(sc)) if (k !== 'colori') giu(v)
  return fuori
}

/* I nomi arrivano **da fuori**: questo file non importa l'atlante, che è
   generato e pesa centinaia di chilobyte di base64 — e i dati di un
   gioco non devono tirarsi dietro la grafica, o il motore smette di
   girare in Node senza schermo. Chi controlla (il test) legge i nomi
   dall'atlante e li passa di qui. */
export function guastiDelleTessere(nomi = null) {
  const g = []
  const ha = n => !nomi || nomi.includes(n)
  const chiedi = (n, dove) => { if (n && !ha(n)) g.push(`${dove}: nell'atlante non c'è "${n}"`) }

  if (!SCENARI[SCENARIO]) g.push(`lo scenario di ripiego "${SCENARIO}" non esiste`)
  const chiavi = Object.keys(SCENARI[SCENARIO] || {}).sort().join()
  for (const [k, sc] of Object.entries(SCENARI)) {
    /* tutte le voci con le stesse chiavi: la tela chiede `sc.bordi.n`
       senza domandarsi quale scenario sia, e una chiave che manca è un
       muro che non si disegna — senza errori, perché `drawImage` con un
       nome che non c'è torna senza disegnare e senza lanciare */
    if (Object.keys(sc).sort().join() !== chiavi)
      g.push(`lo scenario ${k} non ha le stesse voci di ${SCENARIO}`)
    for (const n of pezziDelloScenario(sc)) chiedi(n, `scenario ${k}`)
    for (const verso of ['davanti', 'fianco'])
      for (const pelle of ['guardia', 'tesoro', 'mercante', 'fonte', 'vuoto', 'aperta'])
        if (!(sc.porte && sc.porte[verso] && sc.porte[verso][pelle]))
          g.push(`lo scenario ${k} non ha la porta ${pelle} vista ${verso}`)
  }
  for (const q of [1, 6, 12]) chiedi(pezzoDelleGemme(q, 0), `gemme da ${q}`)
  chiedi('forziere-oro-chiuso', 'forziere d\'oro')
  chiedi('forziere-scuro-chiuso', 'forziere scuro')
  if (nomi) {
    /* gli eroi e i mostri si chiedono alle **loro** tabelle: aggiungerne
       uno non deve voler dire ricordarsi di scriverlo anche qui. I
       mostri erano invece un elenco a mano di quattro nomi, ed è
       esattamente il posto in cui un bestiario di undici creature
       sarebbe entrato senza che niente lo controllasse.

       Chi dichiara `unaPosa` ha solo il respiro: chiedergli anche la
       corsa griderebbe al lupo su un pezzo che nessuno disegna mai
       (vedi `scena/tela.js`). */
    const chiedeva = [
      ...EROI.map(e => ({ sprite: e.sprite, pose: ['fermo', 'corsa'] })),
      ...Object.values(MOSTRI).map(m => ({
        sprite: m.sprite, pose: m.unaPosa ? ['fermo'] : ['fermo', 'corsa'],
      })),
    ]
    for (const { sprite, pose } of chiedeva)
      for (const posa of pose)
        for (let i = 0; i < 4; i++) chiedi(pezzoAndante(sprite, posa, i), `${sprite} ${posa}`)
  }
  return g
}
