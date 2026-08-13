/* ═══════════════════════════════════════════════════════════════════
   L'ORCHESTRATORE — un personaggio, più fili, un puntatore solo

   Un personaggio ha un piano e può avere più fili: quello principale,
   uno per ogni «quando senti» che è scattato, uno per ogni reazione che
   gli è addosso. Ne gira sempre UNO, e quando finisce il puntatore
   torna a chi era in pausa.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../aiuto/verifica.mjs'
import { mondoFinto, campoFinto, cosaFinta, cartellino, registroFinto } from '../../aiuto/finto.js'
import { Unita } from '../../../src/motore/generale/unita.js'
import { compilaFila } from '../../../src/motore/generale/azioni/indice.js'
import { Fila } from '../../../src/motore/generale/azioni/fila.js'
import { Rumore } from '../../../src/motore/generale/messaggi/rumore.js'
/* la reazione la si prende dalla LIBRERIA dei dati, non dal motore: il
   motore non sa cosa voglia dire «accorrere al rumore», sa solo far
   partire una fila quando arriva un messaggio */
import { reagisce } from '../../../src/data/livelli/scrivi.js'

const stanza = () => campoFinto({ larghezza: 12, altezza: 5 })

{
  const meta = cosaFinta({ id: 'meta', nome: 'la meta', tipo: 'posto', x: 2, y: 0 })
  const eroe = new Unita({ id: 'eroe', nome: "l'eroe", fazione: 'nostri', x: 0, y: 0, vita: 3, vista: 6 })
  const mondo = mondoFinto({ cose: [meta], campo: stanza(), unita: [eroe] })
  const registro = registroFinto()
  eroe.parti(compilaFila([{ verbo: 'vai', complemento: 'meta' }]))

  controlla('appena partita è impegnata', eroe.eImpegnata())
  uguale('e il filo attivo è il principale', eroe.attivo.nome, 'principale')
  const speso = eroe.esegui(mondo, registro)
  controlla('un passo spende il battito', speso)
  uguale('e la muove di una cella', eroe.x, 1)
  eroe.esegui(mondo, registro)
  eroe.esegui(mondo, registro)
  controlla('finito il piano non è più impegnata', !eroe.eImpegnata())
  controlla('e chi è libero non spende più battiti', !eroe.esegui(mondo, registro))
}

{
  /* UN ASCOLTO NON INTERROMPE: aspetta che il personaggio sia libero,
     se no il piano che hai scritto non si spiegherebbe più */
  const lontano = cosaFinta({ id: 'lontano', nome: 'il fondo', tipo: 'posto', x: 9, y: 0 })
  const via = cartellino('via', 'segnale', 'via libera')
  const eroe = new Unita({ id: 'eroe', nome: "l'eroe", fazione: 'nostri', x: 0, y: 0, vita: 3, vista: 6 })
  const mondo = mondoFinto({ cose: [lontano, via], campo: stanza(), unita: [eroe] })
  const registro = registroFinto()
  eroe.parti(compilaFila([{ verbo: 'vai', complemento: 'lontano' }]))
  eroe.mettiInAscolto('via', new Fila([]), 'quando «via libera»')
  eroe.esegui(mondo, registro)

  const destato = eroe.senti({ segnale: 'via' })
  controlla('un segnale che arriva mentre sei occupato non ti sveglia', !destato)
  uguale('e il filo attivo resta quello di prima', eroe.attivo.nome, 'principale')
}

{
  /* UNA REAZIONE SÌ: è come sei fatto, e ti prende mentre fai altro.
     Poi finisce, e il puntatore torna dov'era. */
  const lontano = cosaFinta({ id: 'lontano', nome: 'il fondo', tipo: 'posto', x: 11, y: 0 })
  const guardia = new Unita({ id: 'guardia', nome: 'la guardia', fazione: 'orchi',
                              x: 0, y: 0, vita: 9, vista: 2,
                              reagisce: [reagisce.alRumore('richiamo', { sosta: 2 })] })
  const ladra = new Unita({ id: 'ladra', nome: 'la ladra', fazione: 'nostri', x: 5, y: 4, vita: 1, vista: 3 })
  const mondo = mondoFinto({ cose: [lontano], campo: stanza(), unita: [guardia, ladra] })
  const registro = registroFinto()
  guardia.parti(compilaFila([{ verbo: 'vai', complemento: 'lontano' }]))
  ladra.parti(new Fila([]))
  guardia.esegui(mondo, registro)
  uguale('la guardia sta facendo il suo giro', guardia.x, 1)

  const destato = guardia.senti(new Rumore('richiamo', ladra, 40))
  controlla('il rumore la sveglia anche se era impegnata', destato)
  guardia.esegui(mondo, registro)
  uguale('e adesso corre al rumore', guardia.attivo.nome, 'reagisce a «richiamo»')
  controlla('lasciando il suo giro in pausa, non buttandolo',
            guardia.fili.some(f => f.nome === 'principale' && !f.finito))

  /* la finestra: ci mette dei battiti ad andare, sostare e tornare — ed
     è tutto il tempo in cui il passaggio resta scoperto */
  let battiti = 0
  while (guardia.attivo.nome !== 'principale' && battiti < 60) { guardia.esegui(mondo, registro); battiti++ }
  controlla('finita la reazione il puntatore torna al giro di prima',
            guardia.attivo.nome === 'principale')
  controlla('e la finestra è durata dei battiti veri', battiti > 4)
  nota(`la guardia è stata via ${battiti} battiti`)
}

riassunto("l'orchestratore")
