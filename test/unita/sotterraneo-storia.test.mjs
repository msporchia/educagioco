/* La grande storia del sotterraneo (docs/sotterraneo/la-grande-storia.md e
   missioni.md): la tabella della roba attesa, chi la dà (il guardiano
   dell'ultimo piano, i forzieri), chi è sotto il livello e lo sa prima di
   scendere, le missioni dei personaggi dal fumetto al premio, e le
   avventure scritte con le sei discese di prima rilette nella fila nuova
   senza toccare medaglie ed esperienza. Le misure della tabella (vinte a
   8, 6, 4 su 10) stanno in `misure/sotterraneo`.
   `node test/esegui.mjs sotterraneo-storia --niente-build` */
import { CAMPAGNA, QUANTE_TAPPE, guastiDellaCampagna } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { PASSI, passoDi, premiDella, numeriDel, guastiDellaStoria } from '../../src/giochi/sotterraneo/dati/storia.js'
import { MISSIONI, PERSONAGGI, missioneDi, guastiDelleMissioni } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { PERSONAGGI as DOVE_PERSONAGGI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Corredo, schedaConLaRoba } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { robaAttesa, premioPer, dettoDelLivello } from '../../src/giochi/sotterraneo/motore/storia.js'
import { cosaDice, segnoDi, chiTiCerca, proposta, prendi, fatte, consegna, presePer, PRESA, FATTA, CONSEGNATA }
  from '../../src/giochi/sotterraneo/motore/missioni.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { azzeraIlVecchio, riordina, MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import manifesto from '../../src/giochi/sotterraneo/gioco.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

// le tappe di un'avventura col cursore a `n` (n discese finite, la n-esima è quella di adesso)
const tappeAl = n => CAMPAGNA.map((t, i) => ({ chiave: t.chiave, aperta: i <= n, fatta: i < n }))
const statoDiFatta = st => (st === PRESA ? FATTA : CONSEGNATA)
const PERSONE = ['eremita', 'ragazza', 'mugnaio', 'guardia', 'pescatore', 'boscaiolo', 'minatore']

/* ══════════ 1. i dati stanno in piedi ══════════ */
{
  const g = [...guastiDellaStoria(), ...guastiDelleMissioni(Object.keys(DOVE_PERSONAGGI)), ...guastiDellaCampagna()]
  controlla('la storia, le missioni e la campagna stanno in piedi', !g.length, g.join(' · '))
  uguale('sette discese', QUANTE_TAPPE, 7)
  for (const e of EROI) uguale(`${e.chiave}: una riga per discesa più l'uscita`, PASSI[e.chiave].length, QUANTE_TAPPE + 1)
  for (const e of EROI)
    nota(`${e.chiave.padEnd(9)} ` + PASSI[e.chiave].map((_, k) => { const n = numeriDel(e.chiave, k); return `⚔️${n.att}🛡️${n.dif}` }).join(' '))
}

/* ══════════ 2. chi dà la riga dopo ══════════
   Con la roba attesa per la discesa k, la discesa dà il primo pezzo della
   riga k+1 (il guardiano dell'ultimo piano e i forzieri); a chi ha già la
   riga dopo non dà niente: una discesa non fa saltare un passo. */
{
  let giusti = 0, oltre = 0, quanti = 0
  for (const e of EROI) {
    for (let k = 0; k < QUANTE_TAPPE; k++) {
      const c = new Corsa(CAMPAGNA[k], { seme: 11 + k, eroe: e.chiave, roba: robaAttesa(e.chiave, k), rnd: seminato(k + 1) })
      quanti++
      if (c.premio() === premiDella(e.chiave, k)[0]) giusti++
      const avanti = new Corsa(CAMPAGNA[k], { seme: 11 + k, eroe: e.chiave, roba: robaAttesa(e.chiave, k + 1), rnd: seminato(k + 1) })
      if (avanti.premio()) oltre++
    }
  }
  uguale('ogni discesa dà il primo pezzo della riga dopo', giusti, quanti)
  uguale('e a chi ce l\'ha già niente di più', oltre, 0)

  // il forziere: il pezzo della riga dopo; il guardiano dell'ultimo piano: il pezzo che resta
  const e = 'cavaliere', k = 4   // la scala sommersa: scudo di ferro e corazza
  let c = null
  for (let seme = 5; seme < 200 && (!c || !c.livello.robe.some(r => r.che === 'forziere')); seme++)
    c = new Corsa(CAMPAGNA[k], { seme, eroe: e, roba: robaAttesa(e, k), rnd: seminato(seme) })
  const forziere = c.livello.robe.find(r => r.che === 'forziere')
  const esito = c.rispostaForziere(forziere, true)
  uguale('il forziere della storia dà il pezzo della riga dopo', esito.cosa, premiDella(e, k)[0])
  c.trovata(c.livello.robe.find(r => r.che === 'cosa' && r.cosa === esito.cosa))
  controlla('e si raccoglie', c.possiedo(esito.cosa))
  c.piano = CAMPAGNA[k].piani - 1
  c.nuovoPiano()
  const capo = c.livello.robe.find(r => r.che === 'mostro' && r.chiave)
  c.cade(capo)
  controlla('il guardiano dell\'ultimo piano lascia l\'altro pezzo',
            c.livello.robe.some(r => r.che === 'cosa' && r.cosa === premiDella(e, k)[1]), premiDella(e, k)[1])
  // gli altri mostri lasciano solo da bere o da accendere
  const t = CAMPAGNA[2]
  let roba = 0
  for (let s = 0; s < 30; s++) {
    const d = new Corsa(t, { seme: 100 + s, eroe: e, roba: robaAttesa(e, 2), rnd: seminato(s + 3) })
    for (const m of d.livello.robe.filter(r => r.che === 'mostro' && !r.chiave)) d.cade(m)
    roba += d.livello.robe.filter(r => r.che === 'cosa' && COSE[r.cosa].dove).length
  }
  uguale('nella storia i mostri di tutti i giorni non lasciano roba da mettersi addosso', roba, 0)
}

/* ══════════ 3. chi è sotto il livello lo sa prima di scendere ══════════ */
{
  let tutti = 0
  for (const e of EROI) for (let k = 0; k < QUANTE_TAPPE; k++)
    if (dettoDelLivello(e.chiave, schedaConLaRoba(e.chiave, robaAttesa(e.chiave, k)), CAMPAGNA[k], k)) tutti++
  uguale('con la roba attesa il minatore non dice niente', tutti, 0)
  const nudo = dettoDelLivello('cavaliere', schedaConLaRoba('cavaliere', null), CAMPAGNA[1], 1)
  uguale('a mani nude giù per la scalinata, manca l\'arma', nudo && nudo.manca, 'arma')
  controlla('e lo dice con le cose vere, e da chi andare', /mani nude/.test(nudo.detto) && /armaiolo/.test(nudo.detto), nudo.detto)
  const corta = dettoDelLivello('cavaliere', schedaConLaRoba('cavaliere', robaAttesa('cavaliere', 2)), CAMPAGNA[3], 3)
  controlla('con la spada corta nella grotta: «con quella spada corta»', corta && corta.detto.startsWith('Con quella spada corta'),
            corta && corta.detto)
  const senza = dettoDelLivello('cavaliere', schedaConLaRoba('cavaliere', { ...robaAttesa('cavaliere', 2), mancina: null }),
                                CAMPAGNA[2], 2)
  controlla('senza lo scudo, sotto la torre: la difesa', senza && senza.manca === 'difesa' && /senza scudo/.test(senza.detto),
            senza && senza.detto)
}

/* ══════════ 4. le missioni: dal fumetto al premio ══════════ */
{
  // la scalinata è la discesa di adesso (la cripta è fatta): la sola missione proposta è quella della scalinata
  const aperta = tappeAl(1)
  uguale('la ragazza ha qualcosa da chiedere: è la missione della scalinata', segnoDi('ragazza', {}, aperta), '!')
  uguale('l\'eremita no: la sua cripta è già fatta, e di più adatte ce n\'è', segnoDi('eremita', {}, aperta), null)
  uguale('né la guardia: la torre è ancora chiusa', segnoDi('guardia', {}, aperta), null)
  uguale('chi non ha il segno saluta e basta', cosaDice('guardia', {}, aperta).fase, 'saluto')
  let stati = prendi({}, 'collana')
  uguale('presa', stati.collana, PRESA)
  uguale('prenderla due volte non fa niente', prendi(stati, 'collana'), null)
  uguale('la ragazza ha il punto di domanda già da presa', segnoDi('ragazza', stati, aperta), '?')
  uguale('il fumetto la ricorda', cosaDice('ragazza', stati, aperta).fase, 'aspetta')
  stessaLista('la scalinata sa che c\'è da cercare la collana', presePer(stati, 'cantine').map(m => m.id), ['collana'])

  // giù: il forziere della collana sta al suo piano, e si riconosce
  const m = missioneDi('collana')
  const c = new Corsa(CAMPAGNA[1], { seme: 21, eroe: 'cavaliere', roba: robaAttesa('cavaliere', 1),
                                    rnd: seminato(21), missioni: presePer(stati, 'cantine') })
  const f = c.livello.robe.find(r => r.missione === 'collana')
  controlla('al primo piano della scalinata c\'è il forziere della collana', !!f && c.piano === m.piano)
  controlla('d\'oro, col nome e la faccia della collana', f && f.pelle === 'forziere-oro-chiuso' && f.nome === m.cosa.nome && f.em === m.cosa.em)
  controlla('in una stanza dove si cammina, non nell\'ingresso', f && c.livello.calpestabile(f.x, f.y) &&
            c.livello.stanzaDi(f.x, f.y)?.ruolo !== 'ingresso')
  // sbagliando non si perde: si riprova
  c.interagisci(f)
  uguale('toccandolo chiede una domanda', c.foglio && c.foglio.che, 'forziere')
  c.rispondi(false)
  controlla('sbagliando resta chiuso, e si riprova', !f.aperto && !c.missioniFatte.has('collana'))
  c.interagisci(f)
  uguale('rispondendo giusto la collana è trovata', c.rispondi(true).che, 'missione')
  controlla('e la discesa lo sa', c.missioniFatte.has('collana'))

  // la sosta tiene la collana trovata, e la cosa resta trovata anche ripresa
  const dato = scrivi(c, 1)
  const ripresa = leggi(dato, CAMPAGNA[1], c.roba, presePer(stati, 'cantine'))
  controlla('ripresa, la collana è ancora trovata', !!ripresa && ripresa.missioniFatte.has('collana'))
  uguale('e il forziere non è rinato', ripresa.livello.robe.filter(r => r.missione === 'collana' && !r.aperto).length, 0)
  stati = fatte(stati, [...c.missioniFatte])
  uguale('sopra è fatta', stati.collana, FATTA)
  uguale('e la ragazza ha il punto di domanda, adesso a consegnare', cosaDice('ragazza', stati, aperta).fase, 'consegna')

  // la consegna: le gemme sulla roba, mai monete
  const b = new Corredo({ eroe: 'cavaliere', roba: robaAttesa('cavaliere', 1, { gemme: 3 }) })
  const r = consegna(stati, 'collana', b)
  uguale('consegnata', r.stati.collana, CONSEGNATA)
  uguale('il premio sono gemme, sulla roba', b.gemme, 3 + m.premio.gemme)
  uguale('consegnarla di nuovo non dà niente', consegna(r.stati, 'collana', b), null)
  controlla('nessuna missione paga in monete', MISSIONI.every(x => !x.premio.monete))

  // un premio in roba: va addosso o in tasca; a tasche piene la consegna aspetta
  const pieno = new Corredo({ eroe: 'mago', roba: { ...robaAttesa('mago', 4), dito: 'amuleto-rosso', zaino: new Array(6).fill('pozione') } })
  const s2 = { rosicchione: FATTA }
  uguale('a tasche piene il gioiello non entra', consegna(s2, 'rosicchione', pieno).esito, 'pieno')
  const vuoto = new Corredo({ eroe: 'mago', roba: robaAttesa('mago', 2, { pozioni: false }) })
  consegna(s2, 'rosicchione', vuoto)
  controlla('a dito libero l\'amuleto va addosso', vuoto.dito === 'amuleto-azzurro', vuoto.dito)
}
{
  // il mostro col nome: più duro di quelli del suo piano, e battuto fa la missione
  const stati = { rosicchione: PRESA }
  const m = missioneDi('rosicchione')
  const c = new Corsa(CAMPAGNA[2], { seme: 9, eroe: 'cavaliere', roba: robaAttesa('cavaliere', 2), rnd: seminato(9),
                                    missioni: presePer(stati, 'torre') })
  uguale('al primo piano della torre Rosicchione non c\'è', c.livello.robe.filter(r => r.missione).length, 0)
  c.allaScala(); c.chiaveDelPiano = true; c.foglio = { che: 'scala' }; c.scendi()
  const r = c.livello.robe.find(x => x.missione === 'rosicchione')
  controlla('al secondo sì', !!r && c.piano === m.piano)
  const ratto = c.livello.mostro('ratto', 0, 0)
  controlla('è un ratto col nome, più duro di un ratto', r.tipo === 'ratto' && r.nome === 'Rosicchione' && r.ossa > ratto.ossa && r.att > ratto.att,
            `${r.ossa}/${r.att} contro ${ratto.ossa}/${ratto.att}`)
  c.cade(r)
  controlla('battuto, la missione è fatta', c.missioniFatte.has('rosicchione'))
  // presa sopra mentre la discesa è a metà (dal portale): ripresa, compare nel suo piano
  const dato = scrivi(new Corsa(CAMPAGNA[2], { seme: 9, eroe: 'cavaliere', rnd: seminato(9) }), 2)
  const dopo = leggi(dato, CAMPAGNA[2], null, presePer({ chiavi: PRESA }, 'torre'))
  controlla('una missione presa dopo compare riprendendo, nel piano giusto', !!dopo &&
            dopo.livello.robe.filter(x => x.missione === 'chiavi').length === (dopo.piano === missioneDi('chiavi').piano ? 1 : 0))
}
{
  // ogni personaggio sta sulla mappa e chiede qualcosa; ogni discesa ha almeno una missione
  for (const k of Object.keys(PERSONAGGI)) controlla(`${k}: ha un posto sulla mappa`, !!DOVE_PERSONAGGI[k])
  nota('missioni: ' + MISSIONI.map(m => `${m.id} (${m.da}, ${m.discesa} ${m.piano + 1})`).join(' · '))
}

/* ══════════ 4b. le missioni, una per volta ══════════
   Per ogni avventura una sola missione è proposta, quella adatta a dove è arrivato l'eroe (docs/sotterraneo/missioni.md) */
{
  const segniIn = (stati, tappe) => PERSONE.map(c => [c, segnoDi(c, stati, tappe)]).filter(([, s]) => s)
  // a ogni punto della storia, a stati vuoti: un solo segno, ed è la prima missione della discesa di adesso
  const giuste = ['badessa', 'collana', 'rosicchione', 'ascia', 'chela', 'zannagrigia', 'lanterna', 'lanterna']
  for (let n = 0; n <= QUANTE_TAPPE; n++) {
    const segni = segniIn({}, tappeAl(n))
    uguale(`al punto ${n} c'è un solo segno`, segni.length, 1)
    uguale(`al punto ${n} è «!»`, segni[0][1], '!')
    uguale(`al punto ${n} la missione proposta è la più adatta`, proposta({}, tappeAl(n)).id, giuste[n])
  }
  uguale('sull\'avventura nuova nessuna missione di una discesa lontana', proposta({}, tappeAl(0)).discesa, 'altare')

  // chi le fa tutte, in fila: una per volta, nell'ordine della storia
  const seguite = []
  let stati = {}
  for (let n = 0; n <= QUANTE_TAPPE - 1; n++) {
    for (let g = 0; g < 5; g++) {
      const p = proposta(stati, tappeAl(n))
      if (!p) break
      if (p.discesa !== CAMPAGNA[n].chiave) break   // quelle indietro: solo se chi le ha saltate le vuole
      seguite.push(p.id)
      stati = prendi(stati, p.id, tappeAl(n))
      uguale(`${p.id}: presa, una sola proposta`, segniIn(stati, tappeAl(n)).length, 1)
      stati = fatte(stati, [p.id])
      uguale(`${p.id}: fatta, una sola proposta, col punto di domanda`, segniIn(stati, tappeAl(n)).map(x => x[1]).join(''), '?')
      stati = consegna(stati, p.id, new Corredo({ eroe: 'mago', roba: robaAttesa('mago', n, { pozioni: false }) })).stati
    }
  }
  stessaLista('chi le fa tutte le trova una per volta, nell\'ordine della storia', seguite,
              ['badessa', 'collana', 'rosicchione', 'chiavi', 'ascia', 'chela', 'canna', 'zannagrigia', 'lanterna'])

  // una presa e non consegnata ferma le altre, anche cambiando discesa; chi ne ha saltata una la ritrova dopo
  stati = prendi({}, 'rosicchione', tappeAl(2))
  controlla('con la discesa di adesso la torre, si può prendere Rosicchione', !!stati)
  uguale('Rosicchione presa: ne resta una sola, e non è un\'altra', proposta(stati, tappeAl(3)).id, 'rosicchione')
  uguale('e non si prende un\'altra missione al volo', prendi(stati, 'ascia', tappeAl(3)), null)
  uguale('chi tocca la ragazza non ha il segno', segnoDi('ragazza', stati, tappeAl(3)), null)
  stati = { ...stati, rosicchione: CONSEGNATA }
  uguale('consegnata Rosicchione, arriva la successiva della discesa di adesso', proposta(stati, tappeAl(3)).id, 'ascia')
  stati = { ...stati, ascia: CONSEGNATA }
  uguale('finite quelle di adesso, la più vicina saltata (le chiavi, sulla torre)', proposta(stati, tappeAl(3)).id, 'chiavi')
  stati = { ...stati, chiavi: CONSEGNATA }
  uguale('poi la collana', proposta(stati, tappeAl(3)).id, 'collana')
  stati = { ...stati, collana: CONSEGNATA }
  uguale('poi la badessa', proposta(stati, tappeAl(3)).id, 'badessa')
  stati = { ...stati, badessa: CONSEGNATA }
  uguale('e poi niente, anche se le discese più avanti hanno le loro', proposta(stati, tappeAl(3)), null)
  uguale('nessun segno: tutti salutano', segniIn(stati, tappeAl(3)).length, 0)

  // uno stato di prima (più missioni prese insieme) non si rompe: una per volta, e le fatte prima
  const vecchio = { badessa: PRESA, collana: PRESA, rosicchione: PRESA, chiavi: FATTA, zannagrigia: PRESA }
  const ordine = []
  let v = vecchio
  for (let giro = 0; giro < 8; giro++) {
    const segni = segniIn(v, tappeAl(2))
    controlla(`vecchio stato, giro ${giro}: al più un segno`, segni.length <= 1, JSON.stringify(segni))
    const p = proposta(v, tappeAl(2))
    if (!p) break
    ordine.push(p.id)
    v = { ...v, [p.id]: statoDiFatta(v[p.id]) }
  }
  stessaLista('una fatta si consegna per prima, poi le prese nell\'ordine della storia', ordine,
              ['chiavi', 'badessa', 'badessa', 'collana', 'collana', 'rosicchione', 'rosicchione', 'zannagrigia'])

  // il minatore, indicando la strada, dice chi ha una missione per te
  uguale('la ragazza ha un favore: il minatore lo dice', chiTiCerca({}, tappeAl(1)), 'La ragazza del pozzo ha un favore da chiederti.')
  controlla('presa: dice cosa aspetta', /aspetta ancora: la collana della nonna\./.test(chiTiCerca({ collana: PRESA }, tappeAl(1))))
  controlla('fatta: dice che ti aspetta', /ti aspetta/.test(chiTiCerca({ collana: FATTA }, tappeAl(1))))
  uguale('se la missione è sua, il minatore non la ripete', chiTiCerca({}, tappeAl(6)), null)
  uguale('e senza missioni non dice niente', chiTiCerca({ badessa: CONSEGNATA }, tappeAl(0)), null)
}

/* ══════════ 5. le avventure di prima, nella fila nuova ══════════
   Un'avventura del mondo 2 (sei discese) si rilegge per chiave: le stelle
   seguono la discesa, il cursore conta quelle di fila già finite nella
   fila nuova, la sosta si butta. Il record di fuori non si tocca:
   medaglie, esperienza e livello lo leggono, e togliere non abbassa. */
{
  const vecchia = { tappa: 3, libera: false, stelle: { 0: 3, 1: 2, 2: 1 }, sosta: { v: 4, tappa: 1 },
                    terra: { nebbia: 'ab', dove: [17, 41], parlato: true, divieti: ['torre'] } }
  const a = riordina(JSON.parse(JSON.stringify(vecchia)))
  uguale('la cripta dell\'altare non l\'ha fatta nessuno: si comincia da lì', a.tappa, 0)
  stessaLista('le stelle seguono la discesa (il pozzo non c\'è più)', a.stelle, { 1: 3, 3: 1 })
  uguale('la sosta si butta', a.sosta, undefined)
  controlla('la nebbia resta, e si riparte dal villaggio', a.terra.nebbia === 'ab' && !a.terra.dove && !a.terra.parlato)

  const fuori = { tappa: 4, libera: false, stelle: { 0: 3, 1: 2, 2: 1, 3: 3 },
                  cfg: { mondo: 2, eroe: 'mago', avventure: { mago: JSON.parse(JSON.stringify(vecchia)) } } }
  const m = { tot: () => 0, best: () => 0, stelleDi: () => Object.values(fuori.stelle).reduce((n, s) => n + s, 0),
              tappeDi: () => fuori.tappa, finita: () => (fuori.libera ? 1 : 0) }
  const xpPrima = manifesto.albo.xp(m)
  const copia = JSON.parse(JSON.stringify({ tappa: fuori.tappa, stelle: fuori.stelle, libera: fuori.libera }))
  controlla('il profilo del mondo 2 si rilegge', azzeraIlVecchio(fuori))
  uguale('una volta sola', azzeraIlVecchio(fuori), false)
  uguale('segnato col mondo nuovo', fuori.cfg.mondo, MONDO)
  stessaLista('il record di fuori resta com\'era', { tappa: fuori.tappa, stelle: fuori.stelle, libera: fuori.libera }, copia)
  uguale('e l\'esperienza non scende', manifesto.albo.xp(m), xpPrima)
  uguale('l\'avventura invece è nella fila nuova', fuori.cfg.avventure.mago.tappa, 0)
  uguale('e l\'eroe scelto resta', fuori.cfg.eroe, 'mago')
}

riassunto('la grande storia del sotterraneo')
