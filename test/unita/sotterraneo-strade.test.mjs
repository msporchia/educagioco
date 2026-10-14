/* Le tre strade di ogni classe (docs/sotterraneo/strade.md) e le due mani (docs/sotterraneo/roba.md, «Due mani»).
   Le strade sono dato: qui si controlla che ognuna esista davvero (l'arma si impugna, i nodi sono della classe e vogliono
   l'arma che la strada porta, la roba delle righe si indossa coi punti che la strada dà) e che il banco la giochi senza
   guasti. Che stiano vicine fra loro è una misura: `misure/sotterraneo-strade`.
   Poi la regola delle due mani (un'arma a due mani vale quella a una mano più la mano che toglie) e il potere del bastone.
   `node test/esegui.mjs sotterraneo-strade --niente-build` */
import { STRADE, stradeDi, stradaDi, filaDellaStrada, robaDellaStrada, crescitaDellaStrada, ammette, guastiDelleStrade }
  from '../../src/giochi/sotterraneo/motore/strade.js'
import { COSE, ARMI_DI, PESO_DELLA_DIFESA, RICARICA_DEL_BASTONE, chiaveDelPezzo } from '../../src/giochi/sotterraneo/dati/cose.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { RISPOSTE_PER_ENERGIA } from '../../src/giochi/sotterraneo/dati/abilita.js'
import { Corredo, ROBA_VUOTA } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { gioca, misuraLaStrada } from '../../src/giochi/sotterraneo/motore/banco.js'
import { numeriDi } from '../../src/giochi/sotterraneo/viste/pezzo.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. le strade stanno in piedi ══════════ */
{
  stessaLista('nessun guasto nei dati delle strade', guastiDelleStrade(), [])
  stessaLista('quattro classi, tre strade ciascuna', EROI.map(e => `${e.chiave}:${stradeDi(e.chiave).length}`), EROI.map(e => `${e.chiave}:3`))
  uguale('una strada si trova per classe e nome', stradaDi('mago', 'pura').arma.mani, 2)
  uguale('e una che non c\'è è nulla', stradaDi('mago', 'inesistente'), null)
  for (const e of EROI) for (const s of stradeDi(e.chiave)) {
    const nome = `${e.chiave}:${s.chiave}`
    const fila = filaDellaStrada(e.chiave, s)
    uguale(`${nome}: una riga per discesa, più l'uscita`, fila.length, CAMPAGNA.length + 1)
    // la roba con cui si entra in ogni discesa si indossa coi punti che la strada dà: niente messo da parte per un requisito
    const storte = []
    CAMPAGNA.forEach((_, k) => {
      const roba = robaDellaStrada(e.chiave, s, k)
      const c = new Corredo({ eroe: e.chiave, roba, crescita: crescitaDellaStrada(e.chiave, s, k) })
      for (const dove of ['mano', 'mancina', 'corpo', 'collo', 'dito', 'dito2'])
        if (roba[dove] && !c.posso(roba[dove])) storte.push(`discesa ${k}: ${roba[dove]} non si regge`)
      const arma = COSE[roba.mano]
      if (arma && !s.arma.famiglie.includes(arma.famiglia)) storte.push(`discesa ${k}: ${roba.mano} non è della strada`)
      if (arma && s.arma.mani === 2 && arma.mani === 2 && roba.mancina) storte.push(`discesa ${k}: due mani e uno scudo`)
      if (arma && s.mancina === 'scudo' && arma.mani !== 2 && k > 1 && !roba.mancina) storte.push(`discesa ${k}: senza lo scudo della strada`)
    })
    stessaLista(`${nome}: la roba di ogni discesa si indossa ed è della strada`, storte, [])
  }
  // le strade a due mani prendono l'arma a due mani appena ce n'è una; le altre non ne prendono mai
  const spadone = filaDellaStrada('cavaliere', stradaDi('cavaliere', 'spadone')), baluardo = filaDellaStrada('cavaliere', stradaDi('cavaliere', 'baluardo'))
  controlla('lo spadone ha un\'arma a due mani nelle ultime righe', COSE[spadone[6].mano].mani === 2 && !spadone[6].mancina, JSON.stringify(spadone[6]))
  controlla('il baluardo ha sempre un\'arma a una mano e lo scudo', baluardo.slice(2).every(r => COSE[r.mano].mani !== 2 && r.mancina), JSON.stringify(baluardo[6]))
  const pura = filaDellaStrada('mago', stradaDi('mago', 'pura'))
  controlla('la pura magia impugna il bastone', pura.some(r => r.mano === 'bastone-magico'))
}

/* ══════════ 2. il vincolo del banco: una strada non prende da sé quello che è di un'altra ══════════ */
{
  const mago = stradaDi('mago', 'guerriero'), pura = stradaDi('mago', 'pura')
  const c = new Corredo({ eroe: 'mago', roba: { ...ROBA_VUOTA(), mano: 'spada', mancina: 'scudo-legno' } })
  controlla('il mago guerriero prende una spada, non una bacchetta', ammette(mago)(c, 'spada-corta') && !ammette(mago)(c, 'scettro'))
  controlla('e la pura magia non prende la spada, ma il bastone sì', !ammette(pura)(c, 'spada') && ammette(pura)(c, 'bastone-magico'))
  controlla('lo scudo lo vuole chi lo porta, non la pura magia', ammette(mago)(c, 'scudo-ferro') && !ammette(pura)(c, 'scudo-ferro'))
  // il gioco propone un pezzo migliore e il banco di una strada lo rifiuta
  const v = new Corredo({ eroe: 'mago', roba: { ...ROBA_VUOTA(), mano: 'verga' } })
  v.vincoloDelBanco = ammette(pura)
  controlla('un\'arma di un\'altra strada non si mette da sé', !v.vaAddosso('spada-corta'))
  v.vincoloDelBanco = null
}

/* ══════════ 3. il banco gioca una strada ══════════ */
{
  for (const e of EROI) for (const s of stradeDi(e.chiave)) {
    const g = gioca(CAMPAGNA[1], { seme: 9, bravura: 0.8, eroe: e.chiave, strada: s, roba: robaDellaStrada(e.chiave, s, 1),
                                   crescita: crescitaDellaStrada(e.chiave, s, 1, 6) })
    controlla(`${e.chiave}:${s.chiave}: la scalinata si gioca fino in fondo, senza guasti`, !g.guasto, g.guasto)
    const arma = g.corsa.mano && COSE[g.corsa.mano]
    controlla(`${e.chiave}:${s.chiave}: e a fine discesa ha ancora l'arma della strada`, !arma || s.arma.famiglie.includes(arma.famiglia), g.corsa.mano)
  }
  const m = misuraLaStrada({ classe: 'nano', nome: 'doppia', k: 1, prove: [0.8, 0.4], semi: 3, piu: 5 })
  controlla('la misura di una strada torna le vittorie a ogni bravura e le domande', m.vinte.length === 2 && m.domande > 0 && m.partite === 3, JSON.stringify(m))
  // a una mano o a due con la stessa strada (punti e albero): serve a misurare quanto vale la mano che resta
  const una = misuraLaStrada({ classe: 'cavaliere', nome: 'spadone', k: 1, prove: [0.8], semi: 2, mani: 1 })
  controlla('si può provare la stessa strada a una mano', una.vinte.length === 1)
}

/* ══════════ 4. due mani: l'arma pesante vale la leggera più la mano che toglie ══════════ */
{
  for (const grado of [1, 2, 3]) {
    const una = ARMI_DI(grado).find(k => (COSE[k].mani || 1) === 1), due = ARMI_DI(grado).find(k => COSE[k].mani === 2)
    const scudo = ['scudo-legno', 'scudo-ferro', 'scudo-teschio'][grado - 1]
    uguale(`gradino ${grado}: ${due} vale ${una} più lo scudo del gradino, contato come attacco`,
           COSE[due].att, COSE[una].att + PESO_DELLA_DIFESA * COSE[scudo].dif)
  }
  // il livello cresce l'arma ogni 5 livelli e lo scudo ogni 15: l'arma a due mani porta anche quel pezzo di scudo
  const dif = k => COSE[chiaveDelPezzo(k, 31)].dif - COSE[k].dif
  uguale('al livello 31 lo scudo ha due punti di difesa in più', dif('scudo-ferro'), 2)
  uguale('e l\'arma a due mani due scudi di attacco in più dell\'arma a una mano', (COSE[chiaveDelPezzo('spadone', 31)].att - COSE.spadone.att) -
         (COSE[chiaveDelPezzo('sciabola', 31)].att - COSE.sciabola.att), 2 * PESO_DELLA_DIFESA)
  // le armi a una mano dei gradini alti: senza, la strada con lo scudo restava ferma a un gradino sotto
  controlla('ci sono la sciabola, la scure e la mannaia', COSE.sciabola.mani === 1 && COSE.scure.grado === 2 && COSE.mannaia.grado === 3)
  controlla('e il nano e il cavaliere le portano', new Corredo({ eroe: 'nano' }).porta('mannaia') && new Corredo({ eroe: 'cavaliere' }).porta('sciabola'))
}

/* ══════════ 5. il bastone: l'energia torna più in fretta ══════════ */
{
  controlla('il bastone dichiara la ricarica', COSE['bastone-magico'].ricarica === RICARICA_DEL_BASTONE && COSE.scettro.ricarica === undefined)
  controlla('e la dice il pannello del pezzo', numeriDi(COSE['bastone-magico']).some(n => n.campo === 'ricarica' && /più in fretta/.test(n.testo)),
            JSON.stringify(numeriDi(COSE['bastone-magico'])))
  controlla('anche un bastone di livello alto, magico', COSE[chiaveDelPezzo('bastone-magico', 9)].ricarica === RICARICA_DEL_BASTONE)
  // dieci risposte giuste a un mostro che regge: con la bacchetta quattro punti di energia, col bastone sei
  const dopo = mano => {
    const c = new Corsa(CAMPAGNA[1], { seme: 5, eroe: 'mago', rnd: seminato(5), crescita: { esp: sogliaDi(3), caselle: [null, null, null] },
                                       roba: { ...ROBA_VUOTA(), mano } })
    const m = c.livello.robe.find(r => r.che === 'mostro')
    Object.assign(m, { tipo: 'goblin', ossa: 900, ossaMax: 900, att: 1, dif: 0, sveglio: true, stati: null, velocita: c.velocita })
    c.scontro(m, { solo: true, tocco: true })
    c.energia = 0
    for (let i = 0; i < 10; i++) c.rispondi(true)
    return c.energia
  }
  const bacchetta = dopo('verga'), bastone = dopo('bastone-magico')
  uguale('con la bacchetta, due punti ogni cinque risposte', bacchetta, Math.floor(10 / RISPOSTE_PER_ENERGIA))
  controlla('col bastone di più', bastone > bacchetta, `${bastone} contro ${bacchetta}`)
  uguale('il bastone fa tornare l\'energia di metà più in fretta', bastone, Math.floor(10 * (1 + RICARICA_DEL_BASTONE / 100) / RISPOSTE_PER_ENERGIA))
  nota(`dieci risposte giuste a un mostro: ${bacchetta} punti di energia con la bacchetta, ${bastone} col bastone`)
}

riassunto('le strade e le due mani')
