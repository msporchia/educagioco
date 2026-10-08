/* La grande storia del sotterraneo (docs/sotterraneo/la-grande-storia.md e
   missioni.md): la tabella della roba attesa, chi la dà (il guardiano
   dell'ultimo piano, i forzieri), chi è sotto il livello e lo sa prima di
   scendere (anche per il livello), le missioni dei personaggi dal fumetto
   al premio, e le avventure di prima azzerate dal mondo 4 senza toccare
   medaglie, esperienza e il fondo dell'abisso. Le misure della tabella
   (vinte a 8, 6, 4 su 10) stanno in `misure/sotterraneo`.
   `node test/esegui.mjs sotterraneo-storia --niente-build` */
import { CAMPAGNA, QUANTE_TAPPE, guastiDellaCampagna } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { COSE, baseDi, livelloDelPezzo } from '../../src/giochi/sotterraneo/dati/cose.js'
import { PASSI, passoDi, premiDella, guastiDellaStoria, LIVELLI_ATTESI, CASELLE } from '../../src/giochi/sotterraneo/dati/storia.js'
import { MISSIONI, PERSONAGGI, missioneDi, guastiDelleMissioni } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { PERSONAGGI as DOVE_PERSONAGGI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Corredo, schedaConLaRoba } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { robaAttesa, premioPer, dettoDelLivello, crescitaAttesa, numeriAttesi, livelloDeiPezzi }
  from '../../src/giochi/sotterraneo/motore/storia.js'
import { cosaDice, segnoDi, prendi, fatte, consegna, presePer, PRESA, FATTA, CONSEGNATA }
  from '../../src/giochi/sotterraneo/motore/missioni.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { azzeraIlVecchio, ricordaIlFondo, MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import manifesto from '../../src/giochi/sotterraneo/gioco.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

// le tappe di un'avventura col cursore a `n` (n discese finite, la n-esima è quella di adesso)
const tappeAl = n => CAMPAGNA.map((t, i) => ({ chiave: t.chiave, aperta: i <= n, fatta: i < n }))

/* ══════════ 1. i dati stanno in piedi ══════════ */
{
  const g = [...guastiDellaStoria(), ...guastiDelleMissioni(Object.keys(DOVE_PERSONAGGI)), ...guastiDellaCampagna()]
  controlla('la storia, le missioni e la campagna stanno in piedi', !g.length, g.join(' · '))
  uguale('sette discese', QUANTE_TAPPE, 7)
  for (const e of EROI) uguale(`${e.chiave}: una riga per discesa più l'uscita`, PASSI[e.chiave].length, QUANTE_TAPPE + 1)
  for (const e of EROI)
    nota(`${e.chiave.padEnd(9)} ` + PASSI[e.chiave].map((_, k) => { const n = numeriAttesi(e.chiave, k); return `liv${n.livello} ⚔️${n.att}🛡️${n.dif}❤️${n.vita}` }).join(' '))
  // la roba attesa porta il livello: i pezzi comuni della riga sono di un livello sotto quello atteso dell'eroe, e i
  // pezzi col nome dei mostri grossi delle discese finite ci sono quando rendono di più
  for (const e of EROI) {
    const r = robaAttesa(e.chiave, 5)
    const comuni = CASELLE.map(c => r[c]).filter(k => k && !k.includes('.'))
    controlla(`${e.chiave}: i pezzi comuni attesi alla botola sono al più del livello ${livelloDeiPezzi(5)}`,
              comuni.length && comuni.every(k => livelloDelPezzo(k) <= livelloDeiPezzi(5)), JSON.stringify(r))
    controlla(`${e.chiave}: e c'è almeno un pezzo di un mostro grosso`, CASELLE.some(c => r[c] && r[c].includes('.u.')), JSON.stringify(r))
    uguale(`${e.chiave}: e l'eroe è al livello atteso`, numeriAttesi(e.chiave, 5).livello, LIVELLI_ATTESI[5])
  }
}

/* ══════════ 2. chi dà la riga dopo ══════════
   La discesa k dà un pezzo della riga k+1 (il guardiano dell'ultimo piano
   e i forzieri), a tono col posto e con l'eroe; a chi entra con la sola
   riga di prima dà proprio il primo pezzo nuovo; e mai un pezzo che non
   rende più di quello che si ha (chi è avanti non riceve una spada peggiore). */
{
  let giusti = 0, quanti = 0, peggiori = 0, dati = 0
  for (const e of EROI) {
    for (let k = 0; k < QUANTE_TAPPE; k++) {
      const solo = { ...passoDi(e.chiave, k), v: 1, gemme: 0, zaino: [], torcia: 0, torce: 0 }
      const c = new Corsa(CAMPAGNA[k], { seme: 11 + k, eroe: e.chiave, roba: solo, crescita: crescitaAttesa(e.chiave, k), rnd: seminato(k + 1) })
      quanti++
      if (baseDi(c.premio()) === premiDella(e.chiave, k)[0] && livelloDelPezzo(c.premio()) === c.livelloDelBottino) giusti++
      const atteso = new Corsa(CAMPAGNA[k], { seme: 11 + k, eroe: e.chiave, roba: robaAttesa(e.chiave, k),
                                             crescita: crescitaAttesa(e.chiave, k), rnd: seminato(k + 1) })
      const p = atteso.premio()
      if (p) { dati++; if (!(atteso.confronto(p).meglio > 0 || !atteso.casella(COSE[p].dove))) peggiori++ }
    }
  }
  uguale('ogni discesa dà il primo pezzo nuovo della riga dopo, a tono col posto e con l\'eroe', giusti, quanti)
  uguale('e mai un pezzo che non rende più di quello che si ha', peggiori, 0)
  nota(`con la roba attesa (pezzi dei grossi compresi) la riga dopo dà ancora qualcosa ${dati} volte su ${quanti}`)

  // il forziere: il pezzo della riga dopo; il guardiano dell'ultimo piano: il pezzo che resta
  const e = 'cavaliere', k = 4   // la scala sommersa: scudo di ferro e corazza
  let c = null
  for (let seme = 5; seme < 200 && (!c || !c.livello.robe.some(r => r.che === 'forziere')); seme++)
    c = new Corsa(CAMPAGNA[k], { seme, eroe: e, roba: { ...passoDi(e, k), v: 1, gemme: 0, zaino: [], torcia: 0, torce: 0 },
                                crescita: crescitaAttesa(e, k), rnd: seminato(seme) })
  const forziere = c.livello.robe.find(r => r.che === 'forziere')
  const esito = c.rispostaForziere(forziere, true)
  uguale('il forziere della storia dà il pezzo della riga dopo', baseDi(esito.cosa), premiDella(e, k)[0])
  c.trovata(c.livello.robe.find(r => r.che === 'cosa' && r.cosa === esito.cosa))
  controlla('e si raccoglie', c.possiedo(esito.cosa))
  c.piano = CAMPAGNA[k].piani - 1
  c.nuovoPiano()
  const capo = c.livello.robe.find(r => r.che === 'mostro' && r.chiave)
  controlla('in fondo alla discesa la chiave ce l\'ha il mostro grosso', !!capo.grosso, capo.nome)
  c.cade(capo)
  controlla('e lascia l\'altro pezzo della riga',
            c.livello.robe.some(r => r.che === 'cosa' && baseDi(r.cosa) === premiDella(e, k)[1]), premiDella(e, k)[1])
  // gli altri mostri lasciano da bere, e a volte un pezzo: a tono col posto e con l'eroe, mai a caso nel livello
  const t = CAMPAGNA[2]
  let pezzi = 0, mostri = 0
  const livelli = new Set()
  for (let s = 0; s < 40; s++) {
    const d = new Corsa(t, { seme: 100 + s, eroe: e, roba: robaAttesa(e, 2), crescita: crescitaAttesa(e, 2), rnd: seminato(s + 3) })
    for (const m of d.livello.robe.filter(r => r.che === 'mostro' && !r.chiave)) { d.cade(m); mostri++ }
    for (const r of d.livello.robe.filter(r => r.che === 'cosa' && COSE[r.cosa].dove)) { pezzi++; livelli.add(COSE[r.cosa].liv) }
  }
  nota(`mostri qualunque della torre: ${pezzi} pezzi da ${mostri} mostri, ai livelli ${[...livelli].join(', ')}`)
  controlla('a volte un mostro qualunque lascia un pezzo (poco: la tabella dice ancora con che roba si arriva)',
            pezzi > 0 && pezzi < mostri * 0.15, `${pezzi}/${mostri}`)
  stessaLista('e il pezzo è a tono: il livello dell\'eroe, più alto di quello del posto', [...livelli], [LIVELLI_ATTESI[2]])
}

/* ══════════ 3. chi è sotto il livello lo sa prima di scendere ══════════ */
{
  const scheda = (e, roba, k) => schedaConLaRoba(e, roba, crescitaAttesa(e, k))
  let tutti = 0
  for (const e of EROI) for (let k = 0; k < QUANTE_TAPPE; k++)
    if (dettoDelLivello(e.chiave, scheda(e.chiave, robaAttesa(e.chiave, k), k), CAMPAGNA[k], k)) tutti++
  uguale('con la roba e il livello attesi il minatore non dice niente', tutti, 0)
  const nudo = dettoDelLivello('cavaliere', scheda('cavaliere', null, 1), CAMPAGNA[1], 1)
  uguale('a mani nude giù per la scalinata, manca l\'arma', nudo && nudo.manca, 'arma')
  controlla('e lo dice con le cose vere, e da chi andare', /mani nude/.test(nudo.detto) && /fabbro/.test(nudo.detto), nudo.detto)
  const corta = dettoDelLivello('cavaliere', scheda('cavaliere', { ...robaAttesa('cavaliere', 4), mano: 'spada-corta' }, 4), CAMPAGNA[4], 4)
  controlla('con la spada corta nella scala sommersa: «con quella spada corta»', corta && corta.detto.startsWith('Con quella spada corta'),
            corta && corta.detto)
  const senza = dettoDelLivello('cavaliere', scheda('cavaliere', { ...robaAttesa('cavaliere', 2), mancina: null }, 2),
                                CAMPAGNA[2], 2)
  controlla('senza lo scudo, sotto la torre: la difesa', senza && senza.manca === 'difesa' && /senza scudo/.test(senza.detto),
            senza && senza.detto)
  // con la roba giusta ma due livelli sotto: i mostri sono più forti di te, fatti le ossa prima
  const piccolo = dettoDelLivello('cavaliere', schedaConLaRoba('cavaliere', robaAttesa('cavaliere', 5), crescitaAttesa('cavaliere', 3)),
                                  CAMPAGNA[5], 5)
  controlla('due livelli sotto: lo dice il livello, non la roba', piccolo && piccolo.manca === 'livello' &&
            /più forti di te/.test(piccolo.detto), piccolo && piccolo.detto)
}

/* ══════════ 4. le missioni: dal fumetto al premio ══════════ */
{
  // la scalinata è la discesa di adesso (la cripta è fatta): la ragazza ha la collana da chiedere, e l'eremita
  // la sua Dama Grigia (non l'ha ancora presa); la guardia no, la torre è ancora chiusa. L'albero sta in sotterraneo-missioni
  const aperta = tappeAl(1)
  uguale('la ragazza ha qualcosa da chiedere: è la missione della scalinata', segnoDi('ragazza', {}, aperta), 'nuova')
  uguale('anche l\'eremita, se non ha preso la Dama Grigia', segnoDi('eremita', {}, aperta), 'nuova')
  uguale('la guardia no: la torre è ancora chiusa', segnoDi('guardia', {}, aperta), null)
  uguale('chi non ha il segno saluta e basta', cosaDice('guardia', {}, aperta).fase, 'saluto')
  let stati = prendi({}, 'collana', aperta)
  uguale('presa', stati.collana, PRESA)
  uguale('prenderla due volte non fa niente', prendi(stati, 'collana', aperta), null)
  uguale('la ragazza ha il punto di domanda già da presa', segnoDi('ragazza', stati, aperta), 'attesa')
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

  // un premio in roba: va addosso o in tasca; a tasche piene la consegna aspetta
  const pieno = new Corredo({ eroe: 'mago', roba: { ...robaAttesa('mago', 4), dito: 'amuleto-rosso', zaino: new Array(6).fill('pozione') } })
  const s2 = { rosicchione: FATTA }
  uguale('a tasche piene il gioiello non entra', consegna(s2, 'rosicchione', pieno).esito, 'pieno')
  const vuoto = new Corredo({ eroe: 'mago', roba: { ...robaAttesa('mago', 2, { pozioni: false }), dito: null } })
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

/* ══════════ 5. le avventure di prima si azzerano (il mondo 4) ══════════
   Da quando l'eroe ha i livelli e la roba ha livello e rarità, le
   avventure di prima (mondo 2 e 3) si azzerano: un eroe al livello 1 con
   le discese di prima finite troverebbe un muro. Il record di fuori non si
   tocca (medaglie, esperienza e livello lo leggono), il fondo dell'abisso
   di ogni avventura resta per la riga della home. */
{
  for (const mondo of [2, 3]) {
    const vecchia = { tappa: 3, libera: true, stelle: { 0: 3, 1: 2, 2: 1 }, sosta: { v: 5, tappa: 1 }, abisso: { fondo: 14 },
                      roba: { v: 1, gemme: 40, zaino: [], mano: 'spada' }, terra: { nebbia: 'ab', dove: [17, 41], parlato: true } }
    const fuori = { tappa: 4, libera: true, stelle: { 0: 3, 1: 2, 2: 1, 3: 3 },
                    cfg: { mondo, eroe: 'mago', avventure: { mago: JSON.parse(JSON.stringify(vecchia)) } } }
    const m = { tot: () => 0, best: () => 0, stelleDi: () => Object.values(fuori.stelle).reduce((n, s) => n + s, 0),
                tappeDi: () => fuori.tappa, finita: () => (fuori.libera ? 1 : 0) }
    const xpPrima = manifesto.albo.xp(m)
    const copia = JSON.parse(JSON.stringify({ tappa: fuori.tappa, stelle: fuori.stelle, libera: fuori.libera }))
    controlla(`mondo ${mondo}: il fondo dell'abisso di un'avventura si ricorda prima di azzerare`,
              ricordaIlFondo(fuori, 0) && fuori.cfg.fondoDiPrima === 14, fuori.cfg.fondoDiPrima)
    controlla(`mondo ${mondo}: le avventure di prima si azzerano`, azzeraIlVecchio(fuori) && !fuori.cfg.avventure)
    uguale(`mondo ${mondo}: una volta sola`, azzeraIlVecchio(fuori), false)
    uguale(`mondo ${mondo}: segnato col mondo nuovo`, fuori.cfg.mondo, MONDO)
    stessaLista(`mondo ${mondo}: il record di fuori resta com'era`, { tappa: fuori.tappa, stelle: fuori.stelle, libera: fuori.libera }, copia)
    uguale(`mondo ${mondo}: e l'esperienza non scende`, manifesto.albo.xp(m), xpPrima)
    uguale(`mondo ${mondo}: l'eroe scelto resta`, fuori.cfg.eroe, 'mago')
    controlla(`mondo ${mondo}: la riga della home dice ancora il fondo`, /piano più profondo 14/.test(manifesto.riassunto(fuori)),
              manifesto.riassunto(fuori))
  }
}

riassunto('la grande storia del sotterraneo')
