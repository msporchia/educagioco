/* LE BOTTEGHE DEL PAESE, SENZA BROWSER

   Le cose che questo file difende (`docs/fattoria-albero.md` §8.3):
     1. **una bottega chiede solo dal suo elenco, e solo l'ottenibile** —
        controllato al livello in cui arriva e in cima alla scaletta;
     2. **un cliente, una merce, 2–4 pezzi**, e il premio è quello del
        banco per un quarto in più — esperienza, mai monete;
     3. **il cliente dopo arriva fra 10 e 20 minuti**, dopo una consegna
        come dopo un «non mi va», e chi aspetta aspetta per sempre;
     4. **la fama**: cinque consegne, un bancone in più, fino a tre;
     5. **un salvataggio si riapre uguale**, e uno di ieri nasce vuoto;
     6. **i dati stanno in piedi**: nessun guasto, tetto compreso.
   `node test/esegui.mjs botteghe --niente-build` */
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import {
  bottegaIn, aggiornaLaBottega, aggiornaLeBotteghe, consegnaInBottega,
  rifiutaInBottega, famaDi, bottegaDi, daConsegnareIn, merciDellaBottega,
} from '../../src/giochi/fattoria/motore/botteghe.js'
import { merciOrdinabili } from '../../src/giochi/fattoria/motore/mercato.js'
import {
  guastiDelleBotteghe, POSTI, PEZZI_MIN, PEZZI_MAX, ATTESA_MIN, ATTESA_MAX,
  CUORI, BANCONI_MAX, PIU_DEL_BANCO,
} from '../../src/giochi/fattoria/dati/botteghe.js'
import { premioPer, guastiDelMercato, CLIENTI } from '../../src/giochi/fattoria/dati/mercato.js'
import { PER_ID, guastiDelCatalogo } from '../../src/giochi/fattoria/dati/catalogo.js'
import { ULTIMO, sogliaDi, guastiDegliSblocchi, livelloDellaVoce, livelloDelProdotto }
  from '../../src/giochi/fattoria/dati/livelli.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const MINUTO = 60000

/* Una sorte seminabile. I primi giri di uno xorshift con un seme
   piccolo sono piccoli anche loro — semi vicini danno tutti un primo
   numero vicino a zero, cioè sempre la prima merce dell'elenco — e qui
   un cliente pesca una volta sola: si scaldano buttandone qualcuno. */
function sorte(seme = 1) {
  let s = seme >>> 0 || 1
  const tira = () => {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
  for (let i = 0; i < 8; i++) tira()
  return tira
}

function borsaTracciata(iniziale) {
  let n = iniziale
  return { quante: () => n, paga: c => { n -= c; return true }, saldo: () => n }
}

/* Una fattoria a un certo livello, con tutti i premi presi, i tre
   silos e la bottega in mappa. `speso` si scrive a mano: come si sale
   di livello non è la cosa che si prova qui. */
function conLaBottega(id, livello = livelloDellaVoce(PER_ID[id]), borsa = borsaInfinita()) {
  const f = new Fattoria({ borsa })
  f.speso = sogliaDi(livello)
  f.reclamaTutto()
  for (const [s, x, y] of [['silo', 22, 22], ['silo_bianco', 26, 22], ['dispensa', 20, 26]]) {
    if (!f.sbloccata(s)) continue
    const dove = f.cellaLibera(x, y)
    const r = f.posa(s, dove.x, dove.y)
    if (!r.ok) throw new Error(`${s} non si posa: ${r.motivo}`)
  }
  if (id && f.sbloccata(id)) {
    const dove = f.cellaLibera(14, 14)
    const r = f.posa(id, dove.x, dove.y)
    if (!r.ok) throw new Error(`${id} non si posa: ${r.motivo}`)
  }
  return f
}

const clientiDi = (f, id) => ((f.botteghe[id] || {}).banconi || []).filter(o => o && o.chiede)
const attesaDi = (f, id) => ((f.botteghe[id] || {}).banconi || []).filter(o => o && o.dal)
/* Mette in mano quello che il cliente chiede e consegna. */
function accontenta(f, id, o, ora, rnd) {
  for (const [p, n] of Object.entries(o.chiede)) f.metti(p, n)
  return consegnaInBottega(f, id, o.id, ora, rnd)
}

/* ══════════ 1. i dati stanno in piedi ══════════ */
{
  for (const [nome, g] of [['delle botteghe', guastiDelleBotteghe()],
                           ['degli sblocchi', guastiDegliSblocchi()],
                           ['del catalogo', guastiDelCatalogo()],
                           ['del mercato', guastiDelMercato()]])
    controlla(`nessun guasto ${nome}`, g.length === 0, g.join(' · '))
  uguale('le botteghe del paese sono quattro', POSTI.map(v => v.id).join(' '),
         'pasticceria osteria mensa merceria')
  for (const v of POSTI) {
    controlla(`${v.id} è unica`, !!v.unico)
    const subito = v.posto.chiede.filter(p => livelloDelProdotto(p) <= livelloDellaVoce(v))
    controlla(`${v.id} arriva con almeno tre merci da chiedere`, subito.length >= 3,
              subito.join(', '))
  }
  controlla('il bidello c\'è, per la mensa', CLIENTI.some(c => c.id === 'bidello'))
}

/* ══════════ 2. il suo elenco, e solo l'ottenibile ══════════
   Si prova al livello in cui la bottega arriva — dove l'elenco è più
   stretto — e in cima alla scaletta, dove c'è tutto. */
for (const v of POSTI) {
  for (const liv of [livelloDellaVoce(v), ULTIMO]) {
    const f = conLaBottega(v.id, liv)
    const lecite = new Set(merciOrdinabili(f))
    let fuori = 0, storti = 0, estranei = 0, quanti = 0
    const pezzi = new Set(), merci = new Set()
    for (let s = 1; s <= 150; s++) {
      f.botteghe = {}
      aggiornaLaBottega(f, v.id, 1000, sorte(liv * 1000 + s))
      for (const o of clientiDi(f, v.id)) {
        quanti++
        const chiede = Object.entries(o.chiede)
        if (chiede.length !== 1) { storti++; continue }
        const [[p, n]] = chiede
        merci.add(p); pezzi.add(n)
        if (!v.posto.chiede.includes(p) || !lecite.has(p)) fuori++
        if (!v.posto.clienti.includes(o.chi)) estranei++
        if (o.xp !== Math.round(premioPer({ [p]: n }) * PIU_DEL_BANCO)) storti++
      }
    }
    uguale(`${v.id} al ${liv}: chiede solo dal suo elenco, e solo l'ottenibile (${quanti})`,
           fuori, 0)
    uguale(`${v.id} al ${liv}: una merce sola, col premio del banco ×1,25`, storti, 0)
    uguale(`${v.id} al ${liv}: e chi chiede è di casa`, estranei, 0)
    dentro(`${v.id} al ${liv}: da ${Math.min(...pezzi)} a ${Math.max(...pezzi)} pezzi`,
           Math.min(...pezzi), PEZZI_MIN, PEZZI_MAX)
    dentro(`${v.id} al ${liv}: mai più di ${PEZZI_MAX}`, Math.max(...pezzi), PEZZI_MIN, PEZZI_MAX)
    uguale(`${v.id} al ${liv}: escono tutte le quantità`, pezzi.size, PEZZI_MAX - PEZZI_MIN + 1)
    /* e prima o poi le chiede tutte: un filtro che lasciasse passare solo
       la prima dell'elenco supererebbe il controllo di sopra */
    uguale(`${v.id} al ${liv}: prima o poi chiede tutto quello che può`,
           merciDellaBottega(f, v.id).filter(p => !merci.has(p)).join(' '), '')
  }
}

/* Il premio, scritto una volta: tre biscotti del banco valgono un quarto
   in meno di tre biscotti della pasticcera. */
nota(`3 biscotti: ⭐${premioPer({ biscotti: 3 })} al banco, ` +
     `⭐${Math.round(premioPer({ biscotti: 3 }) * 1.25)} in pasticceria`)

/* ══════════ 3. consegnare: esperienza, mai monete; e l'attesa ══════════ */
{
  const borsa = borsaTracciata(5000)
  const f = conLaBottega('pasticceria', 26, borsa)
  const soldi = borsa.saldo()
  aggiornaLaBottega(f, 'pasticceria', 1000, sorte(3))
  uguale('al primo giro c\'è un bancone con un cliente', clientiDi(f, 'pasticceria').length, 1)
  const o = clientiDi(f, 'pasticceria')[0]
  const primaXp = f.esperienza

  const no = consegnaInBottega(f, 'pasticceria', o.id, 1000, sorte(4))
  uguale('a silo vuoto non si consegna', no.motivo, 'manca-roba')

  const r = accontenta(f, 'pasticceria', o, 2000, sorte(5))
  controlla('con la roba in mano si consegna', r.ok, r.motivo)
  uguale('l\'esperienza sale del premio', f.esperienza - primaXp, o.xp)
  uguale('le monete non si toccano', borsa.saldo(), soldi)
  uguale('la merce esce dal silo', f.quantoHo(Object.keys(o.chiede)[0]), 0)
  dentro('il cliente dopo arriva fra 10 e 20 minuti', r.attesa, ATTESA_MIN, ATTESA_MAX)
  uguale('e intanto il bancone aspetta', clientiDi(f, 'pasticceria').length, 0)
  uguale('con la sua attesa', attesaDi(f, 'pasticceria').length, 1)
  const dal = attesaDi(f, 'pasticceria')[0].dal
  uguale('scritta come ora vera', dal, 2000 + r.attesa * MINUTO)
  uguale('la schermata dice fra quanto',
         bottegaDi(f, 'pasticceria', 2000).banconi[0].minuti, r.attesa)

  aggiornaLaBottega(f, 'pasticceria', dal - MINUTO, sorte(6))
  uguale('un minuto prima non è arrivato nessuno', clientiDi(f, 'pasticceria').length, 0)
  aggiornaLaBottega(f, 'pasticceria', dal, sorte(7))
  uguale('all\'ora giusta arriva', clientiDi(f, 'pasticceria').length, 1)

  /* Un cliente che aspetta aspetta per sempre: un anno dopo è lì. */
  const lui = clientiDi(f, 'pasticceria')[0]
  aggiornaLaBottega(f, 'pasticceria', dal + 365 * 24 * 60 * MINUTO, sorte(8))
  uguale('un cliente aspetta per sempre', clientiDi(f, 'pasticceria')[0].id, lui.id)

  /* «Non mi va»: stessa attesa di una consegna, e niente esperienza. */
  const xp = f.esperienza
  const via = rifiutaInBottega(f, 'pasticceria', lui.id, dal, sorte(9))
  controlla('un cliente si manda via', via.ok)
  dentro('e il dopo arriva fra 10 e 20 minuti', via.attesa, ATTESA_MIN, ATTESA_MAX)
  uguale('mandarlo via non dà niente', f.esperienza, xp)
  uguale('né toglie cuori', famaDi(f.botteghe.pasticceria).cuori, 1)

  /* Le attese si spalmano davvero fra 10 e 20. */
  const viste = new Set()
  for (let s = 1; s <= 40; s++) {
    const g = conLaBottega('pasticceria', 26)
    aggiornaLaBottega(g, 'pasticceria', 1000, sorte(s))
    viste.add(rifiutaInBottega(g, 'pasticceria', clientiDi(g, 'pasticceria')[0].id,
                               1000, sorte(s + 7)).attesa)
  }
  controlla('le attese non sono sempre le stesse', viste.size >= 5, [...viste].join(' '))
}

/* ══════════ 4. la fama fa crescere i banconi ══════════ */
{
  const f = conLaBottega('merceria', ULTIMO)
  let ora = 1000, rnd = sorte(31), cresciute = 0
  const giro = () => {
    ora += 21 * MINUTO                       // tutti quelli in attesa sono arrivati
    aggiornaLaBottega(f, 'merceria', ora, rnd)
    const o = clientiDi(f, 'merceria')[0]
    const r = accontenta(f, 'merceria', o, ora, rnd)
    if (!r.ok) throw new Error('consegna fallita: ' + r.motivo)
    if (r.cresciuta) cresciute++
    return r
  }
  for (let i = 1; i < CUORI; i++) giro()
  uguale('quattro consegne: quattro cuori', famaDi(f.botteghe.merceria).cuori, CUORI - 1)
  uguale('e un bancone solo', famaDi(f.botteghe.merceria).banconi, 1)
  const r = giro()
  controlla('la quinta fa crescere la bottega', r.cresciuta)
  uguale('i cuori ripartono', famaDi(f.botteghe.merceria).cuori, 0)
  uguale('i banconi sono due', f.botteghe.merceria.banconi.length, 2)
  uguale('e il nuovo ha già il suo cliente', clientiDi(f, 'merceria').length, 1)
  controlla('che non chiede la stessa roba dell\'altro, se c\'è altro',
            new Set(clientiDi(f, 'merceria').map(o => Object.keys(o.chiede)[0])).size ===
              clientiDi(f, 'merceria').length)
  for (let i = 0; i < CUORI * 3; i++) giro()
  uguale(`non cresce oltre ${BANCONI_MAX} banconi`, f.botteghe.merceria.banconi.length, BANCONI_MAX)
  uguale('è cresciuta due volte in tutto', cresciute, BANCONI_MAX - 1)
  controlla('e a fama piena i cuori restano pieni', famaDi(f.botteghe.merceria).piena &&
            famaDi(f.botteghe.merceria).cuori === CUORI)
  ora += 21 * MINUTO
  aggiornaLaBottega(f, 'merceria', ora, rnd)
  uguale('tre banconi, tre clienti', clientiDi(f, 'merceria').length, BANCONI_MAX)
}

/* ══════════ 5. il fumetto, e le cose che non ci sono ══════════ */
{
  const f = conLaBottega('osteria', 30)
  aggiornaLeBotteghe(f, 1000, sorte(41))
  const cosa = bottegaIn(f, 'osteria')
  uguale('a silo vuoto la bottega non chiama nessuno',
         (f.aspettoDellaCosa(cosa, 1000) || {}).fumetto, undefined)
  const o = clientiDi(f, 'osteria')[0]
  for (const [p, n] of Object.entries(o.chiede)) f.metti(p, n)
  controlla('con la roba in mano c\'è da consegnare', daConsegnareIn(f, 'osteria'))
  uguale('e la bottega lo dice da lontano', (f.aspettoDellaCosa(cosa, 1000) || {}).fumetto, '📋')

  /* Senza la bottega in mappa non c'è niente: né clienti né consegne. */
  const g = conLaBottega(null, 30)
  uguale('senza la bottega posata nessuno arriva',
         aggiornaLaBottega(g, 'osteria', 1000, sorte(1)), false)
  uguale('e non si consegna', consegnaInBottega(g, 'osteria', 1, 1000).motivo, 'niente-bottega')
  /* E prima del suo livello non si compra. */
  const h = conLaBottega(null, livelloDellaVoce(PER_ID.mensa) - 1)
  controlla('la mensa non si compra prima del suo livello', !h.sbloccata('mensa'))
}

/* ══════════ 6. un salvataggio si riapre uguale ══════════ */
{
  const f = conLaBottega('mensa', 40)
  let ora = 1000
  const rnd = sorte(51)
  for (let i = 0; i < 6; i++) {
    ora += 21 * MINUTO
    aggiornaLaBottega(f, 'mensa', ora, rnd)
    accontenta(f, 'mensa', clientiDi(f, 'mensa')[0], ora, rnd)
  }
  const dato = JSON.parse(JSON.stringify(f.serializza()))
  const g = new Fattoria({ borsa: borsaInfinita(), dato })
  uguale('le botteghe si rileggono uguali', JSON.stringify(g.botteghe), JSON.stringify(f.botteghe))
  uguale('con la loro fama', famaDi(g.botteghe.mensa).banconi, 2)
  controlla('e gli id non ripartono da capo',
            g.botteghe.mensa.prossimo > Math.max(0, ...clientiDi(g, 'mensa').map(o => o.id)))

  /* Una fattoria di ieri: niente botteghe nel salvataggio. */
  delete dato.botteghe
  const vecchia = new Fattoria({ borsa: borsaInfinita(), dato })
  uguale('una fattoria di ieri nasce senza botteghe', JSON.stringify(vecchia.botteghe), '{}')
  controlla('e appena la bottega c\'è, arriva qualcuno',
            aggiornaLeBotteghe(vecchia, 5000, sorte(2)) && clientiDi(vecchia, 'mensa').length === 1)

  /* Un cliente di roba sparita si butta, una bottega sparita pure; la
     fama resta. */
  const storto = JSON.parse(JSON.stringify(f.serializza()))
  storto.botteghe.mensa.banconi = [{ id: 99, chi: 'maestra', chiede: { verzatorta: 3 }, xp: 40 },
                                   { dal: 12345 }]
  storto.botteghe.gioielleria = { consegne: 3, banconi: [] }
  const pulita = new Fattoria({ borsa: borsaInfinita(), dato: storto })
  uguale('un cliente di roba che non esiste non si rilegge', clientiDi(pulita, 'mensa').length, 0)
  uguale('un\'attesa sì', attesaDi(pulita, 'mensa').length, 1)
  uguale('una bottega che non esiste più si butta', pulita.botteghe.gioielleria, undefined)
  uguale('e la fama guadagnata resta', pulita.botteghe.mensa.consegne, 6)
}

riassunto('Le botteghe del paese')
