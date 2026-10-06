/* Il gioco di lingua di prima (views/LinguaGame.vue: i verbi e il libero)
   lasciato a metà, senza browser: si scrive, si rilegge passando dal JSON
   ed è la stessa partita — giuste, errori, monete già prese e la domanda
   aperta con le sue risposte nello stesso ordine. Quello che non torna non
   si legge; una partita senza niente da tenere non si scrive.
   Vedi docs/lingue/sosta.md.
   `node test/esegui.mjs lingua-sosta --niente-build` */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { linguaDi } from '../../src/data/lingue.js'
import { voceDi } from '../../src/data/lessico.js'
import { componi } from '../../src/data/domande.js'
import { scrivi, leggi, dice, chiaveSosta, VERSIONE } from '../../src/motore/lingua/sosta.js'

const viaggio = x => JSON.parse(JSON.stringify(x))
const EN = linguaDi('en'), ES = linguaDi('es')
const hud = (giuste, errori, mirate = 0, serie = 0) => ({ giuste, mirate, errori, serie })
const turnoDi = (L, i, tipo) => componi(voceDi(L.CAMPAGNA[i].nuove[0]), tipo, L.nome)

/* ---------- 1. una tappa: la domanda aperta torna com'era ---------- */
{
  const t = turnoDi(EN, 0, 'figura')
  const dato = viaggio(scrivi({ L: EN, tappa: 0, hud: hud(5, 2, 3, 2), monete: { dato: 4, chiesto: 5 },
                                mostrate: 0, turno: t }))
  uguale('la versione è scritta', dato.v, VERSIONE)
  uguale('è la lingua giusta', dato.lingua, 'en')
  const r = leggi(dato, EN)
  controlla('si rilegge', !!r)
  uguale('le giuste', r.hud.giuste, 5)
  uguale('gli errori', r.hud.errori, 2)
  uguale('le mirate', r.hud.mirate, 3)
  uguale('la serie', r.hud.serie, 2)
  uguale('le monete già prese', r.monete.dato, 4)
  uguale('e quelle chieste', r.monete.chiesto, 5)
  uguale('la domanda è la stessa', r.turno.chiave, t.chiave)
  controlla('le risposte sono le stesse, nello stesso ordine',
            JSON.stringify(r.turno.opzioni.map(o => o.testo)) === JSON.stringify(t.opzioni.map(o => o.testo)))
  uguale('e una sola è giusta', r.turno.opzioni.filter(o => o.giusta).length, 1)
  const q = componi(voceDi(r.turno.chiave), r.turno.tipo, EN.nome)
  uguale('la domanda si rifà uguale dal codice', JSON.stringify(q.domanda), JSON.stringify(t.domanda))
  const d = dice(dato, EN)
  uguale('la carta dice la tappa', d.nome, EN.CAMPAGNA[0].nome)
  uguale('e il bersaglio', d.bersaglio, EN.CAMPAGNA[0].bersaglio)
  uguale('e le giuste', d.giuste, 5)
  controlla('non è il libero', !d.libero)
}

/* ---------- 2. risposta già data: niente domanda, si pesca la prossima ---------- */
{
  const dato = viaggio(scrivi({ L: EN, tappa: 1, hud: hud(1, 0), monete: { dato: 1, chiesto: 1 }, turno: null }))
  const r = leggi(dato, EN)
  controlla('si rilegge senza domanda', !!r && r.turno === null)
}

/* ---------- 3. il gioco libero ---------- */
{
  const L = { ...EN }
  const t = componi(voceDi(EN.CAMPAGNA[3].nuove[0]), 'tradIt', EN.nome)
  const dato = viaggio(scrivi({ L: EN, tappa: -1, hud: hud(23, 4), monete: { dato: 20, chiesto: 21 },
                                mostrate: 20, turno: t }))
  uguale('il libero è la tappa -1', dato.tappa, -1)
  const r = leggi(dato, L)
  controlla('si rilegge', !!r)
  uguale('le giuste non hanno tetto', r.hud.giuste, 23)
  uguale('i cartelli già detti restano detti', r.mostrate, 20)
  const d = dice(dato, EN)
  controlla('la carta sa che è il libero', d.libero)
  uguale('senza bersaglio', d.bersaglio, 0)
}

/* ---------- 4. niente da tenere, niente si scrive ---------- */
uguale('a zero risposte non si scrive', scrivi({ L: EN, tappa: 0, hud: hud(0, 0), monete: { dato: 0, chiesto: 0 } }), null)

/* ---------- 5. quello che non torna non si legge ---------- */
{
  const buono = () => viaggio(scrivi({ L: EN, tappa: 2, hud: hud(6, 1, 2), monete: { dato: 3, chiesto: 3 },
                                       turno: turnoDi(EN, 2, 'tradIt') }))
  controlla('il buono si legge', !!leggi(buono(), EN))
  controlla('un\'altra versione si butta', leggi({ ...buono(), v: VERSIONE + 1 }, EN) === null)
  controlla('un\'altra lingua si butta (le lingue non si mescolano)', leggi(buono(), ES) === null)
  controlla('una tappa con un altro nome si butta (si è spostato qualcosa)',
            leggi({ ...buono(), nome: 'Un\'altra tappa' }, EN) === null)
  controlla('una tappa che non c\'è più si butta', leggi({ ...buono(), tappa: 99 }, EN) === null)
  controlla('una tappa richiusa dai grandi si butta', leggi(buono(), EN, { siGioca: () => false }) === null)
  controlla('un conto storto si butta', leggi({ ...buono(), giuste: -3 }, EN) === null)
  controlla('un conto non numero si butta', leggi({ ...buono(), errori: 'molti' }, EN) === null)
  controlla('una tappa già raggiunta non si riprende',
            leggi({ ...buono(), giuste: EN.CAMPAGNA[2].bersaglio, mirate: EN.CAMPAGNA[2].mirate }, EN) === null)
  const con = f => { const d = buono(); f(d.turno); return leggi(d, EN) }
  controlla('una domanda con una voce che non c\'è si butta', con(q => { q.chiave = 'en:nonesiste' }) === null)
  controlla('una voce di un\'altra tappa si butta', con(q => { q.chiave = ES.CAMPAGNA[0].nuove[0] }) === null)
  controlla('un tipo che non c\'è si butta', con(q => { q.tipo = 'inventato' }) === null)
  controlla('due risposte giuste si buttano', con(q => q.opzioni.forEach(o => { o.giusta = true })) === null)
  controlla('nessuna risposta giusta si butta', con(q => q.opzioni.forEach(o => { o.giusta = false })) === null)
  controlla('un dato che non è un oggetto si butta', leggi(null, EN) === null && leggi('x', EN) === null)
}

/* ---------- 6. lo spagnolo ha la sua, e non si scambiano ---------- */
{
  const dato = viaggio(scrivi({ L: ES, tappa: 0, hud: hud(3, 0), monete: { dato: 2, chiesto: 2 },
                                turno: turnoDi(ES, 0, 'figura') }))
  uguale('è spagnola', dato.lingua, 'es')
  controlla('lo spagnolo la rilegge', !!leggi(dato, ES))
  controlla('l\'inglese no', leggi(dato, EN) === null)
  controlla('le chiavi sono due, e non sono quelle delle tappe a mondi',
            new Set([chiaveSosta('en'), chiaveSosta('es')]).size === 2
            && !['inglese', 'spagnolo'].includes(chiaveSosta('en'))
            && !['inglese', 'spagnolo'].includes(chiaveSosta('es')))
}

riassunto('lingua — il gioco di prima lasciato a metà, senza browser')
