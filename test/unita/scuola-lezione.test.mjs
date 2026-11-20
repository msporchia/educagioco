/* LA LEZIONE A BLOCCHI — la forma, le soglie, dove sta un bambino, le lezioni di prima convertite.
   Vedi docs/scuola/lezione.md. `node test/esegui.mjs scuola-lezione --niente-build` */
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'
import { lezioneValida, passaValido, descriviPassa, convertiLezione, posizione, finita, bloccoDi, superato, MAX_BLOCCHI, alleDomande }
  from '../../src/scuola/comune/lezione.js'

const NOVE = { tipo: 'tabelline', tabelline: [9], modo: 'prodotto' }
const OROLOGIO = { tipo: 'modulo', modulo: 'orologio', da: 1, a: 2, tipologie: [] }
const lez = (blocchi, inTondo = false) => ({ id: 'l1', nome: 'Prova', blocchi, inTondo })

console.log('\nLA FORMA')
{
  controlla('due blocchi, uno da solo e uno della maestra', lezioneValida(lez([{ esercizio: NOVE, passa: { giuste: 5 } }, { esercizio: OROLOGIO, passa: null }])))
  controlla('nello stesso gioco con voci diverse, in tondo', lezioneValida(lez([{ esercizio: { ...NOVE, gioco: 'asteroidi' }, passa: null },
    { esercizio: { tipo: 'tabelline', tabelline: [7], modo: 'prodotto', gioco: 'asteroidi' }, passa: null }], true)))
  for (const [cosa, l] of [['nessun blocco', lez([])], ['troppi blocchi', lez(Array.from({ length: MAX_BLOCCHI + 1 }, () => ({ esercizio: NOVE, passa: null })))],
    ['un esercizio storto', lez([{ esercizio: { tipo: 'boh' }, passa: null }])], ['passa mancante', lez([{ esercizio: NOVE }])],
    ['una chiave in più', { ...lez([{ esercizio: NOVE, passa: null }]), obiettivo: {} }], ['inTondo non booleano', { ...lez([{ esercizio: NOVE, passa: null }]), inTondo: 1 }]])
    controlla(`non è valida: ${cosa}`, !lezioneValida(l))
  for (const p of [{ giuste: 0 }, { domande: 501 }, { minuti: 181 }, { giuste: 2, domande: 3 }, { secondi: 3 }, { giuste: '5' }, []])
    controlla(`passa storto: ${JSON.stringify(p)}`, !passaValido(p))
  stessaLista('si dice in italiano', [{ giuste: 5 }, { giuste: 1 }, { domande: 20 }, { minuti: 1 }, null].map(descriviPassa),
    ['dopo 5 risposte giuste', 'dopo una risposta giusta', 'dopo 20 domande', 'dopo un minuto', 'quando lo dice la maestra'])
}

console.log('\nLE LEZIONI DI PRIMA')
{
  const vecchia = { id: 'v', nome: 'Il nove', obiettivo: { esercizio: NOVE, quante: 15, minuti: null }, dopo: OROLOGIO }
  const nuova = convertiLezione(vecchia)
  stessaLista('obiettivo e se hai finito diventano due blocchi', nuova,
    { id: 'v', nome: 'Il nove', blocchi: [{ esercizio: NOVE, passa: { domande: 15 } }, { esercizio: OROLOGIO, passa: null }], inTondo: false })
  controlla('ed è valida', lezioneValida(nuova))
  stessaLista('a minuti, senza se hai finito: un blocco', convertiLezione({ id: 'w', nome: 'x', obiettivo: { esercizio: NOVE, quante: null, minuti: 10 }, dopo: null }).blocchi,
    [{ esercizio: NOVE, passa: { minuti: 10 } }])
  controlla('una lezione già a blocchi torna uguale', convertiLezione(nuova) === nuova)
}

console.log('\nDOVE STA UN BAMBINO')
{
  const l = lez([{ esercizio: NOVE, passa: { giuste: 3 } }, { esercizio: OROLOGIO, passa: null }])
  uguale('«Avanti tutti» porta avanti chi è indietro', posizione(0, 1), 1)
  uguale('e lascia dov\'è chi era già avanti', posizione(2, 1), 2)
  stessaLista('i blocchi, poi finita', [0, 1, 2].map(p => bloccoDi(l, p)), [0, 1, -1])
  controlla('oltre l\'ultimo blocco è finita', finita(l, 2) && !finita(l, 1))
  const giro = { ...l, inTondo: true }
  stessaLista('in tondo si ricomincia, e non finisce mai', [0, 1, 2, 3, 4].map(p => bloccoDi(giro, p)), [0, 1, 0, 1, 0])
  controlla('tre giuste superano «dopo 3 giuste»', superato({ giuste: 3 }, { fatte: 5, giuste: 3 }, 0) && !superato({ giuste: 3 }, { fatte: 5, giuste: 2 }, 0))
  controlla('le domande contano le fatte', superato({ domande: 4 }, { fatte: 4, giuste: 0 }, 0))
  controlla('i minuti contano dall\'inizio del blocco', superato({ minuti: 2 }, { inizio: 1000 }, 1000 + 120_000) && !superato({ minuti: 2 }, { inizio: 1000 }, 1000 + 119_999))
  controlla('quando lo dice la maestra non passa mai da solo', !superato(null, { fatte: 999, giuste: 999, inizio: 0 }, 1e12))
}

console.log('\nTUTTI ALLE DOMANDE')
{
  const PASSO = { tipo: 'passo', protagonista: 'coniglio', gradini: ['passi'] }
  const l = lez([{ esercizio: { ...NOVE, gioco: 'asteroidi', difficolta: 'facile' }, passa: { giuste: 3 } }, { esercizio: OROLOGIO, passa: null }, { esercizio: PASSO, passa: null }])
  const { lezione: d, restano } = alleDomande(l)
  stessaLista('il blocco degli Asteroidi lascia il gioco e la difficoltà', d.blocchi[0], { esercizio: NOVE, passa: { giuste: 3 } })
  stessaLista('quello a schede resta com\'è', d.blocchi[1], l.blocchi[1])
  controlla('quello che c\'è solo nel gioco resta, e si conta', d.blocchi[2] === l.blocchi[2] && restano === 1)
  controlla('ed è ancora valida', lezioneValida(d))
}

riassunto('la lezione a blocchi')
