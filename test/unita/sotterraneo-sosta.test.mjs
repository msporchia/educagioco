/* La discesa lasciata a metà, che è anche il portale lasciato aperto:
   si scrive, si rilegge, e **si finisce**. Qui si prova la cosa che
   conta davvero — non che il salvataggio «esista», ma che una partita
   ripresa sia la stessa partita, nel punto esatto, coi mostri dove
   erano, e arrivi in fondo. E che pesi poco: si salvano il seme e i
   cambiamenti, non il piano (docs/sotterraneo/regole.md, docs/sotterraneo/portale-e-sosta.md); e come si è usciti (`via`: portale o uscita).
   `node test/esegui.mjs sosta --niente-build` */
import { CAMPAGNA, L_ABISSO, INDICE_ABISSO } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { CALMA, TASCHE } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { ROBA_VUOTA } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { gioca, robaPer } from '../../src/giochi/sotterraneo/motore/banco.js'
import { scrivi, leggi, dice, stringaDi, vistoDa, VERSIONE, viaDi, PORTALE, USCITA }
  from '../../src/giochi/sotterraneo/motore/sosta.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

// una cosa del piano com'è adesso, senza quello che un mostro rifà da sé a ogni fotogramma
const firmaDi = r => { const { fx, fy, calmo, sveglio, detto, casa, ...resto } = r; return JSON.stringify(resto) }
const firmeDelPiano = c => c.livello.robe.map(firmaDi)
// si gioca un pezzo di discesa per davvero, cosa per cosa, come farebbe il dito
function rispondiFinche(c, giusto = () => true, giri = 40) {
  for (let i = 0; i < giri && c.foglio && c.chiesta; i++) c.rispondi(giusto(i))
}

/* ══════════ 1. la mappa vista, compressa ══════════
   Duemilaseicento zeri e uno scritti tali e quali sono venti chilobyte
   di JSON per niente: si contano le lunghezze dei tratti. */
{
  const visto = new Uint8Array(50)
  for (let i = 10; i < 22; i++) visto[i] = 1
  visto[40] = 1
  const s = stringaDi(visto)
  uguale('e si rilegge identica', vistoDa(s, 50).join(), visto.join())
  controlla('e sta in poche cifre', s.length < 20, s)

  const tutta = new Uint8Array(2704)
  uguale('una mappa mai vista è un numero solo', stringaDi(tutta), '2704')
}

/* ══════════ 2. si riprende esattamente dove si era ══════════
   Una porta aperta, un mostro ferito che ti insegue a metà stanza, un
   forziere aperto, un altro sbagliato, una cosa buttata per terra, e
   l'eroe fermo a metà di un passo: la ripresa è lo stesso piano, cosa per
   cosa. */
{
  const c = new Corsa(CAMPAGNA[1], { seme: 314, rnd: seminato(314), roba: { ...ROBA_VUOTA(), gemme: 40 } })
  const robe = c.livello.robe
  const porta = robe.find(r => r.che === 'porta')
  controlla('il piano ha una porta da aprire', !!porta)
  c.foglio = { che: 'porta', chi: porta }; c.chiedi('porta', 0)
  rispondiFinche(c)
  controlla('la porta si è aperta', porta.aperta)

  const [f1, f2] = robe.filter(r => r.che === 'forziere')
  c.foglio = { che: 'forziere', chi: f1 }; c.chiedi('forziere', 0); rispondiFinche(c)
  if (f2) { c.foglio = { che: 'forziere', chi: f2 }; c.chiedi('forziere', 0); rispondiFinche(c, () => false) }

  const ferito = robe.find(r => r.che === 'mostro' && !r.chiave && r.ossa > c.colpo(r))
  controlla('c\'è un mostro che non cade al primo colpo', !!ferito)
  c.foglio = { che: 'scontro', chi: ferito }; c.chiedi('scontro', 0)
  c.rispondi(true)
  c.scappa()
  const ossa = ferito.ossa
  controlla('il mostro è ferito', ossa < ferito.ossaMax, `${ossa}/${ferito.ossaMax}`)
  // e ti insegue: lo si sposta di due celle dentro la sua stanza, come farebbe camminando
  for (let i = 0; i < 5; i++) c.passo(1 / 30)
  const st = c.livello.stanzaDi(ferito.x, ferito.y)
  const dove = { x: Math.min(st.x + st.w - 1, ferito.x + 2), y: ferito.y }
  ferito.fx = dove.x + 0.5; ferito.fy = dove.y + 0.5; ferito.x = dove.x; ferito.y = dove.y

  c.zaino.push('ascia')
  c.butta(c.zaino.length - 1)
  c.eroe = { x: 7.37, y: 9.81 }   // a metà di un passo
  c.aggiornaLuce()
  c.visto[5] = 1
  c.vita = 13

  const dato = scrivi(c, 1)
  const b = leggi(dato, CAMPAGNA[1], c.roba)
  controlla('il salvataggio si rilegge', !!b)
  stessaLista('ogni cosa del piano è com\'era (porte, forzieri, mostri, roba per terra)', firmeDelPiano(b), firmeDelPiano(c))
  uguale('il piano è quello di prima, rifatto dal seme', b.livello.celle.join(), c.livello.celle.join())
  uguale('l\'eroe nel punto esatto, anche a metà di un passo', `${b.eroe.x},${b.eroe.y}`, '7.37,9.81')
  uguale('la mappa esplorata è quella', b.visto.join(), c.visto.join())
  const lui = b.livello.robe[robe.indexOf(ferito)]
  uguale('il mostro ferito è dove ti inseguiva, non a casa sua', `${lui.x},${lui.y}`, `${dove.x},${dove.y}`)
  uguale('con le ossa che gli restano', lui.ossa, ossa)
  stessaLista('e sa ancora dov\'è casa sua', lui.casa, c.robeDelSeme[robe.indexOf(ferito)] &&
              { x: c.robeDelSeme[robe.indexOf(ferito)].x, y: c.robeDelSeme[robe.indexOf(ferito)].y })
  uguale('e prima di ripartire si calma: riaprire con un colpo già partito fa pentire', lui.calmo, CALMA)
  controlla('la porta aperta è ancora aperta', b.livello.robe[robe.indexOf(porta)].aperta)
  controlla('il forziere aperto è ancora aperto', b.livello.robe[robe.indexOf(f1)].aperto)
  controlla('l\'ascia lasciata per terra è ancora lì',
            b.livello.robe.some(r => r.che === 'cosa' && r.cosa === 'ascia' && !r.presa))

  const firma = x => [x.piano, x.vita, x.vitaMax, x.gemme, x.chiaveDelPiano, x.domande, x.giuste,
                      x.mostriBattuti, x.tesori, x.stanzeViste, x.contaChieste].join('|')
  uguale('e i conti della discesa sono gli stessi', firma(b), firma(c))

  /* il peso: il seme e i cambiamenti, non il piano disegnato né le cose intere */
  const pesa = JSON.stringify(dato).length
  const intere = JSON.stringify(c.livello.robe.map(firmaDi)).length
  controlla('una sosta a metà piano pesa meno di un chilobyte e mezzo', pesa < 1500, `${pesa} byte`)
  controlla('e meno di un terzo delle cose scritte intere', pesa * 3 < intere, `${pesa} contro ${intere}`)
  nota(`una sosta a metà piano pesa ${pesa} byte (le cose intere ne peserebbero ${intere}): ` +
       `${Object.keys(dato.robe.cambi).length} cose cambiate su ${dato.robe.n}, ${dato.robe.nuove.length} nuove`)

  /* riscritta subito, la ripresa è identica: niente si sposta a ogni giro */
  stessaLista('riscrivere una ripresa dà la stessa sosta', scrivi(b, 1).robe, dato.robe)
}

/* ══════════ 3. il portale: si sale e si torna nello stesso posto ══════════
   La stanza del mercante (salito sopra) ha il portale. Toccarlo non
   chiede niente: apre il foglio per salire, e la sosta scritta allora
   rimette l'eroe accanto a lui. */
{
  const c = new Corsa(CAMPAGNA[2], { seme: 8, rnd: seminato(8) })
  const portale = c.livello.robe.find(r => r.che === 'portale')
  controlla('il piano ha il suo portale', !!portale)
  uguale('nella stanza che era del mercante', c.livello.stanze.find(s => s.ruolo === 'portale')?.cx, portale.x)
  controlla('si tocca quando lo si vede', (c.luce.add(portale.y * c.livello.largo + portale.x), c.toccabile(portale)))
  c.interagisci(portale)
  uguale('toccarlo apre il foglio del portale', c.foglio && c.foglio.che, 'portale')
  uguale('senza nessuna domanda', c.chiesta, null)
  c.chiudi()
  c.eroe = { x: portale.x - 0.5, y: portale.y + 0.5 }
  const b = leggi(scrivi(c, 2), CAMPAGNA[2], c.roba)
  uguale('tornando giù si è accanto al portale', `${b.eroe.x},${b.eroe.y}`, `${portale.x - 0.5},${portale.y + 0.5}`)
  controlla('e il portale c\'è ancora: si può risalire quante volte si vuole',
            b.livello.robe.some(r => r.che === 'portale' && r.x === portale.x && r.y === portale.y))
}

/* ══════════ 4. riprendere non è entrare in una stanza ══════════
   La torcia paga la strada girata al buio: un piano nuovo, il risveglio
   e una discesa ripresa non sono strada. */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 77, rnd: seminato(77) })
  c.accendi('torcia'); c.accendi('torcia')
  c.torciaResta = 3
  const oggi = leggi(scrivi(c, 0), CAMPAGNA[0], c.roba)
  uguale('una torcia a metà resta a metà (sta nella roba)', oggi.torciaResta, 3)
  uguale('e la scorta si riprende', oggi.torceInScorta, 1)

  const altrove = c.livello.stanze[2] || c.livello.stanze[1]
  c.eroe = { x: altrove.cx + 0.5, y: altrove.cy + 0.5 }
  const li = leggi(scrivi(c, 0), CAMPAGNA[0], c.roba)
  uguale('si riprende nella stanza in cui si era', li.stanzaOra, altrove.id)
  const prima = li.torciaResta
  li.bruciaLaTorcia()
  uguale('e il primo passo non costa luce', li.torciaResta, prima)
}

/* ══════════ 5. una discesa ripresa si finisce ══════════
   È la prova vera: non che il dato torni indietro, ma che la partita
   arrivi in fondo dopo essere stata interrotta. Con la roba di chi
   arriva alla grotta: la roba resta, e la grotta conta su di lei. */
{
  const t = CAMPAGNA[2]
  const roba = robaPer(2)
  const c = new Corsa(t, { seme: 101, rnd: seminato(101), roba })
  const mezzo = gioca(t, { seme: 101, bravura: 1, come: 'minimo', da: c })
  controlla('la prova parte da una discesa giocata', mezzo.esito.domande > 0)

  const dopo = new Corsa(t, { seme: 202, rnd: seminato(202), roba })
  const salvato = scrivi(dopo, 2)
  for (let i = 0; i < 60; i++) dopo.passo(1 / 30)
  const ripresa = leggi(salvato, t, roba)
  const finita = gioca(t, { seme: 202, bravura: 1, come: 'minimo', da: ripresa })
  controlla('una discesa ripresa arriva in fondo', finita.esito.vinta,
            finita.guasto || `${finita.esito.piani}/${finita.esito.quantiPiani} piani`)

  /* e una ripresa a metà della discesa vera, al secondo piano, si finisce lo stesso */
  const giu = new Corsa(t, { seme: 303, rnd: seminato(303), roba })
  gioca(t, { seme: 303, bravura: 1, come: 'tutto', da: giu, fino: 1 })
  const daMeta = leggi(scrivi(giu, 2), t, giu.roba)
  controlla('una sosta scritta a metà discesa si rilegge', !!daMeta)
  const fine = daMeta && gioca(t, { seme: 303, bravura: 1, come: 'minimo', da: daMeta })
  controlla('e arriva in fondo', !!fine && fine.esito.vinta, fine && (fine.guasto || `${fine.esito.piani} piani`))
}

/* ══════════ 6. quello che non si sa leggere si butta ══════════
   Una partita persa è un dispiacere; una partita ripresa a metà con dei
   campi che non tornano è un gioco rotto in un modo che nessuno sa
   spiegare. Le soste di prima (versione 3: le cose intere e la roba
   dentro) si buttano con l'azzeramento delle avventure. */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 5, rnd: seminato(5) })
  const dato = scrivi(c, 0)
  uguale('una sosta della 3 non si legge', !!leggi({ ...dato, v: 3 }, CAMPAGNA[0]), false)
  uguale('e nemmeno un dato storto', leggi({ v: VERSIONE, robe: null }, CAMPAGNA[0]), null)
  uguale('niente salvataggio, niente ripresa', leggi(null, CAMPAGNA[0]), null)
  uguale('se il piano non nasce più con le stesse cose, non si indovina',
         leggi({ ...dato, robe: { ...dato.robe, n: dato.robe.n + 1 } }, CAMPAGNA[0]), null)

  c.finita = true
  uguale('una discesa finita non lascia soste', scrivi(c, 0), null)

  const riga = dice(dato, CAMPAGNA)
  uguale('la carta dice da che tappa si riprende', riga.nome, CAMPAGNA[0].nome)
  uguale('con la sua chiave, per l\'icona ritagliata dalla mappa', riga.chiave, CAMPAGNA[0].chiave)
  uguale('e a che piano si era', riga.piano, 1)
}

/* ══════════ 7. chi scendeva è chi risale ══════════ */
{
  for (const chi of ['mago', 'nano', 'elfa', 'cavaliere']) {
    const c = new Corsa(CAMPAGNA[1], { seme: 42, rnd: seminato(42), eroe: chi })
    for (let i = 0; i < 30; i++) c.passo(1 / 30)
    const dato = scrivi(c, 1)
    const b = leggi(dato, CAMPAGNA[1], c.roba)
    uguale(`si riprende da ${chi}`, b.chiEro, chi)
    uguale('con la sua vita', b.vitaMax, c.vitaMax)
    uguale('e dove si era', `${b.eroe.x},${b.eroe.y}`, `${c.eroe.x},${c.eroe.y}`)
    uguale('e la carta lo dice', dice(dato, CAMPAGNA).eroe, chi)
  }
}

/* ── la roba dell'avventura e la classe ──
   La roba passa a `leggi` dall'avventura: quello che la classe non porta
   va in tasca, o per terra se le tasche sono piene — mai nel niente. */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 77, rnd: seminato(77), eroe: 'mago' })
  const dato = scrivi(c, 0)
  const b = leggi(dato, CAMPAGNA[0], { ...ROBA_VUOTA(), mano: 'ascia', corpo: 'corazza' })
  uguale('l\'ascia esce dal pugno del mago', b.mano, null)
  uguale('e la corazza da addosso', b.corpo, null)
  controlla('ma finiscono in tasca, non nel niente',
            b.zaino.includes('ascia') && b.zaino.includes('corazza'), b.zaino.join())
  const d = leggi(dato, CAMPAGNA[0], { ...ROBA_VUOTA(), mano: 'ascia', zaino: new Array(TASCHE).fill('pozione') })
  uguale('con lo zaino pieno il pugno si svuota lo stesso', d.mano, null)
  controlla('e l\'ascia è per terra, non persa',
            d.livello.robe.some(r => r.che === 'cosa' && r.cosa === 'ascia' && !r.presa))
  uguale('e si sa ancora com\'è fatta', COSE.ascia.att, 3)
}

/* ══════════ 8. come si è lasciata: il portale e l'uscita ══════════
   Uscire con la ✕ non è un portale (docs/sotterraneo/portale-e-sosta.md, «Il portale e l'uscita»): la sosta ricorda come si è
   lasciata la discesa, e solo col portale vero sopra c'è il gemello. Una sosta di prima, senza `via`, è un'uscita. */
{
  const c = new Corsa(CAMPAGNA[1], { seme: 21, rnd: seminato(21) })
  for (let i = 0; i < 20; i++) c.passo(1 / 30)
  uguale('di difetto è un\'uscita', scrivi(c, 1).via, USCITA)
  uguale('dal portale vero', scrivi(c, 1, { via: PORTALE }).via, PORTALE)
  uguale('un valore che non si conosce è un\'uscita (nessuna strada regalata)', scrivi(c, 1, { via: 'pippo' }).via, USCITA)
  uguale('la carta lo dice: portale', dice(scrivi(c, 1, { via: PORTALE }), CAMPAGNA).via, PORTALE)
  uguale('la carta lo dice: uscita', dice(scrivi(c, 1), CAMPAGNA).via, USCITA)

  // le soste di prima non hanno `via`: valgono come uscita, e si leggono lo stesso
  const vecchia = scrivi(c, 1)
  delete vecchia.via
  uguale('una sosta di prima vale come uscita', viaDi(vecchia), USCITA)
  uguale('e la carta pure', dice(vecchia, CAMPAGNA).via, USCITA)
  controlla('e si riprende', !!leggi(vecchia, CAMPAGNA[1], c.roba))
  uguale('niente sosta, niente via: uscita', viaDi(null), USCITA)

  // la via non cambia la ripresa: stesso punto, stessi cambiamenti
  const a = leggi(scrivi(c, 1), CAMPAGNA[1], c.roba), b = leggi(scrivi(c, 1, { via: PORTALE }), CAMPAGNA[1], c.roba)
  uguale('il punto è lo stesso', `${a.eroe.x},${a.eroe.y}`, `${b.eroe.x},${b.eroe.y}`)
  uguale('e la via non pesa che qualche byte', JSON.stringify(scrivi(c, 1, { via: PORTALE })).length - JSON.stringify({ ...scrivi(c, 1), via: undefined }).length < 24, true)

  // l'abisso risalito per stasera (Gioco.vue lo scrive col portale): una sosta finita si scrive solo chiedendolo
  const ab = new Corsa(L_ABISSO, { seme: 9, rnd: seminato(9) })
  ab.risali()
  uguale('l\'abisso risalito si scrive col portale', scrivi(ab, INDICE_ABISSO, { anchePerFinite: true, via: PORTALE }).via, PORTALE)
}

riassunto('la discesa lasciata a metà, e il portale')
