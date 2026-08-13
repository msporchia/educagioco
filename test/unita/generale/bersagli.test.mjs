/* ═══════════════════════════════════════════════════════════════════
   I BERSAGLI — quello che si può indicare col dito

   `views/generale/bersagli.js` è il ponte fra il motore e le due cose
   che chiedono «su cosa può valere questo verbo?»: l'editor, per
   riempire l'elenco, e il campo, per accendere le caselle mentre il
   dito cerca. È codice di vista, ma non tocca lo schermo: si prova
   qui, in un decimo di secondo, invece che dentro Chrome.

   ── PERCHÉ ESISTE QUESTO FILE ──
   Due difetti veri, tutti e due invisibili al banco dei livelli e
   tutti e due dello stesso tipo — la vista che chiede al motore
   qualcosa che il motore non dice più:

     · `mondo.oggetti.find(z => z.nome === k)` — `nome` era un alias
       dell'id, poi `allestimento.js` ha cominciato a dargli il nome che
       si legge in una frase («il tesoro»). Cercare per nome una chiave
       (`tesoro`) non trovava più niente: **il tesoro non si poteva
       nemmeno indicare**, e la prima prova del gioco diventava
       impossibile da finire;
     · `u.viva` — la classe `Unita` tiene lo stato per sé e risponde a
       `eInPiedi()`. `undefined` è falso, quindi ogni unità risultava
       caduta: nessuna compariva fra i bersagli, e sul campo si
       disegnavano tutte stese.

   La rete c'era già — `integrazione/generale` li prende tutti e due, ed
   è stato verificato rimettendo il difetto — ma vive dentro Chrome, e
   la CI non lancia mai i test di integrazione. Un guasto che si scopre
   solo aprendo il gioco a mano è un guasto che si scopre dal telefono
   di un bambino. Qui gli stessi controlli costano zero e girano
   sempre.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, riassunto } from '../../aiuto/verifica.mjs'
import { creaMondo } from '../../../src/motore/generale.js'
import { bersagliDi, cosePer, nomeDi } from '../../../src/views/generale/bersagli.js'
import PRIMO from '../../../src/data/livelli/tutorial/1-primo-ordine.js'
import CHIAVE from '../../../src/data/livelli/tutorial/2-la-chiave-e-il-portone.js'
import ATTESA from '../../../src/data/livelli/tutorial/4-mettetevi-daccordo.js'

const idDi = l => l.map(b => b.id)

{
  /* la prima prova del gioco: un eroe, un forziere, e «apri».
     ── IL TESORO NON È PIÙ UNA COSA DA PRENDERE ──
     Si apre, ed è una `Porta` come il cancello e la botola (`cose.
     forziere` in `data/livelli/scrivi.js`): questo blocco chiedeva
     `prendi` perché il tesoro finiva in tasca, e la domanda giusta
     adesso è un'altra. Quello che sorveglia non cambia — che la vista
     sappia ancora dire DOVE sta e COME si chiama la cosa su cui vale
     il verbo della prima prova. */
  const m = creaMondo(PRIMO, 0)
  const aperti = bersagliDi(m, 'apri')
  controlla('il tesoro si può indicare col dito', idDi(aperti).includes('tesoro'),
            `bersagli di «apri»: ${JSON.stringify(idDi(aperti))}`)
  const b = aperti.find(z => z.id === 'tesoro')
  controlla('e sta dove sta davvero',
            !!b && b.x === m.cose.tesoro.x && b.y === m.cose.tesoro.y,
            b ? `${b.x},${b.y}` : 'non c\'è')
  controlla('e si legge col nome della frase, non con la chiave',
            nomeDi(m, 'tesoro') === 'il tesoro', nomeDi(m, 'tesoro'))
  controlla('«apri» offre il tesoro anche nell\'elenco',
            cosePer(m, 'apri').some(c => c.id === 'tesoro'))
  /* `vai` accetta più tipi: il tesoro c'è lo stesso, ed è la mossa che
     la prima prova esiste per far sbagliare */
  controlla('anche «vai» lo accetta', idDi(bersagliDi(m, 'vai')).includes('tesoro'))
}

{
  /* ── E UNA COSA DA PRENDERE C'È ANCORA, NELLA SECONDA PROVA ──
     Il difetto che questo file esiste per sorvegliare — `oggetti.find(z
     => z.nome === k)`, cioè cercare per NOME una chiave — riguarda gli
     oggetti, non le porte: da quando il tesoro si apre, la rete va tesa
     dove gli oggetti sono rimasti, se no smetterebbe di guardare
     proprio quello per cui è stata scritta. */
  const m = creaMondo(CHIAVE, 0)
  const presi = bersagliDi(m, 'prendi')
  controlla('la chiave si può indicare col dito', idDi(presi).includes('chiave'),
            `bersagli di «prendi»: ${JSON.stringify(idDi(presi))}`)
  const b = presi.find(z => z.id === 'chiave')
  controlla('e sta dove sta davvero',
            !!b && b.x === m.oggetti[0].x && b.y === m.oggetti[0].y,
            b ? `${b.x},${b.y}` : 'non c\'è')
  controlla('e si legge col nome della frase, non con la chiave',
            nomeDi(m, 'chiave') === 'la chiave', nomeDi(m, 'chiave'))
  controlla('«prendi» offre la chiave anche nell\'elenco',
            cosePer(m, 'prendi').some(c => c.id === 'chiave'))
}

{
  /* ── CHI È IN PIEDI SI INDICA, CHI È CADUTO NO ──
     Si guarda una FAZIONE, non un'unità qualsiasi: quali cose si
     possano nominare lo decide il livello (`complementi`), e la quarta
     prova dichiara «gli orchi» e non i propri — mandare l'eroe *dal
     cavaliere* non è una mossa che quel livello vuole offrire. È anche
     il motivo per cui questo controllo va scritto su quello che il
     livello dichiara davvero, invece che su quello che ci si aspetta:
     la prima stesura di questo test pretendeva le unità del giocatore
     e sbagliava lei, non il codice. */
  const m = creaMondo(ATTESA, 0)
  const chiVedo = () => idDi(bersagliDi(m, 'vai'))
  const orchi = m.unita.filter(u => u.fazione === 'orchi')
  controlla('c\'è almeno un orco in campo', orchi.length >= 1, String(orchi.length))
  controlla('finché è in piedi, «gli orchi» si indicano',
            chiVedo().includes('orchi'), JSON.stringify(chiVedo()))

  /* si buttano giù come farebbe una battaglia: la fazione sparisce dai
     bersagli, ed è la stessa domanda che si fa il campo per disegnarli
     stesi invece che in piedi */
  orchi.forEach(o => o.subisci(999, m))
  controlla('caduti tutti, la fazione non si indica più',
            !chiVedo().includes('orchi'), JSON.stringify(chiVedo()))
  controlla('e il tesoro resta lì dov\'era', chiVedo().includes('tesoro'))
}

riassunto('i bersagli')
