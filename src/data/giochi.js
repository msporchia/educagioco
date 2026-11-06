/* Una carta della home per riga, con la stessa chiave di App.vue. I flag del
   manifesto (piccoli/grandi/posto/cresce, serve/chiede, spentoDiBase/nota, quiz)
   sono spiegati in docs/apprendimento/eta-e-portata.md e saperi.md; i giochi
   in prova in docs/genitori/interruttori.md; senzaFine in
   docs/core/primati.md. L'albo dei progressi resta fuori di proposito. */
import { GIOCHI_NUOVI, gioco } from '../giochi/indice.js'
import { LIBERE_RACCONTO, RACCONTO } from './campagne-castello.js' // le quattro partite libere del castello, e le sue venti tappe
import { SCALETTA, filaDi, posizioneOra } from './asteroidi.js'
import { CUCINE } from './bancarella-cucine.js'

// un gioco nuovo che ha preso la carta di uno vecchio sta al suo posto, non in coda
const AL_POSTO_DI_UNO_VECCHIO = ['inglese', 'spagnolo']
function riga(g) {
  return { chiave: g.chiave, ico: g.icona, nome: g.nome, che: g.che,
           area: g.area, come: g.come, piccoli: !!g.piccoli,
           cresce: !!g.cresce, grandi: !!g.grandi, posto: !!g.posto, quiz: !!g.quiz,
           copertina: g.copertina,
           spentoDiBase: !!g.spentoDiBase, nota: g.nota || null, serve: g.serve || [],
           chiede: g.chiede || [],
           senzaFine: g.senzaFine || null,
           amici: g.amici || null }
}

export const GIOCHI = [
  // senza `grandi`: la prima tappa è tarata su 6 anni (arcoDelGioco), la portata già non offre una tappa fuori mira
  { chiave: 'mate',       ico: '☄️', nome: 'Asteroidi',
    che: 'tabelline e calcolo a mente', area: 'numeri', come: 'domande',
    copertina: { fondo: '#26305e', disegno: '#3d4a8a', scena: 'stelle' },
    // sfida sola; best.math resta fuori dalla campagna finché un quaderno non c'è (vedi docs/core/primati.md)
    senzaFine: {
      nome: 'Volo infinito', icona: '♾️', misura: 'punti', che: 'quanti punti fai',
      dettagli: d => [`livello ${d.livello}`, `${d.centri} centri`, `serie ${d.serie}`],
      vecchio: p => (p && p.best ? p.best.math : 0),
    },
    // gli amici sulla rotta (docs/core/amici-bacheca.md): la fila sta in `profile.mate`, non nelle campagne
    amici: { tappe: SCALETTA.length, dove: 'al volo infinito', tappa: p => posizioneOra(filaDi(p.mate)) } },
  // l'inglese e lo spagnolo a mondi hanno preso il posto delle carte di prima, e ne tengono il posto
  riga(gioco('inglese')),
  riga(gioco('spagnolo')),
  // l'esempio per cui `chiede` esiste: la cassa guarda moltiplicazioni/divisioni da sempre (vedi docs/apprendimento/saperi.md)
  { chiave: 'torri',      ico: '🏰', nome: 'Difendi il Castello',
    che: 'operazioni in colonna, torri e nemici', area: 'numeri', come: 'strategia',
    grandi: true, chiede: ['moltiplicazioni', 'divisioni'],
    copertina: { fondo: '#5b8fd1', disegno: '#8d96a3', scena: 'mura' },
    // quattro sfide, una per terreno; la prima (il bosco) eredita il record di quando la libera era una sola
    senzaFine: {
      misura: 'ondate', che: 'quante ondate reggi',
      dettagli: d => [`${d.uccisi} nemici fermati`, `${d.torri} torri`],
      sfide: LIBERE_RACCONTO.map((l, i) => ({
        chiave: l.chiave, nome: l.nome, icona: l.emoji, eredita: i === 0,
      })),
    },
    // gli amici sul regno (docs/core/amici-nei-giochi.md): la tappa da fare sta in `profile.td`, non nelle campagne; finita, le libere al centro
    amici: { tappe: RACCONTO.length, dove: 'alle partite libere',
             tappa: p => { const td = p.td || {}; return td.libera ? RACCONTO.length : Math.floor(Number(td.tappa) || 0) } } },
  // senza `grandi`: la prima giornata è tarata sui 6,5 anni (portata: 32), contare monete non chiede di saper leggere
  { chiave: 'bancarella', ico: '🍳', nome: 'La cucina',
    che: 'cucinare, euro e resto', area: 'numeri', come: 'fare',
    copertina: { fondo: '#ffd36b', disegno: '#e8553f', scena: 'tenda' },
    // il record dell'ultima, quella a tempo (docs/bancarella/cucina.md)
    senzaFine: { nome: 'Cinque minuti', icona: '⏱️', misura: 'quanti', che: 'quante ordinazioni servi',
                 dettagli: d => [`${(d.incasso / 100).toFixed(2).replace('.', ',')} € incassati`, `${d.banchi} giri`] },
    // gli amici sui livelli (docs/core/amici-nei-giochi.md): quanti ne ha vinti sta nel banco
    amici: { tappe: CUCINE.length, dove: 'al gran servizio', tappa: p => p.campagne?.bancarella?.banco?.cucina?.fatte } },
  // i giochi di src/giochi/ si aggiungono da soli dal loro manifesto: ripeterli qui sarebbe tenerli allineati a mano
  ...GIOCHI_NUOVI.filter(g => !AL_POSTO_DI_UNO_VECCHIO.includes(g.chiave)).map(riga),
]

export const CHIAVI_GIOCHI = GIOCHI.map(g => g.chiave)
// un gioco con `nota` è ancora a metà: spento di base, fuori dalle guide e dalle novità (docs/genitori/interruttori.md)
export const eInProva = chiave => GIOCHI.some(g => g.chiave === chiave && g.nota)
export const serveA = chiave => GIOCHI.find(g => g.chiave === chiave)?.serve || []
export const chiedeA = chiave => GIOCHI.find(g => g.chiave === chiave)?.chiede || [] // il gemello più debole di serveA
