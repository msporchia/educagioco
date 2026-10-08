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
import { MERCANTI, mercanteDi, vendeLa, righeDi, guastiDeiMercanti, schedaDi }
  from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { MERCANTI as DOVE_MERCANTI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Corredo, ROBA_VUOTA, rileggiRoba, ABILITA_CONFRONTATE } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { ABILITA, affiancatoDi, sintesiDi } from '../../src/giochi/sotterraneo/viste/pezzo.js'
import { Livello, seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { gioca, misuraLaStoria } from '../../src/giochi/sotterraneo/motore/banco.js'
import { robaAttesa, migliora } from '../../src/giochi/sotterraneo/motore/storia.js'
import { passoDi, premiDella } from '../../src/giochi/sotterraneo/dati/storia.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
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

/* ══════════ 7. i banchi portano il passo dopo ══════════
   L'armaiolo e il rigattiere hanno la riga della storia con cui si entra
   nella prossima discesa (dati/storia.js): a chi non ha raccolto niente
   offrono i pezzi che mancano, a chi li ha già nient'altro di più forte,
   e qualche cosa in più che non costa più del pezzo del passo. */
{
  const righe = []
  let fuori = 0, avanti = 0, troppoCare = 0, mancati = 0
  for (const eroe of EROI.map(e => e.chiave)) {
    for (let finite = 1; finite <= CAMPAGNA.length; finite++) {
      const riga = passoDi(eroe, finite)
      const tetto = c => Math.max(0, ...c.map(x => (riga[x] ? COSE[riga[x]].prezzo : 0)))
      for (let s = 0; s < 6; s++) {
        // chi arriva con la riga di prima: i pezzi del passo ci sono tutti
        const indietro = new Bottega({ eroe, roba: robaAttesa(eroe, finite - 1), finite, rnd: seminato(100 + s * 7 + finite) })
        const dovuti = premiDella(eroe, finite - 1).filter(k => migliora(indietro, k))
        const offerti = [...indietro.banco('armaiolo').roba, ...indietro.banco('rigattiere').roba]
        mancati += dovuti.filter(k => !offerti.includes(k)).length
        // chi ha già la riga: niente della riga dopo, e niente sopra il prezzo del passo
        const pari = new Bottega({ eroe, roba: robaAttesa(eroe, finite), finite, rnd: seminato(200 + s * 7 + finite) })
        const dopo = new Set(premiDella(eroe, finite))
        for (const m of MERCANTI) {
          const r = pari.mercanzia(m.chiave)
          controlla(`${m.chiave}, ${finite} finite: in cima quello che non finisce`,
                    r.filter(x => x.sempre).map(x => x.chiave).join() === m.sempre.join())
          const pescati = r.filter(x => !x.sempre).map(x => x.chiave)
          fuori += pescati.filter(k => !vendeLa(m, k)).length
          avanti += pescati.filter(k => dopo.has(k)).length
          if (m.passo) troppoCare += pescati.filter(k => COSE[k].prezzo > tetto(m.passo)).length
          else uguale(`${m.chiave}, ${finite} finite: tante righe quante dichiara`, pescati.length, righeDi(m, finite))
        }
      }
      if (eroe === 'cavaliere') righe.push(`  ${finite} finite: ${premiDella(eroe, finite - 1).join(', ')}`)
    }
  }
  uguale('chi arriva senza i pezzi del passo li trova al banco', mancati, 0)
  uguale('ogni mercante vende solo il suo', fuori, 0)
  uguale('nessun banco porta la riga dopo', avanti, 0)
  uguale('e niente costa più del pezzo del passo', troppoCare, 0)
  nota('il passo che il banco porta al cavaliere, per discese finite:')
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

/* ══════════ 7b. la bottega: confronto, vetrina, linguette ══════════
   Il pannello dice «⚔️ 3 → 5» coi numeri del motore (seLoMetto), il banco
   non resta mai vuoto (la vetrina dei pezzi più su, spenti) e quello che
   non alza niente di quello addosso non si mostra (docs/sotterraneo/roba.md,
   «La bottega e lo zaino»). */
{
  const nudo = new Bottega({ roba: { ...ROBA_VUOTA(), gemme: 50 } })
  const p = nudo.seLoMetto('spada-corta')
  uguale('a mani nude la spada corta porta il braccio da 3 a 4', `${p.prima.att} → ${p.dopo.att}`, '3 → 4')
  uguale('in mano', p.dove, 'mano')
  const vestito = new Bottega({ roba: { ...ROBA_VUOTA(), mano: 'spadone', corpo: 'panciotto', dito: 'amuleto-rosso' } })
  uguale('lo scudo con lo spadone in mano non va: lo dice', vestito.seLoMetto('scudo-legno')?.bloccata, 'spadone')
  const anello = vestito.seLoMetto('anello-verde')
  uguale('cambiare l\'amuleto rosso con l\'anello verde toglie sei di vita', anello.prima.vita - anello.dopo.vita, 6)
  controlla('e dà le gemme', anello.dopo.gemme > anello.prima.gemme)
  uguale('il mago non si mette l\'ascia: niente confronto', new Bottega({ eroe: 'mago' }).seLoMetto('ascia'), null)
  /* in discesa la vita è il tetto della corsa, che cresce coi piani */
  const giu = new Corsa(CAMPAGNA[2], { seme: 3, rnd: seminato(3), roba: { ...ROBA_VUOTA(), zaino: ['amuleto-azzurro'] } })
  const pg = giu.seLoMetto('amuleto-azzurro')
  uguale('nello zaino il confronto parte dalla vita massima della discesa', pg.prima.vita, giu.vitaMax)
  uguale('e ci aggiunge i tre dell\'amuleto', pg.dopo.vita, giu.vitaMax + 3)

  uguale('prima della prima discesa l\'armaiolo non ha niente da vendere', nudo.banco('armaiolo').roba.length, 0)
  const vetrina = nudo.vetrina('armaiolo')
  controlla('ma la vetrina mostra i pezzi più su', vetrina.length >= 3, JSON.stringify(vetrina))
  uguale('la spada corta arriva finita la cripta', vetrina.find(v => v.chiave === 'spada-corta')?.finita, 0)
  controlla('e niente della vetrina si compra', vetrina.every(v => nudo.compraDa('armaiolo', v.chiave) === null))
  uguale('l\'erborista non ha vetrina: il suo banco non è mai vuoto', nudo.vetrina('erborista').length, 0)
  const forte = new Bottega({ finite: 3, roba: { ...ROBA_VUOTA(), mano: 'spadone' } })
  uguale('chi ha lo spadone non vede la spada corta', forte.sottoAddosso('spada-corta'), true)
  uguale('né la spada in vetrina', forte.vetrina('armaiolo').some(v => v.chiave === 'spada'), false)
  const leggera = new Bottega({ roba: { ...ROBA_VUOTA(), mano: 'spada' } })
  uguale('una seconda arma leggera, con la mano libera, alza il braccio: si vede', leggera.sottoAddosso('spada-corta'), false)

  /* ogni cosa del banco sta sotto una linguetta, e «Vendi» ce l'ha solo chi compra */
  for (const m of MERCANTI)
    for (const r of new Bottega({ finite: 6, roba: { ...ROBA_VUOTA(), gemme: 99 } }).mercanzia(m.chiave))
      controlla(`${m.chiave}: ${r.chiave} ha la sua linguetta`, !!schedaDi(m, r.chiave))
  uguale('la linguetta «Vendi» è del rigattiere', MERCANTI.filter(m => m.schede.some(s => s.vendi)).map(m => m.chiave).join(), 'rigattiere')
}

/* ══════════ 7c. il confronto affiancato, riga per riga ══════════
   «Addosso» a sinistra, «Questo» a destra, una riga per ogni abilità che
   almeno uno dei due ha (docs/sotterraneo/roba.md, «La bottega e lo zaino»):
   il motore dà i numeri di ogni lato (seLoMetto().cambio), pezzo.js li mette
   in riga con il verso e la sintesi. */
{
  const riga = (a, campo) => a.righe.find(r => r.campo === campo)
  const bott = roba => new Bottega({ roba: { ...ROBA_VUOTA(), gemme: 99, ...roba } })
  const affianca = (b, k) => affiancatoDi(b.seLoMetto(k), { chiave: k, ...COSE[k] })

  controlla('le abilità del motore e quelle in riga nella vista sono le stesse',
            ABILITA.map(a => a.campo).join() === ABILITA_CONFRONTATE.join(), `${ABILITA.map(a => a.campo)} / ${ABILITA_CONFRONTATE}`)
  controlla('ogni abilità ha parola, icona e modo di scriversi',
            ABILITA.every(a => a.nome && a.em && a.scrivi(1)), JSON.stringify(ABILITA.map(a => a.campo)))

  /* un pezzo con più abilità contro uno con altre: il pugnale vampiro (braccio e vita) al posto della spada di ghiaccio (braccio e difesa) */
  const g = affianca(bott({ mano: 'spada-di-ghiaccio', mancina: 'scudo-legno' }), 'pugnale-vampiro')
  uguale('a sinistra la spada di ghiaccio', g.toglie.join(), 'spada-di-ghiaccio')
  stessaLista('tre righe: braccio, difesa, vita', g.righe.map(r => r.campo), ['att', 'dif', 'vita'])
  uguale('il braccio è lo stesso: neutro', riga(g, 'att').verso, 'pari')
  uguale('la difesa c\'era e non c\'è più: «—» a destra, in rosso', `${riga(g, 'dif').vecchio} → ${riga(g, 'dif').nuovo} ${riga(g, 'dif').verso}`, '+1 → — giu')
  uguale('la vita c\'è solo a destra: «—» a sinistra, in verde', `${riga(g, 'vita').vecchio} → ${riga(g, 'vita').nuovo} ${riga(g, 'vita').verso}`, '— → +6 su')
  uguale('la sintesi conta le righe', g.sintesi, 'meglio in 1, peggio in 1')

  /* la mano debole libera: il pugnale ci va da sé, a sinistra niente, e il braccio vale metà (2 → 1) */
  const deb = affianca(bott({ mano: 'spada-di-ghiaccio' }), 'pugnale-vampiro')
  uguale('nella mano libera non toglie niente', deb.toglie.length, 0)
  uguale('il posto è la mano debole', deb.dove, 'mancina')
  uguale('il braccio dimezzato', riga(deb, 'att').nuovo, '+1')

  /* il posto vuoto: a sinistra niente, tutto quello che il pezzo ha è meglio */
  const v = affianca(bott({}), 'spada-corta')
  uguale('posto vuoto: nessun pezzo a sinistra', v.toglie.length, 0)
  stessaLista('una riga sola, il braccio', v.righe.map(r => r.campo), ['att'])
  uguale('«—» contro +1, in verde', `${v.righe[0].vecchio} → ${v.righe[0].nuovo} ${v.righe[0].verso}`, '— → +1 su')
  uguale('meglio in 1', v.sintesi, 'meglio in 1')
  uguale('e non è un caso a due mani', v.dueMani, false)

  /* lo spadone contro spada e scudo insieme: la sinistra ne ha due e lo dice */
  const d = affianca(bott({ mano: 'spada', mancina: 'scudo-borchiato' }), 'spadone')
  stessaLista('a sinistra arma e scudo', d.toglie, ['spada', 'scudo-borchiato'])
  uguale('è un caso a due mani', d.dueMani, true)
  uguale('il braccio: la spada (2) e lo scudo (0) contro i 4 dello spadone', `${riga(d, 'att').vecchio} → ${riga(d, 'att').nuovo}`, '+2 → +4')
  uguale('la difesa dello scudo si perde', riga(d, 'dif').verso, 'giu')
  uguale('e anche la sua vita', riga(d, 'vita').verso, 'giu')
  uguale('meglio in 1, peggio in 2', d.sintesi, 'meglio in 1, peggio in 2')
  const pd = bott({ mano: 'spada', mancina: 'scudo-borchiato' }).seLoMetto('spadone')
  uguale('le righe sommano il totale che cambia: il braccio', pd.dopo.att - pd.prima.att, 4 - 2)
  uguale('la difesa', pd.dopo.dif - pd.prima.dif, -1)
  uguale('la vita', pd.dopo.vita - pd.prima.vita, -3)
  uguale('un\'arma a due mani sola in mano non è «arma e scudo»', affianca(bott({ mano: 'spada' }), 'spadone').dueMani, false)

  /* un anello si confronta col gioiello che hai, e le gemme si scrivono come moltiplicatore */
  const a = affianca(bott({ dito: 'amuleto-rosso' }), 'anello-verde')
  uguale('a sinistra l\'amuleto rosso', a.toglie.join(), 'amuleto-rosso')
  uguale('la vita 6 si perde', `${riga(a, 'vita').vecchio} → ${riga(a, 'vita').nuovo} ${riga(a, 'vita').verso}`, '+6 → — giu')
  uguale('le gemme ×1,5 arrivano', `${riga(a, 'gemme').vecchio} → ${riga(a, 'gemme').nuovo} ${riga(a, 'gemme').verso}`, '— → ×1,5 su')
  uguale('la mano non c\'entra: niente riga del braccio', riga(a, 'att'), undefined)
  uguale('uno meglio e uno peggio', a.sintesi, 'meglio in 1, peggio in 1')
  const luce = affianca(bott({ dito: 'anello-ambra' }), 'anello-ambra')
  uguale('lo stesso pezzo contro se stesso: tutto neutro', luce.sintesi, 'uguale')
  controlla('e ha comunque la sua riga', luce.righe.length === 1 && luce.righe[0].verso === 'pari')

  /* la mano debole vale metà: una seconda spada nella mano libera ha il braccio dimezzato */
  const m = affianca(bott({ mano: 'spada', mancina: 'scudo-legno' }), 'spada')
  uguale('con la mano debole occupata una spada contro una spada: il posto è la mano, +2 contro +2', m.sintesi, 'uguale')
  const mancino = affianca(bott({ mano: 'spadone' }), 'scudo-ferro')
  uguale('con lo spadone in mano lo scudo non c\'è, niente confronto', bott({ mano: 'spadone' }).seLoMetto('scudo-ferro').cambio, undefined)
  uguale('e la vista non lo affianca', mancino, null)

  /* quello che non si porta o non si indossa non ha confronto */
  uguale('il mago non porta l\'ascia: niente da affiancare', affiancatoDi(new Bottega({ eroe: 'mago' }).seLoMetto('ascia'), COSE.ascia), null)
  uguale('una pozione non si confronta', affiancatoDi(bott({}).seLoMetto('pozione'), COSE.pozione), null)
  uguale('senza righe meglio né peggio la sintesi è «uguale»', sintesiDi(0, 0), 'uguale')
}

/* ══════════ 7b. la pozione della barra ══════════
   Un tocco sulla 🧪 della barra in basso beve senza aprire lo zaino
   (docs/sotterraneo/barra.md): la più piccola che riempie, o la più
   grande se nessuna basta; in piena forma niente, l'elisir non conta. */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 3, eroe: 'cavaliere',
    roba: { v: 1, gemme: 0, zaino: ['pozione-grande', 'elisir-toro', 'pozione-piccola', 'pozione'], mano: null,
            mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 } })
  uguale('tre pozioni: l\'elisir non è una cura', c.pozioni, 3)
  uguale('in piena forma non si beve', c.pozioneGiusta(), null)
  c.vita = c.vitaMax - 5
  uguale('mancano 5: la boccetta basta', c.zaino[c.pozioneGiusta()], 'pozione-piccola')
  c.vita = c.vitaMax - 8
  uguale('mancano 8: la pozione, non l\'ampolla', c.zaino[c.pozioneGiusta()], 'pozione')
  c.vita = 1
  c.vitaBase += 30
  uguale('ne mancano più di quante ne curi la più grande: l\'ampolla', c.zaino[c.pozioneGiusta()], 'pozione-grande')
  c.zaino = ['elisir-toro']
  uguale('senza cure niente', c.pozioneGiusta(), null)
}

/* ══════════ 8. l'equilibrio, in piccolo ══════════
   La misura intera (venti semi, otto/sei/quattro su dieci, la roba di una
   discesa prima e di due avanti) sta in `misure/sotterraneo`; qui sei semi
   col cavaliere e la roba attesa, per accorgersi subito se la tabella
   rende una discesa una passeggiata o un muro. */
{
  const m = misuraLaStoria({ eroe: 'cavaliere', semi: 6, prove: [0.8, 0.4], scarti: [0] })
  const [otto, quattro] = m.vinte[0]
  for (const [k, t] of CAMPAGNA.entries()) {
    controlla(`${t.chiave}: con la roba attesa, a otto su dieci si arriva in fondo`, otto[k] >= 5, `${otto[k]}/6`)
    if (k) controlla(`${t.chiave}: con la roba attesa, a quattro su dieci quasi mai`, quattro[k] <= 1, `${quattro[k]}/6`)
  }
  nota(`sei semi con la roba attesa: a 8/10 ${Object.values(otto).join(' · ')}, a 4/10 ${Object.values(quattro).join(' · ')}`)
}

riassunto('la roba che resta e i mercanti')
