/* ═══════════════════════════════════════════════════════════════════
   I MOSTRI DEL MONDO DI SOPRA — docs/sotterraneo/mondo-aperto-mostri.md

   Chi vive in ogni regione nasce da (eroe, giro): lo stesso eroe allo
   stesso giro trova gli stessi branchi, un giro nuovo ne trova altri. Mai
   in città, nella cintura attorno al villaggio e lungo la strada della
   cripta, su una strada, un ponte, un valico o l'acqua; e inseguendo non
   escono dalla loro regione. Le fasce salgono con l'anello, ogni regione
   ha la sua tana col signore. I morti tornano a passi (mai a secondi),
   il signore e i caporali no. Lo stato si salva e si rilegge. Lo scontro
   è quello dei dungeon; svenendo si perdono metà gemme e le tasche, ma
   non i pezzi rari né i leggendari. La mappa non cambia.
   ═══════════════════════════════════════════════════════════════════ */
import { ilMondo, terraDelMondo } from '../../src/giochi/sotterraneo/motore/mondo-sopra-anelli.js'
import { popolaMondo, spaziDi, alSicuro, inSalvo, riprendiMondo, nuovoGiro, mostriVicini, muoviMostri, cammina, incontro, apriLoScontro,
         esitoDelloScontro, annuncioDi, coloreDellaRegione, perdeSvenendo, taglieDaContare, tanaDi, crescitaDiSopra, abitantiDi, dellaRegione,
         cittaDelRisveglio } from '../../src/giochi/sotterraneo/motore/aperta.js'
import { SOPRA, ABITANTI_DI_SOPRA } from '../../src/giochi/sotterraneo/dati/mondo-aperto-mostri.js'
import { MONDO_APERTO } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { ERBA } from '../../src/giochi/sotterraneo/motore/mondo-aperto.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { LIVELLI_ATTESI } from '../../src/giochi/sotterraneo/dati/storia.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { pezzoNuovo } from '../../src/giochi/sotterraneo/motore/bottino.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { ROBA_VUOTA } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { controlla, uguale, stessaLista, dentro, riassunto } from '../aiuto/verifica.mjs'

const m = ilMondo()
const firma = m.firma
const stato = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })
const k = c => c.y * m.W + c.x
const impronta = s => s.mostri.map(q => `${q.tipo}@${q.casa.x},${q.casa.y}:${q.livello}:${q.ossa}`).join('|')

/* ── la mappa non cambia, quello che ci vive sì ── */
{
  uguale('popolare il mondo non tocca la firma della pianta', m.firma, MONDO_APERTO.firma)
  uguale('né la cambia', firma, MONDO_APERTO.firma)
  controlla('ci sono mostri sopra', stato.mostri.length > 100, `${stato.mostri.length}`)
  uguale('lo stesso eroe allo stesso giro: gli stessi mostri', impronta(popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })), impronta(stato))
  controlla('un giro nuovo: altri mostri', impronta(popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 1 })) !== impronta(stato))
  controlla('un altro eroe: altri mostri', impronta(popolaMondo({ mondo: m, eroe: 'mago', giro: 0 })) !== impronta(stato))
  controlla('ogni specie esiste e non è un capo', stato.mostri.every(q => MOSTRI[q.tipo] && !MOSTRI[q.tipo].capo))
  for (const [chiave, a] of Object.entries(ABITANTI_DI_SOPRA)) {
    controlla(`${chiave}: da due a quattro abitanti, il caporale non per strada`, a.mostri.length >= 2 && a.mostri.length <= 4 && !a.mostri.includes(a.caporale))
    controlla(`${chiave}: è una regione del mondo, senza abitanti nella scheda`, m.regioni.some(R => R.chiave === chiave && !R.abitanti))
  }
  controlla('ogni regione fuori dal villaggio ha chi ci vive', m.regioni.every(R => !R.anello || abitantiDi(R)))
  uguale('il signore del cimitero vecchio', `Il signore ${dellaRegione('Il cimitero vecchio')}`, 'Il signore del cimitero vecchio')
  uguale('delle rovine', dellaRegione('Le rovine del guado'), 'delle rovine del guado')
}

/* ── dove stanno: mai in città, cintura, strada, ponte, valico, acqua ── */
{
  const { casa, cintura } = spaziDi(m)
  const male = stato.mostri.filter(q => {
    const c = k(q.casa)
    return m.zonaCitta[c] || m.strada[c] || m.terreno[c] !== ERBA || m.ponte[c] >= 0 || m.varco[c] >= 0 || cintura[c] || casa[c] !== q.regione || m.reg[c] !== q.regione
  })
  uguale('nessuno nasce in città, sulla strada, su un ponte o un valico, nell\'acqua o nella cintura', male.length, 0)
  // la cintura, rifatta qui: attorno alla piazza e lungo la strada della cripta, SOPRA.cintura celle
  const primo = m.ingressi.find(i => i.indice === 0)
  const via = [m.partenza, ...terraDelMondo(m, () => true).strada(m.partenza, primo.accanto)]
  const vicino = stato.mostri.filter(q => via.some(c => Math.hypot(c.x - q.casa.x, c.y - q.casa.y) <= SOPRA.cintura))
  uguale(`nessuno a meno di ${SOPRA.cintura} celle dalla strada fra la piazza e la cripta`, vicino.length, 0)
  controlla('la cripta e la piazza sono al sicuro', alSicuro(m, primo.accanto.x, primo.accanto.y) && alSicuro(m, m.partenza.x, m.partenza.y))
  const villaggio = m.regioni.find(R => R.chiave === 'villaggio')
  uguale('nel villaggio non vive nessuno', stato.mostri.filter(q => m.regioni[q.regione] === villaggio).length, 0)
  // inseguendo restano nella loro regione e fuori dalle città: l'eroe cammina in tondo vicino a un branco per un minuto
  const s = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })
  const q0 = s.mostri.find(q => m.regioni[q.regione].anello === 2 && !q.signore)
  for (let t = 0; t < 1200; t++) {
    const a = t / 40
    muoviMostri(s, { x: q0.casa.x + 0.5 + Math.cos(a) * 9, y: q0.casa.y + 0.5 + Math.sin(a) * 9 }, 1 / 20)
  }
  controlla('qualcuno si è svegliato e ha inseguito', s.mostri.some(q => q.fx !== q.casa.x + 0.5 || q.fy !== q.casa.y + 0.5))
  const fuori = s.mostri.filter(q => casa[Math.floor(q.fy) * m.W + Math.floor(q.fx)] !== q.regione)
  uguale('e inseguendo nessuno è uscito dalla sua regione o è entrato in città', fuori.length, 0)
}

/* ── le fasce: salgono con l'anello, seguono il dungeon ── */
{
  const media = a => { const l = stato.mostri.filter(q => m.regioni[q.regione].anello === a); return l.reduce((n, q) => n + q.livello, 0) / l.length }
  controlla('le marche sono più forti delle terre vicine', media(2) > media(1) + 4, `${media(1).toFixed(1)} → ${media(2).toFixed(1)}`)
  controlla('ogni mostro sta nella fascia della sua regione', stato.mostri.every(q => { const f = m.regioni[q.regione].fascia; return q.livello >= f[0] && q.livello <= f[1] }))
  controlla('l\'anello 1 sta in 1–6', stato.mostri.every(q => m.regioni[q.regione].anello !== 1 || q.livello <= 6))
  for (const R of m.regioni.filter(q => q.dungeon)) {
    const i = CAMPAGNA.findIndex(t => t.chiave === R.dungeon), atteso = i >= 0 ? LIVELLI_ATTESI[i] : LIVELLI_ATTESI[LIVELLI_ATTESI.length - 1]
    uguale(`${R.chiave}: la fascia comincia un livello sotto il suo dungeon`, R.fascia[0], Math.max(1, atteso - 1))
  }
  controlla('la forza dei mostri sale col livello', crescitaDiSopra(2).forza > crescitaDiSopra(1).forza && crescitaDiSopra(13).forza > crescitaDiSopra(10).forza)
  const ossa = a => { const l = stato.mostri.filter(q => m.regioni[q.regione].anello === a && !q.caporale); return l.reduce((n, q) => n + q.ossa, 0) / l.length }
  controlla('e anche le ossa', ossa(2) > ossa(1) * 2)
}

/* ── le tane e il signore ── */
{
  for (const R of m.regioni.filter(q => q.anello)) {
    const t = tanaDi(stato, R.chiave)
    controlla(`${R.chiave}: ha la tana col signore vivo`, t && t.signore && t.signore.vivo)
  }
  const signori = stato.mostri.filter(q => q.signore)
  uguale('un signore per regione', signori.length, m.regioni.filter(q => q.anello).length)
  controlla('il signore è un caporale col nome della regione', signori.every(q => q.caporale && /^Il signore d/.test(q.scheda.nome)))
  const mediana = l => [...l].sort((a, b) => a - b)[Math.floor(l.length / 2)]
  controlla('il signore ha almeno una volta e mezza le ossa di chi sta per strada', signori.every(q => {
    const strada = stato.mostri.filter(x => x.regione === q.regione && !x.caporale).map(x => x.ossa)
    return !strada.length || q.ossa >= 1.5 * mediana(strada)
  }))
}

/* ── l'annuncio della regione ── */
{
  const R = m.regioni.find(q => q.chiave === 'bosco')
  const t = stato.tane.find(q => q.chiave === 'bosco')
  const a = annuncioDi(m, t.x, t.y, R.fascia[0])
  uguale('nel bosco: verde a livello', a.colore, 'verde')
  uguale('e la riga', a.testo, `🟢 Il bosco vecchio · livello ${R.fascia[0]}–${R.fascia[1]}`)
  uguale('due sotto: arancio', coloreDellaRegione([5, 7], 3), 'arancio')
  uguale('molto sotto: rosso', coloreDellaRegione([10, 12], 3), 'rosso')
  uguale('sopra: grigio', coloreDellaRegione([1, 3], 6), 'grigio')
  const c = m.citta[0]
  controlla('in città: il suo nome, al sicuro', annuncioDi(m, c.piazza.x, c.piazza.y, 1).sicura)
}

/* ── lo scontro, vinto: il bottino, i morti, le taglie ── */
const forte = { eroe: 'cavaliere', roba: robaAttesa('cavaliere', 7), crescita: crescitaAttesa('cavaliere', 7) }
const giocaFinoInFondo = (corsa, giusto = () => true) => { for (let i = 0; i < 400 && corsa.foglio && corsa.foglio.che === 'scontro'; i++) corsa.rispondi(giusto()) }
{
  const s = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 3 })
  const q = s.mostri.find(x => m.regioni[x.regione].chiave === 'campi' && !x.caporale)
  const pos = { x: q.fx - 0.5, y: q.fy }
  uguale('nessuno scontro senza contatto né tocco', incontro(s, { x: q.fx + 5, y: q.fy + 5 }), null)
  const inc = incontro(s, pos, { tocco: q.i })
  controlla('il tocco apre lo scontro col suo branco', inc && inc.chi === q.i && inc.campo.every(i => s.mostri[i].branco === q.branco || s.mostri[i].sveglio))
  controlla('al più sette in campo', inc.campo.length <= 7)
  const corsa = apriLoScontro(s, inc, forte)
  uguale('il foglio è quello dei dungeon', corsa.foglio && corsa.foglio.che, 'scontro')
  uguale('in campo quelli dell\'incontro', corsa.foglio.campo.length, inc.campo.length)
  const gemme0 = corsa.gemme
  giocaFinoInFondo(corsa)
  const e = esitoDelloScontro(s, corsa)
  uguale('rispondendo giusto si vince', e.come, 'vinto')
  uguale('una taglia per morto', e.uccisi.length, inc.campo.length)
  controlla('le gemme cadute si raccolgono', e.roba.gemme > gemme0 && e.gemme > 0)
  controlla('l\'esperienza sale', e.esp > 0 && e.crescita.esp > forte.crescita.esp)
  controlla('i morti sono morti nel mondo', inc.campo.every(i => s.mostri[i].morto))
  controlla('e torneranno fra una e due volte la base, in passi', inc.campo.every(i => s.mostri[i].torna >= s.passi + SOPRA.ricomparsa - 1 && s.mostri[i].torna <= s.passi + 2 * SOPRA.ricomparsa + 1))
  uguale('le forze di sopra si ricordano', s.forze.vita, e.forze.vita)
  uguale('taglieDaContare: quelli della specie', taglieDaContare(e.uccisi, { specie: q.tipo }), e.uccisi.filter(t => t.specie === q.tipo).length)
  uguale('taglieDaContare: nella regione', taglieDaContare(e.uccisi, { regione: 'campi' }), e.uccisi.length)
  uguale('taglieDaContare: altrove niente', taglieDaContare(e.uccisi, { regione: 'bosco' }), 0)

  /* ── la ricomparsa: a passi, mai a secondi, mai sotto gli occhi ── */
  const morto = s.mostri[inc.campo[0]]
  for (let t = 0; t < 2000; t++) muoviMostri(s, { x: 0, y: 0 }, 1)
  controlla('il tempo che passa da fermi non fa tornare nessuno', morto.morto)
  cammina(s, Math.max(0, morto.torna - s.passi - 1), { x: 0, y: 0 })
  controlla('un passo prima, ancora morto', morto.morto)
  cammina(s, 2, { x: morto.casa.x + 0.5, y: morto.casa.y + 0.5 })
  controlla('sotto gli occhi dell\'eroe non torna', morto.morto)
  const tornati = cammina(s, 1, { x: 0, y: 0 })
  controlla('lontano torna, a casa sua e intero', !morto.morto && tornati.includes(morto) && morto.ossa === morto.scheda.ossaMax && morto.fx === morto.casa.x + 0.5)

  /* ── il salvataggio ── */
  const salvo = JSON.parse(JSON.stringify(inSalvo(s)))
  controlla('si salva poco', JSON.stringify(salvo).length < 2000, `${JSON.stringify(salvo).length}`)
  const r = riprendiMondo({ mondo: m, eroe: 'cavaliere', giro: 3, salvato: salvo })
  stessaLista('rileggendo: gli stessi morti', r.mostri.filter(x => x.morto).map(x => [x.i, x.torna]), s.mostri.filter(x => x.morto).map(x => [x.i, x.torna]))
  uguale('gli stessi passi', r.passi, s.passi)
  stessaLista('le stesse forze', r.forze, s.forze)
  uguale('di nuovo in salvo è uguale', JSON.stringify(inSalvo(r)), JSON.stringify(salvo))
  const altro = riprendiMondo({ mondo: m, eroe: 'cavaliere', giro: 4, salvato: salvo })
  uguale('un giro nuovo: nessun morto', altro.mostri.filter(x => x.morto).length, 0)
  uguale('ma i passi restano', altro.passi, s.passi)
  uguale('un salvato storto: mondo nuovo', riprendiMondo({ mondo: m, eroe: 'cavaliere', giro: 3, salvato: { v: 99 } }).mostri.filter(x => x.morto).length, 0)
  const g = nuovoGiro(s, 4)
  controlla('nuovoGiro rifà i mostri e tiene i passi', g.giro === 4 && g.passi === s.passi && !g.mostri.some(x => x.morto))
}

/* ── il signore non torna; svenire non perde rari e leggendari ── */
{
  const raro = pezzoNuovo({ livello: 5, rarita: 'raro', rnd: seminato(3) })
  const legg = pezzoNuovo({ livello: 5, rarita: 'leggendario', rnd: seminato(5) })
  uguale('il pezzo raro è raro', COSE[raro].rarita, 'raro')
  uguale('il leggendario è leggendario', COSE[legg].rarita, 'leggendario')
  const p = perdeSvenendo({ gemme: 41, zaino: [raro, 'pozione', legg, 'spada@5', 'pozione-piccola'], mano: 'spada' })
  stessaLista('svenendo restano in tasca solo i rari e i leggendari', p.zaino, [raro, legg])
  uguale('metà delle gemme', p.gemme, 20)
  uguale('quello addosso resta', p.mano, 'spada')

  const s = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 5 })
  const sig = s.mostri.find(q => q.signore && m.regioni[q.regione].chiave === 'landa')
  const inc = incontro(s, { x: sig.fx - 0.6, y: sig.fy }, { tocco: sig.i })
  const debole = { eroe: 'cavaliere', roba: { ...ROBA_VUOTA(), gemme: 41, zaino: [raro, 'pozione', legg] }, crescita: null }
  const corsa = apriLoScontro(s, inc, debole)
  giocaFinoInFondo(corsa, () => false)
  const e = esitoDelloScontro(s, corsa, { terra: terraDelMondo(m, () => true) })
  uguale('il signore della landa stende un eroe nuovo', e.come, 'svenuto')
  const tutto = r => [r.mano, r.mancina, r.corpo, r.collo, r.dito, r.dito2, ...r.zaino]
  controlla('e svenuto ha ancora i pezzi rari e leggendari (in tasca o addosso)', tutto(e.roba).includes(raro) && tutto(e.roba).includes(legg), JSON.stringify(e.roba))
  controlla('non la pozione', !e.roba.zaino.includes('pozione'))
  controlla('le gemme sono la metà o meno', e.roba.gemme <= 20)
  controlla('ci si risveglia in una città', e.risveglio && m.citta.some(c => c.chiave === e.risveglio.citta))
  controlla('tutti a casa a dormire', s.mostri.every(q => q.morto || (!q.sveglio && q.fx === q.casa.x + 0.5)))
  uguale('nessuna risposta sbagliata ha pagato niente', e.esp, 0)
  const vicino = cittaDelRisveglio(m, m.partenza.x, m.partenza.y + 30, terraDelMondo(m, () => true))
  uguale('sotto il villaggio ci si risveglia al villaggio', vicino.citta, 'villaggio')

  // il signore, battuto, non torna nel giro (né i suoi caporali)
  const s2 = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 5 })
  const sig2 = s2.mostri[sig.i]
  const inc2 = incontro(s2, { x: sig2.fx - 0.6, y: sig2.fy }, { tocco: sig2.i })
  const c2 = apriLoScontro(s2, inc2, { eroe: 'cavaliere', roba: robaAttesa('cavaliere', 7), crescita: crescitaAttesa('cavaliere', 7) })
  // un eroe forte e sempre giusto: per sicurezza si ritenta finché non vince o sviene
  giocaFinoInFondo(c2)
  const e2 = esitoDelloScontro(s2, c2)
  if (e2.come === 'vinto') {
    controlla('il signore battuto non torna', sig2.morto && sig2.torna == null)
    controlla('lascia un pezzo raro o meglio', e2.presi.concat(e2.rimasti).some(x => ['raro', 'leggendario'].includes(COSE[x] && COSE[x].rarita)), JSON.stringify(e2.presi))
    cammina(s2, 10000, { x: 0, y: 0 })
    controlla('neanche dopo diecimila passi', sig2.morto)
    uguale('la taglia del signore', taglieDaContare(e2.uccisi, { signore: true }), 1)
  } else controlla('l\'eroe atteso della fine storia batte il signore della landa', false, e2.come)
}

/* ── chi è vicino ── */
{
  const q = stato.mostri[10]
  controlla('mostriVicini lo trova', mostriVicini(stato, q.fx, q.fy, 1).includes(q))
  dentro('e pochi attorno', mostriVicini(stato, q.fx, q.fy, SOPRA.vista).length, 1, 40)
}

riassunto('il mondo di sopra: i mostri')
