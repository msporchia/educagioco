/* ═══════════════════════════════════════════════════════════════════
   LANTERNA — la luce che porti, o che lasci

   Non prova il buio (quello è `unita.test.mjs`, che prova come
   `Unita.vede()` legge un tetto e un'eccezione): prova solo che la
   lanterna sappia dire, in ogni momento, DA DOVE e FIN DOVE illumina —
   il contratto che `Mondo.illuminato()` le chiede.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, chiFinto, mondoFinto, campoFinto } from '../../../aiuto/finto.js'
import { Lanterna } from '../../../../src/motore/generale/elementi/lanterna.js'

function bancoLanterna (opts) {
  const q = banco(opts)
  q.mondo.livello = {}   // basta a nomeIn(): nessun nome dichiarato, si legge l'id
  return q
}

{
  /* PER TERRA, MAI TOCCATA: fa luce da sé, col raggio di default */
  const lanterna = new Lanterna('lanterna', { x: 4, y: 2 })
  const q = bancoLanterna({ cose: [lanterna], chi: chiFinto() })
  const luce = lanterna.luce(q.mondo)
  controlla('per terra: fa luce', !!luce)
  controlla('per terra: da sé stessa', luce.da === lanterna)
  uguale('per terra: raggio di default', luce.raggio.limite, 3)
  nota('il raggio di default è quello di una vista normale, non tutto il livello')
}
{
  /* IL RAGGIO SI SCEGLIE: `cose.lanterna('x', { raggio: 5 })` produce
     `d.raggio = 5`, e la classe lo legge */
  const lanterna = new Lanterna('lanterna', { x: 0, y: 0, raggio: 5 })
  const q = bancoLanterna({ cose: [lanterna], chi: chiFinto() })
  uguale('un raggio dichiarato si usa', lanterna.luce(q.mondo).raggio.limite, 5)
}
{
  /* PRESA: segue chi la porta, non resta dov'era raccolta */
  const lanterna = new Lanterna('lanterna', { x: 0, y: 0 })
  const eroe = chiFinto({ id: 'eroe', x: 5, y: 5 })
  const q = bancoLanterna({ cose: [lanterna], chi: eroe })
  lanterna.ricevi('prendi', eroe, q.contesto)
  const luce = lanterna.luce(q.mondo)
  controlla('presa: fa ancora luce', !!luce)
  controlla('presa: la sorgente è chi la porta, non più lei', luce.da === eroe)
  nota('così se chi la porta cammina, il cerchio la segue senza che nessuno lo dica')
}
{
  /* CHI LA PORTAVA È CADUTO: nessuno la tiene più in mano, e finché
     resta addosso a un corpo a terra non fa luce da nessuna parte —
     è la parte del contratto che serve a provare che qui il controllo
     è quello giusto (`eInPiedi()`), non quello ereditato da `Oggetto`
     (`chi.viva`, che su un'`Unita` vera non esiste più: vedi la nota
     in testa a `lanterna.js`) */
  const lanterna = new Lanterna('lanterna', { x: 0, y: 0 })
  const eroe = chiFinto({ id: 'eroe', x: 5, y: 5 })
  const q = bancoLanterna({ cose: [lanterna], chi: eroe })
  lanterna.ricevi('prendi', eroe, q.contesto)
  eroe.inPiedi = false
  uguale('nessuna luce finché nessuno la tiene in piedi', lanterna.luce(q.mondo), null)
}
{
  /* POSATA: torna a illuminare IL POSTO, non chi l'ha lasciata lì —
     è la mossa che permette di lasciare la lanterna dove serve invece
     di portarsela dietro */
  const lanterna = new Lanterna('lanterna', { x: 0, y: 0 })
  const eroe = chiFinto({ id: 'eroe', x: 5, y: 5 })
  const q = bancoLanterna({ cose: [lanterna], chi: eroe })
  lanterna.ricevi('prendi', eroe, q.contesto)
  lanterna.ricevi('posa', eroe, q.contesto)
  const luce = lanterna.luce(q.mondo)
  controlla('posata: fa ancora luce', !!luce)
  controlla('posata: la sorgente è di nuovo lei, non l\'eroe', luce.da === lanterna)
  uguale('posata: è dove l\'ha lasciata, non dov\'era all\'inizio', luce.da.x, 5)
  controlla('e se l\'eroe se ne va, la luce non lo segue',
            lanterna.luce(q.mondo).da !== eroe)
}
{
  /* IL CERCHIO SI MISURA A CAMMINO, COME LA VISTA: un corridoio senza
     giri intorno (altezza 1) e un muro che lo taglia in due — non un
     cerchio geometrico, che passerebbe dritto attraverso il muro come
     farebbe il suono (`InAria`, `distanze/in-aria.js`) */
  const muri = [{ x: 2, y: 0 }]
  const campo = campoFinto({ larghezza: 5, altezza: 1, muri })
  const lanterna = new Lanterna('lanterna', { x: 0, y: 0, raggio: 9 })
  const mondo = mondoFinto({ cose: [lanterna], campo })
  controlla('dalla stessa parte del muro, arriva', mondo.illuminato({ x: 1, y: 0 }))
  controlla('un muro in mezzo ferma la luce, anche con un raggio enorme',
            !mondo.illuminato({ x: 4, y: 0 }))
}

riassunto('lanterna')
