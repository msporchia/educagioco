/* ═══════════════════════════════════════════════════════════════════
   QUANTO SPESSO ESCE UNA CLASSE DI DOMANDE
   tempo: 15

   Una CLASSE è una coppia (modulo, grado): «il perimetro», «i
   contrari», «le conversioni facili». Questo test guarda una cosa
   sola, che però è quella che decide cosa un bambino vede davvero:
   **con che frequenza esce ognuna**.

   Il difetto che ha fatto nascere `nucleo/classi.js` era invisibile a
   ogni altra prova. Le domande erano giuste, varie, senza doppioni — e
   metà delle classi non usciva mai, perché il grado si calcolava dalla
   difficoltà (`round(1 + d × (gradi−1))`) e le difficoltà che i giochi
   chiedono sono poche e fisse: 0.15, 0.50, 0.85 in Survivors. Area e
   perimetro, che stanno in cima alla scaletta della griglia, si
   vedevano solo comprando le carte più care.

   Quindi qui si contano i tiri, non si guardano le domande:

     · alle difficoltà che i giochi chiedono davvero, TUTTE le classi
       devono uscire almeno ogni tanto;
     · nessuna deve prendersi una fetta spropositata;
     · il centro della banda deve restare dov'è: una carta facile non
       deve consegnare l'ultimo grado di un modulo (sarebbe una bugia
       al bambino: ha pagato poco);
     · e a parità di seme deve uscire sempre lo stesso, se no non si
       può provare niente.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { nota, controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { classiDi, pescaClasse, pesoDi, bersaglio, adatta, finestraDi,
         livelloDegliAnni, BANDA, TAGLIO_SOTTO, TAGLIO_SOPRA,
         MIRA_SOTTO, MIRA_SOPRA } from '../../src/quiz/nucleo/classi.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/quiz/moduli')

const moduli = []
if (existsSync(CARTELLA))
  for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js'))) {
    const mod = (await import(pathToFileURL(resolve(CARTELLA, f)).href)).default
    if (mod) moduli.push(mod)
  }
controlla('i moduli si raccolgono da soli', moduli.length > 0)

const CLASSI = moduli.reduce((s, m) => s + m.gradi, 0)
nota(`${moduli.length} moduli, ${CLASSI} classi di domande in tutto`)

/* ═══════════ due larghezze, non una ═══════════
   L'ammissione è larga — si toglie solo quello che è preso in giro o
   muro — e la mira è stretta. Sono due cose diverse, e per un pezzo
   erano lo stesso numero: il risultato era che a nove anni le ore
   intere dell'orologio sparivano *del tutto* invece di uscire ogni
   tanto, che è quello che deve succedere a una domanda facile ma
   onesta. */
{
  const f = finestraDi(8)
  const qui = livelloDegliAnni(8)
  uguale('si ammette parecchio sotto', f[0], qui - TAGLIO_SOTTO)
  uguale('e un po\' sopra', f[1], qui + TAGLIO_SOPRA)
  controlla('l\'ammissione è più larga della mira',
            TAGLIO_SOTTO + TAGLIO_SOPRA > MIRA_SOTTO + MIRA_SOPRA)
  uguale('la carta più debole mira un anno indietro', bersaglio(0, 8), qui - MIRA_SOTTO)
  uguale('la più tosta mira dove finisce il mazzo', bersaglio(1, 8), qui + MIRA_SOPRA)
  /* a fondo corsa la mira TOCCA il tetto dell'ammissione, e non è una
     svista: sopra non c'è niente da pescare, quindi puntare più in alto
     vorrebbe solo dire pescare dal di fuori. Sotto invece resta larga
     distanza, perché lì il mazzo continua. */
  controlla('e la mira non esce dall\'ammissione',
            bersaglio(0, 8) > f[0] && bersaglio(1, 8) <= f[1])
  controlla('senza età non si taglia niente', adatta(3, finestraDi(null)))
  controlla('una domanda di due anni sotto è ancora ammessa', adatta(qui - 25, f))
  controlla('una di quattro anni sotto no: è una presa in giro', !adatta(qui - 50, f))
  controlla('e una di tre anni sopra nemmeno: è un muro', !adatta(qui + 38, f))
}
controlla('il peso è massimo dove il bersaglio cade',
          pesoDi(50, 50) > pesoDi(40, 50) && pesoDi(50, 50) > pesoDi(60, 50))
controlla('e cala allontanandosi', pesoDi(40, 50) > pesoDi(30, 50))
controlla('a due bande di distanza è trascurabile', pesoDi(50 - 2 * BANDA, 50) < 0.05,
          `${pesoDi(50 - 2 * BANDA, 50).toFixed(3)} con banda ${BANDA}`)

/* ═══════════ mille tiri per ogni difficoltà ═══════════
   Le difficoltà sono quelle vere: le tre fasce delle carte di
   Survivors, più gli estremi della rampa del dungeon. */
const ETA = [
  ['chi comincia adesso', 5],
  ['prima o seconda', 6.5],
  ['terza', 8],
  ['quinta', 10],
]
const MANOPOLE = [['carta debole', 0.15], ['carta media', 0.5], ['carta tosta', 0.85]]
const TIRI = 3000

const conta = (eta, difficolta = 0.5, seme = 3) => {
  const sorte = new Sorte(seme)
  const classi = classiDi(moduli, { difficolta, regole: { eta } })
  const quante = new Map()
  for (let i = 0; i < TIRI; i++) {
    const c = pescaClasse(sorte, classi)
    if (!c) break
    const k = `${c.modulo.id}/${c.grado}`
    quante.set(k, (quante.get(k) || 0) + 1)
  }
  return quante
}

for (const [chi, eta] of ETA) {
  const quante = conta(eta)
  const usate = [...quante.keys()].length
  const massima = Math.max(...quante.values()) / TIRI
  const moduliVisti = new Set([...quante.keys()].map(k => k.split('/')[0])).size
  /* Tutti i moduli non è più il traguardo: un mazzo che sta tutto in
     fondo alla scala NON deve uscire a un bambino di dieci anni. Quello
     che si controlla è che le materie non si riducano a due o tre, se
     no il gioco sembra un'interrogazione su una materia sola. */
  controlla(`${chi} (${eta} anni): vede almeno cinque moduli diversi`,
            moduliVisti >= 5, `${moduliVisti} moduli`)
  controlla(`${chi} (${eta} anni): nessuna classe si prende più di un quinto dei tiri`,
            massima <= 0.2, `la più frequente prende il ${(massima * 100).toFixed(1)}%`)
  /* e nessuna domanda fuori età: è il controllo che tiene su tutto il
     resto, perché è invisibile a occhio e si vede solo contando */
  const finestra = finestraDi(eta)
  const fuoriEta = [...quante.keys()].filter(k => {
    const [id, g] = k.split('/')
    const m = moduli.find(x => x.id === id)
    return !adatta(m.livelloVisto(Number(g), [], { eta, finestra }), finestra)
  })
  uguale(`${chi} (${eta} anni): niente fuori dalla sua finestra`,
         fuoriEta.join(' ') || '—', '—')
  nota(`${chi} a ${eta} anni: ${usate} classi, ${moduliVisti} moduli, la più frequente al ` +
       `${(massima * 100).toFixed(1)}%`)
}

/* ── ammesse non vuol dire frequenti, ed è cambiato ──
   Le ore intere sono di seconda elementare: a nove anni non sono più il
   suo pane, ma restano una domanda onesta. Con la banda a 19 capitavano
   ogni tanto anche in mezzo al mazzo pieno; con la banda a 11 non più —
   stanno due anni e mezzo sotto il bersaglio perfino con la carta più
   debole, e a quella distanza il peso è un decimillesimo.

   È il prezzo dichiarato dello stringere, e quello che si compra è
   scritto in `nucleo/classi.js`: una porta della terza tappa del
   sotterraneo smette di consegnare domande da sei anni a un bambino di
   otto. Restano AMMESSE, che è un'altra cosa — e si vede quando il
   mazzo si impoverisce: lì la banda si allarga da sola e tornano a
   uscire, più con la carta debole che con quella tosta. Che è il verso
   giusto anche nel degrado. */
{
  const orologio = moduli.find(m => m.id === 'orologio')
  if (orologio) {
    const a9 = classiDi([orologio], { regole: { eta: 9 } }).map(c => c.grado)
    controlla('a nove anni le ore intere ci sono ancora', a9.includes(1), a9.join(','))
    const pieno = conta(9, 0.15).get('orologio/1') || 0
    controlla('ma col mazzo pieno non capitano quasi mai', pieno < TIRI / 100,
              `${pieno} su ${TIRI}`)
    /* mazzo povero: solo l'orologio acceso. La banda si allarga a
       tentativi finché non c'è varietà, e le classi lontane tornano. */
    const soloOrologio = (dif, quale) => {
      const classi = classiDi([orologio], { difficolta: dif, regole: { eta: 9 } })
      let quante = 0
      for (let i = 0; i < TIRI; i++)
        if (pescaClasse(new Sorte(i * 7919 + 13), classi).grado === quale) quante++
      return quante
    }
    const debole = soloOrologio(0.15, 1)
    const tosta = soloOrologio(0.85, 1)
    controlla('col mazzo povero la banda si allarga e tornano', debole > 0,
              `mai in ${TIRI} tiri`)
    controlla('e anche lì capitano più con la carta debole che con quella tosta',
              debole > tosta, `${debole} contro ${tosta} su ${TIRI}`)
    const a11 = classiDi([orologio], { regole: { eta: 11 } }).map(c => c.grado)
    controlla('ma a undici no: lì sono una presa in giro', !a11.includes(1), a11.join(','))
  }
}

/* ── la manopola si sente ancora, dentro l'età ──
   Il rischio del taglio per età è di appiattire tutto: se una carta
   debole e una tosta consegnano la stessa roba, i giochi hanno perso la
   loro leva. Si controlla che il baricentro si sposti davvero. */
const baricentro = (eta, dif) => {
  const quante = conta(eta, dif, 7)
  let somma = 0, tot = 0
  for (const [k, n] of quante) {
    const [id, g] = k.split('/')
    somma += moduli.find(x => x.id === id).livelloVisto(Number(g), [], { eta, finestra: finestraDi(eta) }) * n
    tot += n
  }
  return somma / tot
}
for (const [chi, eta] of ETA) {
  const debole = baricentro(eta, 0.15)
  const tosta = baricentro(eta, 0.85)
  controlla(`${chi}: una carta tosta chiede più in alto di una debole`, tosta > debole,
            `${debole.toFixed(1)} → ${tosta.toFixed(1)} sulla scala`)
}

/* ── le classi in cima si vedono ──
   Il grado in cima alla scaletta della griglia (area e perimetro a
   confronto) usciva solo a difficoltà ≥ 0.92 col conto secco di una
   volta. Adesso deve farsi vedere da un bambino che ne ha l'età. */
const griglia = moduli.find(m => m.id === 'griglia')
if (griglia) {
  const cima = conta(11, 0.85).get(`griglia/${griglia.gradi}`) || 0
  const area = conta(8.5, 0.5).get('griglia/4') || 0
  controlla('l\'ultimo grado della griglia esce a chi ha finito la primaria',
            cima > 0, 'mai in 3000 tiri')
  controlla('e l\'area a chi fa la terza', area > 0, 'mai in 3000 tiri')
  nota(`griglia: area a 8 anni e mezzo ${area} volte, ultimo grado a 11 anni ${cima} volte`)
}

/* ── e il contrario: a un bambino piccolo non arriva roba da grande ── */
const piccolo = conta(6.5, 1)
const soffitto = finestraDi(6.5)[1]
const troppo = [...piccolo.entries()].filter(([k]) => {
  const [id, g] = k.split('/')
  const m = moduli.find(x => x.id === id)
  return m.livelloVisto(Number(g), [], { eta: 6.5, finestra: finestraDi(6.5) }) > soffitto
})
uguale('nemmeno la carta più tosta scavalca il soffitto di chi ha sei anni e mezzo',
       troppo.map(([k]) => k).join(' ') || '—', '—')
/* e la stessa cosa dall'altra parte: a dieci anni le lettere non si
   vedono nemmeno con la carta più debole */
const grande = conta(10, 0)
uguale('a dieci anni il mazzo di chi impara a leggere non compare',
       [...grande.keys()].filter(k => k.startsWith('lettere/')).join(' ') || '—', '—')

/* ── il ritocco: quando lo dice un grande ──
   Un gradino è mezzo anno, e da quando l'ammissione è larga il ritocco
   lavora soprattutto sul **peso**: «per lui questo è facile» non apre
   una porta chiusa, sposta il gruppo più in alto — quindi ne escono
   meno domande facili e più toste, e la roba in cima diventa
   raggiungibile. */
const problemi = moduli.find(m => m.id === 'problemi')
if (problemi) {
  const visto = n => problemi.livelloVisto(3, [], {
    eta: 8, finestra: finestraDi(8), ritocchi: { problemi: n },
  })
  controlla('«gli è facile» abbassa il livello visto di quel gruppo', visto(2) < visto(0),
            `${visto(0)} → ${visto(2)}`)
  controlla('«gli è difficile» lo alza', visto(-2) > visto(0), `${visto(0)} → ${visto(-2)}`)
  uguale('un gradino vale mezzo anno di scuola', Math.round(visto(0) - visto(1)), 6)
  controlla('e più di tre gradini non si va', visto(9) === visto(3))

  /* e l'effetto vero: quante domande di problemi escono a un bambino di
     sei anni quando un grande dice che gli vengono bene */
  const quante = n => {
    const sorte = new Sorte(5)
    const classi = classiDi(moduli, {
      difficolta: 0.5, regole: { eta: 6, ritocchi: { problemi: n } },
    })
    let conto = 0
    for (let i = 0; i < 2000; i++) if (pescaClasse(sorte, classi)?.modulo.id === 'problemi') conto++
    return conto
  }
  const fermo = quante(0)
  controlla('a sei anni i problemi scritti capitano poco', fermo < 300, `${fermo} su 2000`)
  controlla('e con «gli è facile» capitano di più', quante(3) > fermo,
            `${fermo} → ${quante(3)} su 2000`)
  nota(`problemi a sei anni su 2000 tiri: fermo ${fermo}, ` +
       `«gli è facile» ${quante(3)}, «gli è difficile» ${quante(-3)}`)
}

/* ── il caso è ripetibile ── */
const a = [...conta(8, 0.5, 11).entries()].sort().map(([k, n]) => `${k}:${n}`).join(' ')
const b = [...conta(8, 0.5, 11).entries()].sort().map(([k, n]) => `${k}:${n}`).join(' ')
uguale('stesso seme, stessa distribuzione', a, b)

/* ── i macrogruppi spenti non entrano nel conto ──
   Se un genitore spegne le misure, nessun tiro deve finire su una
   classe che le chiedeva: è la stessa cosa che prova `unita/saperi`,
   qui vista dal lato della frequenza. */
const spenti = ['misure', 'conversioni', 'orologio']
const sorte = new Sorte(5)
const classi = classiDi(moduli, { spenti, difficolta: 0.6 })
let intrusi = 0
for (let i = 0; i < TIRI; i++) {
  const c = pescaClasse(sorte, classi)
  if (c.modulo.serve(c.grado).some(s => spenti.includes(s))) intrusi++
}
uguale('spenti misure e orologio, nessun tiro ci finisce sopra', intrusi, 0)

riassunto('i pesi delle classi di domande')
