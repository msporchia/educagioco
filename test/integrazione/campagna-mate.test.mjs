/* ═══════════════════════════════════════════════════════════════════
   LA SCALETTA DEGLI ASTEROIDI, NEL BROWSER: PIANETI, STAZIONI, REGALI
     node test/esegui.mjs integrazione/campagna-mate --niente-build
   perché: la rotta degli asteroidi giocata a codice: la mappa da zero, il primo pianeta e la prima stazione che si chiudono, pagano e restano dopo una ricarica, il trucco del calcolo, «Cosa so», la nave madre coi suoi pacchi e l'hangar, il volo infinito col record sul tasto
   a parte perché: `asteroidi-3d` guarda il tocco sul cielo, `rotta-asteroidi` la rotta disegnata e `asteroidi-sosta` l'uscita a metà; qui si gioca col gancio `__mate`, e le regole dei pacchi e della paga stanno in `unita/asteroidi-hangar` e `unita/portata`

   La stessa mappa e la stessa tappa vinta, un blocco per prova:
     · la mappa a profilo nuovo: una fila sola, che comincia a mente;
     · il primo pianeta: la tabellina nuova, la nave madre in fondo, i
       gettoni, una risposta per colpo in archivio, il progresso che resta;
     · la prima stazione: i concetti del calcolo, un giusto per ondata, il
       trucco alla seconda volta storta, «Cosa so» coi trucchi;
     · a fila finita: i pacchi della nave madre, l'hangar, il volo infinito
       col pacco al livello 3 e il record di ieri battuto.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, leggiProfilo, attendi, TELEFONO, scegli, parti, SCATTI_ACCESI }
  from '../aiuto/browser.mjs'
import { chiudiTraguardi, GIA_FESTEGGIATI } from '../aiuto/traguardi.mjs'
import { CAMPAGNA as PIANETI } from '../../src/data/tabelline.js'
import { CONCETTI, STAZIONI } from '../../src/data/calcolo.js'
import { statoDellaTappa, PASSATA } from '../../src/data/portata.js'
import { ETA_DIFETTO } from '../../src/store/profile.js'
import { SCALETTA } from '../../src/data/asteroidi.js'
import { regaliDellaTappa, REGALI_VOLO, tipoDi, idDi } from '../../src/data/hangar.js'
import { controlla, uguale, dentro, nota, riassunto, blocco } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

const allaRotta = async () => {
  await chiudiTraguardi(page)
  await scegli(page, 'mate')
  await page.waitForSelector('[data-rotta]', { timeout: 5000 })
}
const inGioco = () => page.waitForFunction(() => window.__mate && window.__mate.fase.value === 'gioco', null, { timeout: 5000 })
// le foto vogliono la scena ferma; senza foto non si aspetta niente
const foto = async (nome, ms = 0) => { if (!SCATTI_ACCESI) return; await attendi(page, ms); await scatto(page, nome) }
const passata = t => statoDellaTappa(t, { eta: ETA_DIFETTO }) === PASSATA
const giaSapute = fila => fila.filter(passata).length

/* ═══════════ 1. la mappa a profilo nuovo ═══════════
   Il contatore della fila è uno solo e a profilo azzerato sta a zero:
   la fila apre UNA voce, la prima, che è a mente; le altre aperte le apre
   l'età (`portata`, regola in `unita/portata`), e qui si guarda che la
   rotta disegni quella regola. */
await blocco('la mappa a profilo nuovo', async () => {
  await allaRotta()
  const mappa = await page.evaluate(() => ({
    fila: [...document.querySelectorAll('[data-rotta] [data-tappa]')]
      .map(b => ({ mente: b.dataset.tipo === 'stazione', chiusa: b.dataset.stato === 'chiusa' })),
    stazioni: document.querySelectorAll('[data-rotta] [data-tipo="stazione"]').length,
    schede: !!document.querySelector('.campagna .schede'),
    volo: document.querySelectorAll('[data-volo][data-stato="chiusa"]').length,
    testo: document.body.innerText,
  }))
  controlla('la mappa dei pianeti sostituisce la scelta delle tabelline', !/Quali tabelline vuoi allenare/i.test(mappa.testo))
  controlla('si vede il primo pianeta', /Il pianeta del 2/.test(mappa.testo))
  uguale('dieci pianeti in fila', mappa.fila.filter(v => !v.mente).length, 10)
  uguale('e un bottone per ogni stazione', mappa.stazioni, STAZIONI.length)
  controlla('le due linguette non ci sono più: è una fila sola', !mappa.schede)
  controlla('la scaletta comincia da una tappa a mente', mappa.fila[0].mente)
  controlla('la prima tappa è aperta a chi comincia adesso', !mappa.fila[0].chiusa)
  /* UNA sola tappa aperta dalla fila, non due (una per mestiere, quando i contatori erano due) */
  const aperte = giaSapute(STAZIONI) + giaSapute(PIANETI) + (passata(STAZIONI[0]) ? 0 : 1)
  uguale('la fila apre una tappa sola, più quelle già sapute per età', mappa.fila.filter(v => !v.chiusa).length, aperte)
  uguale('e il volo infinito è ancora chiuso', mappa.volo, 1)
  await foto('campagna-mate-mappa')
})

/* ═══════════ 2. il primo pianeta ═══════════ */
await blocco('il primo pianeta', async () => {
  await parti(page, '[data-rotta] [data-tipo="pianeta"]')
  await inGioco()

  /* Il cannone non insegue mai un asteroide prima che il dito abbia scelto: spazza il cielo con un moto che dipende dal solo
     tempo (±54°, un'andata e ritorno ogni 3,4 s). Si guarda finché ha toccato tutti e due i lati, e intanto che l'angolo verso
     il sasso giusto gli scorre sotto senza agganciarsi. */
  const GRADI = 180 / Math.PI
  const puntamento = await page.evaluate(async () => {
    const m = window.__mate, letture = []
    const scarto = l => (l.mira + Math.PI / 2) * 180 / Math.PI
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 100))
      const giusto = m.asteroidi().find(a => a.ok && !a.morto)
      letture.push({ mira: m.nave.mira, vivi: m.asteroidi().filter(a => !a.morto).length,
                     verso: giusto ? Math.atan2(giusto.y - m.nave.y, giusto.x - m.nave.x) : null })
      const s = letture.map(scarto)
      if (letture.length >= 8 && Math.min(...s) < -30 && Math.max(...s) > 30) break
    }
    return letture
  })
  const scarti = puntamento.map(l => (l.mira + Math.PI / 2) * GRADI)
  controlla('ci sono asteroidi in scena mentre si guarda il cannone', Math.max(...puntamento.map(l => l.vivi)) >= 2)
  controlla('il cannone spazza il cielo da una parte all\'altra', Math.min(...scarti) < -25 && Math.max(...scarti) > 25,
            `è andato da ${Math.round(Math.min(...scarti))}° a ${Math.round(Math.max(...scarti))}°`)
  /* se inseguisse la risposta, questa distanza resterebbe intorno a zero per tutte le letture */
  const addosso = puntamento.filter(l => l.verso !== null).map(l => Math.abs(l.mira - l.verso) * GRADI)
  dentro('e non resta addosso all\'asteroide giusto', Math.round(Math.max(...addosso) - Math.min(...addosso)), 25, 180)

  const partita = await page.evaluate(async () => {
    const m = window.__mate
    const viste = [], ritardi = []
    let gettoni = 0, tolti = 0, primaDelMirino = 0
    const tipi = new Set()
    const salvadanaio = m.salvadanaio()
    for (let i = 0; i < 200 && m.fase.value === 'gioco'; i++) {
      const giusto = m.asteroidi().find(x => x.ok && !x.morto)
      if (!giusto) break
      /* il mirino, una volta, a metà covata: messo in tasca a mano (giocando arriva ai quindici di fila, che questa tappa non
         fa), perché quello da provare è che un sasso sparito così non lasci niente in archivio */
      if (i === 3) {
        m.tasca.mirino = 1
        const prima = m.asteroidi().filter(x => !x.morto).length
        m.usaMirino()
        tolti = prima - m.asteroidi().filter(x => !x.morto).length
        primaDelMirino = prima
      }
      viste.push([m.domanda.a, m.domanda.b, giusto.specie === 'bomba'])
      // fra quanto il sasso giusto sarà in scena: nasce sopra il bordo e ci mette (r + quanto sta sopra) / vy
      ritardi.push((giusto.r - giusto.y) / giusto.vy)
      m.colpisci(giusto)
      gettoni = Math.max(gettoni, m.tasca.gelo + m.tasca.mirino)
      if (m.tasca.gelo) tipi.add('gelo')
      if (m.tasca.mirino) tipi.add('mirino')
      await new Promise(r => setTimeout(r, 15))
    }
    await new Promise(r => requestAnimationFrame(() => r()))
    return { viste, ritardi, fase: m.fase.value, giuste: m.hud.giuste, gettoni, tolti, primaDelMirino,
             tipi: [...tipi], tappa: m.progresso.value.tappa, bersaglio: m.tappa.value.bersaglio,
             prese: m.monete.prese, entrate: m.salvadanaio() - salvadanaio,
             regalo: document.querySelector('[data-regalo]')?.dataset.pezzo || null, presi: m.hangar().presi }
  })

  /* la risposta non si fa aspettare: il sasso giusto non nasce in fondo alla covata */
  dentro('la risposta giusta è in scena entro tre secondi dalla domanda', Math.round(Math.max(...partita.ritardi) * 10) / 10, 0, 3.2)
  uguale('il bersaglio chiude la tappa', partita.fase, 'vinta')
  uguale('e la tappa risulta superata', partita.tappa, 1)
  // le monete arrivano col sasso, una a centro (la paga sta in docs/apprendimento/calibrazione.md)
  uguale('un centro, una moneta', partita.prese, partita.giuste)
  controlla('e sono entrate davvero nel salvadanaio', partita.entrate >= partita.giuste,
            `${partita.entrate} monete per ${partita.giuste} centri`)
  dentro('senza chiedere molto più del bersaglio (i tre della nave madre)', partita.giuste, partita.bersaglio, partita.bersaglio + 4)
  /* la tabellina del pianeta è la maggioranza larga (la quota esatta la misura `misure/asteroidi`) */
  const suoi = partita.viste.filter(([a, b]) => a === 2 || b === 2).length
  dentro('la tabellina nuova è la maggior parte delle domande', Math.round(suoi / partita.viste.length * 100), 65, 100)
  nota(`${suoi} domande su ${partita.viste.length} erano della tabellina del 2`)
  /* la nave madre arriva a bersaglio fatto e tira tre bombe col numero; abbattuta, lascia il primo pacco (docs/asteroidi/boss.md) */
  const bombe = partita.viste.map(([, , b]) => b)
  uguale('la nave madre tira tre bombe', bombe.filter(Boolean).length, 3)
  controlla('e solo in fondo, a bersaglio fatto', bombe.slice(-3).every(Boolean) && !bombe.slice(0, -3).some(Boolean))
  uguale('e non esce niente fuori dalle tabelline aperte',
         partita.viste.filter(([a, b]) => ![1, 2].includes(a) && ![1, 2].includes(b)).length, 0)
  uguale('il pacco della nave madre, sul cartello, è il primo regalo della tappa', partita.regalo,
         regaliDellaTappa(SCALETTA.find(v => v.tipo === 'pianeta' && v.i === 0).pos)[0])
  controlla('ed è nell\'hangar', partita.presi.includes(partita.regalo), partita.presi.join(', '))
  await foto('campagna-mate-vinta')

  /* i gettoni non rispondono al posto del bambino: il mirino porta via un sasso sbagliato, e quell'esplosione non deve finire
     nel motore come una risposta. E in una tappa vera arrivano tutti e due (usciva sempre e solo il gelo) */
  controlla('i gettoni arrivano già durante la tappa, non alla fine', partita.gettoni > 0, `in tasca al massimo ${partita.gettoni}`)
  uguale('e in una tappa si vedono tutti e due i poteri, non sempre lo stesso', partita.tipi.sort().join(' '), 'gelo mirino')
  uguale('e il mirino lascia tre sassi in cielo (con tre, ne toglie uno)', partita.tolti, Math.max(1, partita.primaDelMirino - 3))
  const profilo = await leggiProfilo(page)
  const mat = Object.entries(profilo.items || {}).filter(([k]) => k.startsWith('math:'))
  uguale('e in archivio c\'è una risposta per colpo, non una per esplosione',
         mat.reduce((n, [, it]) => n + (it.ok || 0) + (it.err || 0), 0), partita.viste.length)
  const chiuse = mat.map(([k]) => k).filter(k => k.slice(5).split('x').map(Number).every(n => ![1, 2].includes(n)))
  controlla('e niente in archivio fuori dalle tabelline aperte', chiuse.length === 0, chiuse.join(', '))

  /* il progresso resta dopo aver chiuso: la home conta le voci della fila unica, e il primo pianeta sta dopo due voci a mente */
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
  const home = await page.evaluate(() => document.body.innerText)
  const dovuto = SCALETTA.findIndex(v => v.tipo === 'pianeta' && v.i === 0) + 1
  controlla('la home conta le tappe della fila unica', new RegExp(`${dovuto} tappe su ${SCALETTA.length}`).test(home),
            home.split('\n').find(r => /tapp/i.test(r)) || 'nessuna riga sugli asteroidi')
  await allaRotta()
  const dopo = await page.evaluate(() =>
    [...document.querySelectorAll('[data-rotta] [data-tipo="pianeta"]')].filter(b => b.dataset.stato !== 'chiusa').length)
  uguale('dopo la ricarica sono aperti i pianeti già passati, più il prossimo', dopo,
         PIANETI.filter((p, i) => i <= 1 || passata(p)).length)

  /* «Cosa so» è una schermata come le altre */
  await page.getByRole('button', { name: /Cosa so/ }).click()
  await page.waitForSelector('.cella', { timeout: 5000 })
  const tavola = await page.evaluate(() => ({
    celle: document.querySelectorAll('.cella').length,
    barra: !!document.querySelector('.barra-app button[aria-label="indietro"]'),
    titolo: document.querySelector('.barra-app .dove')?.textContent.trim(),
    velo: !!document.querySelector('.velo'),   // il fondo dello spazio non arriva fin qui
  }))
  uguale('la tavola pitagorica è intera', tavola.celle, 100)
  controlla('si esce dal tasto della barra, come ovunque', tavola.barra)
  uguale('e la barra dice dove si è', tavola.titolo, 'Cosa so')
  controlla('non è un velo sopra la partita', !tavola.velo)
  await foto('campagna-mate-cosa-so')
  await page.locator('.barra-app button[aria-label="indietro"]').click()
  controlla('e il tasto riporta alla mappa', !!(await page.waitForSelector('[data-rotta]', { timeout: 5000 })))
})

/* ═══════════ 3. la prima stazione del calcolo a mente ═══════════ */
await blocco('la prima stazione', async () => {
  await azzera(page)
  await allaRotta()
  // di che calcoli si tratta lo dice il fumetto della tappa (docs/asteroidi/mappa.md)
  await page.locator('[data-rotta] [data-tipo="stazione"]').first().click()
  const fumetto = await page.locator('[data-fumetto]').innerText()
  controlla('il fumetto dice di che calcoli si tratta', /3\+4/.test(fumetto), fumetto)
  await page.click('[data-fumetto] [data-azione="parti"]')
  await inGioco()

  const partita = await page.evaluate(async () => {
    const m = window.__mate
    const viste = [], ondate = []
    for (let i = 0; i < 300 && m.fase.value === 'gioco'; i++) {
      viste.push({ testo: m.domanda.testo, ris: m.domanda.ris, chiave: m.domanda.chiave, madre: m.madre().attiva })
      const vivi = m.asteroidi().filter(x => !x.morto)
      ondate.push({ quanti: vivi.length, giusti: vivi.filter(x => x.ok).length, valori: vivi.map(x => x.v) })
      const giusto = vivi.find(x => x.ok)
      if (!giusto) break
      m.colpisci(giusto)
      await new Promise(r => setTimeout(r, 12))
    }
    return { viste, ondate, fase: m.fase.value, giuste: m.hud.giuste, mirate: m.hud.mirate,
             bersaglio: m.tappa.value.bersaglio, fila: m.contatore.value, mente: m.mente.value }
  })
  /* «a mente» è il tipo della voce su cui si è, un fatto della fila, non un modo scelto lanciando la partita */
  uguale('la tappa su cui si è è una di quelle a mente', partita.mente, true)
  uguale('il bersaglio chiude la stazione', partita.fase, 'vinta')
  uguale('e il contatore della fila avanza di uno', partita.fila, 1)
  dentro('senza chiedere molto più del bersaglio', partita.giuste, partita.bersaglio, partita.bersaglio + 4)
  uguale('ogni ondata ha un asteroide giusto e uno solo', partita.ondate.filter(o => o.giusti !== 1).length, 0)
  uguale('e nessun bersaglio ripetuto', partita.ondate.filter(o => new Set(o.valori).size !== o.valori.length).length, 0)
  uguale('gli asteroidi non scendono mai sotto tre', partita.ondate.filter(o => o.quanti < 3).length, 0)
  uguale('la nave madre arriva a bersaglio fatto, per tre domande', partita.viste.filter(v => v.madre).length, 3)
  const fuori = partita.viste.filter(v => v.ris > 20 || /[×:]/.test(v.testo))
  controlla('non esce niente che la stazione non abbia presentato', !fuori.length, fuori.length ? fuori[0].testo : '')
  uguale('e tutte le domande sono del calcolo a mente', partita.viste.filter(v => v.chiave.startsWith('calc:')).length, partita.viste.length)
  /* varietà: i fatti entrano in ordine di fatica, non in quello in cui sono scritti (se no la serata è «1+2, 1+3, 1+4…»);
     si misura sulla tappa, la nave madre in fondo ripesca dallo stesso gruppetto */
  const dellaTappa = partita.viste.filter(v => !v.madre)
  const distinte = [...new Map(dellaTappa.map(v => [v.chiave, v.testo])).values()]
  const conteggio = {}
  for (const testo of distinte) for (const n of new Set(testo.match(/\d+/g) || [])) conteggio[n] = (conteggio[n] || 0) + 1
  const piuVisto = Object.entries(conteggio).sort((a, b) => b[1] - a[1])[0]
  controlla('nessun numero entra in quasi tutti i calcoli', piuVisto[1] <= distinte.length * 0.65,
            `il ${piuVisto[0]} è in ${piuVisto[1]} calcoli diversi su ${distinte.length}`)
  dentro('e i calcoli diversi sono parecchi', distinte.length, Math.round(dellaTappa.length * 0.5), dellaTappa.length)
  dentro('le risposte mirate contano quasi tutte', partita.mirate, Math.round(partita.giuste * 0.8), partita.giuste)
  await foto('calcolo-vinta')

  /* il trucco arriva alla seconda volta storta: si riapre la prima voce a mente dicendo il suo posto nella fila */
  await page.evaluate(() => { const m = window.__mate; m.inizia(m.fila.find(v => v.tipo === 'mente').pos) })
  await inGioco()
  const trucco = await page.evaluate(async () => {
    const m = window.__mate
    for (let i = 0; i < 30; i++) {
      const falso = m.asteroidi().find(x => !x.ok && !x.morto)
      if (!falso) break
      m.colpisci(falso)
      await new Promise(r => setTimeout(r, 12))
      if (document.querySelector('.trucco')) return { arrivato: true, dopo: i + 1 }
      if (m.hud.vite <= 0) return { arrivato: false, dopo: i + 1 }
    }
    return { arrivato: false, dopo: 30 }
  })
  controlla('dopo due errori sullo stesso trucco, il trucco si dice', trucco.arrivato, `nessun cartello dopo ${trucco.dopo} errori`)

  /* il progresso resta dopo aver chiuso */
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
  const home = await page.evaluate(() => document.body.innerText)
  controlla('la home conta la stazione fra le tappe della fila', new RegExp(`1 tappa su ${SCALETTA.length}`).test(home),
            home.split('\n').find(r => /tapp/i.test(r)) || 'nessuna riga sugli asteroidi')
  await allaRotta()
  const dopo = await page.evaluate(() =>
    [...document.querySelectorAll('[data-rotta] [data-tipo="stazione"]')].filter(b => b.dataset.stato !== 'chiusa').length)
  /* la prima è superata, la seconda è quella che la fila tiene aperta, dietro quelle che a quell'età sono già passate */
  uguale('dopo la ricarica sono aperte le stazioni giuste', dopo, 2 + giaSapute(STAZIONI.slice(2)))

  /* «Cosa so» ha la faccia dei trucchi */
  await page.getByRole('button', { name: /Cosa so/ }).click()
  await page.waitForSelector('.schede', { timeout: 5000 })
  await page.getByRole('button', { name: /A mente/ }).click()
  await page.waitForSelector('.voce', { timeout: 5000 })
  const tavola = await page.evaluate(() => {
    const voci = [...document.querySelectorAll('.voce')]
    return { quante: voci.length, chiuse: voci.filter(v => v.classList.contains('chiuso')).length,
             avviati: voci.filter(v => v.classList.contains('lavoro')).length,
             titolo: document.querySelector('.barra-app .dove')?.textContent.trim() }
  })
  uguale('c\'è una riga per ogni trucco', tavola.quante, CONCETTI.length)
  controlla('quelli che non si sono ancora aperti si vedono chiusi', tavola.chiuse > 10, `solo ${tavola.chiuse} chiusi`)
  // dopo una partita sola non c'è niente «in mano»: deve vedersi che il lavoro è cominciato
  controlla('e su quelli della prima stazione il lavoro è cominciato', tavola.avviati >= 1, 'nessuna barra avviata')
  uguale('la barra dice sempre dove si è', tavola.titolo, 'Cosa so')
  await page.locator('.voce').first().click()
  await page.waitForSelector('.spiega', { timeout: 5000 })
  const spiega = await page.evaluate(() => document.querySelector('.spiega').innerText)
  controlla('e toccando un trucco lo si legge', spiega.length > 20, spiega)
  await foto('calcolo-cosa-so')
})

/* ═══════════ 4. a fila finita: la nave madre, l'hangar, il volo ═══════════
   La fila finita col volo aperto e il record di ieri in `best.math`; prima il volo (una tappa vinta alzerebbe il record),
   poi la tappa rigiocata e l'hangar. Che pacco esce a ogni giro lo dice `unita/asteroidi-hangar`; qui si guarda dove arriva:
   il velo del volo, il cartello di fine tappa, la rotta, il tasto dell'hangar, l'hangar. */
await blocco('a fila finita: pacchi, hangar e volo', async () => {
  await azzera(page)
  await semina(page, { mate: { tappa: 10, fila: SCALETTA.length, libera: true }, settings: { eta: 11 },
                       best: { math: 40 }, ...GIA_FESTEGGIATI })
  await allaRotta()
  const hangar = async () => ((await leggiProfilo(page)).campagne?.mate?.hangar) || {}
  // si risponde giusto finché `basta` non dice di fermarsi (o, con `sbaglia`, si sbaglia); si raccolgono magazzini e domande
  const magazzini = new Set(), testi = []
  const gioca = async (basta, sbaglia = false) => {
    const r = await page.evaluate(async ([basta, sbaglia]) => {
      const m = window.__mate, specie = new Set(), mag = [], tst = []
      const stop = new Function('m', 'return ' + basta)
      for (let i = 0; i < 300 && m.fase.value === 'gioco' && !m.regaloVolo.value && !stop(m); i++) {
        const vivi = m.asteroidi().filter(x => !x.morto)
        const scelto = sbaglia ? (vivi.find(x => !x.ok) || vivi.find(x => x.ok)) : vivi.find(x => x.ok)
        if (!scelto) break
        if (m.magazzino) { mag.push(m.magazzino.value); tst.push(m.domanda.testo) }
        specie.add(scelto.specie)
        m.colpisci(scelto)
        await new Promise(r => setTimeout(r, 12))
      }
      await new Promise(r => requestAnimationFrame(() => r()))
      return { fase: m.fase.value, madre: m.madre(), specie: [...specie], livello: m.hud.livello, mag, tst }
    }, [basta, sbaglia])
    r.mag.forEach(x => magazzini.add(x)); testi.push(...r.tst)
    return r
  }

  /* sulla rotta: il tasto dell'hangar, i pacchi e il volo col record */
  controlla('col volo aperto c\'è il tasto dell\'hangar', await page.locator('[data-azione="hangar"]').isVisible())
  const piene = await page.locator('[data-pacchi][data-quanti="2"]').count()
  controlla('le tappe aperte hanno due pacchi', piene >= 15, `${piene} tappe con due pacchi`)
  const tasti = await page.evaluate(() => ({
    voli: document.querySelectorAll('[data-volo]:not([data-stato="chiusa"])').length,
    record: document.querySelector('[data-rotta] [data-record]')?.textContent.trim() || '',
    vecchi: /Volo libero|Volo a mente/.test(document.body.innerText),
  }))
  uguale('a fila finita il tasto del volo è uno solo', tasti.voli, 1)
  controlla('e non ci sono più i due voli di prima', !tasti.vecchi)
  uguale('sul tasto c\'è il record di ieri, letto da best.math', tasti.record, 'record 40 punti')

  /* il volo: un posto per livello, la nave madre al 3 col pacco (il dado lo fissa il test), poi fino alla fine */
  await parti(page, '[data-volo]')
  await inGioco()
  await page.evaluate(() => window.__mate.dado(() => 0))
  const volo = await gioca('false')
  uguale('al livello 3 la nave madre del volo lascia un pacco',
         await page.locator('[data-regalo-volo] [data-regalo]').getAttribute('data-pezzo'), REGALI_VOLO[0])
  controlla('il volo comincia dal primo posto della storia', volo.specie[0] === 'rottami', volo.specie.join(', '))
  await foto('asteroidi-volo-regalo', 900)
  await chiudiTraguardi(page)
  await page.click('[data-regalo-volo] [data-azione="avanti"]')
  uguale('«Avanti» lo chiude', await page.locator('[data-regalo-volo]').count(), 0)
  controlla('e il pacco è nell\'hangar', (await hangar()).presi.includes(REGALI_VOLO[0]))
  const dopo = await gioca('m.hud.livello >= 4 && m.asteroidi().some(a => !a.morto && a.specie === "ghiaccio")')
  controlla('al livello 4 si è al pianeta del 10, fra le comete', dopo.livello >= 4 && dopo.fase === 'gioco')
  await foto('asteroidi-volo-ghiaccio', 1200)

  /* tre sbagli e il volo finisce: la frase coi due numeri, i coriandoli, il record scritto */
  const fine = await gioca('false', true)
  await page.waitForSelector('[data-primato]', { timeout: 5000 })
  const chiusa = await page.evaluate(() => ({ primato: window.__mate.finale.primato, punti: window.__mate.hud.punti,
    frase: document.querySelector('[data-primato]')?.textContent.trim() || '', festa: !!document.querySelector('[data-festa]') }))
  uguale('la partita finisce', fine.fase, 'fine')
  controlla('nel volo escono tutti e due i magazzini', magazzini.size === 2, [...magazzini].join(', '))
  controlla('cioè tabelline E conti a mente', testi.some(t => /×/.test(t)) && testi.some(t => /[+\-−:]/.test(t)), testi.slice(0, 12).join(' | '))
  controlla('il record di ieri è battuto', chiusa.primato && chiusa.primato.record && chiusa.primato.prima === 40, JSON.stringify(chiusa.primato))
  controlla('e la fine dice i due numeri', /Nuovo record! \d+ punti \(\d+ meglio di prima\)/.test(chiusa.frase), chiusa.frase)
  controlla('con i coriandoli', chiusa.festa)
  const salvato = await leggiProfilo(page)
  uguale('il record è scritto accanto alle stelle', salvato.campagne.mate.primato.best, chiusa.punti)
  uguale('e best.math resta, per i traguardi', salvato.best.math, chiusa.punti)
  await foto('campagna-mate-volo')
  await page.click('.velo .bottone.chiaro')            // «Mappa»
  await page.waitForSelector('[data-rotta]')

  /* una tappa vinta tre volte: la nave madre in fondo, un pacco per giro finché ce n'è, poi il cartello che lo dice */
  const POS = 5
  for (let giro = 0; giro < 3; giro++) {
    await parti(page, `[data-tappa="${POS}"]`)
    await inGioco()
    if (giro === 0) {
      const a = await gioca('m.madre().colpi >= 1')
      controlla('a bersaglio fatto arriva la nave madre', a.madre.attiva && a.madre.chiamata)
      controlla('e tira bombe', a.specie.includes('bomba'), a.specie.join(', '))
      await foto('asteroidi-madre', 700)
    }
    uguale(`giro ${giro + 1}: la tappa è vinta`, (await gioca('false')).fase, 'vinta')
    await page.waitForSelector('.velo .bottone.chiaro', { timeout: 5000 })
    const regalo = await page.evaluate(() => document.querySelector('[data-regalo]')?.dataset.pezzo || null)
    if (giro < 2) {
      uguale(`giro ${giro + 1}: il cartello mostra il ${giro + 1}° pacco della tappa`, regalo, regaliDellaTappa(POS)[giro])
      if (giro === 0) await foto('asteroidi-regalo', 900)
    } else {
      uguale('al terzo giro niente pacco', regalo, null)
      controlla('e il cartello lo dice', await page.locator('[data-pacchi-finiti]').isVisible())
    }
    await chiudiTraguardi(page)
    await page.click('.velo .bottone.chiaro')            // «Mappa»
    await page.waitForSelector('[data-rotta]')
    if (giro === 0) {
      uguale('sulla rotta la tappa ha un pacco in meno', await page.locator(`[data-pacchi-di="${POS}"]`).getAttribute('data-quanti'), '1')
      uguale('e il tasto dell\'hangar conta il pezzo nuovo (col pacco del volo, due)',
             (await page.locator('[data-azione="hangar"] [data-nuovi]').innerText()).trim(), '2')
    }
  }
  uguale('vinta tre volte, la tappa non ha più pacchi sulla rotta', await page.locator(`[data-pacchi-di="${POS}"]`).count(), 0)
  uguale('due pezzi presi dalla tappa, e non di più (più quello del volo)', ((await hangar()).presi || []).length, 3)

  /* l'hangar: il pallino sul nuovo, la scelta che resta, il lucchetto */
  await page.click('[data-azione="hangar"]')
  await page.waitForSelector('[data-hangar]')
  const primo = regaliDellaTappa(POS)[0]
  const linguetta = { scafo: 'scafo', d: 'disegno', s: 'stemma' }[tipoDi(primo)]
  uguale('la linguetta del pezzo nuovo ha il pallino', await page.locator(`[data-linguetta="${linguetta}"] [data-nuovo]`).count(), 1)
  await page.click(`[data-linguetta="${linguetta}"]`)
  uguale('il pezzo vinto si può scegliere', await page.locator(`[data-scelta="${primo}"]`).getAttribute('data-preso'), '1')
  uguale('e il pezzo pure', await page.locator(`[data-scelta="${primo}"] [data-nuovo]`).count(), 1)
  await page.click(`[data-scelta="${primo}"]`)
  await page.click('[data-linguetta="scafo"]')
  controlla('un colore non preso ha il lucchetto', await page.locator('[data-scelta="scafo:oro"]').isDisabled())
  await page.click('[data-scelta="scafo:rosso"]')
  await foto('asteroidi-hangar', 500)
  const nave = (await hangar()).nave || {}
  uguale('la scelta resta', nave.scafo, 'rosso')
  uguale('anche quella del pezzo vinto', nave[linguetta], idDi(primo))
  await page.click('[data-hangar] [data-chiudi]')
  uguale('chiuso l\'hangar, niente più di nuovo', await page.locator('[data-azione="hangar"] [data-nuovi]').count(), 0)

})

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))
await browser.close()
riassunto('la scaletta degli asteroidi: pianeti, stazioni, regali')
