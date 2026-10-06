/* Il Codice Segreto lasciato a metà: si scrive, si rilegge, ed è la stessa
   partita — lo stesso codice segreto, le stesse righe, i codici già vinti,
   la serie del libero. Quello che non torna non si legge. Vedi
   docs/codice-segreto/sosta.md.
   `node test/esegui.mjs codice-segreto-sosta --niente-build` */
import { CAMPAGNA } from '../../src/giochi/codice-segreto/dati/campagna.js'
import { Regole } from '../../src/giochi/codice-segreto/motore/partita.js'
import { Corsa } from '../../src/giochi/codice-segreto/motore/corsa.js'
import { scrivi, leggi, dice, VERSIONE } from '../../src/giochi/codice-segreto/motore/sosta.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const passaDalDisco = d => JSON.parse(JSON.stringify(d))
const tappa = CAMPAGNA[3]                    // la scogliera: quattro caselle, doppioni sì
const nuova = (t = tappa, codici = null) => Corsa.perTappa(t, { codici })

/* una riga sbagliata ma sensata: il primo disegno ripetuto, poi il resto */
function giocaRiga(c, simboli) {
  for (const s of simboli) c.partita.posa(s)
  return c.partita.conferma()
}
// una riga di un disegno che nel codice non c'è (il codice ne ha al più
// quattro, il tema cinque): niente pieni, niente vuoti, mai vincente
const sbagliata = c => {
  const p = c.partita
  return Array(p.regole.caselle).fill(p.regole.pool.find(s => !p.codice.includes(s)))
}

/* ══════════ 1. quello che è successo si ritrova ══════════ */
{
  const pool = Regole.perTappa(tappa).pool
  const c = nuova(tappa, [[pool[1], pool[2], pool[3], pool[4]]])   // nessuna riga sotto lo indovina
  const codice = c.partita.codice.slice()
  giocaRiga(c, [pool[0], pool[0], pool[1], pool[2]])
  giocaRiga(c, [pool[3], pool[3], pool[4], pool[4]])
  c.partita.posa(pool[1]); c.partita.posa(pool[2])      // una riga a metà

  const dato = scrivi(c, { chiave: tappa.chiave, serie: 2 })
  controlla('una partita con righe giocate si scrive', !!dato)
  const r = leggi(passaDalDisco(dato))
  controlla('e si rilegge', !!r)
  uguale('è la stessa tappa', r.indice, 3)
  uguale('con lo stesso codice segreto', r.corsa.partita.codice.join(), codice.join())
  uguale('le stesse righe giocate', r.corsa.partita.prove.map(x => x.simboli.join()).join('|'),
         c.partita.prove.map(x => x.simboli.join()).join('|'))
  uguale('con gli stessi pallini',
         JSON.stringify(r.corsa.partita.prove.map(x => [x.pieni, x.vuoti])),
         JSON.stringify(c.partita.prove.map(x => [x.pieni, x.vuoti])))
  uguale('e la riga a metà dov\'era', r.corsa.partita.corrente.join(), c.partita.corrente.join())
  uguale('le prove rimaste sono quelle di prima', r.corsa.partita.rimaste, c.partita.rimaste)
  uguale('la serie dell\'albo torna', r.serie, 2)

  // e la partita ripresa si può finire come quella di prima
  r.corsa.partita.posa(pool[3]); r.corsa.partita.posa(pool[4])
  const prova = r.corsa.partita.conferma()
  controlla('si può continuare a giocare', !!prova && r.corsa.partita.usate === 3)
}

/* ══════════ 2. i codici già vinti, le stelle e le monete restano ══════════ */
{
  const c = nuova(tappa, [['🐠', '🐙', '🦀', '🐳']])
  giocaRiga(c, ['🐠', '🐙', '🦀', '🐳'])
  controlla('il primo codice è vinto', c.partita.vinta)
  c.registra()
  c.avanti()
  giocaRiga(c, sbagliata(c))
  const dato = passaDalDisco(scrivi(c, { chiave: tappa.chiave }))
  const r = leggi(dato)
  uguale('i codici vinti restano', r.corsa.vinte, 1)
  uguale('le giocate pure', r.corsa.giocate, 1)
  uguale('le monete incassate nella tappa restano', r.corsa.monete, c.monete)
  uguale('le stelle peggiori restano', r.corsa.peggiore, c.peggiore)
  uguale('mancano ancora due codici', r.corsa.rimaste, tappa.partite - 1)
  uguale('e dice a che codice si è', dice(dato).codice, 2)
}

/* ══════════ 3. fra un codice e l'altro non c'è un codice da salvare ══════════ */
{
  const c = nuova(tappa, [['🐠', '🐙', '🦀', '🐳']])
  giocaRiga(c, ['🐠', '🐙', '🦀', '🐳'])
  c.registra()                             // il cartello di fine è aperto
  const dato = passaDalDisco(scrivi(c, { chiave: tappa.chiave }))
  controlla('si salva anche col cartello aperto: il codice vinto non si rifà',
            dato && dato.partita === null && dato.vinte === 1)
  const r = leggi(dato)
  uguale('si riprende con un codice nuovo e pulito', r.corsa.partita.prove.length, 0)
  uguale('e un codice vinto in meno da vincere', r.corsa.rimaste, tappa.partite - 1)
}

/* ══════════ 4. una partita finita, o non cominciata, non si scrive ══════════ */
{
  const c = nuova()
  controlla('un codice appena nato non è una partita a metà',
            scrivi(c, { chiave: tappa.chiave }) === null)
  c.partita.posa(c.regole.pool[0])
  controlla('ma una casella posata sì', scrivi(c, { chiave: tappa.chiave }) !== null)

  const f = Corsa.perTappa(tappa)
  f.vinte = f.richieste
  controlla('una tappa finita non si scrive', scrivi(f, { chiave: tappa.chiave }) === null)

  // un codice perso: si è ancora a metà tappa, e le stelle si ricordano
  const p = nuova()
  while (!p.partita.finita) giocaRiga(p, sbagliata(p))
  p.registra()
  const d = scrivi(p, { chiave: tappa.chiave })
  controlla('dopo un codice perso la tappa si scrive, senza il codice perso',
            d && d.partita === null && d.giocate === 1 && d.peggiore === 1)
  uguale('e il rientro non ridà le stelle', leggi(passaDalDisco(d)).corsa.peggiore, 1)
}

/* ══════════ 5. il libero: la serie in corso ══════════ */
{
  const regole = Regole.libere('normale', 'mare')
  const c = new Corsa(regole, Infinity, { codici: [Array(regole.caselle).fill(regole.pool[4])] })
  const ctx = { difficolta: 'normale', tema: 'mare' }
  controlla('libero appena cominciato, senza serie: niente da ritrovare',
            scrivi(c, { ...ctx, fila: 0 }) === null)
  controlla('con una serie sì, anche fra un codice e l\'altro',
            scrivi(c, { ...ctx, fila: 4 }) !== null)
  giocaRiga(c, [regole.pool[0], regole.pool[1], regole.pool[2], regole.pool[3]])
  const dato = passaDalDisco(scrivi(c, { ...ctx, fila: 4, serie: 4 }))
  const r = leggi(dato)
  controlla('il libero si rilegge', !!r && r.indice === -1)
  uguale('con la sua serie', r.fila, 4)
  uguale('la sua difficoltà', r.difficolta, 'normale')
  uguale('il suo tema', r.tema, 'mare')
  uguale('senza fine', r.corsa.richieste, Infinity)
  uguale('e lo stesso codice', r.corsa.partita.codice.join(), c.partita.codice.join())
  const d = dice(dato)
  controlla('la carta dice «di fila»', d.libero && d.fila === 4 && d.righe === 1)

  // una serie spezzata (codice sbagliato) è chiusa: niente da ritrovare
  const p = new Corsa(regole, Infinity)
  while (!p.partita.finita) giocaRiga(p, sbagliata(p))
  p.registra()
  controlla('dopo il codice sbagliato la serie è a zero e la sosta non c\'è',
            scrivi(p, { ...ctx, fila: 0 }) === null)
}

/* ══════════ 6. quello che non torna non si legge ══════════ */
{
  const c = nuova()
  c.partita.posa(c.regole.pool[0])
  const buono = () => passaDalDisco(scrivi(c, { chiave: tappa.chiave }))
  const guasto = (cosa, f) => { const d = buono(); f(d); controlla(cosa, leggi(d) === null) }

  controlla('il salvataggio buono si legge', leggi(buono()) !== null)
  guasto('un\'altra versione si butta', d => { d.v = VERSIONE + 1 })
  guasto('una tappa che non esiste più si butta', d => { d.chiave = 'sparita' })
  guasto('un disegno che non c\'è si butta', d => { d.partita.codice[0] = '💥' })
  guasto('un codice corto si butta', d => { d.partita.codice.pop() })
  guasto('troppe righe giocate si buttano',
         d => { d.partita.prove = Array(99).fill(d.partita.codice) })
  guasto('una riga a metà con un buco in mezzo si butta',
         d => { d.partita.corrente = [null, c.regole.pool[0], null, null] })
  guasto('più codici vinti di quelli della tappa si buttano', d => { d.vinte = 9; d.giocate = 9 })
  guasto('monete negative si buttano', d => { d.monete = -3 })
  guasto('un libero con difficoltà ignota si butta', d => { d.chiave = ''; d.difficolta = 'boh'; d.tema = 'mare' })
  controlla('niente salvataggio, niente partita', leggi(null) === null)
  controlla('e il carico a metà non porta giù il gioco', leggi({ v: VERSIONE, chiave: 3 }) === null)
  controlla('la carta non si fida di una versione diversa',
            dice({ ...buono(), v: VERSIONE + 1 }) === null)
}

riassunto('codice segreto — la partita lasciata a metà')
