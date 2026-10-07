/* La roba che resta, e i mercanti di sopra. Fino al 7 ottobre 2026 fra
   una discesa e l'altra si ripartiva nudi; adesso quello che si ha
   addosso, in tasca e le gemme scendono e risalgono con l'avventuriero,
   e il mercante è uscito dalle discese: tre botteghe sulla terra di
   sopra (docs/sotterraneo/regole.md, docs/sotterraneo/roba.md).
   Qui: la roba fra due discese, lo svenimento, la sosta, un'avventura
   nuova, il banco di ogni mercante per discese finite, e una misura
   leggera dell'equilibrio (quella intera: `misure/sotterraneo`).
   `node test/esegui.mjs sotterraneo-roba --niente-build`
   tempo: 100 */
import { CAMPAGNA, L_ABISSO, svenimentiDi } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { COSE, CURE, SEGNI, IN_VENDITA, STANZE_TORCIA } from '../../src/giochi/sotterraneo/dati/cose.js'
import { TASCHE } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { MERCANTI, mercanteDi, vendeLa, righeDi, tettoDi, profonditaDelBanco, guastiDeiMercanti }
  from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { MERCANTI as DOVE_MERCANTI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Corredo, ROBA_VUOTA, rileggiRoba } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { Livello, seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { gioca, misuraConLaRoba } from '../../src/giochi/sotterraneo/motore/banco.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati ══════════ */
{
  const g = guastiDeiMercanti()
  controlla('i mercanti stanno in piedi', g.length === 0, g.join(' · '))
  uguale('tre mercanti', MERCANTI.length, 3)
  for (const m of MERCANTI) controlla(`${m.chiave}: ha un posto sulla terra di sopra`, !!DOVE_MERCANTI[m.chiave])
  uguale('uno solo compra la roba', MERCANTI.filter(m => m.compra).map(m => m.chiave).join(), 'rigattiere')
  controlla('nessun segno promette un mercante nelle discese', !SEGNI.mercante)
}

/* ══════════ 2. il mercante non è più giù, e al suo posto c'è un portale ══════════
   La stanza del mercante era la prima pescata fra le foglie: adesso ci
   sta il portale per il villaggio, con la stessa pesca, così il piano
   nasce uguale a ieri; la fonte resta una. Il portale non ha porta. */
{
  let piani = 0, fonti = 0, mercanti = 0, portali = 0, chiusi = 0
  for (const t of [...CAMPAGNA, L_ABISSO]) {
    for (let s = 0; s < 8; s++) {
      const l = new Livello({ seme: 31 + s * 977, piano: s % 3, largo: t.misura, alto: t.misura, giri: t.giri })
      piani++
      fonti += l.robe.filter(r => r.che === 'fonte').length
      mercanti += l.robe.filter(r => r.che === 'mercante').length
      const p = l.robe.filter(r => r.che === 'portale')
      portali += p.length
      const sua = p[0] && l.stanze.find(st => st.ruolo === 'portale')
      if (sua && l.robe.some(r => r.che === 'porta' && r.gruppo === sua.id)) chiusi++
    }
  }
  uguale('nessun mercante in nessun piano', mercanti, 0)
  controlla('un portale per piano, quasi sempre', portali >= piani * 0.9 && portali <= piani, `${portali} portali in ${piani} piani`)
  controlla('e una fonte', fonti >= piani * 0.9 && fonti <= piani, `${fonti} fonti in ${piani} piani`)
  uguale('il portale non sta dietro una porta', chiusi, 0)
  nota(`${portali} portali e ${fonti} fonti in ${piani} piani`)
}

/* ══════════ 3. la roba resta fra due discese ══════════ */
{
  const a = new Corsa(CAMPAGNA[0], { seme: 3, rnd: seminato(3) })
  a.mano = 'spada'
  a.corpo = 'corazza'
  a.dito = 'amuleto-rosso'
  a.zaino = ['pozione', 'ascia']
  a.gemme = 40
  a.torciaResta = 5
  a.torceInScorta = 1
  const r = a.roba
  const b = new Corsa(CAMPAGNA[1], { seme: 4, rnd: seminato(4), roba: r })
  stessaLista('alla discesa dopo si ritrova quello che si aveva addosso',
              [b.mano, b.corpo, b.dito], ['spada', 'corazza', 'amuleto-rosso'])
  stessaLista('e in tasca', b.zaino, ['pozione', 'ascia'])
  uguale('e le gemme', b.gemme, 40)
  uguale('e la torcia a metà, con quella di scorta', `${b.torciaResta}+${b.torceInScorta}`, '5+1')
  uguale('si scende in piedi: la vita parte dal massimo, amuleto compreso', b.vita, b.vitaMax)
  controlla('e l\'amuleto conta', b.vitaMax > b.io.vita, `${b.vitaMax}`)
  r.zaino.push('chiave')
  controlla('la roba passata non resta legata alla discesa di prima', !b.zaino.includes('chiave'))

  /* la roba è dell'avventuriero, non dell'eroe: un mago trova la stessa
     roba, e quello che non porta va in tasca (lo dice, come al rientro) */
  const m = new Corsa(CAMPAGNA[1], { seme: 4, rnd: seminato(4), eroe: 'mago', roba: a.roba })
  uguale('al mago la spada non va in pugno', m.mano, null)
  controlla('ma finisce in tasca, con la corazza', m.zaino.includes('spada') && m.zaino.includes('corazza'),
            m.zaino.join())
  controlla('e la riga dice perché', m.avvisi.some(x => /non impugna/.test(String(x))), JSON.stringify(m.avvisi))

  /* le torce comprate sopra aspettano alla cintura: scendendo se ne accende una */
  const t = new Corsa(CAMPAGNA[0], { seme: 5, rnd: seminato(5), roba: { ...ROBA_VUOTA(), torce: 2 } })
  uguale('scendendo la prima torcia si accende', t.torciaResta, STANZE_TORCIA)
  uguale('e l\'altra resta alla cintura', t.torceInScorta, 1)

  /* giocata davvero: la roba della scalinata scende nel pozzo */
  const g = gioca(CAMPAGNA[0], { seme: 11, bravura: 0.9, come: 'tutto' })
  controlla('la scalinata si vince', g.esito.vinta)
  const su = g.corsa.roba
  const giu = new Corsa(CAMPAGNA[1], { seme: 12, rnd: seminato(12), roba: su })
  uguale('e nel pozzo si scende con la stessa roba', JSON.stringify(giu.roba.zaino), JSON.stringify(su.zaino))
  uguale('e le stesse gemme', giu.gemme, su.gemme)
  nota(`dalla scalinata si porta su: ${[su.mano, su.mancina, su.corpo, su.dito].filter(Boolean).join(', ') || 'niente addosso'}` +
       ` · tasche ${su.zaino.join(', ') || 'vuote'} · 💎 ${su.gemme}`)
}

/* ══════════ 4. svenire: le tasche e metà gemme, mai quello addosso ══════════ */
{
  const t = CAMPAGNA[2]
  const c = new Corsa(t, { seme: 9, rnd: seminato(9), roba: { ...ROBA_VUOTA(), mano: 'spada', corpo: 'corazza',
                                                              zaino: ['pozione', 'pozione'], gemme: 41 } })
  c.vita = 0
  c.svieni()
  c.riprendi()
  stessaLista('svenendo quello addosso resta', [c.mano, c.corpo], ['spada', 'corazza'])
  uguale('le tasche si svuotano', c.zaino.length, 0)
  uguale('le gemme si dimezzano', c.gemme, 20)
  controlla('e la discesa continua', !c.finita)

  /* l'ultimo: si risale con quello che si ha addosso, e la discesa è da rifare */
  c.zaino = ['pozione']
  c.gemme = 30
  c.svenimenti = svenimentiDi(t) - 1
  c.vita = 0
  c.svieni()
  uguale('all\'ultimo il cartello lo dice', c.foglio.ultimo, true)
  c.riprendi()
  controlla('si risale, a discesa persa', c.finita && !c.vinta)
  const r = c.roba
  stessaLista('e quello addosso viene su', [r.mano, r.corpo], ['spada', 'corazza'])
  uguale('le tasche no', r.zaino.length, 0)
  uguale('e delle gemme metà', r.gemme, 15)
}

/* ══════════ 5. la sosta: la roba di sopra comanda ══════════
   Uscendo a metà si va dai mercanti con la roba di giù; riprendendo, la
   discesa ritrova la roba com'è adesso, non com'era quando si è usciti. */
{
  const c = new Corsa(CAMPAGNA[1], { seme: 21, rnd: seminato(21), roba: { ...ROBA_VUOTA(), gemme: 30, zaino: ['ascia'] } })
  const dato = scrivi(c, 1)
  const sopra = new Bottega({ roba: c.roba, finite: 2, rnd: seminato(3) })
  sopra.vendiA('rigattiere', 0)
  sopra.compraDa('erborista', 'pozione')
  const ripresa = leggi(dato, CAMPAGNA[1], sopra.roba)
  stessaLista('riprendendo si ha in tasca quello comprato sopra', ripresa.zaino, ['pozione'])
  uguale('e le gemme di dopo la spesa', ripresa.gemme, 30 + COSE.ascia.prezzo / 2 - COSE.pozione.prezzo)
  uguale('e il piano è quello di prima', ripresa.livello.celle.join(), c.livello.celle.join())
  controlla('la sosta non tiene una copia della roba: sta nell\'avventura', !('zaino' in dato) && !('gemme' in dato))
}

/* ══════════ 6. un'avventura nuova parte nuda ══════════
   I salvataggi di prima si sono azzerati (docs/sotterraneo/avventure.md):
   niente gemme di bentornato, niente roba passata dalla sosta. */
{
  uguale('un profilo senza roba non ha roba da rileggere', rileggiRoba(null), null)
  uguale('e un dato storto nemmeno', rileggiRoba({ v: 99, gemme: 5 }), null)
  const c = new Corsa(CAMPAGNA[0], { seme: 4, rnd: seminato(4), roba: rileggiRoba(null) })
  stessaLista('chi comincia scende nudo', c.roba, ROBA_VUOTA())
}

/* ══════════ 7. i banchi ══════════ */
{
  /* ogni mercante vende solo il suo, e più discese finite vuol dire più
     righe e roba più cara (il tetto dell'armaiolo, la profondità) */
  const righe = []
  for (let finite = 0; finite <= CAMPAGNA.length; finite++) {
    const riga = []
    for (const m of MERCANTI) {
      let quante = 0, prezzo = 0, banchi = 0, fuori = 0, sopraIlTetto = 0
      for (let s = 0; s < 40; s++) {
        const b = new Bottega({ finite, rnd: seminato(100 + s * 7 + finite) })
        const r = b.mercanzia(m.chiave)
        const pescati = r.filter(x => !x.sempre).map(x => x.chiave)
        quante += pescati.length
        prezzo += pescati.reduce((a, k) => a + COSE[k].prezzo, 0)
        banchi++
        fuori += pescati.filter(k => !vendeLa(m, k)).length
        sopraIlTetto += pescati.filter(k => COSE[k].prezzo > tettoDi(m, finite)).length
        controlla(`${m.chiave}, ${finite} finite: in cima quello che non finisce`,
                  r.filter(x => x.sempre).map(x => x.chiave).join() === m.sempre.join())
      }
      uguale(`${m.chiave}, ${finite} finite: vende solo il suo`, fuori, 0)
      uguale(`${m.chiave}, ${finite} finite: niente sopra il tetto`, sopraIlTetto, 0)
      uguale(`${m.chiave}, ${finite} finite: tante righe quante dichiara`, quante, righeDi(m, finite) * banchi)
      riga.push(`${m.chiave} ${righeDi(m, finite)} ${righeDi(m, finite) === 1 ? 'riga' : 'righe'}, ${quante ? (prezzo / quante).toFixed(0) : '-'} 💎`)
      m.medi = m.medi || []
      m.medi.push(quante ? prezzo / quante : 0)
    }
    righe.push(`  ${finite} finite: ${riga.join(' · ')}`)
  }
  const armi = mercanteDi('armaiolo').medi
  controlla('dall\'armaiolo, più discese finite vuol dire roba più cara', armi[CAMPAGNA.length] > armi[0] * 1.8,
            armi.map(x => x.toFixed(0)).join(' → '))
  controlla('e il terzo gradino solo dopo la grotta', tettoDi(mercanteDi('armaiolo'), 2) < COSE.spadone.prezzo &&
            tettoDi(mercanteDi('armaiolo'), 3) >= COSE.spadone.prezzo)
  controlla('la profondità del banco cresce', [0, 1, 2, 3, 4, 5, 6].every(f => !f ||
            profonditaDelBanco(f) > profonditaDelBanco(f - 1)))
  nota('i banchi, per discese finite:')
  righe.forEach(r => nota(r))
  controlla('l\'erborista ha sempre le tre cure e la torcia', CURE.every(k => mercanteDi('erborista').sempre.includes(k)) &&
            mercanteDi('erborista').sempre.includes('torcia'))
}
{
  /* il banco si pesca una volta per giro: aprirlo di nuovo non lo cambia,
     e quello che si compra se ne va; le cure no */
  const b = new Bottega({ roba: { ...ROBA_VUOTA(), gemme: 200 }, finite: 3, rnd: seminato(8) })
  const prima = b.banco('armaiolo').roba.join()
  const altra = new Bottega({ roba: b.roba, finite: 3, banchi: b.banchi, rnd: seminato(999) })
  uguale('riaperto, il banco è lo stesso', altra.banco('armaiolo').roba.join(), prima)
  const k = b.banco('armaiolo').roba.find(x => b.posso(x))
  const e = b.compraDa('armaiolo', k)
  uguale('si compra', e && e.che, 'comprato')
  controlla('e quello comprato se ne va dal banco', !b.banco('armaiolo').roba.includes(k), b.banco('armaiolo').roba.join())
  controlla('una cosa migliore comprata va addosso', b.possiedo(k) && (e.addosso || b.zaino.includes(k)))
  for (let i = 0; i < 3; i++) uguale(`boccetta ${i + 1}: si compra`, b.compraDa('erborista', 'pozione-piccola')?.che, 'comprato')
  uguale('e le cure restano sul banco', b.mercanzia('erborista').filter(r => r.chiave === 'pozione-piccola').length, 1)

  /* la torcia comprata sopra va alla cintura, non in tasca */
  const tasche = b.zaino.length
  b.compraDa('erborista', 'torcia')
  uguale('la torcia non prende una tasca', b.zaino.length, tasche)
  uguale('e aspetta alla cintura', b.torceInScorta, 1)

  /* il non comprabile resta visibile e spento: dice perché */
  const mago = new Bottega({ eroe: 'mago', roba: { ...ROBA_VUOTA(), gemme: 200 }, finite: 6, rnd: seminato(4) })
  const ascia = ['ascia', 'accetta', 'bipenne', 'corazza'].find(x => mago.banco('armaiolo').roba.includes(x))
  if (ascia) {
    uguale('il mago non compra quello che non porta', mago.compraDa('armaiolo', ascia)?.che, 'niente')
    controlla('e il banco dice perché', mago.avvisi.some(a => /mago non/i.test(String(a))), JSON.stringify(mago.avvisi))
  }
  uguale('senza gemme non si compra', new Bottega({ finite: 0, rnd: seminato(1) }).compraDa('erborista', 'pozione')?.che, 'niente')

  /* lo zaino pieno ferma quello che non trova posto */
  const pieno = new Bottega({ roba: { ...ROBA_VUOTA(), gemme: 100, zaino: new Array(TASCHE).fill('pozione') }, rnd: seminato(2) })
  uguale('a zaino pieno una pozione non entra', pieno.compraDa('erborista', 'pozione')?.che, 'pieno')
  uguale('e le gemme restano', pieno.gemme, 100)

  /* si vende solo al rigattiere, a metà prezzo */
  const v = new Bottega({ roba: { ...ROBA_VUOTA(), zaino: ['spada'] }, rnd: seminato(2) })
  uguale('l\'armaiolo non compra', v.vendiA('armaiolo', 0), null)
  const venduta = v.vendiA('rigattiere', 0)
  uguale('il rigattiere sì, a metà prezzo', venduta && venduta.gemme, COSE.spada.prezzo / 2)
  uguale('e la tasca si libera', v.zaino.length, 0)
  controlla('rivendere quello comprato ci rimette sempre', IN_VENDITA.every(x => new Corredo().quantoVale(x) < COSE[x].prezzo))
}

/* ══════════ 8. l'equilibrio, in piccolo ══════════
   La misura intera (venti file, otto/sei/quattro su dieci) sta in
   `misure/sotterraneo`; qui sei file, per accorgersi subito se la roba
   rende una discesa una passeggiata o un muro. */
{
  const m = misuraConLaRoba({ semi: 6, fila: 'minimo' })
  const [otto, , quattro] = m.vinte
  for (const [k, t] of CAMPAGNA.entries()) {
    controlla(`${t.chiave}: con la roba, a otto su dieci si arriva in fondo`, otto[k] >= 5, `${otto[k]}/6`)
    if (k) controlla(`${t.chiave}: con la roba, a quattro su dieci quasi mai`, quattro[k] <= 1, `${quattro[k]}/6`)
  }
  nota(`sei file con la roba: a 8/10 ${otto.join(' · ')}, a 4/10 ${quattro.join(' · ')}`)
}

riassunto('la roba che resta e i mercanti')
