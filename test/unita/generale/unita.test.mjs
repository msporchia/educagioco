/* ═══════════════════════════════════════════════════════════════════
   IL BUIO E LA LANTERNA — «al buio vedi un passo; con la lanterna vedi
   come sempre — e ti vedono come sempre»

   Prova `Unita.vede()`/`limiteVista()`: il tetto che il livello può
   mettere sulla vista (`mondo.vistaAlBuio`), e le due eccezioni che lo
   tolgono — portare luce, ed essere illuminati. La lanterna vera e
   propria (da dove e fin dove fa luce) è provata a parte, in
   `elementi/lanterna.test.mjs`: qui interessa solo come `Unita` legge
   quello che il mondo le dice.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../aiuto/verifica.mjs'
import { mondoFinto, campoFinto } from '../../aiuto/finto.js'
import { Unita } from '../../../src/motore/generale/unita.js'
import { Lanterna } from '../../../src/motore/generale/elementi/lanterna.js'
import { ACammino } from '../../../src/motore/generale/distanze/a-cammino.js'

const stanza = () => campoFinto({ larghezza: 12, altezza: 12 })
const eroe = (x, y, vista = 6) => new Unita({ id: 'eroe', nome: "l'eroe", fazione: 'nostri', x, y, vita: 3, vista })
const orco = (x, y, vista = 6) => new Unita({ id: 'orco', nome: "l'orco", fazione: 'orchi', x, y, vita: 3, vista })

{
  /* ═══ SENZA TETTO, NIENTE CAMBIA ═══
     Un livello che non dichiara `vistaAlBuio` (il caso di TUTTI i
     livelli di oggi) deve dare esattamente lo stesso risultato di
     `this.sguardo.arriva(...)` da solo — è la condizione che rende
     sicuro questo lavoro. Lo si prova anche con un mondo che non
     definisce nemmeno `illuminato`: se il corto circuito del tetto
     infinito non scattasse, questo test andrebbe in eccezione prima
     ancora di poter fallire su un valore. */
  const mondoSenzaLuce = { ...mondoFinto({ campo: stanza() }), illuminato: undefined, vistaAlBuio: undefined }
  const chi = eroe(0, 0, 6)
  const vicino = { x: 3, y: 0 }, lontano = { x: 8, y: 0 }
  uguale('a distanza 3 con vista 6, si vede', chi.vede(mondoSenzaLuce, vicino),
         new ACammino(6).arriva(mondoSenzaLuce, chi, vicino))
  controlla('e vale true', chi.vede(mondoSenzaLuce, vicino))
  uguale('a distanza 8 con vista 6, no', chi.vede(mondoSenzaLuce, lontano),
         new ACammino(6).arriva(mondoSenzaLuce, chi, lontano))
  controlla('e vale false', !chi.vede(mondoSenzaLuce, lontano))
}
{
  /* ═══ COL TETTO, CHI È AL BUIO VEDE MENO DI QUANTO DICHIARA ═══ */
  const mondo = mondoFinto({ campo: stanza(), vistaAlBuio: 2 })
  const chi = eroe(0, 0, 6)
  controlla('a un passo, dentro il tetto, si vede', chi.vede(mondo, { x: 1, y: 0 }))
  controlla('a due passi, al limite del tetto, si vede', chi.vede(mondo, { x: 2, y: 0 }))
  controlla('a quattro passi il tetto ferma anche una vista di 6',
            !chi.vede(mondo, { x: 4, y: 0 }))
  nota('la vista dichiarata (6) non basta più a spiegare quello che si vede: comanda il tetto')
}
{
  /* ═══ CHI PORTA LA LANTERNA VEDE COME SEMPRE ═══
     Stesso tetto, stessa distanza del test sopra — ma questa volta
     l'eroe ha una lanterna in zaino: il tetto non lo tocca più, e
     torna a vedere fin dove dichiara. */
  const chi = eroe(0, 0, 6)
  const lanterna = new Lanterna('lanterna', { x: 0, y: 0, raggio: 1 })
  lanterna.passaA(chi)   // in zaino: non serve una `posa`, basta portarla
  const mondo = mondoFinto({ cose: [lanterna], unita: [chi], campo: stanza(), vistaAlBuio: 2 })
  controlla('con la lanterna in mano, a quattro passi si vede lo stesso',
            chi.vede(mondo, { x: 4, y: 0 }))
  nota('il raggio della lanterna (1) non c\'entra qui: quello che conta è che ' +
       'chi guarda È dentro il proprio cerchio, non fin dove il cerchio arriva')
}
{
  /* ═══ L'ASIMMETRIA — LA PARTE CHE ROMPE «SE IO NON TI VEDO, TU NON
     VEDI ME» DI PROPOSITO ═══
     L'orco, al buio e senza luce, vede l'eroe lontano perché l'eroe è
     illuminato — la sua lanterna lo rende visibile a piena vista anche
     a chi sta al buio. Ma l'eroe, che la lanterna la PORTA, non vede
     l'orco: la sua vista resta la SUA (dichiarata: 3), la lanterna non
     gliene regala di più — «vede come sempre», non «vede oltre». */
  const orsoDistanza = 4
  const luceEroe = eroe(0, 0, 3)      // vista corta: la lanterna non gliela allunga
  const luceOrco = orco(orsoDistanza, 0, 6)  // vista lunga: gli basta per arrivare all'eroe illuminato
  const lanterna = new Lanterna('lanterna', { x: 0, y: 0, raggio: 1 })
  lanterna.passaA(luceEroe)
  const mondo = mondoFinto({
    cose: [lanterna], unita: [luceEroe, luceOrco], campo: stanza(), vistaAlBuio: 1,
  })
  controlla('l\'orco al buio VEDE l\'eroe illuminato, anche da lontano',
            luceOrco.vede(mondo, luceEroe))
  controlla('l\'eroe, che porta la luce, NON vede l\'orco: è oltre la sua vista',
            !luceEroe.vede(mondo, luceOrco))
  nota(`distanza ${orsoDistanza}: dentro la vista dell'orco (6), fuori da quella dell'eroe (3)`)
}
{
  /* ═══ UNA LANTERNA POSATA ILLUMINA IL POSTO, NON CHI L'HA LASCIATA ═══
     Lo stesso schema dell'asimmetria, ma la lanterna sta per terra: chi
     l'ha posata e se n'è andato torna a essere «uno normale al buio»
     — è il posto che resta illuminato, non lui. */
  const lanterna = new Lanterna('lanterna', { x: 0, y: 0, raggio: 1 })
  const chi = eroe(0, 0, 6)
  lanterna.passaA(chi)
  /* la vera mossa `posa` (`azioni/posa.js` → `Oggetto.ricevi('posa')`),
     non i due campi toccati a mano: prende le coordinate di chi la
     lascia e la spoglia dallo zaino, esattamente come farebbe un
     bambino che scrive «posa la lanterna» */
  lanterna.ricevi('posa', chi, { mondo: { livello: {}, perId: { eroe: chi }, eventi: [] } })
  chi.x = 4; chi.y = 0                        // e se ne va, senza portarsela dietro
  const orcoVicino = orco(0, 0, 6)            // arriva DOPO, e trova il posto ancora illuminato
  const estraneo = { x: 4, y: 3 }             // un punto qualunque, lontano dal cerchio di luce
  const mondo = mondoFinto({
    cose: [lanterna], unita: [chi, orcoVicino], campo: stanza(), vistaAlBuio: 1,
  })
  controlla('chi arriva DOPO sul posto posato vede a piena vista, non solo chi l\'aveva presa',
            orcoVicino.vede(mondo, chi))
  controlla('l\'eroe che se n\'è andato è di nuovo limitato dal tetto verso quello che non è illuminato',
            !chi.vede(mondo, estraneo))
  nota('la lanterna è rimasta a (0,0): illumina chiunque ci passi sopra, non l\'eroe che è andato via')
}

riassunto("il buio e la lanterna, letti da un'unità")
