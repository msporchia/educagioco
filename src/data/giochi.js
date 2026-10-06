/* Una carta della home per riga, con la stessa chiave di App.vue. I flag del
   manifesto (piccoli/grandi/posto/cresce, serve/chiede, sperimentale, quiz)
   sono spiegati in docs/apprendimento/eta-e-portata.md e saperi.md; i giochi
   in prova in docs/genitori/interruttori.md; senzaFine in
   docs/core/primati.md. L'albo dei progressi resta fuori di proposito. */
import { GIOCHI_NUOVI, gioco } from '../giochi/indice.js'
import { LIBERE_RACCONTO } from './campagne-castello.js' // le quattro partite libere del castello

// un gioco nuovo che ha preso la carta di uno vecchio sta al suo posto, non in coda
const AL_POSTO_DI_UNO_VECCHIO = ['inglese', 'spagnolo']
function riga(g) {
  return { chiave: g.chiave, ico: g.icona, nome: g.nome, che: g.che,
           area: g.area, come: g.come, piccoli: !!g.piccoli,
           cresce: !!g.cresce, grandi: !!g.grandi, posto: !!g.posto, quiz: !!g.quiz,
           copertina: g.copertina,
           sperimentale: !!g.sperimentale, serve: g.serve || [],
           chiede: g.chiede || [],
           senzaFine: g.senzaFine || null }
}

export const GIOCHI = [
  // senza `grandi`: la prima tappa è tarata su 6 anni (arcoDelGioco), la portata già non offre una tappa fuori mira
  { chiave: 'mate',       ico: '☄️', nome: 'Asteroidi',
    che: 'tabelline e calcolo a mente', area: 'numeri', come: 'domande',
    copertina: { fondo: '#2f3b73', disegno: '#4a5aa3', scena: 'stelle' },
    // sfida sola; best.math resta fuori dalla campagna finché un quaderno non c'è (vedi docs/core/primati.md)
    senzaFine: {
      nome: 'Volo infinito', icona: '♾️', misura: 'punti', che: 'quanti punti fai',
      dettagli: d => [`livello ${d.livello}`, `${d.centri} centri`, `serie ${d.serie}`],
      vecchio: p => (p && p.best ? p.best.math : 0),
    } },
  // l'inglese e lo spagnolo a mondi hanno preso il posto delle carte di prima, e ne tengono il posto
  riga(gioco('inglese')),
  riga(gioco('spagnolo')),
  // l'esempio per cui `chiede` esiste: la cassa guarda moltiplicazioni/divisioni da sempre (vedi docs/apprendimento/saperi.md)
  { chiave: 'torri',      ico: '🏰', nome: 'Difendi il Castello',
    che: 'operazioni in colonna, torri e nemici', area: 'numeri', come: 'strategia',
    grandi: true, chiede: ['moltiplicazioni', 'divisioni'],
    copertina: { fondo: '#7bb662', disegno: '#5c9a47', scena: 'colline' },
    // quattro sfide, una per terreno; la prima (il bosco) eredita il record di quando la libera era una sola
    senzaFine: {
      misura: 'ondate', che: 'quante ondate reggi',
      dettagli: d => [`${d.uccisi} nemici fermati`, `${d.torri} torri`],
      sfide: LIBERE_RACCONTO.map((l, i) => ({
        chiave: l.chiave, nome: l.nome, icona: l.emoji, eredita: i === 0,
      })),
    } },
  // senza `grandi`: la prima giornata è tarata sui 6,5 anni (portata: 32), contare monete non chiede di saper leggere
  { chiave: 'bancarella', ico: '🛒', nome: 'La bancarella',
    che: 'euro, centesimi e resto', area: 'numeri', come: 'fare',
    copertina: { fondo: '#ffd36b', disegno: '#e8553f', scena: 'tenda' } },
  { chiave: 'generale',   ico: '🎖️', nome: 'Il generale',
    che: 'sequenze, cicli ed eventi', area: 'logica', come: 'strategia', grandi: true,
    copertina: { fondo: '#c9a36b', disegno: '#b08850', scena: 'griglia' } },
  // i giochi di src/giochi/ si aggiungono da soli dal loro manifesto: ripeterli qui sarebbe tenerli allineati a mano
  ...GIOCHI_NUOVI.filter(g => !AL_POSTO_DI_UNO_VECCHIO.includes(g.chiave)).map(riga),
]

export const CHIAVI_GIOCHI = GIOCHI.map(g => g.chiave)
export const eSperimentale = chiave => GIOCHI.some(g => g.chiave === chiave && g.sperimentale)
export const CHIAVI_SPERIMENTALI = GIOCHI.filter(g => g.sperimentale).map(g => g.chiave)
export const serveA = chiave => GIOCHI.find(g => g.chiave === chiave)?.serve || []
export const chiedeA = chiave => GIOCHI.find(g => g.chiave === chiave)?.chiede || [] // il gemello più debole di serveA
