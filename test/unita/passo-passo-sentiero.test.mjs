/* I sentieri senza fine di Passo passo, senza browser: due sentieri, il
   coniglio (prati e zaino) e il cane (pascoli e zaino col cane), ognuno
   solo con le sue famiglie; ogni posto si vince, sta sopra il pavimento
   della sua forma e usa davvero le regole che ha; le forme girano e non
   si ripetono di fila; il risolutore svelto dei pascoli dice le stesse
   cose del motore vero; ogni sagoma dello zaino regge. Vedi
   docs/passo-passo/sentiero.md.
   `node test/esegui.mjs passo-passo-sentiero --niente-build`
   tempo: 300 */
import { SCALINI } from '../../src/giochi/passo-passo/dati/campagna.js'
import { guastiDellaMappa } from '../../src/giochi/passo-passo/dati/mondo.js'
import { carteDi, guastiDellaFila } from '../../src/giochi/passo-passo/dati/carte.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { esegui, TANA } from '../../src/giochi/passo-passo/motore/mondo.js'
import { risolvi, suggerisci, serveLaRegola, serveLaCarta, misura } from '../../src/giochi/passo-passo/motore/risolutore.js'
import { seguiConsiglio } from '../../src/giochi/passo-passo/motore/fila.js'
import { generaSentiero, caso, famigliaDi, premioDi, ricordoDi, INGREDIENTI, DI_BASE, FORME, PAVIMENTO, SENTIERI,
         RISERVA, RISERVA_CANE, RISERVA_ZAINO, LIMITE_CANE } from '../../src/giochi/passo-passo/motore/generatore.js'
import { SAGOME, generaZaino, provaLoZaino, animaleDi, ZAINO_MIN, STRADA_MIN } from '../../src/giochi/passo-passo/motore/sagome.js'
import { BOZZE_DEL_PASCOLO } from '../../src/giochi/passo-passo/motore/pascoli.js'
import { risolviSvelto, vaBene } from '../../src/giochi/passo-passo/motore/svelto.js'
import manifesto, { SENZA_FINE } from '../../src/giochi/passo-passo/gioco.js'
import { apriQuaderno, conRisultato, sfideDi, sfidaDi, guastiDelleSfide } from '../../src/giochi/primati.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const TUTTI = Object.values(INGREDIENTI)
const PICCOLI = [...DI_BASE, 'cane']
const VOLTE_PROVA = [2, 3, 4, 5, 6, 7, 8, 9]
const NOME_REGOLA = { salto: 'salto', ghiaccio: 'ghiaccio', massi: 'spinta', buche: 'buche' }
/* la strada più corta senza carota, col risolutore giusto per il posto */
const sciolta = liv => (vaBene(liv) ? risolviSvelto(liv, { carota: false, limite: 200000 })
  : risolvi(liv, { carota: false, limite: 200000 }))

/* ══════════ 1. le famiglie: ognuno le sue ══════════ */
{
  controlla('ogni gradino dopo i primi passi porta un ingrediente, tranne l\'ultimo',
            SCALINI.slice(1, -1).every(s => INGREDIENTI[s.chiave]) && !INGREDIENTI[SCALINI.at(-1).chiave])
  controlla('lo zaino paga più di un prato', premioDi({ zaino: 3 }) > premioDi({ mappa: [] }))
  uguale('i sentieri sono due', Object.keys(SENTIERI).join(), 'coniglio,cane')
  const famiglie = (sbl, strada, n = 400, prima = null) => {
    const r = caso(11), c = {}
    for (let i = 0; i < n; i++) { const f = famigliaDi(r, sbl, prima, strada); c[f] = (c[f] || 0) + 1 }
    return c
  }
  uguale('coniglio, finite le buche: solo prati', Object.keys(famiglie(DI_BASE, 'coniglio')).join(), 'prato')
  uguale('coniglio, finito il cane: ancora solo prati', Object.keys(famiglie(PICCOLI, 'coniglio')).join(), 'prato')
  uguale('coniglio, finita la campagna: prati e le tre carte, niente pascoli',
         Object.keys(famiglie(TUTTI, 'coniglio')).sort().join(), 'fino,prato,ripeti,se')
  uguale('cane, finito il pascolo: solo pascoli', Object.keys(famiglie(PICCOLI, 'cane')).join(), 'pascolo')
  uguale('cane, finita la campagna: pascoli e le tre carte col cane',
         Object.keys(famiglie(TUTTI, 'cane')).sort().join(), 'fino,pascolo,ripeti,se')
  controlla('la famiglia appena giocata esce di rado', (famiglie(TUTTI, 'coniglio', 400, 'se:segni').se || 0) < 400 / 10,
            JSON.stringify(famiglie(TUTTI, 'coniglio', 400, 'se:segni')))
  controlla('anche col ricordo di ieri, che era la famiglia sola', (famiglie(TUTTI, 'coniglio', 400, 'prato').prato || 0) < 400 * 0.15,
            JSON.stringify(famiglie(TUTTI, 'coniglio', 400, 'prato')))
}

/* ══════════ 2. un giro lungo per sentiero ══════════
   Tutto sbloccato, posti in fila col ricordo del posto di prima: ogni
   posto è una mappa scritta bene, si vince, sta sopra il pavimento della
   sua forma, usa le regole che dice, e sta nel suo sentiero. */
const posti = { coniglio: [], cane: [] }
for (const strada of ['coniglio', 'cane']) {
  let tutti = 0, buoni = 0, riserve = 0, stesse = 0, bassi = 0, regole = 0, servono = 0, fuori = 0
  const forme = new Set(), famiglie = new Set()
  for (let seme = 1; seme <= 4; seme++) {
    let prima = null
    for (let fatti = 0; fatti < 24; fatti++) {
      const t = generaSentiero(fatti, caso(97 * fatti + seme), { sbloccati: TUTTI, prima, strada })
      if (prima && ricordoDi(t) === prima) stesse++
      prima = ricordoDi(t)
      tutti++
      posti[strada].push(t)
      forme.add(t.forma)
      famiglie.add(t.famiglia)
      if (!t.misure) riserve++
      if (t.strada !== strada || !SENTIERI[strada].famiglie.includes(t.famiglia)) fuori++
      const liv = Livello.da(t)
      const g = guastiDellaMappa(t.mappa)
      let vince
      if (t.zaino) {
        const r = esegui(liv, t.soluzioni[0])
        vince = r.esito === TANA && r.carota && carteDi(t.soluzioni[0]) === t.zaino && t.zaino >= ZAINO_MIN
      } else if (liv.cane) {
        const s = risolviSvelto(liv, { carota: true, limite: 2 * LIMITE_CANE })
        vince = !!s && esegui(liv, s).esito === TANA && esegui(liv, s).carota
      } else {
        const m = misura(liv, { limite: 40000 })
        vince = !!m.conCarota && esegui(liv, m.conCarota).esito === TANA
      }
      /* il coniglio non vede mai una pecora, il cane le vede sempre */
      const animale = strada === 'cane' ? liv.cane : !liv.cane
      if (!g.length && vince && animale) buoni++
      else nota('un sentiero storto', `${strada} ${t.famiglia} ${t.forma} ${g.join(' ')} ${t.mappa.join('/')}`)
      if (!t.zaino && t.regole && t.regole.length) {
        regole++
        if (t.regole.every(r => serveLaRegola(liv, NOME_REGOLA[r]))) servono++
        else nota('una regola che non serve', `${t.forma} ${t.regole.join(',')} ${t.mappa.join('/')}`)
      }
      /* il pavimento: la strada più corta, anche lasciando perdere la
         carota, non scende sotto quello della forma */
      const sagoma = SAGOME.find(x => x.chiave === t.forma)
      const pavimento = t.zaino ? (sagoma && sagoma.strada) || STRADA_MIN : PAVIMENTO[t.forma]
      const corta = sciolta(liv)
      if (!corta || !(corta.length >= pavimento)) { bassi++; nota('un sentiero basso', `${t.forma} ${corta && corta.length} < ${pavimento}`) }
    }
  }
  uguale(`${strada}: ogni posto è una mappa scritta bene, si vince, e ha il suo animale`, buoni, tutti)
  uguale(`${strada}: solo le famiglie del suo sentiero`, fuori, 0)
  uguale(`${strada}: escono tutte le famiglie`, [...famiglie].sort().join(), [...SENTIERI[strada].famiglie].sort().join())
  controlla(`${strada}: e tante forme diverse`, forme.size >= (strada === 'cane' ? 6 : 12), [...forme].join(' '))
  controlla(`${strada}: quasi mai il posto di riserva`, riserve <= tutti * 0.03, `${riserve} su ${tutti}`)
  controlla(`${strada}: quasi mai due posti di fila della stessa forma`, stesse <= tutti * 0.1, `${stesse} su ${tutti}`)
  uguale(`${strada}: le regole servono tutte`, servono, regole)
  uguale(`${strada}: nessun posto sotto il pavimento della sua forma, dal primo all'ultimo`, bassi, 0)
  nota(`${strada}: ${forme.size} forme in ${tutti} posti`)
}

/* ══════════ 3. i prati e i pascoli, più da vicino ══════════ */
{
  const prati = posti.coniglio.filter(t => t.famiglia === 'prato')
  controlla('i prati sono labirinti, laghi e fiumi', ['labirinto', 'lago', 'fiumi'].every(f => prati.some(t => t.forma === f)),
            prati.map(t => t.forma).join(' '))
  controlla('un labirinto mette insieme tre o quattro regole',
            prati.filter(t => t.forma === 'labirinto').every(t => t.regole.length >= 3 && t.regole.length <= 4))
  controlla('i salti compaiono solo dove c\'è da saltare',
            prati.every(t => !!t.salti === (t.regole || []).includes('salto')))
  const pascoli = posti.cane.filter(t => t.famiglia === 'pascolo')
  const pecore = pascoli.map(t => Livello.da(t).pecore.length)
  controlla('i pascoli hanno da tre a cinque pecore (il cancello due)', pascoli.every(t => {
    const n = Livello.da(t).pecore.length
    return t.forma === 'cancello' ? n >= 2 : n >= 3 && n <= 5
  }), pecore.join(' '))
  controlla('e ne escono con tre e con quattro', pecore.includes(3) && pecore.includes(4), pecore.join(' '))
  controlla('ogni forma di pascolo esce', Object.keys(BOZZE_DEL_PASCOLO).every(f => pascoli.some(t => t.forma === f)),
            pascoli.map(t => t.forma).join(' '))
  controlla('ogni posto del cane sta nella fila: la strada con l\'osso non passa 36 frecce',
            pascoli.every(t => t.misure.lunga <= 36))
  /* lo stesso seme fa lo stesso posto, in tutti e due i sentieri */
  for (const strada of ['coniglio', 'cane']) {
    const a = generaSentiero(5, caso(42), { sbloccati: TUTTI, strada }), b = generaSentiero(5, caso(42), { sbloccati: TUTTI, strada })
    uguale(`${strada}: lo stesso seme fa lo stesso posto`, a.mappa.join('/'), b.mappa.join('/'))
  }
  controlla('senza le carte, niente zaino nel sentiero del coniglio',
            Array.from({ length: 12 }, (_, f) => generaSentiero(f, caso(f + 3), { sbloccati: PICCOLI })).every(t => !t.zaino))
  controlla('e nemmeno in quello del cane',
            Array.from({ length: 8 }, (_, f) => generaSentiero(f, caso(f + 3), { sbloccati: PICCOLI, strada: 'cane' })).every(t => !t.zaino))
  for (const [nome, r] of [['prato', RISERVA], ['cane', RISERVA_CANE]]) {
    const liv = Livello.da(r)
    const s = sciolta(liv)
    controlla(`il posto di riserva del ${nome} si vince e sta sopra il pavimento`,
              !!misura(liv).conCarota && s && s.length >= (nome === 'cane' ? FORME.pascolo[0].pavimento : FORME.prato[0].pavimento),
              s && s.length)
  }
  controlla('e quello dello zaino vince, vuole la scatola e sta sopra il pavimento',
            provaLoZaino({ ...RISERVA_ZAINO, carte: ['ripeti'] }))
}

/* ══════════ 4. il risolutore svelto dice le stesse cose del motore ══════════
   Su pascoli fatti dalle bozze, prima della scelta: la stessa strada più
   corta (o nessuna), con l'osso e senza, e la strada svelta vince giocata
   dal motore vero. */
{
  const rnd = caso(5)
  const bozze = Object.values(BOZZE_DEL_PASCOLO)
  let n = 0, uguali = 0
  while (n < 120) {
    const b = bozze[n % bozze.length]({ pecore: 3 + (n % 2), inFila: n % 2 ? 2 : 0, ghiaccio: true }, rnd)
    if (!b) continue
    n++
    const liv = Livello.da({ mappa: b })
    let ok = true
    for (const carota of [false, true]) {
      const g = risolvi(liv, { carota, limite: 3000 }), s = risolviSvelto(liv, { carota, limite: 3000 })
      if (!g !== !s || (g && g.length !== s.length)) ok = false
      if (s) { const r = esegui(liv, s, { eventi: false }); if (r.esito !== TANA || (carota && !r.carota)) ok = false }
    }
    if (ok) uguali++
    else nota('il risolutore svelto non torna', b.join('/'))
  }
  uguale('su centoventi pascoli il risolutore svelto e quello del motore dicono lo stesso', uguali, n)
  controlla('il risolutore svelto non si usa dove ci sono massi o salti',
            !vaBene(Livello.da({ mappa: ['P.p.#', '.m...', '..c..'] })) && !vaBene(Livello.da({ mappa: ['P.p.#', '.....', '..c..'], salti: true })))
}

/* ══════════ 5. le sagome dello zaino, una per una ══════════
   Ognuna, con semi diversi: si vince con la carota, la scatola serve, le
   mosse ingenue perdono (col «fino a» e col «se» dopo almeno due passi:
   la falsa pista), e chi segue soltanto gli aiuti arriva a casa senza
   sforare lo zaino. Quelle del cane hanno le pecore, quelle del
   coniglio no. */
for (const g of SAGOME) {
  let fatte = 0, prove = 0, sane = 0, aiutate = 0, piste = 0, pisteBuone = 0, animale = 0
  const forme = new Set()
  for (let seme = 1; seme <= 12; seme++) {
    prove++
    const t = generaZaino(g.carta, TUTTI, caso(1000 + seme * 7), { sagoma: g.chiave })
    if (!t) continue
    fatte++
    forme.add(t.mappa.join('/'))
    const liv = Livello.da(t)
    if (liv.cane === (animaleDi(g) === 'cane')) animale++
    if (provaLoZaino(t, { strada: g.strada || STRADA_MIN }) && t.zaino >= ZAINO_MIN && !guastiDellaFila(t.soluzioni[0]).length &&
        serveLaCarta(liv) && t.fragili.every(f => { const r = esegui(liv, f); return !(r.esito === TANA && r.carota) })) sane++
    if (g.carta !== 'ripeti') for (const f of t.fragili) {
      piste++
      if (esegui(liv, f).passi.length >= 2) pisteBuone++
    }
    let fila = [], cur = 0, u = null, sfora = false
    for (let k = 0; k < 40; k++) {
      u = suggerisci(liv, fila)
      if (!u || u.che === 'via') break
      ;({ fila, cursore: cur } = seguiConsiglio(fila, cur, u))
      if (carteDi(fila) > t.zaino) sfora = true
    }
    const r = esegui(liv, fila)
    if (u && u.che === 'via' && r.esito === TANA && r.carota && !sfora) aiutate++
  }
  uguale(`sagoma «${g.chiave}»: esce sempre`, fatte, prove)
  uguale(`sagoma «${g.chiave}»: ha il suo animale`, animale, fatte)
  uguale(`sagoma «${g.chiave}»: si vince con la carota, la scatola serve, le mosse ingenue perdono`, sane, fatte)
  uguale(`sagoma «${g.chiave}»: seguendo gli aiuti si arriva, dentro lo zaino`, aiutate, fatte)
  if (piste) uguale(`sagoma «${g.chiave}»: le mosse ingenue fanno almeno due passi`, pisteBuone, piste)
  controlla(`sagoma «${g.chiave}»: posti diversi l'uno dall'altro`, forme.size >= fatte * 0.8, `${forme.size} su ${fatte}`)
}
/* col «fino a» contare non basta: la stessa sagoma, coi numeri al posto
   del colore, non vince mai */
for (const chiave of ['gradini', 'gallerie-storte', 'pettine-storto']) {
  const g = SAGOME.find(x => x.chiave === chiave)
  const t = generaZaino(g.carta, TUTTI, caso(5), { sagoma: chiave })
  const liv = Livello.da(t)
  const contando = VOLTE_PROVA.every(n => {
    const f = t.soluzioni[0].map(x => (/^ripeti-(rosso|blu|giallo)$/.test(x) ? `ripeti-${n}` : x))
    const r = esegui(liv, f)
    return !(r.esito === TANA && r.carota)
  })
  controlla(`nella sagoma «${chiave}» nessun numero fa le veci del colore`, contando)
}

/* ══════════ 6. i record: uno per sentiero ══════════
   Il profilo di oggi ha un record solo (`primato`, di quando il sentiero
   era uno): lo ritrova il sentiero del coniglio, e il cane parte da zero. */
{
  const diOggi = { tappa: 60, stelle: {}, primato: { best: 6, quando: 5, partite: 9, ultime: [{ v: 6, t: 5 }] } }
  const coniglio = sfidaDi(SENZA_FINE, 'coniglio'), cane = sfidaDi(SENZA_FINE, 'cane')
  uguale('due sfide, il coniglio e il cane', sfideDi(SENZA_FINE).map(s => s.chiave).join(), 'coniglio,cane')
  uguale('il record di oggi è del sentiero del coniglio', apriQuaderno(diOggi, coniglio).best, 6)
  uguale('con le sue partite', apriQuaderno(diOggi, coniglio).partite, 9)
  uguale('il sentiero del cane parte da zero', apriQuaderno(diOggi, cane).best, 0)
  /* scrivere un record del cane non tocca quello del coniglio */
  const dopo = { ...diOggi, primati: { cane: conRisultato(apriQuaderno(diOggi, cane), 3, 10).quaderno } }
  uguale('dopo un record del cane, il coniglio ha ancora il suo', apriQuaderno(dopo, coniglio).best, 6)
  uguale('e il cane il suo', apriQuaderno(dopo, cane).best, 3)
  const riletto = { ...diOggi, primati: { coniglio: conRisultato(apriQuaderno(diOggi, coniglio), 4, 11).quaderno } }
  uguale('una serie più corta non abbassa il record ereditato', apriQuaderno(riletto, coniglio).best, 6)
  const g = guastiDelleSfide([manifesto])
  controlla('le due sfide sono dichiarate bene', g.length === 0, g.join(' · '))
}

riassunto('Passo passo — i sentieri senza fine')
