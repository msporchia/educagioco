/* Verifica del porto, la seconda metà del costruttore, senza browser. Le
   cose che contano:

     1. la legenda: ogni coppia di caratteri vuol dire una cosa sola, e
        una coppia sconosciuta è un guasto e non un pavimento;
     2. le regole del mondo sono quelle dichiarate in testa a
        `motore/porto/mondo.js` — il robot non passa sopra le cose, prende
        e posa di fianco, una cosa alla volta, i cassoni col colore — perché
        un mondo che non si può prevedere non si programma;
     3. guardare e leggere: di fianco e in mano, un colore per nome;
     4. l'orologio: un gesto è un turno, pensare no; la gru aspetta il suo
        punto libero; il nastro porta in mare; i clienti hanno pazienza;
     5. aspettare e «per sempre»: la giornata finisce da sola quando non
        può più succedere niente, e un giro che non fa niente si ferma; le
        frasi della sera dicono cosa manca, con i numeri.
   Le mappe del porto sono a coppie di caratteri: `.@` è il robot, `.R`
   una cassa rossa per terra, `=B` uno scaffale con una cassa blu.
   I livelli del porto si giocano in `unita/costruttore`, con tutti gli
   altri. `node test/esegui.mjs porto` */
import { fai, guarda, leggi, tinta, progetto, programma } from '../../src/giochi/costruttore/dati/scrivi.js'
import { leggiCasella } from '../../src/giochi/costruttore/dati/porto/legenda.js'
import { Porto, nel, coloreAlPlurale } from '../../src/giochi/costruttore/motore/porto/mondo.js'
import { esitoDelPorto } from '../../src/giochi/costruttore/motore/porto/esito.js'
import { Esecuzione, TETTO_PENSIERI } from '../../src/giochi/costruttore/motore/esecutore.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

/* una giornata di prova: la mappa, e quello che serve dell'ordine */
const porto = (mappa, resto = {}) => Porto.daOrdine({ nome: 'prova', mappa, ...resto })
const gioca = (prog, mappa, resto = {}) => {
  const p = porto(mappa, resto)
  const es = new Esecuzione(programma(prog), p, { lavagnette: resto.lavagnette || {} })
  const fatti = []
  let e
  do { e = es.prossimo(); fatti.push(e) } while (e.tipo !== 'fine' && e.tipo !== 'errore')
  return { p, es, ultimo: e, fatti }
}
const dove = p => `${p.robot.x},${p.robot.y}`

/* ══════════ 1. la legenda ══════════ */
{
  uguale('«..» è il pavimento', leggiCasella('..').suolo, 'pavimento')
  uguale('«##» è il muro, anche col segno ripetuto', leggiCasella('##').suolo, 'muro')
  uguale('«~~» è il mare', leggiCasella('~~').suolo, 'mare')
  uguale('«=R» è uno scaffale con una cassa rossa', `${leggiCasella('=R').arredo.tipo} ${leggiCasella('=R').cosa.colore}`, 'scaffale rosso')
  uguale('«BB» è il bancone con una cassa blu, non un bancone e basta', leggiCasella('BB').cosa.colore, 'blu')
  uguale('«>.» è un nastro che porta a destra', leggiCasella('>.').arredo.verso, 'destra')
  uguale('«v.» porta in giù, e «.v» è una cassa verde da mettere lì',
         `${leggiCasella('v.').arredo.verso} ${leggiCasella('.v').bersaglio}`, 'giu verde')
  uguale('«.3» è un biglietto col 3', leggiCasella('.3').cosa.numero, 3)
  uguale('«Cs» è un cassone di nome «s»', leggiCasella('Cs').arredo.id, 's')
  uguale('una coppia sconosciuta non è un pavimento', leggiCasella('.?'), null)
  uguale('e il robot non sta sopra un muro', leggiCasella('#@'), null)
  let rotta = null
  try { porto(['..??']) } catch (e) { rotta = e.message }
  controlla('una mappa con una coppia sconosciuta è un guasto che dice dove', /riga 1, colonna 2/.test(rotta || ''), rotta)
}

/* ══════════ 2. le regole del mondo ══════════ */
{
  const cammina = gioca({ principale: [fai.vai('destra', 2), fai.vai('giu', 1), fai.vai('sinistra', 1), fai.vai('su', 1)] },
                        ['.@....', '......'])
  uguale('il robot va nelle quattro direzioni', dove(cammina.p), '1,0')
  uguale('e ogni passo è un turno', cammina.p.t, 5)

  uguale('una cassa per terra non si scavalca', gioca({ principale: [fai.vai('destra', 2)] }, ['.@.R..']).ultimo.motivo, 'porto-cassa')
  uguale('il mare ferma il robot', gioca({ principale: [fai.vai('su', 1)] }, ['~~~~', '.@..']).ultimo.motivo, 'porto-mare')
  const scaffale = gioca({ principale: [fai.vai('destra', 1)] }, ['.@=R'])
  uguale('sugli scaffali non si sale', scaffale.ultimo.motivo, 'porto-arredo')
  controlla('e la frase dice quale arredo', /lo scaffale/.test(scaffale.ultimo.frase), scaffale.ultimo.frase)

  const presa = gioca({ principale: [fai.prendi('su'), fai.posa('destra')] }, ['.R..', '.@..'])
  uguale('si prende di fianco: la cassa di sopra va in mano, e poi a destra', presa.p.cimaDi(presa.p.k(1, 1)).colore, 'rosso')
  uguale('e sopra non c\'è più niente', presa.p.pile[presa.p.k(0, 0)].length, 0)
  uguale('le mani sono di nuovo vuote', presa.p.mano, null)
  uguale('una cosa alla volta', gioca({ principale: [fai.prendi('su'), fai.prendi('giu')] }, ['.R..', '.@..', '.B..']).ultimo.motivo, 'mani-piene')
  uguale('senza niente in mano non si posa', gioca({ principale: [fai.posa('destra')] }, ['.@..']).ultimo.motivo, 'mani-vuote')
  uguale('dove non c\'è niente non si prende', gioca({ principale: [fai.prendi('destra')] }, ['.@..']).ultimo.motivo, 'niente-da-prendere')
  uguale('per terra ci sta una cosa sola', gioca({ principale: [fai.prendi('su'), fai.posa('destra')] }, ['.R..', '.@.B']).ultimo.motivo, 'posto-occupato')
  uguale('nel mare non si butta niente', gioca({ principale: [fai.prendi('sinistra'), fai.posa('su')] }, ['~~~~', '.R.@']).ultimo.motivo, 'nel-mare')

  /* i cassoni: tante casse, fino alla capienza, e col colore */
  const colorato = gioca({ principale: [fai.prendi('sinistra'), fai.posa('destra')] }, ['C2.@C1'],
                         { cassoni: { 1: { nome: 'il camion rosso', colore: 'rosso' }, 2: { nome: 'la stiva', dentro: 'RRB' } } })
  uguale('da un cassone si prende la cassa in cima, e il camion rosso non prende la blu', colorato.ultimo.motivo, 'colore-sbagliato')
  controlla('e lo dice al plurale: «solo casse rosse»', /solo casse rosse/.test(colorato.ultimo.frase), colorato.ultimo.frase)
  const pieno = gioca({ principale: [fai.ripeti(3, [fai.prendi('sinistra'), fai.posa('destra')])] }, ['C2.@C1'],
                      { cassoni: { 1: { nome: 'la cesta', capienza: 2 }, 2: { nome: 'la stiva', dentro: 'RRR' } } })
  uguale('un cassone tiene fino alla sua capienza', pieno.ultimo.motivo, 'pieno')
  controlla('e «la cesta è piena», al femminile', /La cesta è piena/.test(pieno.ultimo.frase), pieno.ultimo.frase)
  uguale('«nel camion», non «in il camion»', nel('il camion'), 'nel camion')
  uguale('«nella stiva»', nel('la stiva'), 'nella stiva')
  uguale('le casse verdi, al plurale', coloreAlPlurale('verde'), 'verdi')
}

/* ══════════ 3. guardare e leggere ══════════ */
{
  const g = gioca({ principale: [
    fai.se(guarda('su', 'cassa', true, 'rosso'), [fai.prendi('su')]),
    fai.se(guarda('mano', 'cassa', true, 'rosso'), [fai.posa('destra')]),
    fai.se(guarda('mano', 'niente'), [fai.vai('giu', 1)]),
  ] }, ['.R..', '.@..', '....'])
  uguale('«se ↑ c\'è una cassa rossa», «se in mano…», «se in mano non c\'è niente»',
         `${dove(g.p)} ${g.p.cimaDi(g.p.k(1, 1)).colore}`, '0,2 rosso')

  const letto = gioca({ lavagnette: ['n', 'c'], principale: [
    fai.assegna('n', leggi('su')), fai.assegna('c', leggi('destra')), fai.prendi('destra'), fai.assegna('c', leggi('mano')),
  ] }, ['.7..', '.@.G', '....'])
  uguale('si legge il numero di un biglietto', letto.es.valori.n, 7)
  uguale('e il colore di una cassa, anche in mano', letto.es.valori.c, 'giallo')
  uguale('ogni lettura si racconta alla regia', letto.fatti.filter(f => f.tipo === 'legge').length, 3)
  const conta = gioca({ lavagnette: ['n'], principale: [fai.assegna('n', leggi('sinistra'))] }, ['Cs.@'],
                      { cassoni: { s: { nome: 'la stiva', dentro: 'RRBG' } } })
  uguale('un cassone si legge come quante casse tiene', conta.es.valori.n, 4)
  uguale('dove non c\'è niente non si legge',
         gioca({ lavagnette: ['n'], principale: [fai.assegna('n', leggi('destra'))] }, ['.@..']).ultimo.motivo, 'niente-da-leggere')
  uguale('un colore letto non fa da numero', gioca({ principale: [fai.vai('destra', leggi('su'))] }, ['.R..', '.@..']).ultimo.motivo, 'letto-colore')

  const cestoBlu = { cassoni: { r: { nome: 'il cesto rosso', colore: 'rosso' }, b: { nome: 'il cesto blu', colore: 'blu' } } }
  const qui = gioca({ principale: [fai.se(guarda('giu', 'cassone', true, 'blu'), [fai.vai('destra', 1)])] }, ['.@....', 'Cr..Cb'], cestoBlu)
  uguale('«se ↓ c\'è un cassone blu»: sotto c\'è quello rosso, e il robot resta', qui.p.robot.x, 0)
  const cercato = gioca({ lavagnette: ['c'], principale: [
    fai.assegna('c', 'blu'),
    fai.finche(guarda('giu', 'cassone', true, tinta('c')), [fai.vai('destra', 1)]),
  ] }, ['.@....', '..CrCb'], cestoBlu)
  uguale('una lavagnetta tiene un colore, e una domanda lo cerca per nome', cercato.p.robot.x, 2)
}

/* ══════════ 4. l'orologio e gli attori ══════════ */
{
  const pensa = gioca({ lavagnette: ['h'], principale: [fai.ripeti(10, [fai.assegna('h', 1), fai.se(guarda('su', 'muro'), [])])] }, ['.@..'])
  uguale('guardare, decidere e fare i conti non fanno passare il tempo', pensa.p.t, 0)

  /* i turni a mano: il mondo che va avanti da solo */
  const giri = (p, n) => { for (let k = 0; k < n; k++) for (const _ of p.turno('attesa')) { /* si guarda e basta */ } }

  const gru = porto(['.*.@'], { gru: { casse: 'RB', ogni: 3, primo: 1 } })
  giri(gru, 1)
  uguale('la gru cala la prima cassa al suo turno', gru.cimaDi(gru.k(0, 0)).colore, 'rosso')
  giri(gru, 5)
  uguale('e con il punto occupato aspetta: la seconda è ancora sua', gru.gru.casse.length, 1)

  let splash = null
  const nastro = porto(['>R>.~~', '.@....'], { nastro: { passo: 1 } })
  try { giri(nastro, 3) } catch (e) { splash = e.motivo }
  uguale('in fondo al nastro la cassa cade in mare, e la giornata è persa', splash, 'in-mare')

  const salvate = gioca({ principale: [fai.sempre([fai.aspetta(guarda('su', 'cassa')), fai.prendi('su'), fai.posa('destra')])] },
                        ['>*>.~~', '...@Cf'], { gru: { casse: 'RBR', ogni: 4, primo: 1 }, nastro: { passo: 2 },
                                                cassoni: { f: { nome: 'il frigo' } } })
  uguale('chi aspetta in fondo al nastro non ne perde nessuna', salvate.ultimo.tipo, 'fine')
  controlla('e la giornata finisce da sola quando non arriva più niente', salvate.ultimo.sera === true, JSON.stringify(salvate.ultimo))
  uguale('le tre casse sono nel frigo', salvate.p.pile[salvate.p.k(2, 1)].length, 3)

  /* i clienti */
  const bottega = ['####=B##', '.%B..@..']
  const arrabbiato = gioca({ principale: [fai.sempre([fai.aspetta(guarda('sinistra', 'libero'))])] }, bottega,
                           { clienti: { pazienza: 5, fila: [[1, 'rosso']] } })
  uguale('un cliente che aspetta troppo se ne va arrabbiato, e la giornata è persa', arrabbiato.ultimo.motivo, 'cliente-arrabbiato')
  const servi = [fai.aspetta(guarda('sinistra', 'cliente')), fai.prendi('su'), fai.posa('sinistra')]
  const sbagliato = gioca({ principale: servi }, bottega, { clienti: { pazienza: 50, fila: [[1, 'rosso']] } })
  uguale('dargli una cassa che non voleva fa perdere la giornata', sbagliato.ultimo.motivo, 'cliente-sbagliato')
  const giusto = gioca({ principale: servi }, ['####=R##', '.%B..@..'], { clienti: { pazienza: 50, fila: [[1, 'rosso']] } })
  uguale('la cassa che voleva: se ne va contento', `${giusto.ultimo.tipo} ${giusto.p.clienti.serviti}`, 'fine 1')
  uguale('al bancone senza nessuno non si dà niente',
         gioca({ principale: [fai.prendi('su'), fai.posa('sinistra')] }, ['####=R##', '.%B..@..'], { clienti: { pazienza: 50, fila: [[9, 'rosso']] } }).ultimo.motivo,
         'nessun-cliente')
}

/* ══════════ 4-bis. i camion, il nastro che scarica, le buche ══════════ */
{
  /* la strada: il robot non ci va, e senza camion non si carica */
  const strada = ['Ca.@....', '___&____']
  uguale('sulla strada il robot non ci va', gioca({ principale: [fai.vai('giu', 1)] }, strada,
    { cassoni: { a: { nome: 'la catasta', dentro: 'RR' } } }).ultimo.motivo, 'porto-strada')
  uguale('e sulla piazzola vuota non si posa niente', gioca({ principale: [fai.prendi('sinistra'), fai.posa('giu')] }, strada,
    { cassoni: { a: { nome: 'la catasta', dentro: 'RR' } } }).ultimo.motivo, 'niente-camion')

  /* il camion arriva alla sua ora, e riparte appena pieno */
  const carica = { principale: [fai.sempre([fai.aspetta(guarda('giu', 'camion')),
    fai.finche(guarda('giu', 'camion', false), [fai.prendi('sinistra'), fai.posa('giu')])])] }
  const due = gioca(carica, strada, { cassoni: { a: { nome: 'la catasta', dentro: 'RRBBB' } },
                                      camion: { pazienza: 30, fila: [[2, 2], [9, 3]] } })
  uguale('due camion, caricati finché ci sono: la giornata finisce', due.ultimo.tipo, 'fine')
  uguale('e sono ripartiti tutti e due, pieni', due.p.camion.partiti, 2)
  uguale('la piazzola è di nuovo vuota', due.p.arredo[due.p.k(1, 1)], null)
  const partenze = due.fatti.filter(f => f.tipo === 'turno').flatMap(f => f.eventi).filter(e => e.che === 'camion-parte')
  controlla('e ognuno è ripartito col suo carico', partenze.map(e => e.carico.length).join() === '2,3', partenze.map(e => e.carico.length).join())
  const lento = gioca({ principale: [fai.aspetta(guarda('giu', 'camion'))] }, strada,
                      { cassoni: { a: { nome: 'la catasta', dentro: 'RR' } }, camion: { pazienza: 4, fila: [[1, 2]] } })
  uguale('un camion che aspetta troppo riparte mezzo vuoto, e la giornata è persa', lento.ultimo.motivo, 'camion-vuoto')
  controlla('e lo dice: «è ripartito vuoto»', /ripartito vuoto: ne voleva 2/.test(lento.ultimo.frase), lento.ultimo.frase)
  const colorato = gioca(carica, strada, { cassoni: { a: { nome: 'la catasta', dentro: 'RB' } },
                                           camion: { pazienza: 30, fila: [[1, 2, 'rosso']] } })
  uguale('un camion col colore prende solo quelle', colorato.ultimo.motivo, 'colore-sbagliato')

  /* il nastro che finisce in un cassone ci scarica dentro */
  const nastro = gioca({ principale: [] }, ['>*>.Cm', '.@....'],
                       { gru: { casse: 'RBR', ogni: 2, primo: 1 }, cassoni: { m: { nome: 'il magazzino', capienza: 2 } } })
  uguale('il nastro scarica nel magazzino finché c\'è posto', nastro.p.pile[nastro.p.k(2, 0)].length, 2)
  controlla('pieno il magazzino, il nastro si ferma: la terza cassa resta sul nastro, e niente cade',
            nastro.ultimo.tipo === 'fine' && nastro.p.celleNastro.some(k => nastro.p.pile[k].length), JSON.stringify(nastro.ultimo))

  /* le buche delle lettere */
  const buca = gioca({ principale: [fai.prendi('sinistra'), fai.posa('su')] }, ['..C3', 'Cp.@'],
                     { cassoni: { p: { nome: 'il sacco', dentro: '5' }, 3: { nome: 'la buca del 3', numero: 3 } } })
  uguale('la buca del 3 prende solo le lettere per il 3', buca.ultimo.motivo, 'numero-sbagliato')
  controlla('e la frase dice per chi era', /questa è per il 5/.test(buca.ultimo.frase), buca.ultimo.frase)
  const giusta = gioca({ principale: [fai.prendi('sinistra'), fai.posa('su')] }, ['..C3', 'Cp.@'],
                       { cassoni: { p: { nome: 'il sacco', dentro: '3' }, 3: { nome: 'la buca del 3', numero: 3 } } })
  uguale('quella giusta ci entra', giusta.ultimo.tipo, 'fine')

  /* aspettare un turno */
  const pausa = gioca({ principale: [fai.pausa(), fai.pausa(), fai.pausa()] }, ['.*.@'], { gru: { casse: 'RRRR', ogni: 1, primo: 5 } })
  uguale('«aspetta un turno»: il robot sta fermo, il mondo va avanti — tre pause, tre turni d\'attesa',
         pausa.fatti.filter(f => f.tipo === 'turno' && f.come === 'attesa').length, 3)
  const sera = gioca({ principale: [fai.sempre([fai.pausa()])] }, ['.@..'])
  controlla('e se non può più succedere niente, è sera', sera.ultimo.tipo === 'fine' && sera.ultimo.sera === true)
}

/* ══════════ 5. la bottega vera, e le frasi della sera ══════════ */
{
  const mappa = ['########', '####=B=R', '.%B..@..', '########']
  const cerca = progetto('cerca', { misure: ['tinta'], tipi: { tinta: 'colore' } }, [
    fai.finche(guarda('su', 'cassa', true, tinta('tinta')), [fai.vai('destra', 1)])])
  const torna = [fai.prendi('su'), fai.finche(guarda('sinistra', 'bancone'), [fai.vai('sinistra', 1)]), fai.posa('sinistra')]
  const prog = { lavagnette: ['voglio'], progetti: [cerca], principale: [fai.sempre([
    fai.aspetta(guarda('sinistra', 'cliente')), fai.assegna('voglio', leggi('sinistra')), fai.chiama('cerca', 'voglio'), ...torna])] }
  const bene = gioca(prog, mappa, { clienti: { pazienza: 60, fila: [[1, 'rosso'], [3, 'blu']] } })
  uguale('due clienti, due casse cercate e portate: la giornata finisce', bene.ultimo.tipo, 'fine')
  uguale('e tutti e due se ne vanno contenti', bene.p.clienti.serviti, 2)
  controlla('il verdetto è una vittoria', esitoDelPorto(bene.p).vinto)

  const sbaglio = gioca({ progetti: [cerca], principale: [fai.sempre([
    fai.aspetta(guarda('sinistra', 'cliente')), fai.chiama('cerca', 'blu'), ...torna])] },
    mappa, { clienti: { pazienza: 60, fila: [[1, 'rosso']] } })
  uguale('una cassa sbagliata al cliente ferma la giornata', sbaglio.ultimo.motivo, 'cliente-sbagliato')
  controlla('e la frase dice cosa voleva e cosa ha avuto', /voleva una cassa rossa, e gli hai dato una cassa blu/.test(sbaglio.ultimo.frase), sbaglio.ultimo.frase)

  const presto = gioca({ principale: [] }, mappa, { clienti: { pazienza: 8, fila: [[1, 'rosso']] } })
  uguale('a programma finito i clienti arrivano lo stesso, e se ne vanno arrabbiati', presto.ultimo.motivo, 'cliente-arrabbiato')

  const vuoto = gioca({ lavagnette: ['h'], principale: [fai.sempre([fai.assegna('h', 1)])] }, mappa, { clienti: { pazienza: 60, fila: [[1, 'rosso']] } })
  uguale('«ripeti per sempre» senza un gesto gira a vuoto, e il robot lo dice', vuoto.ultimo.motivo, 'a-vuoto')
  controlla('il tetto dei pensieri è ragionevole', TETTO_PENSIERI >= 100)

  const stiva = porto(['Cs.@Ct'], { cassoni: { s: { nome: 'la stiva', dentro: 'RR' }, t: { nome: 'il camion' } },
                                   obiettivo: { cassoni: { t: { quante: 2 }, s: { vuoto: true } } } })
  stessaLista('a sera: cosa manca, con i numeri', esitoDelPorto(stiva).frasi,
              ['Nel camion non c\'è nessuna cassa, e ne volevano 2.', 'La stiva a sera doveva essere vuota, e ci sono ancora 2 casse.'])
}

nota('il porto: legenda, regole, letture, orologio, attori e frasi')
riassunto('costruttore-porto')
