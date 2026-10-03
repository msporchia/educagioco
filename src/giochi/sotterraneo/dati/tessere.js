// Quale pezzo per quale cosa: dato puro, nome della cosa → nome dello sprite (letto da scena/tela.js). Lo
// scenario intero di un piano sta in una voce di SCENARI, tutte con le stesse chiavi (docs/sotterraneo/scenari.md).
// guastiDelleTessere chiede all'atlante ogni nome: un pezzo mancante è rosso nei test, non un muro invisibile.

import { EROI } from './eroi.js'
import { MOSTRI } from './mostri.js'
import { CAMPAGNA, TRATTI_DELL_ABISSO } from './campagna.js'

export const SCENARI = {
  cantine: {
    // quadrati di 4×4 celle, non piastrelle; stanza e corridoio hanno due disegni diversi
    pavimento: { stanza: 'cantine-pav-stanze', corridoio: 'cantine-pav-corridoi' },
    medaglione: 'cantine-medaglione',   // 3×3, sotto la fontana: si vede da lontano dov'è la stanza della fonte
    tetto: 'cantine-tetto',   // trama solo vicino a dove si cammina, o farebbe carta da parati sui muri spessi
    colori: { roccia: '#25201d' },
    faccia: 'cantine-faccia-fila',   // striscia di sei celle; le varianti sono una cella e ci si mettono in mezzo
    torcia: 'cantine-faccia-torcia',
    varianti: ['cantine-faccia-grata', 'cantine-faccia-arco', 'cantine-faccia-liscia',
               'cantine-faccia-toppa', 'cantine-faccia-mensola'],
    capi: { sx: 'cantine-capo-sx', dx: 'cantine-capo-dx' },
    bordi: { n: 'cantine-bordo-n', o: 'cantine-bordo-o', e: 'cantine-bordo-e',
             angolo: 'cantine-bordo-angolo' },
    // la pelle ripete col disegno il segno sopra la porta (SEGNI in dati/cose.js), e non mente mai
    porte: {
      davanti: { guardia: 'cantine-porta-teschio', tesoro: 'cantine-porta-oro',
                 mercante: 'cantine-porta-chiara', fonte: 'cantine-porta-ferro',
                 vuoto: 'cantine-porta-semplice', aperta: 'cantine-porta-aperta' },
      fianco: { guardia: 'cantine-fianco-teschio', tesoro: 'cantine-fianco-oro',
                mercante: 'cantine-fianco-chiara', fonte: 'cantine-fianco-ferro',
                vuoto: 'cantine-fianco-semplice', aperta: 'cantine-fianco-aperta' },
    },
    scala: { aperta: 'cantine-scala-aperta', chiusa: 'cantine-scala-chiusa' },
    fontana: { piena: 'cantine-fontana-piena', asciutta: 'cantine-fontana-asciutta' },   // bevuta resta lì, asciutta
    mercante: ['cantine-mercante-0', 'cantine-mercante-1'],
    perTerra: ['cantine-terriccio', 'cantine-sassolini', 'cantine-radice'],
    ragnatele: { sx: 'cantine-ragnatela-sx', dx: 'cantine-ragnatela-dx' },
    arredo: {}, dice: {},   // vuoti: l'arredo è quello di tutti (botti, casse, ossa) e dice quello di ARREDO_DICE
  },
  // la cripta (sotterraneo_4*.png): ritagliata da una scena, più due fogli coi pezzi che la scena non ha
  cripta: {
    pavimento: { stanza: 'cripta-pav-stanze', corridoio: 'cripta-pav-corridoi' },
    medaglione: 'cripta-medaglione',
    tetto: 'cripta-tetto',
    colori: { roccia: '#14181b' },
    faccia: 'cripta-faccia-fila',
    torcia: 'cripta-faccia-torcia',
    varianti: ['cripta-faccia-grata', 'cripta-faccia-liscia', 'cripta-faccia-toppa'],
    capi: { sx: 'cripta-capo-sx', dx: 'cripta-capo-dx' },
    // bordi con la fascia scura: `luce` è quanto è larga la riga chiara, da ripassare (scena/tela.js)
    bordi: { n: 'cripta-bordo-n', o: 'cripta-bordo-o', e: 'cripta-bordo-e',
             angolo: 'cripta-bordo-angolo', luce: 3 },
    porte: {
      davanti: { guardia: 'cripta-porta-teschio', tesoro: 'cripta-porta-oro',
                 mercante: 'cripta-porta-chiara', fonte: 'cripta-porta-ferro',
                 vuoto: 'cripta-porta-semplice', aperta: 'cripta-porta-aperta' },
      fianco: { guardia: 'cripta-fianco-teschio', tesoro: 'cripta-fianco-oro',
                mercante: 'cripta-fianco-chiara', fonte: 'cripta-fianco-ferro',
                vuoto: 'cripta-fianco-semplice', aperta: 'cripta-fianco-aperta' },
    },
    scala: { aperta: 'cripta-scala-aperta', chiusa: 'cripta-scala-chiusa' },
    fontana: { piena: 'cripta-fontana-piena', asciutta: 'cripta-fontana-asciutta' },
    mercante: ['cripta-mercante-0', 'cripta-mercante-1'],
    perTerra: ['cripta-foglie', 'cripta-schegge', 'cripta-lastra'],
    ragnatele: { sx: 'cripta-ragnatela-sx', dx: 'cripta-ragnatela-dx' },
    arredo: {}, dice: {},
  },
  // la fornace (sotterraneo_5*.png): ritagliata da una scena, più un foglio coi pezzi che la scena non ha
  fornace: {
    pavimento: { stanza: 'fornace-pav-stanze', corridoio: 'fornace-pav-corridoi' },
    medaglione: 'fornace-medaglione',
    tetto: 'fornace-tetto',
    colori: { roccia: '#1b1312' },
    faccia: 'fornace-faccia-fila',
    torcia: 'fornace-faccia-torcia',
    varianti: ['fornace-faccia-grata', 'fornace-faccia-liscia', 'fornace-faccia-toppa'],
    capi: { sx: 'fornace-capo-sx', dx: 'fornace-capo-dx' },
    bordi: { n: 'fornace-bordo-n', o: 'fornace-bordo-o', e: 'fornace-bordo-e', angolo: 'fornace-bordo-angolo' },
    porte: {
      davanti: { guardia: 'fornace-porta-corna', tesoro: 'fornace-porta-oro',
                 mercante: 'fornace-porta-chiara', fonte: 'fornace-porta-ferro',
                 vuoto: 'fornace-porta-semplice', aperta: 'fornace-porta-aperta' },
      fianco: { guardia: 'fornace-fianco-corna', tesoro: 'fornace-fianco-oro',
                mercante: 'fornace-fianco-chiara', fonte: 'fornace-fianco-ferro',
                vuoto: 'fornace-fianco-semplice', aperta: 'fornace-fianco-aperta' },
    },
    scala: { aperta: 'fornace-scala-aperta', chiusa: 'fornace-scala-chiusa' },
    fontana: { piena: 'fornace-fontana-piena', asciutta: 'fornace-fontana-asciutta' },   // lo stesso ottagono: vedi sotterraneo_5_2.json
    mercante: ['fornace-mercante-0', 'fornace-mercante-1'],
    perTerra: ['fornace-cenere', 'fornace-sassi', 'fornace-scoria'],
    ragnatele: { sx: 'fornace-ragnatela-sx', dx: 'fornace-ragnatela-dx' },
    // l'arredo generico (ARREDI in dati/mondo.js) cambia pelle e frase: restano le stesse regole di dove sta e di chi fa luce
    arredo: {
      barile: 'fornace-botte', cassa: 'fornace-carbone', ossa: 'fornace-incudine', 'teschio-scena': 'fornace-gargoyle-0',
      braciere: 'fornace-calderone', lanterna: 'fornace-calderone', stendardo: 'fornace-rastrelliera', candelabro: 'fornace-banco',
    },
    dice: {
      barile: 'Una botte di ferro, vuota.',
      cassa: 'Carbone. Nero, e non scalda più.',
      ossa: 'Un\'incudine: troppo pesante per spostarla.',
      'teschio-scena': 'Un gargoyle di pietra. Ti guarda male e basta.',
      braciere: 'Un calderone sulle braci. Scalda, e fa luce.',
      lanterna: 'Un calderone sulle braci. Scalda, e fa luce.',
      stendardo: 'Catene appese, di nessuno.',
      candelabro: 'Un banco da fabbro, con gli attrezzi.',
    },
  },
}

export const SCENARIO = 'cantine'   // di chi non dichiara il suo: una tappa con `scenario:`, l'abisso dal tratto

// la figura dice quanto vale prima di raccoglierlo: scostarsi per tre gemme o per dodici non è la stessa decisione
export const pezzoDelleGemme = (quante, t) =>
  (quante >= 12 ? 'mucchio-monete'
    : quante >= 6 ? 'moneta-grossa'
      : `moneta-${((t * 8) | 0) % 4}`)

// una funzione per genere, nessuna sa di canvas
export const PEZZO_DI = {
  scala: (r, t, sc, { chiusa } = {}) => (chiusa ? sc.scala.chiusa : sc.scala.aperta),
  arredo: (r, t, sc) => sc.arredo[r.pezzo] || r.pezzo,   // quale arredo è nato col piano (motore/livello.js); lo scenario gli cambia solo la pelle
  // quello d'oro è raro (vedendolo da lontano si decide se vale la strada); le altre famiglie solo chiuse
  forziere: r => (r.aperto ? 'forziere-aperto' : (r.pelle || 'forziere-chiuso')),
  porta: (r, t, sc, { verso = 'davanti' } = {}) => {
    const pelli = sc.porte[verso]
    return r.aperta ? pelli.aperta : (pelli[r.segno] || pelli.vuoto)
  },
  gemme: (r, t) => pezzoDelleGemme(r.quante, t),
  curiosita: r => r.pezzo,
  fonte: (r, t, sc) => (r.morto ? sc.fontana.asciutta : sc.fontana.piena),
  mercante: (r, t, sc) => sc.mercante[((t + r.x * 0.7 + r.y * 1.3) % 6) > 5 ? 1 : 0],   // saluta un secondo ogni sei
}

// tre o quattro fotogrammi per posa, guardano a destra: la sinistra è la stessa specchiata
export const pezzoAndante = (chi, posa, fr) => `${chi}-${posa}-${fr % 4}`

// tutti i nomi che uno scenario chiede all'atlante, tranne `colori`
export function pezziDelloScenario(sc) {
  const fuori = []
  const giu = v => {
    if (typeof v === 'string') fuori.push(v)
    else if (Array.isArray(v)) v.forEach(giu)
    else if (v && typeof v === 'object') Object.values(v).forEach(giu)
  }
  for (const [k, v] of Object.entries(sc)) if (k !== 'colori' && k !== 'dice') giu(v)
  return fuori
}

// i nomi arrivano da fuori: questo file non importa l'atlante, o il motore smetterebbe di girare in Node
export function guastiDelleTessere(nomi = null) {
  const g = []
  const ha = n => !nomi || nomi.includes(n)
  const chiedi = (n, dove) => { if (n && !ha(n)) g.push(`${dove}: nell'atlante non c'è "${n}"`) }

  if (!SCENARI[SCENARIO]) g.push(`lo scenario di ripiego "${SCENARIO}" non esiste`)
  const chiavi = Object.keys(SCENARI[SCENARIO] || {}).sort().join()
  for (const [k, sc] of Object.entries(SCENARI)) {
    // tutte le voci con le stesse chiavi, o una chiave mancante è un muro che non si disegna senza errori
    if (Object.keys(sc).sort().join() !== chiavi)
      g.push(`lo scenario ${k} non ha le stesse voci di ${SCENARIO}`)
    for (const n of pezziDelloScenario(sc)) chiedi(n, `scenario ${k}`)
    for (const q of Object.keys(sc.dice || {}))
      if (!(sc.arredo || {})[q]) g.push(`scenario ${k}: la frase dell'arredo "${q}" non ha il suo pezzo`)
    for (const verso of ['davanti', 'fianco'])
      for (const pelle of ['guardia', 'tesoro', 'mercante', 'fonte', 'vuoto', 'aperta'])
        if (!(sc.porte && sc.porte[verso] && sc.porte[verso][pelle]))
          g.push(`lo scenario ${k} non ha la porta ${pelle} vista ${verso}`)
  }
  // chi lo chiede per nome deve trovarlo: la tela ripiegherebbe in silenzio
  for (const t of [...CAMPAGNA, ...TRATTI_DELL_ABISSO])
    if (t.scenario && !SCENARI[t.scenario]) g.push(`${t.nome}: lo scenario "${t.scenario}" non esiste`)
  for (const [k, sc] of Object.entries(SCENARI))
    if (!(sc.perTerra || []).length) g.push(`lo scenario ${k} non ha niente per terra`)
  for (const q of [1, 6, 12]) chiedi(pezzoDelleGemme(q, 0), `gemme da ${q}`)
  chiedi('forziere-oro-chiuso', 'forziere d\'oro')
  chiedi('forziere-scuro-chiuso', 'forziere scuro')
  if (nomi) {
    // eroi e mostri si chiedono alle loro tabelle, non a un elenco a mano; `unaPosa` ha solo il respiro (scena/tela.js)
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
