/* I sentieri senza fine di Passo passo, il giro pieno: 288 posti in fila
   per sentiero e per mano, con le quote (tante forme, quasi mai la
   riserva, quasi mai due forme uguali di fila, escono tutte le famiglie,
   i prati e i pascoli in tutte le loro forme) e il finale di chi ha tutte
   le carte misurato dal programma più corto. Le regole posto per posto,
   su un campione, stanno in unita/passo-passo-sentiero. Vedi
   docs/passo-passo/sentiero.md e sentiero-finale.md.
   perché: i sentieri senza fine di Passo passo, 288 posti per sentiero e per mano: quote di forme, famiglie, prati e pascoli, e il finale di chi ha tutte le carte misurato col programma più corto
   a parte perché: le regole posto per posto su un campione sono in unita/passo-passo-sentiero; qui il giro pieno, e non c'è un banco da riga di comando per i sentieri
   `node test/esegui.mjs misure/passo-passo-sentiero --niente-build` */
import { guastiDellaMappa } from '../../src/giochi/passo-passo/dati/mondo.js'
import { carteDi } from '../../src/giochi/passo-passo/dati/carte.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { esegui, TANA } from '../../src/giochi/passo-passo/motore/mondo.js'
import { risolvi, serveLaRegola, misura } from '../../src/giochi/passo-passo/motore/risolutore.js'
import { generaSentiero, caso, ricordoDi, INGREDIENTI, DI_BASE, PAVIMENTO, SENTIERI,
         LIMITE_CANE } from '../../src/giochi/passo-passo/motore/generatore.js'
import { SAGOME, ZAINO_MIN, STRADA_MIN, CARTE_MIN, PASSI_MIN } from '../../src/giochi/passo-passo/motore/sagome.js'
import { cercaProgramma } from '../../src/giochi/passo-passo/motore/programmi.js'
import { BOZZE_DEL_PASCOLO } from '../../src/giochi/passo-passo/motore/pascoli.js'
import { risolviSvelto, vaBene } from '../../src/giochi/passo-passo/motore/svelto.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const TUTTI = Object.values(INGREDIENTI)
const PICCOLI = [...DI_BASE, 'cane']
const COL_CICLO = [...PICCOLI, 'ripeti']
const NOME_REGOLA = { salto: 'salto', ghiaccio: 'ghiaccio', massi: 'spinta', buche: 'buche' }
/* la strada più corta senza carota, col risolutore giusto per il posto */
const sciolta = liv => (vaBene(liv) ? risolviSvelto(liv, { carota: false, limite: 200000 })
  : risolvi(liv, { carota: false, limite: 200000 }))

/* ══════════ 1. un giro lungo per sentiero ══════════
   Posti in fila col ricordo del posto di prima, per tre mani: senza carte
   (i piccoli, che arrivano alla fine dei massi), col solo ciclo, con
   tutte. Ogni posto è una mappa scritta bene, si vince, sta sopra il
   pavimento della sua forma, usa le regole che dice, e sta nel suo
   sentiero. */
const posti = { coniglio: [], cane: [] }, piccoli = { coniglio: [], cane: [] }
const GIRI = [['tutte', TUTTI, 4], ['col ciclo', COL_CICLO, 1], ['senza carte', PICCOLI, 1]]
for (const strada of ['coniglio', 'cane']) for (const [mano, sbloccati, semi] of GIRI) {
  let tutti = 0, buoni = 0, riserve = 0, stesse = 0, bassi = 0, regole = 0, servono = 0, fuori = 0
  const forme = new Set(), famiglie = new Set()
  const chi = `${strada}, ${mano}`
  for (let seme = 1; seme <= semi; seme++) {
    let prima = null
    for (let fatti = 0; fatti < 24; fatti++) {
      const t = generaSentiero(fatti, caso(97 * fatti + seme), { sbloccati, prima, strada })
      if (prima && ricordoDi(t) === prima) stesse++
      prima = ricordoDi(t)
      tutti++
      if (sbloccati === TUTTI) posti[strada].push(t)
      if (sbloccati === PICCOLI) piccoli[strada].push(t)
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
      /* chi ha le carte trova i prati alzati alle mosse del finale */
      const pavimento = t.zaino ? (sagoma && sagoma.strada) || STRADA_MIN
        : sbloccati === PICCOLI ? PAVIMENTO[t.forma] : Math.max(PASSI_MIN, PAVIMENTO[t.forma] || 0)
      const corta = sciolta(liv)
      if (t.forma !== 'riserva' && (!corta || !(corta.length >= pavimento))) { bassi++; nota('un sentiero basso', `${t.forma} ${corta && corta.length} < ${pavimento}`) }
    }
  }
  uguale(`${chi}: ogni posto è una mappa scritta bene, si vince, e ha il suo animale`, buoni, tutti)
  uguale(`${chi}: solo le famiglie del suo sentiero`, fuori, 0)
  if (sbloccati === TUTTI)
    uguale(`${chi}: escono tutte le famiglie`, [...famiglie].sort().join(), [...SENTIERI[strada].famiglie].sort().join())
  /* con tutte le carte le forme sono meno: le sagome col se (e un prato
     ogni tanto) */
  const formeMin = { 'senza carte': strada === 'cane' ? 4 : 3, 'col ciclo': strada === 'cane' ? 2 : 5, tutte: 3 }[mano]
  controlla(`${chi}: e tante forme diverse`, forme.size >= formeMin, [...forme].join(' '))
  controlla(`${chi}: quasi mai il posto di riserva`, riserve <= tutti * 0.03, `${riserve} su ${tutti}`)
  controlla(`${chi}: quasi mai due posti di fila della stessa forma`, stesse <= tutti * 0.1, `${stesse} su ${tutti}`)
  uguale(`${chi}: le regole servono tutte`, servono, regole)
  uguale(`${chi}: nessun posto sotto il pavimento della sua forma, dal primo all'ultimo`, bassi, 0)
  nota(`${chi}: ${forme.size} forme in ${tutti} posti`)
}

/* ══════════ 2. i prati e i pascoli del giro, più da vicino ══════════ */
{
  const prati = piccoli.coniglio.filter(t => t.famiglia === 'prato')
  controlla('i prati sono labirinti, laghi e fiumi', ['labirinto', 'lago', 'fiumi'].every(f => prati.some(t => t.forma === f)),
            prati.map(t => t.forma).join(' '))
  controlla('un labirinto mette insieme tre o quattro regole',
            prati.filter(t => t.forma === 'labirinto').every(t => t.regole.length >= 3 && t.regole.length <= 4))
  controlla('i salti compaiono solo dove c\'è da saltare',
            prati.every(t => !!t.salti === (t.regole || []).includes('salto')))
  const pascoli = piccoli.cane.filter(t => t.famiglia === 'pascolo')
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
  /* chi ha le carte trova i prati di rado */
  const conCarte = posti.coniglio.filter(t => !t.zaino).length + posti.cane.filter(t => !t.zaino).length
  controlla('con tutte le carte, i posti senza zaino sono rari', conCarte <= (posti.coniglio.length + posti.cane.length) * 0.1,
            `${conCarte} su ${posti.coniglio.length + posti.cane.length}`)
}

/* ══════════ 3. il finale di chi ha tutte le carte ══════════
   La difficoltà si misura dal programma, non dalle frecce: su un campione
   del giro (prati compresi) si cerca il programma più corto con le carte
   in mano (`cercaProgramma`, arrivando a casa anche senza la carota), e
   se dentro lo zaino si vince senza un ciclo o senza un se. La ricerca ha
   un tetto di passi: quella che non finisce non smentisce il posto, e si
   conta a parte. Vedi docs/passo-passo/sentiero-finale.md. */
{
  const CAMPIONE = { coniglio: 20, cane: 10 }
  const LIMITE = { coniglio: 4000000, cane: 4000000 }
  for (const strada of ['coniglio', 'cane']) {
    const campione = posti[strada].filter((_, i) => i % 4 === 0).slice(0, CAMPIONE[strada])
    let ciclo = 0, conSe = 0, mosse = 0, carte = 0, aperti = 0, scritte = 0
    for (const t of campione) {
      const liv = Livello.da(t)
      if (!t.zaino) {
        /* un prato: solo frecce, e si vince senza niente */
        const s = sciolta(liv)
        if (s && s.length >= PASSI_MIN) mosse++
        if (s && s.length >= CARTE_MIN) carte++
        scritte++
        continue
      }
      /* la soluzione scritta vince con la carota, ed è lunga quanto lo zaino */
      const r = esegui(liv, t.soluzioni[0], { eventi: false })
      if (r.esito === TANA && r.carota && carteDi(t.soluzioni[0]) === t.zaino) scritte++
      else nota('una soluzione scritta che non vince', t.forma, t.mappa.join('/'))
      const min = cercaProgramma(liv, { tetto: t.zaino, limite: LIMITE[strada] })
      const senzaCiclo = cercaProgramma(liv, { carte: [], tetto: t.zaino, limite: LIMITE[strada] })
      const senzaSe = cercaProgramma(liv, { carte: liv.carte.filter(c => c !== 'se'), tetto: t.zaino, limite: LIMITE[strada] })
      if (!min.finito || !senzaSe.finito) aperti++
      if (!senzaCiclo.fila) ciclo++
      if (!senzaSe.fila) conSe++
      else nota('si vince senza il se', t.forma, senzaSe.fila.join(' '))
      const corto = min.fila ? min : { carte: t.zaino, passi: r.passi.length }
      if (corto.passi >= PASSI_MIN) mosse++
      if (corto.carte >= CARTE_MIN) carte++
      else nota('un programma corto', t.forma, `${t.zaino} → ${corto.carte}`, min.fila && min.fila.join(' '))
    }
    const n = campione.length, quota = x => x / n
    uguale(`${strada}, il finale: ogni posto si vince con la soluzione scritta`, scritte, n)
    controlla(`${strada}, il finale: quasi sempre ci vuole un ciclo`, quota(ciclo) >= 0.85, `${ciclo} su ${n}`)
    controlla(`${strada}, il finale: quasi sempre ci vuole un se`, quota(conSe) >= 0.85, `${conSe} su ${n}`)
    controlla(`${strada}, il finale: quasi sempre almeno ${PASSI_MIN} mosse`, quota(mosse) >= 0.85, `${mosse} su ${n}`)
    controlla(`${strada}, il finale: quasi sempre almeno ${CARTE_MIN} carte`, quota(carte) >= 0.85, `${carte} su ${n}`)
    nota(`${strada}, il finale su ${n} posti: ciclo ${ciclo}, se ${conSe}, ≥${PASSI_MIN} mosse ${mosse}, ≥${CARTE_MIN} carte ${carte}, ricerche non finite ${aperti}`)
  }
}

riassunto('Passo passo — il giro lungo dei sentieri')
