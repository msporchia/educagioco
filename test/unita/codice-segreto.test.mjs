/* Verifica del Codice Segreto, senza browser. Le tre cose che contano:
   i dati stanno in piedi, il conteggio dei pallini è giusto anche coi
   doppioni (è lì che questo gioco si sbaglia sempre), e le nove tappe si
   vincono **giocandole davvero** col giocatore finto invece che a occhio.
   `node test/esegui.mjs codice-segreto` */
import { TEMI, guastiDeiTemi, MINIMO_SIMBOLI } from '../../src/giochi/codice-segreto/dati/temi.js'
import { SCAGLIONI, guastiDegliScaglioni, scaglione }
  from '../../src/giochi/codice-segreto/dati/difficolta.js'
import { CAMPAGNA, SCALINI, guastiDellaCampagna }
  from '../../src/giochi/codice-segreto/dati/campagna.js'
import { confronta, passiSpiegazione } from '../../src/giochi/codice-segreto/motore/indizi.js'
import { Regole, Partita } from '../../src/giochi/codice-segreto/motore/partita.js'
import { Corsa } from '../../src/giochi/codice-segreto/motore/corsa.js'
import { gioca, misura, caso, tuttiICodici } from '../../src/giochi/codice-segreto/motore/banco.js'
import manifesto from '../../src/giochi/codice-segreto/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { TRAGUARDI, AREE, XP_AREA, misure, statoTraguardi } from '../../src/store/progressi.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati stanno in piedi ══════════ */
const guastiTemi = guastiDeiTemi()
controlla('i temi non hanno guasti', guastiTemi.length === 0, guastiTemi.join(' · '))
const guastiSc = guastiDegliScaglioni(SCAGLIONI, MINIMO_SIMBOLI + 1)
controlla('gli scaglioni non hanno guasti', guastiSc.length === 0, guastiSc.join(' · '))
const guastiCam = guastiDellaCampagna(CAMPAGNA, TEMI, SCAGLIONI)
controlla('la campagna non ha guasti', guastiCam.length === 0, guastiCam.join(' · '))

controlla('tre scalini', SCALINI.length === 3)
controlla('nove tappe', CAMPAGNA.length === 9)
controlla('ogni tappa ha un tema suo',
          new Set(CAMPAGNA.map(t => t.tema)).size === CAMPAGNA.length)
controlla('la campagna comincia senza doppioni',
          scaglione(CAMPAGNA[0].difficolta).ripetizioni === false)
controlla('la campagna finisce coi doppioni accesi',
          scaglione(CAMPAGNA.at(-1).difficolta).ripetizioni === true)
controlla('lo scaglione «esperto» non capita mai in campagna',
          !CAMPAGNA.some(t => t.difficolta === 'esperto'))

/* ══════════ 2. il cuore: i pallini ══════════ */
uguale('tutto giusto', JSON.stringify(confronta(['a','b','c'], ['a','b','c'])),
       JSON.stringify({ pieni: 3, vuoti: 0 }))
uguale('tutto sbagliato', JSON.stringify(confronta(['a','b','c'], ['d','d','d'])),
       JSON.stringify({ pieni: 0, vuoti: 0 }))
uguale('due scambiati', JSON.stringify(confronta(['a','b','c'], ['b','a','c'])),
       JSON.stringify({ pieni: 1, vuoti: 2 }))

/* i doppioni: un simbolo del codice si consuma una volta sola */
uguale('due uguali nel tentativo, uno solo nel codice',
       JSON.stringify(confronta(['a','b','c'], ['a','a','a'])),
       JSON.stringify({ pieni: 1, vuoti: 0 }))
uguale('due uguali nel codice, uno solo nel tentativo',
       JSON.stringify(confronta(['a','a','b'], ['a','c','c'])),
       JSON.stringify({ pieni: 1, vuoti: 0 }))
uguale('doppioni da tutte e due le parti',
       JSON.stringify(confronta(['a','a','b','b'], ['b','b','a','a'])),
       JSON.stringify({ pieni: 0, vuoti: 4 }))
uguale('il pieno viene prima del vuoto',
       JSON.stringify(confronta(['a','a','b'], ['a','b','a'])),
       JSON.stringify({ pieni: 1, vuoti: 2 }))

/* la regola che tiene insieme tutto: i pallini non superano mai le caselle */
{
  const regole = Regole.libere('tosto', 'animali')
  const rnd = caso(7)
  let peggio = 0
  for (let i = 0; i < 3000; i++) {
    const c = regole.generaCodice(rnd), t = regole.generaCodice(rnd)
    const { pieni, vuoti } = confronta(c, t)
    peggio = Math.max(peggio, pieni + vuoti)
    if (pieni + vuoti > c.length) { peggio = 99; break }
  }
  controlla('pieni + vuoti non superano mai la lunghezza del codice',
            peggio <= regole.caselle, `arrivati a ${peggio}`)
}

/* ══════════ 3. la spiegazione racconta le regole vere ══════════ */
{
  const passi = passiSpiegazione(['🐶','🐱','🐰'], ['🐶','🐰','🦊'])
  stessaLista('i tre casi, in quest\'ordine', passi.map(p => p.tipo),
              ['pieno', 'vuoto', 'niente'])
  uguale('il pieno indica la colonna che combacia', passi[0].seg, 0)
  uguale('il vuoto indica dove sta davvero il disegno', passi[1].seg, 2)
  /* quello che la spiegazione mostra deve fare i conti del gioco */
  const { pieni, vuoti } = confronta(['🐶','🐱','🐰'], ['🐶','🐰','🦊'])
  uguale('tanti passi «pieno» quanti i pallini pieni',
         passi.filter(p => p.tipo === 'pieno').length, pieni)
  uguale('tanti passi «vuoto» quanti i pallini vuoti',
         passi.filter(p => p.tipo === 'vuoto').length, vuoti)
}
/* e deve reggere su un tentativo qualsiasi, non solo su quello scelto bene */
{
  const regole = Regole.libere('tosto', 'mare')
  const rnd = caso(11)
  let storti = 0
  for (let i = 0; i < 500; i++) {
    const c = regole.generaCodice(rnd), t = regole.generaCodice(rnd)
    const passi = passiSpiegazione(c, t)
    const { pieni, vuoti } = confronta(c, t)
    if (passi.length !== c.length) storti++
    if (passi.filter(p => p.tipo === 'pieno').length !== pieni) storti++
    if (passi.filter(p => p.tipo === 'vuoto').length !== vuoti) storti++
    if (passi.some(p => p.seg != null && c[p.seg] !== t[p.prova])) storti++
  }
  uguale('la spiegazione torna sempre coi pallini', storti, 0)
}

/* ══════════ 4. una partita si comporta ══════════ */
{
  const regole = Regole.libere('normale', 'frutta')
  const p = new Partita(regole, { codice: ['🍎','🍌','🍇','🍓'] })
  uguale('si comincia con la riga vuota', p.prossima, 0)
  controlla('non si consegna una riga a metà', p.conferma() === null)
  p.posa('🍎'); p.posa('🍎'); p.posa('🍎')
  uguale('tre posati, la quarta buca è la prossima', p.prossima, 3)
  p.togli(0)
  uguale('togliendo si compatta a sinistra', p.corrente.filter(Boolean).length, 2)
  uguale('e la buca torna a essere quella dopo', p.prossima, 2)
  p.posa('🍌'); p.posa('🍇')
  controlla('con la riga piena si può consegnare', p.piena === true)
  const prova = p.conferma()
  controlla('la prova è entrata nel tabellone', p.prove.length === 1)
  controlla('la riga in composizione si è svuotata', p.prossima === 0)
  controlla('la prova ha i suoi pallini', prova.pieni + prova.vuoti > 0)

  /* si perde solo dopo l'ultima prova concessa: si sbaglia apposta, con
     un tentativo che non ha nemmeno un disegno al posto giusto */
  const storto = p.codice.map(s => regole.pool.find(x => x !== s))
  while (!p.finita) { storto.forEach(s => p.posa(s)); p.conferma() }
  uguale('le prove concesse sono quelle dello scaglione', p.usate, regole.prove)
  uguale('finita e persa', p.esito, 'persa')
  uguale('perdere non dà stelle', p.stelle, 0)
  uguale('perdere non dà monete', p.monete, 0)
}
{
  /* indovinare al primo colpo vale tre stelle, all'ultimo una sola */
  const regole = Regole.libere('normale', 'frutta')
  const codice = regole.generaCodice(caso(3))
  const subito = new Partita(regole, { codice })
  codice.forEach(s => subito.posa(s)); subito.conferma()
  uguale('trovato al primo colpo: tre stelle', subito.stelle, 3)
  controlla('e le monete sono il premio per le stelle',
            subito.monete === regole.premio * 3)
}

/* ══════════ 5. le nove tappe si vincono davvero ══════════ */
nota('tappa                       ragiona sempre   ragiona a sprazzi   prove medie')
for (const [i, t] of CAMPAGNA.entries()) {
  const regole = Regole.perTappa(t)
  const attento = misura(regole, { volte: 120, attenzione: 1, rnd: caso(100 + i) })
  const distratto = misura(regole, { volte: 120, attenzione: 0.55, rnd: caso(200 + i) })
  nota(`${(i + 1 + '. ' + t.nome).padEnd(26)} ${(attento.quota * 100).toFixed(0).padStart(6)}%` +
       `${(distratto.quota * 100).toFixed(0).padStart(18)}%` +
       `${attento.proveMedie.toFixed(1).padStart(14)}`)
  controlla(`tappa ${i + 1} (${t.nome}): chi ragiona la vince quasi sempre`,
            attento.quota >= 0.95, `ce la fa il ${(attento.quota * 100).toFixed(0)}%`)
  controlla(`tappa ${i + 1} (${t.nome}): ce la fa anche chi ragiona a sprazzi`,
            distratto.quota >= 0.5, `ce la fa il ${(distratto.quota * 100).toFixed(0)}%`)
  dentro(`tappa ${i + 1} (${t.nome}): non si vince né al primo colpo né all'ultimo`,
         Number(attento.proveMedie.toFixed(2)), 2, regole.prove - 0.5)
}

/* lo scaglione più duro sta in piedi lo stesso: è il gioco libero */
{
  const esperto = misura(Regole.libere('esperto', 'spazio'),
                         { volte: 40, attenzione: 1, rnd: caso(999) })
  controlla('anche «esperto» si vince ragionando', esperto.quota >= 0.9,
            `ce la fa il ${(esperto.quota * 100).toFixed(0)}%`)
  nota(`esperto: ${(esperto.quota * 100).toFixed(0)}% in ${esperto.proveMedie.toFixed(1)} prove medie`)
}

/* ══════════ 6. la corsa: una persa non fa arretrare ══════════ */
{
  const t = CAMPAGNA[0]
  const regole = Regole.perTappa(t)
  const corsa = new Corsa(regole, 3, { rnd: caso(5) })
  /* si perde il primo codice: si sbaglia apposta fino a finire le prove */
  const sbaglia = () => {
    const p = corsa.partita
    const finto = p.codice.map(s => regole.pool.find(x => x !== s) || s)
    while (!p.finita) { finto.forEach(s => p.posa(s)); p.conferma() }
  }
  sbaglia()
  controlla('perdere non chiude la tappa', corsa.registra() === false)
  uguale('e non conta come vinta', corsa.vinte, 0)
  uguale('la tappa vuole ancora tre codici', corsa.rimaste, 3)
  corsa.avanti()

  /* poi si vince tre volte di fila, sempre al primo colpo */
  for (let k = 0; k < 3; k++) {
    const p = corsa.partita
    p.codice.forEach(s => p.posa(s))
    p.conferma()
    const finita = corsa.registra()
    if (k < 2) { controlla(`dopo ${k + 1} codici la tappa non è finita`, finita === false); corsa.avanti() }
    else controlla('col terzo codice la tappa è finita', finita === true)
  }
  uguale('tre codici indovinati', corsa.vinte, 3)
  uguale('ma una partita persa costa le stelle', corsa.stelle, 1)
  controlla('le monete sono la somma delle partite vinte', corsa.monete > 0)
}
{
  /* tutte vinte al primo colpo: tre stelle piene */
  const corsa = Corsa.perTappa(CAMPAGNA[3], { rnd: caso(8) })
  while (!corsa.finita) {
    const p = corsa.partita
    p.codice.forEach(s => p.posa(s))
    p.conferma()
    if (!corsa.registra()) corsa.avanti()
  }
  uguale('tappa perfetta: tre stelle', corsa.stelle, 3)
  uguale('e tante partite quante ne chiede la tappa', corsa.giocate, CAMPAGNA[3].partite)
}

/* ══════════ 7. il giocatore finto è davvero un ragionatore ══════════ */
{
  const regole = Regole.perTappa(CAMPAGNA[0])
  uguale('senza doppioni i codici sono 24', tuttiICodici(regole).length, 24)
  const p = gioca(regole, { rnd: caso(42) })
  controlla('e li vince tutti in poche prove', p.vinta && p.usate <= regole.prove)
}

/* ══════════ 8. quello che il gioco porta all'albo ══════════
   I traguardi non stanno più scritti in `data/traguardi.js`: li dichiara
   il manifesto e li raccoglie `src/giochi/albo.js`. Qui si prova che
   siano fatti bene e — soprattutto — che **scattino davvero**: un
   traguardo che nessuno può prendere non si vede da nessuna parte. */
{
  /* si controlla il proprio manifesto, non tutti: il test di un gioco non
     deve diventare rosso per come è fatto un altro gioco */
  const guastiAlbo = guastiDellAlbo([manifesto])
  controlla('il blocco albo del manifesto non ha guasti',
            guastiAlbo.length === 0, guastiAlbo.join(' · '))

  const suoi = TRAGUARDI.filter(t => t.area === manifesto.chiave)
  uguale('i suoi traguardi sono nell\'albo', suoi.length, manifesto.albo.traguardi.length)
  controlla('e stanno nella famiglia del gioco',
            AREE.some(a => a.id === manifesto.chiave))

  const vuoto = { totals: {}, best: {}, items: {}, campagne: {} }
  controlla('a profilo vuoto non se n\'è preso nessuno',
            statoTraguardi(vuoto).filter(t => t.area === manifesto.chiave)
              .every(t => t.grado === 0))
  uguale('e il gioco non risulta nemmeno provato',
         XP_AREA[manifesto.chiave](misure(vuoto)), 0)

  /* un bambino che ha finito la campagna con tutte e tre le stelle */
  const finito = {
    totals: { codici: 130 }, best: { serieCodici: 12 }, items: {},
    campagne: { codice: { tappa: CAMPAGNA.length, libera: true,
                          stelle: Object.fromEntries(CAMPAGNA.map((_, i) => [i, 3])) } },
  }
  const presi = statoTraguardi(finito).filter(t => t.area === manifesto.chiave)
  controlla('chi finisce tutto li prende tutti d\'oro',
            presi.length === suoi.length && presi.every(t => t.finito),
            presi.filter(t => !t.finito).map(t => `${t.id} fermo a ${t.valore}`).join(' · '))
  controlla('e l\'area vale esperienza', XP_AREA[manifesto.chiave](misure(finito)) > 0)

  /* le tre misure generiche delle campagne: valgono per ogni gioco nuovo */
  const m = misure(finito)
  uguale('le tappe si leggono dalla campagna nel profilo',
         m.tappeDi(manifesto.chiave), CAMPAGNA.length)
  uguale('le stelle sono la somma dei primati per tappa',
         m.stelleDi(manifesto.chiave), CAMPAGNA.length * 3)
  uguale('e la campagna finita si vede', m.finita(manifesto.chiave), 1)
  uguale('a mani vuote quelle misure valgono zero',
         misure(vuoto).tappeDi(manifesto.chiave) + misure(vuoto).stelleDi(manifesto.chiave)
         + misure(vuoto).finita(manifesto.chiave), 0)
}

riassunto('codice segreto')
