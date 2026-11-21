/* CASTLE BATTLE A SCUOLA

   La maestra sceglie una tappa della campagna (`{ tipo: 'battaglia', tappa: 'ponte' }`) e il livello del nemico; il gioco
   riceve `limite` e parte in quella tappa; ogni calcolo è una risposta raccontata in 40 caratteri. Senza limite nessuna
   tappa, e casa resta com'è (la campagna al Medio). Vedi docs/arena/scuola.md.
   `node test/esegui.mjs arena-scuola --niente-build` */
import scheda, { TAPPE_BATTAGLIA, tappaBattaglia } from '../../src/scuola/giochi/castle-battle/scheda.js'
import { valido as validoCatalogo, descrivi as descriviCatalogo, giocoDi, giochiPer } from '../../src/scuola/comune/esercizi.js'
import { tappaDelLimite, livelloDelLimite, raccontaCalcolo, LUNGO } from '../../src/giochi/arena/motore/limite.js'
import { CAMPAGNA, operazioniDi } from '../../src/giochi/arena/dati/campagna.js'
import { NEMICO_PER_LIVELLO } from '../../src/giochi/arena/dati/taratura.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const { valido, descrivi } = scheda.tipo
const e = tappa => ({ tipo: 'battaglia', tappa })

/* ══════════ la scheda: le dodici tappe, con le loro operazioni ══════════ */
{
  stessaLista('le tappe sono quelle della campagna, in ordine', TAPPE_BATTAGLIA.map(t => t.chiave), CAMPAGNA.map(t => t.chiave))
  controlla('ogni tappa dice le operazioni delle sue truppe',
            TAPPE_BATTAGLIA.every(t => t.segni.split(' ').length === operazioniDi(CAMPAGNA.find(c => c.chiave === t.chiave)).length))
  uguale('la prima scaramuccia è solo addizioni', tappaBattaglia('scaramuccia').operazioni, 'addizioni')
  uguale('il ponte aggiunge le sottrazioni', tappaBattaglia('ponte').operazioni, 'addizioni e sottrazioni')
  controlla('ogni tappa da sola è valida', TAPPE_BATTAGLIA.every(t => valido(e(t.chiave)) && validoCatalogo(e(t.chiave))))
  for (const [cosa, x] of [['senza tappa', { tipo: 'battaglia' }], ['tappa vuota', e('')], ['tappa che non c\'è', e('luna')],
                           ['un campo in più', { ...e('ponte'), extra: 1 }], ['altro tipo', { tipo: 'castello', tappa: 'ponte' }]]) {
    controlla(`storto (${cosa}): non valido`, valido(x) === false)
    controlla(`storto (${cosa}): non valido neanche nel catalogo`, validoCatalogo(x) === false)
  }
  controlla('la scheda vuota non è valida: la tappa si sceglie', !valido(scheda.tipo.voce.vuota))
  uguale('si fa in Castle Battle, anche senza il campo «gioco»', giocoDi(e('ponte')), 'castle-battle')
  stessaLista('e solo lì (niente schede come ripiego)', giochiPer(e('ponte')).map(g => g.id), ['castle-battle'])
  uguale('la frase dice tappa e operazioni', descrivi(e('ponte')), 'Castle Battle · Il ponte di pietra · addizioni e sottrazioni')
  uguale('dal catalogo è la stessa frase', descriviCatalogo(e('ponte')), descrivi(e('ponte')))
}

/* ══════════ il limite: la tappa e il livello ══════════ */
{
  uguale('senza limite nessuna tappa: è casa', tappaDelLimite(null), null)
  uguale('una tappa che non c\'è: casa', tappaDelLimite({ tappa: 'luna' }), null)
  uguale('il ponte è la seconda tappa', tappaDelLimite({ tappa: 'ponte' }), 1)
  stessaLista('Facile, Normale e Difficile sono i tre livelli del nemico',
              ['facile', 'normale', 'difficile', undefined].map(d => livelloDelLimite({ tappa: 'ponte', difficolta: d })),
              ['facile', 'medio', 'difficile', 'medio'])
  controlla('ogni tappa ha il suo nemico tarato a ogni livello',
            ['facile', 'medio', 'difficile'].every(l => CAMPAGNA.every(t => NEMICO_PER_LIVELLO[l][t.chiave])))
}

/* ══════════ il racconto di un calcolo ══════════ */
{
  const d = { testo: '14 + 6 = ?', chiave: 'conti:somma', giusta: 1, risposte: [{ testo: '10' }, { testo: '20' }, { testo: '30' }] }
  const giusto = raccontaCalcolo(d, { giusto: true, indice: 1, tempo: 2.4 })
  stessaLista('giusto: il conto, detto e atteso', [giusto.fatto, giusto.data, giusto.attesa, giusto.giusta, giusto.ultima],
              ['14 + 6', '20', '20', true, true])
  uguale('i secondi diventano millisecondi', giusto.ms, 2400)
  uguale('la chiave è quella della domanda', giusto.chiave, 'conti:somma')
  const sbagliato = raccontaCalcolo(d, { giusto: false, indice: 2, tempo: 5 })
  stessaLista('sbagliato: ha detto 30, era 20', [sbagliato.data, sbagliato.attesa, sbagliato.giusta], ['30', '20', false])
  const lungo = raccontaCalcolo({ ...d, testo: '1'.repeat(80) + ' = ?' }, { giusto: true, indice: 1 })
  controlla(`un testo lungo sta in ${LUNGO} caratteri`, lungo.fatto.length <= LUNGO)
}

riassunto('Castle Battle a scuola')
