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
import { COSE, CURE, SEGNI, IN_VENDITA, STANZE_TORCIA, baseDi, aLivello, chiaveDelPezzo } from '../../src/giochi/sotterraneo/dati/cose.js'
import { TASCHE } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { MERCANTI, mercanteDi, vendeLa, righeDi, guastiDeiMercanti, schedaDi, sovrapprezzo, prezzoAvanti }
  from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { MERCANTI as DOVE_MERCANTI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Corredo, ROBA_VUOTA, rileggiRoba, ABILITA_CONFRONTATE } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Bottega, PEZZI_PER_LINGUETTA, RARI_PER_LINGUETTA, ULTIMI_VENDUTI, alGiroNuovo } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { ABILITA, affiancatoDi, sintesiDi } from '../../src/giochi/sotterraneo/viste/pezzo.js'
import { Livello, seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { gioca, misuraLaStoria } from '../../src/giochi/sotterraneo/motore/banco.js'
import { robaAttesa, migliora, righeAvanti, crescitaAttesa, delPassoDi } from '../../src/giochi/sotterraneo/motore/storia.js'
import { passoDi, premiDella } from '../../src/giochi/sotterraneo/dati/storia.js'
import { EROI, eroeDi, portaLa } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { crescitaA } from '../../src/giochi/sotterraneo/motore/crescita.js'
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
  uguale('al mago la spada va in pugno: è un mago guerriero (docs/sotterraneo/abilita.md)', m.mano, 'spada')
  controlla('ma la corazza finisce in tasca, con l\'ascia che aveva già', m.zaino.includes('corazza') && m.zaino.includes('ascia'),
            m.zaino.join())
  controlla('e la riga dice perché', m.avvisi.some(x => /non veste/.test(String(x))), JSON.stringify(m.avvisi))
  // un'ascia invece no: il mago non porta le asce
  const m2 = new Corsa(CAMPAGNA[1], { seme: 4, rnd: seminato(4), eroe: 'mago', roba: { ...a.roba, mano: 'ascia', corpo: null, zaino: [] } })
  uguale('all\'ascia il mago rinuncia: non la impugna', m2.mano, null)
  controlla('e lo dice', m2.avvisi.some(x => /non impugna/.test(String(x))), JSON.stringify(m2.avvisi))

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
        mancati += dovuti.filter(k => !offerti.map(baseDi).includes(k)).length
        // chi ha già la riga: niente della riga dopo, e niente sopra il prezzo del passo
        const pari = new Bottega({ eroe, roba: robaAttesa(eroe, finite), finite, rnd: seminato(200 + s * 7 + finite) })
        const dopo = new Set(premiDella(eroe, finite))
        for (const m of MERCANTI) {
          const r = pari.mercanzia(m.chiave)
          controlla(`${m.chiave}, ${finite} finite: in cima quello che non finisce`,
                    r.filter(x => x.sempre).map(x => x.chiave).join() === m.sempre.join())
          const pescati = r.filter(x => !x.sempre && !x.avanti).map(x => x.chiave)
          fuori += pescati.filter(k => !vendeLa(m, k)).length
          avanti += pescati.filter(k => dopo.has(baseDi(k))).length
          if (m.passo) troppoCare += pescati.filter(k => COSE[baseDi(k)].prezzo > tetto(m.passo)).length
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

  /* si compra anche senza le caratteristiche: il pezzo va nello zaino, non addosso, e il pannello dice cosa manca */
  let novizio = null, dopo = null
  for (const eroe of ['nano', 'cavaliere', 'elfa']) for (const lv of [1, 3, 5, 8]) if (!dopo) {
    novizio = new Bottega({ eroe, finite: 3, roba: { ...ROBA_VUOTA(), gemme: 500 }, crescita: crescitaA(eroeDi(eroe), lv), rnd: seminato(4) })
    dopo = novizio.mercanziaVista('armaiolo').find(r => r.meritare)
  }
  controlla('l\'armaiolo ha un pezzo che l\'eroe non regge ancora', !!dopo)
  const costoDopo = novizio.quantoCosta(dopo.chiave)
  controlla('di cui manca la caratteristica, e lo dice', !novizio.posso(dopo.chiave) && /^Serve \w+ \d+ \(hai \d+\)$/.test(novizio.perchéNo(dopo.chiave)),
            novizio.perchéNo(dopo.chiave))
  const preso = novizio.compraDa('armaiolo', dopo.chiave)
  uguale('si compra lo stesso', preso?.che, 'comprato')
  uguale('al prezzo che dice', novizio.gemme, 500 - costoDopo)
  stessaLista('e va nello zaino', novizio.zaino, [dopo.chiave])
  controlla('non addosso', !['mano', 'mancina', 'corpo', 'dito'].some(d => novizio.casella(d) === dopo.chiave))
  controlla('e il banco dice dov\'è finito e cosa manca', novizio.avvisi.some(a => a.cosa === dopo.chiave && /nello zaino · Serve /.test(a.testo)),
            JSON.stringify(novizio.avvisi))
  uguale('dallo zaino non si indossa finché manca la caratteristica', novizio.indossaDallaTasca(0)?.che, 'niente')
  const pienoDiNovizio = new Bottega({ eroe: novizio.chiEro, finite: 3, crescita: novizio.crescita,
    roba: { ...ROBA_VUOTA(), gemme: 500, zaino: ['saio', 'verga', 'manto', 'amuleto-azzurro', 'chiave', 'pozione-grande'] }, rnd: seminato(4) })
  const trovato = pienoDiNovizio.mercanziaVista('armaiolo').find(r => r.meritare)
  controlla('(lo stesso pezzo, a zaino pieno)', !!trovato)
  uguale('a zaino pieno non si compra, come per gli altri', pienoDiNovizio.compraDa('armaiolo', trovato.chiave)?.che, 'pieno')
  uguale('e le gemme restano', pienoDiNovizio.gemme, 500)

  /* lo zaino pieno ferma quello che non trova posto */
  const pieno = new Bottega({ roba: { ...ROBA_VUOTA(), gemme: 100, zaino: ['panciotto', 'manto', 'saio', 'amuleto-azzurro', 'chiave', 'corazza'] }, rnd: seminato(2) })
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
   non alza niente di quello addosso non si mostra (docs/sotterraneo/bottega.md,
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
  uguale('ed è una riga avanti', vetrina.find(v => v.chiave === 'spada-corta')?.avanti, 1)
  uguale('l\'erborista non ha vetrina: il suo banco non è mai vuoto', nudo.vetrina('erborista').length, 0)
  const forte = new Bottega({ finite: 3, roba: { ...ROBA_VUOTA(), mano: 'spadone' } })
  uguale('chi ha lo spadone non vede la spada corta', forte.sottoAddosso('spada-corta'), true)
  uguale('né la spada in vetrina', forte.vetrina('armaiolo').some(v => v.chiave === 'spada'), false)
  /* i pezzi delle righe dopo si comprano, e costano di più quanto più sono avanti (nessun blocco di storia) */
  uguale('una riga avanti costa il doppio', sovrapprezzo(1), 2)
  uguale('due righe avanti il triplo', sovrapprezzo(2), 3)
  controlla('il sovrapprezzo cresce a ogni riga', [1, 2, 3, 4, 5, 6].every(n => sovrapprezzo(n) > sovrapprezzo(n - 1)))
  uguale('al passo il prezzo è pieno', prezzoAvanti(20, 0), 20)
  const ricco = new Bottega({ finite: 1, roba: { ...ROBA_VUOTA(), gemme: 200 }, rnd: seminato(5) })
  const lontano = ricco.vetrina('armaiolo')
  controlla('con una discesa finita la vetrina ha pezzi da comprare', lontano.length >= 2, JSON.stringify(lontano))
  for (const v of lontano) {
    uguale(`${v.chiave}: costa il prezzo pieno per il sovrapprezzo delle sue righe`, ricco.quantoCosta(v.chiave),
           prezzoAvanti(COSE[v.chiave].prezzo, v.avanti))
    controlla(`${v.chiave}: più avanti, più caro del prezzo pieno`, ricco.quantoCosta(v.chiave) > COSE[v.chiave].prezzo)
    uguale(`${v.chiave}: le righe avanti sono quelle della storia`, righeAvanti('cavaliere', 1, v.chiave), v.avanti)
  }
  const pezzo = lontano[lontano.length - 1].chiave
  const costa = ricco.quantoCosta(pezzo)
  uguale('con le gemme un pezzo avanti si compra', ricco.compraDa('armaiolo', pezzo)?.che, 'comprato')
  uguale('e si paga il sovrapprezzo', ricco.gemme, 200 - costa)
  controlla('e ce l\'hai addosso o in tasca', ricco.possiedo(pezzo))
  controlla('comprato, non è più in vetrina', !ricco.vetrina('armaiolo').some(v => v.chiave === pezzo))
  const povero = new Bottega({ finite: 1, roba: { ...ROBA_VUOTA(), gemme: 3 }, rnd: seminato(5) })
  uguale('senza gemme no', povero.compraDa('armaiolo', pezzo)?.che, 'niente')
  uguale('e le gemme restano', povero.gemme, 3)
  controlla('ma si vede, col prezzo vero', povero.mercanzia('armaiolo').some(r => r.chiave === pezzo && r.avanti > 0))
  controlla('un pezzo fuori dalla vetrina non si compra', ricco.compraDa('armaiolo', 'bipenne-solare') === null)

  /* solo roba per me: nessun pezzo di una famiglia che l'eroe non porta, né in vendita né in vetrina, a ogni giro */
  let altrui = 0, vuoti = 0, inutili = 0
  for (const eroe of EROI.map(e => e.chiave))
    for (let finite = 0; finite <= CAMPAGNA.length; finite++)
      for (let s = 0; s < 5; s++) {
        const b = new Bottega({ eroe, finite, roba: { ...robaAttesa(eroe, finite), gemme: 99 }, crescita: crescitaAttesa(eroe, finite), rnd: seminato(40 + s * 13 + finite) })
        for (const m of MERCANTI) {
          for (const r of b.mercanzia(m.chiave)) if (COSE[r.chiave].dove && !b.posso(r.chiave)) altrui++
        }
        // il banco non resta mai vuoto: finché c'è qualcosa di più forte da avere, l'armaiolo lo mostra
        const mostrati = b.mercanzia('armaiolo').filter(r => b.siMostra(r.chiave))
        const ultima = passoDi(eroe, CAMPAGNA.length)
        // resta qualcosa che alza davvero un numero: allora il banco non è vuoto
        const resta = ['mano', 'mancina', 'corpo'].some(c => ultima[c] && migliora(b, aLivello(ultima[c], b.livelloEroe)) &&
                                                            b.siMostra(aLivello(ultima[c], b.livelloEroe)))
        if (resta && !mostrati.length) vuoti++
        // e quello che si mostra alza davvero qualcosa, anche i pezzi avanti
        for (const r of mostrati) {
          const p = b.seLoMetto(r.chiave)
          if (p && p.prima && !ABILITA_CONFRONTATE.some(n => p.dopo[n] > p.prima[n]) && b.casella(COSE[r.chiave].dove)) inutili++
        }
      }
  uguale('nessun pezzo di una famiglia che l\'eroe non porta', altrui, 0)
  uguale('l\'armaiolo non ha mai il banco vuoto prima della fine', vuoti, 0)
  uguale('e non mostra mai un pezzo che non migliora niente, nemmeno fra quelli avanti', inutili, 0)

  /* ogni linguetta che veste ha una decina di pezzi, tutti migliori; il banco ha un tetto di rarità: magico sempre, al
     più un raro per linguetta, mai un leggendario (docs/sotterraneo/bottega.md, «Il tetto di rarità») */
  {
    // null: il livello atteso della storia; `rara`: l'eroe ha addosso roba rara di quel livello
    const prove = [{ lv: null, rara: false }, { lv: null, rara: true }, { lv: 15, rara: false }, { lv: 40, rara: true }, { lv: 90, rara: false }]
    const raro = (b, L, ...ab) => chiaveDelPezzo(b, L, 'raro', ab)
    const addossoRaro = (eroe, L) => {
      const porta = (dove, ...basi) => basi.find(x => COSE[x].dove === dove && portaLa(eroeDi(eroe), COSE[x]))
      const mano = porta('mano', 'scettro', 'balestra', 'bipenne', 'spadone')
      return { ...ROBA_VUOTA(), mano: raro(mano, L, 'att', 'fuoco'),
               mancina: COSE[mano].mani === 2 ? null : raro('scudo-teschio', L, 'dif', 'vita'),
               corpo: raro(porta('corpo', 'manto', 'corazza'), L, 'dif', 'vita'), dito: raro('amuleto-osso', L, 'dif', 'vita') }
    }
    let giri = 0, pochi = 0, nonMigliora = 0, nonPortabile = 0, rialzi = 0, storti = 0, meritare = 0, meritareStorti = 0
    let dieci = 0, troppiRari = 0, leggendari = 0, magici = 0, scaffali = 0
    const esempi = []
    for (const eroe of EROI.map(e => e.chiave))
      for (const { lv, rara } of prove)
          for (let finite = 0; finite <= CAMPAGNA.length; finite++) {
            const crescita = lv == null ? crescitaAttesa(eroe, finite) : crescitaA(eroeDi(eroe), lv)
            const roba = { ...(rara ? addossoRaro(eroe, lv || 6) : robaAttesa(eroe, finite)), gemme: 7 }
            const b = new Bottega({ eroe, finite, roba, crescita, rnd: seminato(9 + finite) })
            for (const m of MERCANTI) {
              const vista = b.mercanziaVista(m.chiave)
              uguale(`${m.chiave}: due volte la stessa vetrina`, b.mercanziaVista(m.chiave).map(r => r.chiave).join(), vista.map(r => r.chiave).join())
              leggendari += vista.filter(r => COSE[r.chiave].rarita === 'leggendario' || COSE[r.chiave].unico).length
              leggendari += b.mercanzia(m.chiave).filter(r => COSE[r.chiave].rarita === 'leggendario').length
              for (const s of m.schede.filter(x => x.dove)) {
                giri++
                const qui = vista.filter(r => COSE[r.chiave].dove && schedaDi(m, r.chiave) === s)
                if (qui.length < 3) { pochi++; esempi.push(`${eroe} lv${lv} f${finite} ${m.chiave}/${s.chiave}: ${qui.length}`) }
                if (qui.length >= PEZZI_PER_LINGUETTA) dieci++
                if (qui.filter(r => COSE[r.chiave].rarita === 'raro').length > RARI_PER_LINGUETTA) troppiRari++
                magici += qui.filter(r => r.rialzo && COSE[r.chiave].rarita === 'magico').length
                for (const r of qui) {
                  if (r.rialzo) scaffali++
                  // i pezzi «da meritare»: la classe li porta ma chiedono più caratteristica, e si comprano lo stesso
                  if (r.meritare) { meritare++; if (b.posso(r.chiave) || !b.porta(r.chiave) || !(b.quantoCosta(r.chiave) > 0)) meritareStorti++; continue }
                  const p = b.seLoMetto(r.chiave)
                  if (!b.posso(r.chiave) || !p) { nonPortabile++; continue }
                  if (p.bloccata || (p.prima && !ABILITA_CONFRONTATE.some(n => p.dopo[n] > p.prima[n]))) nonMigliora++
                  if (r.rialzo) {
                    rialzi++
                    const conf = b.confronto(r.chiave)
                    if (conf.addosso && !(conf.meglio > 0)) storti++
                    if (!(b.quantoCosta(r.chiave) > 0)) storti++
                  }
                }
              }
            }
          }
    controlla(`in ${giri} linguette (4 eroi, vari livelli, roba rara addosso) nessuna ha meno di tre pezzi`, pochi === 0,
              esempi.slice(0, 6).join(' | '))
    controlla('quasi tutte arrivano a dieci', dieci > giri * 0.9, `${dieci}/${giri}`)
    uguale('mai un leggendario sul banco, né fra i pezzi in più', leggendari, 0)
    uguale('al più un raro per linguetta', troppiRari, 0)
    controlla('il magico c\'è sempre: la maggior parte dello scaffale', magici > scaffali / 2, `${magici} magici su ${scaffali} in scaffale`)
    uguale('tutti portabili dall\'eroe (tranne quelli da meritare)', nonPortabile, 0)
    uguale('quelli da meritare la classe li porta ma non li regge ancora, e hanno un prezzo', meritareStorti, 0)
    controlla('e ce n\'è davvero, da guardare', meritare > 0, `${meritare}/${giri}`)
    uguale('e tutti migliorano qualcosa di quello che ha addosso', nonMigliora, 0)
    controlla('i pezzi in più servono davvero', rialzi > giri / 2, `${rialzi}/${giri}`)
    uguale('quelli in più alzano il punteggio e hanno un prezzo vero', storti, 0)
    // il pezzo in più si compra al prezzo che dice, anche se dopo non si ha più niente
    const ricco = new Bottega({ eroe: 'mago', finite: 3, roba: { ...addossoRaro('mago', 20), gemme: 5000 }, crescita: crescitaA(eroeDi('mago'), 20), rnd: seminato(2) })
    const piu = ricco.mercanziaVista('armaiolo').find(r => r.rialzo)
    controlla('con roba rara addosso l\'armaiolo ha pezzi in più', !!piu)
    const costo = ricco.quantoCosta(piu.chiave)
    uguale('un pezzo in più si compra', ricco.compraDa('armaiolo', piu.chiave)?.che, 'comprato')
    uguale('al prezzo che dice', ricco.gemme, 5000 - costo)
    controlla('e se ne va dallo scaffale', !ricco.mercanziaVista('armaiolo').some(r => r.chiave === piu.chiave))
    // senza gemme resta lì, spento, col prezzo vero: non sparisce
    const povero = new Bottega({ eroe: 'mago', finite: 3, roba: { ...addossoRaro('mago', 20), gemme: 1 }, crescita: crescitaA(eroeDi('mago'), 20), rnd: seminato(2) })
    controlla('senza gemme il pezzo in più c\'è lo stesso', povero.mercanziaVista('armaiolo').some(r => r.rialzo))
    uguale('ma non si compra', povero.compraDa('armaiolo', piu.chiave)?.che, 'niente')
    // uno scudo con un'arma a due mani in pugno non migliora niente: non si mostra
    const duemani = new Bottega({ eroe: 'nano', finite: 6, roba: { ...ROBA_VUOTA(), mano: 'bipenne' } })
    controlla('con una bipenne in pugno lo scudo non si mostra', duemani.mercanziaVista('armaiolo').every(r => COSE[r.chiave].dove !== 'mancina'))
  }

  // il caso dell'utente: il bastone magico in mano (⚔️ 3), lo scettro una riga avanti (⚔️ 3 anche lui) non si mostra
  const conBastone = new Bottega({ eroe: 'mago', finite: 3, roba: { ...ROBA_VUOTA(), mano: 'bastone-magico', gemme: 99 },
                                   rnd: seminato(3) })
  const offerti = conBastone.mercanzia('armaiolo').map(r => r.chiave)
  controlla('lo scettro c\'è fra quello che il mago potrebbe avere', offerti.includes('scettro'), offerti.join(', '))
  uguale('ma accanto al bastone magico non si mostra: non alza niente', conBastone.siMostra('scettro'), false)
  const conVerga = new Bottega({ eroe: 'mago', finite: 3, roba: { ...ROBA_VUOTA(), mano: 'verga', gemme: 99 }, rnd: seminato(3) })
  uguale('con la verga in mano invece sì', conVerga.siMostra('scettro'), true)
  /* un banco vecchio, pescato prima che si badasse alla famiglia: gli altrui spariscono, sostituiti dove si può */
  const maga = new Bottega({ eroe: 'mago', finite: 3, roba: ROBA_VUOTA(), banchi: { armaiolo: ['ascia', 'spada-corta', 'scudo-legno', 'corazza'] } })
  const vecchio = maga.banco('armaiolo').roba
  controlla('il mago non ritrova l\'ascia né la corazza nel banco di prima',
            !vecchio.some(k => ['ascia', 'corazza'].includes(k)), vecchio.join())
  controlla('la spada corta sì: è una spada, e il mago le porta', vecchio.includes('spada-corta'), vecchio.join())
  controlla('e lo scudo, che porta chiunque, resta', vecchio.includes('scudo-legno'))
  controlla('ma ogni altra cosa è sua', vecchio.every(k => !COSE[k].dove || maga.posso(k)))
  const leggera = new Bottega({ roba: { ...ROBA_VUOTA(), mano: 'spada' } })
  uguale('una seconda arma leggera, con la mano libera, alza il braccio: si vede', leggera.sottoAddosso('spada-corta'), false)

  /* ogni cosa del banco sta sotto una linguetta, e «Vendi» ce l'ha solo chi compra */
  for (const m of MERCANTI)
    for (const r of new Bottega({ finite: 6, roba: { ...ROBA_VUOTA(), gemme: 99 } }).mercanzia(m.chiave))
      controlla(`${m.chiave}: ${r.chiave} ha la sua linguetta`, !!schedaDi(m, r.chiave))
  uguale('la linguetta «Vendi» è del rigattiere', MERCANTI.filter(m => m.schede.some(s => s.vendi)).map(m => m.chiave).join(), 'rigattiere')
}

/* ══════════ 7b2. il banco cambia poco alla volta ══════════
   A ogni giro (finita una discesa), per ogni linguetta che veste se ne vanno i
   tre pezzi più deboli e ne entrano tre nuovi; gli altri aspettano. Un banco
   riaperto, o rimesso in piedi dal salvataggio, è lo stesso (docs/sotterraneo/
   bottega.md, «Il banco cambia poco alla volta»). */
{
  const dellaScheda = (b, m, s) => b.stockDella(m.chiave, s)
  const grado = (b, k) => [!b.siMostra(k) || b.possiedo(k) ? 0 : 1, b.confronto(k).meglio]
  const piuDebole = (a, c) => a[0] < c[0] || (a[0] === c[0] && a[1] <= c[1])
  let linguette = 0, tolti = 0, entrati = 0, rimasti = 0, piuForti = 0, diversi = 0, riaperti = 0
  for (const eroe of EROI.map(e => e.chiave))
    for (const finite of [1, 3, 5]) {
      const dati = { eroe, finite, roba: { ...robaAttesa(eroe, finite), gemme: 99 }, crescita: crescitaAttesa(eroe, finite) }
      const b = new Bottega({ ...dati, rnd: seminato(5 + finite) })
      for (const m of MERCANTI) b.mercanziaVista(m.chiave)
      // scritto e riletto: lo stesso banco, qualunque sia il caso
      const registro = JSON.parse(JSON.stringify(b.botteghe))
      const rilettura = new Bottega({ ...dati, ...registro, rnd: seminato(999) })
      for (const m of MERCANTI) {
        if (rilettura.mercanziaVista(m.chiave).map(r => r.chiave).join() === b.mercanziaVista(m.chiave).map(r => r.chiave).join()) riaperti++
        else diversi++
      }
      // il giro nuovo
      const dopo = new Bottega({ ...dati, ...alGiroNuovo(registro), rnd: seminato(77 + finite) })
      for (const m of MERCANTI.filter(x => x.passo)) {
        const vistaDopo = dopo.mercanziaVista(m.chiave).map(r => r.chiave).join()
        diversi += dopo.mercanziaVista(m.chiave).map(r => r.chiave).join() === vistaDopo ? 0 : 1
        for (const s of m.schede.filter(x => x.dove)) {
          linguette++
          const prima = dellaScheda(b, m, s), ora = dellaScheda(dopo, m, s)
          const via = prima.filter(k => !ora.includes(k)), restano = prima.filter(k => ora.includes(k))
          const nuovi = ora.filter(k => !prima.includes(k))
          tolti += via.length === 3 ? 1 : 0
          entrati += nuovi.length >= 3 ? 1 : 0
          rimasti += restano.length === prima.length - 3 ? 1 : 0
          // chi se ne va è più debole di chi resta (tranne i pezzi del passo, che non si toccano)
          const passo = delPassoDi(m, dopo, finite, { ammessa: dopo.ammessaDa(m) })
          if (via.every(v => restano.filter(k => !passo.includes(k)).every(k => piuDebole(grado(dopo, v), grado(dopo, k))))) piuForti++
        }
      }
      // l'erborista non veste: si ripesca intero, con le sue righe
      const er = mercanteDi('erborista')
      diversi += dopo.banco('erborista').roba.length === righeDi(er, finite) ? 0 : 1
    }
  nota(`${linguette} linguette al giro nuovo: ${tolti} con tre pezzi andati via, ${entrati} con almeno tre nuovi, ${rimasti} con tutti gli altri rimasti`)
  uguale('un banco riaperto dal salvataggio è lo stesso', diversi, 0)
  controlla('(e lo è davvero, per tutti e tre i mercanti)', riaperti === 12 * 3, `${riaperti}`)
  uguale('al giro nuovo, in ogni linguetta se ne vanno tre pezzi', tolti, linguette)
  uguale('ne entrano almeno tre, nuovi', entrati, linguette)
  uguale('tutti gli altri restano', rimasti, linguette)
  uguale('e quelli che se ne vanno sono i più deboli', piuForti, linguette)

  /* il pezzo comprato non torna, e quello che aspetta resta a un livello in più */
  const base = { eroe: 'cavaliere', finite: 3, crescita: crescitaAttesa('cavaliere', 3), roba: { ...robaAttesa('cavaliere', 3), gemme: 5000 } }
  const a = new Bottega({ ...base, rnd: seminato(21) })
  const vistaA = a.mercanziaVista('armaiolo')
  const scaffale = vistaA.find(r => r.rialzo)
  uguale('un pezzo dello scaffale si compra', a.compraDa('armaiolo', scaffale.chiave)?.che, 'comprato')
  const scritto = JSON.parse(JSON.stringify(a.botteghe))
  controlla('e nel registro non c\'è più', !scritto.scaffali.armaiolo.includes(scaffale.chiave))
  const livelloSu = { ...base, roba: a.roba, crescita: crescitaA(eroeDi('cavaliere'), a.livelloEroe + 1), ...scritto }
  const su = new Bottega({ ...livelloSu, rnd: seminato(22) })
  const vistaSu = su.mercanziaVista('armaiolo').map(r => r.chiave)
  const attesi = su.stockDella('armaiolo', mercanteDi('armaiolo').schede[0]).filter(k => su.siMostra(k) && !su.possiedo(k))
  controlla('passando di livello i pezzi che migliorano ancora sono ancora lì', attesi.length > 0 && attesi.every(k => vistaSu.includes(k)),
            attesi.filter(k => !vistaSu.includes(k)).join())
  controlla('il pezzo comprato non c\'è', !vistaSu.includes(scaffale.chiave))

  /* un salvataggio di prima (solo i banchi pescati, nessuno scaffale) si rilegge e al giro dopo ruota come uno nuovo */
  const vecchio = { banchi: { armaiolo: ['spada-corta', 'scudo-legno', 'panciotto'], rigattiere: ['amuleto-azzurro'] } }
  const v1 = new Bottega({ ...base, ...vecchio, rnd: seminato(31) })
  const vistaV = v1.mercanziaVista('armaiolo')
  controlla('un banco di prima si riempie fino a dieci per linguetta', mercanteDi('armaiolo').schede.filter(x => x.dove).every(sc =>
            vistaV.filter(r => COSE[r.chiave].dove && schedaDi(mercanteDi('armaiolo'), r.chiave) === sc).length >= 3))
  const v2 = new Bottega({ ...base, ...alGiroNuovo({ ...vecchio, ...JSON.parse(JSON.stringify(v1.botteghe)) }), rnd: seminato(32) })
  const conta = (bb, sc) => bb.mercanziaVista('armaiolo').filter(r => COSE[r.chiave].dove && schedaDi(mercanteDi('armaiolo'), r.chiave) === sc).length
  controlla('al giro dopo ruota come uno nuovo', mercanteDi('armaiolo').schede.filter(x => x.dove).every(sc => conta(v2, sc) >= 3))
  uguale('alGiroNuovo senza banchi non chiede niente', alGiroNuovo(null), null)
  uguale('né con un record storto', alGiroNuovo({ banchi: 3 }), null)
}

/* ══════════ 7b3. il rigattiere tiene gli ultimi cinque pezzi venduti ══════════
   Li ricompra allo stesso prezzo a cui li ha pagati (non a quello del banco);
   il sesto fa uscire il più vecchio (docs/sotterraneo/bottega.md, «Riacquista»). */
{
  const tutto = ['spada', 'ascia', 'scudo-legno', 'panciotto', 'amuleto-rosso', 'spadone']
  const r = new Bottega({ roba: { ...ROBA_VUOTA(), zaino: [...tutto] } })
  const pagati = tutto.map(k => r.quantoVale(k))
  for (let i = 0; i < 6; i++) r.vendiA('rigattiere', 0)
  uguale('il rigattiere tiene gli ultimi cinque', r.daRiacquistare('rigattiere').length, ULTIMI_VENDUTI)
  uguale('dal più recente', r.daRiacquistare('rigattiere').map(x => x.k).join(), [...tutto].slice(1).reverse().join())
  uguale('il più vecchio è uscito: la spada non c\'è più', r.daRiacquistare('rigattiere').some(x => x.k === 'spada'), false)
  uguale('il prezzo è quello che ha pagato', r.daRiacquistare('rigattiere')[0].prezzo, pagati[5])
  uguale('l\'armaiolo non tiene niente: non compra', new Bottega({ roba: { ...ROBA_VUOTA(), zaino: ['spada'] } }).vendiA('armaiolo', 0), null)
  uguale('né ha nulla da far riprendere', r.daRiacquistare('armaiolo').length, 0)

  const gemme = r.gemme
  const spadone = r.daRiacquistare('rigattiere').find(x => x.k === 'spadone')
  controlla('al banco costa di più di quanto l\'ha pagato', r.quantoCosta('spadone') > spadone.prezzo, `${r.quantoCosta('spadone')} / ${spadone.prezzo}`)
  uguale('si riprende', r.riacquistaDa('rigattiere', spadone.i)?.che, 'comprato')
  uguale('allo stesso prezzo a cui l\'ha pagato', r.gemme, gemme - spadone.prezzo)
  controlla('e ce l\'hai', r.possiedo('spadone'))
  uguale('l\'elenco scala', r.daRiacquistare('rigattiere').length, ULTIMI_VENDUTI - 1)
  uguale('l\'armaiolo non lo ridà', r.riacquistaDa('armaiolo', 0), null)

  const scarso = new Bottega({ roba: { ...ROBA_VUOTA(), zaino: ['spadone'] } })
  scarso.vendiA('rigattiere', 0)
  scarso.gemme = 0
  uguale('senza gemme non si riprende', scarso.riacquistaDa('rigattiere', 0)?.che, 'niente')
  uguale('e resta da parte', scarso.daRiacquistare('rigattiere').length, 1)
  const strapieno = new Bottega({ roba: { ...ROBA_VUOTA(), zaino: ['saio', 'verga', 'manto', 'amuleto-azzurro', 'chiave', 'ascia'], gemme: 9 } })
  strapieno.venduti.push({ k: 'pozione', prezzo: 3 })
  uguale('a zaino pieno non entra niente', strapieno.riacquistaDa('rigattiere', 0)?.che, 'pieno')
  uguale('e le gemme restano', strapieno.gemme, 9)

  /* nell'avventura: riletti uguali, e i dati storti si buttano */
  const letto = new Bottega({ venduti: JSON.parse(JSON.stringify(r.venduti)) })
  uguale('riletti dal salvataggio', JSON.stringify(letto.venduti), JSON.stringify(r.venduti))
  const storti = new Bottega({ venduti: [{ k: 'inventato', prezzo: 4 }, { k: 'spada', prezzo: -1 }, { k: 'spada', prezzo: 5 }, 'x', null] })
  uguale('i pezzi che non esistono e i prezzi storti si buttano', JSON.stringify(storti.venduti), JSON.stringify([{ k: 'spada', prezzo: 5 }]))
  uguale('un record che non è una lista non fa danni', new Bottega({ venduti: 3 }).venduti.length, 0)
  /* sopravvivono al giro: stanno fuori da `botteghe` */
  uguale('il giro nuovo non li tocca', JSON.stringify(alGiroNuovo({ banchi: { armaiolo: [] } })), JSON.stringify({ banchi: { armaiolo: [] }, ruota: ['armaiolo'] }))
}

/* ══════════ 7c. il confronto affiancato, riga per riga ══════════
   «Addosso» a sinistra, «Questo» a destra, una riga per ogni abilità che
   almeno uno dei due ha (docs/sotterraneo/bottega-finestra.md, «La bottega e lo zaino»):
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
   grande se nessuna basta. L'elisir conta fra le pozioni (è una boccetta
   rossa: non contarlo era il guasto della casella che «non saliva»), e si
   beve quando non c'è una cura da bere; in piena forma con sole cure niente. */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 3, eroe: 'cavaliere',
    roba: { v: 1, gemme: 0, zaino: ['pozione-grande', 'elisir-toro', 'pozione-piccola', 'pozione'], mano: null,
            mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 } })
  uguale('quattro pozioni: anche l\'elisir', c.pozioni, 4)
  uguale('in piena forma, l\'elisir (vale uguale a ogni momento)', c.zaino[c.pozioneGiusta()], 'elisir-toro')
  c.vita = c.vitaMax - 5
  uguale('mancano 5: la boccetta basta', c.zaino[c.pozioneGiusta()], 'pozione-piccola')
  c.vita = c.vitaMax - 8
  uguale('mancano 8: la pozione, non l\'ampolla', c.zaino[c.pozioneGiusta()], 'pozione')
  c.vita = 1
  c.vitaPiu += 30
  uguale('ne mancano più di quante ne curi la più grande: l\'ampolla', c.zaino[c.pozioneGiusta()], 'pozione-grande')
  c.zaino = ['elisir-toro']
  uguale('ferito e senza cure: l\'elisir', c.zaino[c.pozioneGiusta()], 'elisir-toro')
  c.zaino = ['pozione']
  c.vita = c.vitaMax
  uguale('in piena forma con sole cure non si beve', c.pozioneGiusta(), null)
  c.zaino = []
  uguale('senza pozioni niente', c.pozioneGiusta(), null)
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
    // la scalinata (k = 1) a quattro su dieci si vince una volta su due (14/30 prima dei piani nuovi, 16/30 dopo: 12/10/2026): su
    // sei semi due vittorie sono il caso, non un guasto
    if (k) controlla(`${t.chiave}: con la roba attesa, a quattro su dieci quasi mai`, quattro[k] <= (k === 1 ? 2 : 1), `${quattro[k]}/6`)
  }
  nota(`sei semi con la roba attesa: a 8/10 ${Object.values(otto).join(' · ')}, a 4/10 ${Object.values(quattro).join(' · ')}`)
}

riassunto('la roba che resta e i mercanti')
