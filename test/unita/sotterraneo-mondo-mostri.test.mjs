/* ═══════════════════════════════════════════════════════════════════
   I MOSTRI DEL MONDO DI SOPRA — docs/sotterraneo/mondo-aperto-mostri.md, mondo-sopra-contratto.md

   Chi vive in ogni zona del mondo a percorso nasce da (eroe, giro): lo
   stesso eroe allo stesso giro trova gli stessi branchi, un giro nuovo
   ne trova altri. Mai nel villaggio, nella cintura del generatore, su
   una strada, un ponte, un valico o vicino a un confine; inseguendo non
   escono dalla loro zona. La fascia sale lungo la zona e di zona in zona
   (e di quattordici a terra), ogni luogo ha la sua tana col signore. Le
   zone si popolano quando il mondo le carica e si dimenticano quando le
   butta: i morti restano, per zona. I morti tornano a passi (mai a
   secondi), il signore e i caporali no. Lo stato si salva e si rilegge.
   Lo scontro è quello dei dungeon; svenendo si perdono metà gemme e le
   tasche, ma non i pezzi rari né i leggendari. La mappa non cambia.
   ═══════════════════════════════════════════════════════════════════ */
import { ilMondoIntero, seguiLEroe } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { scheletroDelMondo, caricaZona, ERBA } from '../../src/giochi/sotterraneo/motore/mondo-percorso.js'
import { popolaMondo, spaziDi, alSicuro, inSalvo, riprendiMondo, nuovoGiro, mostriVicini, muoviMostri, cammina, incontro, apriLoScontro,
         esitoDelloScontro, annuncioDi, coloreDellaRegione, perdeSvenendo, taglieDaContare, tanaDi, crescitaDiSopra, abitantiDi, dellaRegione,
         cittaDelRisveglio, allineaZone, cellePerBranco, BLOCCO_ZONA } from '../../src/giochi/sotterraneo/motore/aperta.js'
import { SOPRA, ABITANTI_DI_SOPRA, CURVA_DI_SOPRA } from '../../src/giochi/sotterraneo/dati/mondo-aperto-mostri.js'
import { MONDO_PERCORSO } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { pezzoNuovo } from '../../src/giochi/sotterraneo/motore/bottino.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { ROBA_VUOTA } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const m = ilMondoIntero()
const firma = m.firma
const stato = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })
const k = c => c.y * m.W + c.x
const impronta = s => s.lista.map(q => `${q.i}:${q.tipo}@${q.casa.x},${q.casa.y}:${q.livello}:${q.ossa}`).join('|')
const luogo = q => m.regioni[q.regione]
const nelLuogo = (s, chiave, f = () => true) => s.lista.find(q => luogo(q).chiave === chiave && f(q))

/* ── la mappa non cambia, quello che ci vive sì ── */
{
  uguale('popolare il mondo non tocca la firma della pianta', m.firma, MONDO_PERCORSO.firma)
  uguale('né la cambia', firma, MONDO_PERCORSO.firma)
  controlla('ci sono mostri in ogni zona', m.zone.every((Z, z) => stato.lista.some(q => q.zona === z)))
  uguale('lo stesso eroe allo stesso giro: gli stessi mostri', impronta(popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })), impronta(stato))
  controlla('un giro nuovo: altri mostri', impronta(popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 1 })) !== impronta(stato))
  controlla('un altro eroe: altri mostri', impronta(popolaMondo({ mondo: m, eroe: 'mago', giro: 0 })) !== impronta(stato))
  controlla('ogni specie esiste e non è un capo', stato.lista.every(q => MOSTRI[q.tipo] && !MOSTRI[q.tipo].capo))
  controlla('l\'indice dice la zona', stato.lista.every(q => Math.floor(q.i / BLOCCO_ZONA) === q.zona && stato.mostri[q.i] === q))
  for (const [chiave, a] of Object.entries(ABITANTI_DI_SOPRA)) {
    controlla(`${chiave}: da due a quattro abitanti, il caporale non per strada`, a.mostri.length >= 2 && a.mostri.length <= 4 && !a.mostri.includes(a.caporale))
    controlla(`${chiave}: è un luogo del mondo, senza abitanti nella scheda`, m.regioni.some(R => R.chiave === chiave && !R.abitanti))
  }
  controlla('ogni luogo fuori dal villaggio ha chi ci vive', m.regioni.every(R => R.chiave === 'villaggio' || abitantiDi(R)))
  uguale('il signore del cimitero vecchio', `Il signore ${dellaRegione('Il cimitero vecchio')}`, 'Il signore del cimitero vecchio')
  uguale('delle rovine', dellaRegione('Le rovine del guado'), 'delle rovine del guado')
  stessaLista('un branco ogni tante celle, per zona', m.zone.map((Z, z) => cellePerBranco(z)), SOPRA.cellePerBranco)
}

/* ── dove stanno: mai nel villaggio, nella cintura, su strade, ponti, valichi, acqua, né vicino a un confine ── */
{
  const { casa } = spaziDi(m)
  const male = stato.lista.filter(q => {
    const c = k(q.casa)
    return m.zonaCitta[c] || m.strada[c] || m.terreno[c] !== ERBA || m.ponte[c] >= 0 || m.varco[c] >= 0 || m.cintura[c] || casa[c] !== q.zona || m.zona[c] !== q.zona || m.reg[c] !== q.regione
  })
  uguale('nessuno nasce nel villaggio, sulla strada, su un ponte o un valico, nell\'acqua o nella cintura', male.length, 0)
  const confini = m.confini.flatMap(c => c.celle)
  const vicini = stato.lista.filter(q => confini.some(p => Math.hypot(p.x - q.casa.x, p.y - q.casa.y) <= SOPRA.daConfine))
  uguale(`nessuno a meno di ${SOPRA.daConfine} celle da un ponte o da un varco`, vicini.length, 0)
  uguale(`nessuno a meno di ${SOPRA.cintura} celle dalla piazza`, stato.lista.filter(q => Math.hypot(q.casa.x - m.partenza.x, q.casa.y - m.partenza.y) <= SOPRA.cintura).length, 0)
  const cripta = m.ingressi.find(i => i.chiave === 'altare')
  controlla('la cripta e la piazza sono al sicuro', alSicuro(m, cripta.accanto.x, cripta.accanto.y) && alSicuro(m, m.partenza.x, m.partenza.y))
  controlla('un ponte è al sicuro', m.confini.filter(c => c.tipo === 'ponte').every(c => c.celle.every(p => alSicuro(m, p.x + 0.5, p.y + 0.5))))
  uguale('nel villaggio non vive nessuno', stato.lista.filter(q => luogo(q).chiave === 'villaggio').length, 0)
  // inseguendo restano nella loro zona: l'eroe cammina in tondo vicino a un branco della palude per un minuto
  const s = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })
  const q0 = s.lista.find(q => q.zona === 3 && !q.signore)
  for (let t = 0; t < 1200; t++) {
    const a = t / 40
    muoviMostri(s, { x: q0.casa.x + 0.5 + Math.cos(a) * 9, y: q0.casa.y + 0.5 + Math.sin(a) * 9 }, 1 / 20)
  }
  controlla('qualcuno si è svegliato e ha inseguito', s.lista.some(q => q.fx !== q.casa.x + 0.5 || q.fy !== q.casa.y + 0.5))
  const fuori = s.lista.filter(q => casa[Math.floor(q.fy) * m.W + Math.floor(q.fx)] !== q.zona)
  uguale('e inseguendo nessuno è uscito dalla sua zona', fuori.length, 0)
}

/* ── le fasce: salgono lungo la zona, di zona in zona, e di terra in terra ── */
{
  controlla('ogni mostro sta nella fascia della sua zona', stato.lista.every(q => { const f = m.zone[q.zona].fascia; return q.livello >= f[0] && q.livello <= f[1] }))
  const media = l => l.reduce((n, q) => n + q.livello, 0) / (l.length || 1)
  const perZona = m.zone.map((Z, z) => media(stato.lista.filter(q => q.zona === z)))
  controlla('di zona in zona più forti', perZona.every((v, i) => !i || v > perZona[i - 1]), perZona.map(v => v.toFixed(1)).join(' → '))
  for (const [z, Z] of m.zone.entries()) {
    const l = stato.lista.filter(q => q.zona === z && !q.caporale)
    const a = (Z.s1 - Z.s0) / 3
    const prima = l.filter(q => m.arco[k(q.casa)] < Z.s0 + a), dopo = l.filter(q => m.arco[k(q.casa)] > Z.s1 - a)
    controlla(`${Z.nome}: in fondo alla zona più forti che all'entrata`, media(dopo) > media(prima), `${media(prima).toFixed(1)} → ${media(dopo).toFixed(1)}`)
  }
  controlla('i prati in 1–3', stato.lista.every(q => q.zona !== 0 || q.livello <= 3))
  uguale('la landa arriva al 15', Math.max(...stato.lista.filter(q => q.zona === 6).map(q => q.livello)), 15)
  controlla('la forza dei mostri sale col livello', crescitaDiSopra(2).forza > crescitaDiSopra(1).forza && crescitaDiSopra(13).forza > crescitaDiSopra(10).forza)
  uguale('la curva è scritta fino al 15', CURVA_DI_SOPRA[CURVA_DI_SOPRA.length - 1].livello, 15)
  controlla('e oltre sale da sola, per le terre dopo (fino al 71)', crescitaDiSopra(29).forza > crescitaDiSopra(15).forza && crescitaDiSopra(71).forza > crescitaDiSopra(57).forza && crescitaDiSopra(71).spinta > crescitaDiSopra(29).spinta)
  const ossa = z => { const l = stato.lista.filter(q => q.zona === z && !q.caporale); return l.reduce((n, q) => n + q.ossa, 0) / l.length }
  controlla('e anche le ossa', ossa(6) > ossa(0) * 2)
  // la seconda terra: la stessa mappa, i mostri quattordici livelli più su
  const m2 = scheletroDelMondo(MONDO_PERCORSO.seme, { terra: 2 })
  caricaZona(m2, 0)
  const s2 = popolaMondo({ mondo: m2, eroe: 'cavaliere', giro: 0 })
  controlla('nella seconda terra i prati stanno in 15–17', s2.lista.length > 0 && s2.lista.every(q => q.livello >= 15 && q.livello <= 17), `${Math.min(...s2.lista.map(q => q.livello))}–${Math.max(...s2.lista.map(q => q.livello))}`)
  uguale('con le stesse tane', s2.tane.map(t => `${t.x},${t.y}`).join(), stato.tane.filter(t => t.zona === 0).map(t => `${t.x},${t.y}`).join())
}

/* ── le tane e il signore ── */
{
  const luoghi = m.regioni.filter(R => R.chiave !== 'villaggio')
  for (const R of luoghi) {
    const t = tanaDi(stato, R.chiave)
    controlla(`${R.chiave}: ha la tana col signore vivo`, t && t.signore && t.signore.vivo)
  }
  const signori = stato.lista.filter(q => q.signore)
  uguale('un signore per luogo', signori.length, luoghi.length)
  controlla('il signore è un caporale col nome del luogo', signori.every(q => q.caporale && /^Il signore d/.test(q.scheda.nome)))
  controlla('all\'inizio della fascia del suo luogo', signori.every(q => q.livello === Math.max(m.zone[q.zona].fascia[0], luogo(q).fascia[0])))
  const guardie = z => Math.max(...signori.filter(q => q.zona === z).map(q => stato.branchi[q.branco].length - 1))
  controlla('nei prati e nel bosco al più una guardia', guardie(0) <= 1 && guardie(1) <= 1)
  const mediana = l => [...l].sort((a, b) => a - b)[Math.floor(l.length / 2)]
  controlla('il signore ha almeno una volta e mezza le ossa di chi sta per strada', signori.every(q => {
    const strada = stato.lista.filter(x => x.regione === q.regione && !x.caporale).map(x => x.ossa)
    return !strada.length || q.ossa >= 1.5 * mediana(strada)
  }))
}

/* ── l'annuncio della zona ── */
{
  const Z = m.zone[1]
  const t = stato.tane.find(q => q.chiave === 'bosco')
  const a = annuncioDi(m, t.x, t.y, Z.fascia[0])
  uguale('nel bosco: verde a livello', a.colore, 'verde')
  uguale('la riga dice la zona', a.testo, `🟢 Il bosco vecchio · livello ${Z.fascia[0]}–${Z.fascia[1]}`)
  uguale('e dove si è dentro la zona', `${a.zona} ${a.luogo}`, 'bosco bosco')
  const l = stato.tane.find(q => q.chiave === 'lupi')
  uguale('un altro luogo della stessa zona: la stessa riga', annuncioDi(m, l.x, l.y, Z.fascia[0]).testo, a.testo)
  uguale('due sotto: arancio', coloreDellaRegione([5, 7], 3), 'arancio')
  uguale('molto sotto: rosso', coloreDellaRegione([10, 12], 3), 'rosso')
  uguale('sopra: grigio', coloreDellaRegione([1, 3], 6), 'grigio')
  controlla('nel villaggio: il suo nome, al sicuro', annuncioDi(m, m.partenza.x, m.partenza.y, 1).sicura)
}

/* ── lo scontro, vinto: il bottino, i morti, le taglie ── */
const forte = { eroe: 'cavaliere', roba: robaAttesa('cavaliere', 7), crescita: crescitaAttesa('cavaliere', 7) }
const giocaFinoInFondo = (corsa, giusto = () => true) => { for (let i = 0; i < 400 && corsa.foglio && corsa.foglio.che === 'scontro'; i++) corsa.rispondi(giusto()) }
{
  const s = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 3 })
  const q = nelLuogo(s, 'frutteto', x => !x.caporale)
  const pos = { x: q.fx - 0.5, y: q.fy }
  uguale('nessuno scontro senza contatto né tocco', incontro(s, { x: q.fx + 5, y: q.fy + 5 }), null)
  const inc = incontro(s, pos, { tocco: q.i })
  controlla('il tocco apre lo scontro col suo branco', inc && inc.chi === q.i && inc.campo.every(i => s.mostri[i].branco === q.branco || s.mostri[i].sveglio))
  uguale('l\'incontro dice la zona', inc.zona, 'prati')
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
  uguale('taglieDaContare: nel luogo', taglieDaContare(e.uccisi, { regione: 'frutteto' }), e.uccisi.length)
  uguale('taglieDaContare: nella zona', taglieDaContare(e.uccisi, { zona: 'prati' }), e.uccisi.length)
  uguale('taglieDaContare: altrove niente', taglieDaContare(e.uccisi, { regione: 'bosco' }) + taglieDaContare(e.uccisi, { zona: 'bosco' }), 0)

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
  controlla('i morti per zona', Object.keys(salvo.morti).every(z => m.zone.some(Z => Z.chiave === z)), JSON.stringify(salvo.morti))
  const r = riprendiMondo({ mondo: m, eroe: 'cavaliere', giro: 3, salvato: salvo })
  stessaLista('rileggendo: gli stessi morti', r.lista.filter(x => x.morto).map(x => [x.i, x.torna]), s.lista.filter(x => x.morto).map(x => [x.i, x.torna]))
  uguale('gli stessi passi', r.passi, s.passi)
  stessaLista('le stesse forze', r.forze, s.forze)
  uguale('di nuovo in salvo è uguale', JSON.stringify(inSalvo(r)), JSON.stringify(salvo))
  const altro = riprendiMondo({ mondo: m, eroe: 'cavaliere', giro: 4, salvato: salvo })
  uguale('un giro nuovo: nessun morto', altro.lista.filter(x => x.morto).length, 0)
  uguale('ma i passi restano', altro.passi, s.passi)
  uguale('un salvato storto: mondo nuovo', riprendiMondo({ mondo: m, eroe: 'cavaliere', giro: 3, salvato: { v: 99 } }).lista.filter(x => x.morto).length, 0)
  const vecchio = { v: 1, eroe: 'cavaliere', giro: 3, passi: 900, morti: [[4, 1200], [17, -1]], forze: null, perTerra: [] }
  uguale('il `sopra` del mondo ad anelli (morti per indice): tornano tutti', riprendiMondo({ mondo: m, eroe: 'cavaliere', giro: 3, salvato: vecchio }).lista.filter(x => x.morto).length, 0)
  const g = nuovoGiro(s, 4)
  controlla('nuovoGiro rifà i mostri e tiene i passi', g.giro === 4 && g.passi === s.passi && !g.lista.some(x => x.morto))
}

/* ── le zone che si caricano e si buttano: i mostri con loro, i morti ricordati ── */
{
  seguiLEroe(m, m.partenza.x, m.partenza.y)
  const s = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 7 })
  stessaLista('dal villaggio: i mostri dei prati e del bosco', [...new Set(s.lista.map(q => q.zona))], [0, 1])
  const n0 = s.lista.length
  // tre morti nei prati: uno che torna presto, uno che torna tardi, un caporale (non torna fino al giro dopo)
  const [a, b] = s.lista.filter(q => q.zona === 0 && !q.caporale), c = s.lista.find(q => q.zona === 0 && q.caporale)
  a.morto = true; a.torna = s.passi + 50
  b.morto = true; b.torna = s.passi + 5000
  c.morto = true; c.torna = null
  const p = m.pietre.find(q => q.chiave === 'zona:palude').accanto
  seguiLEroe(m, p.x, p.y)
  const { nate, dimenticate } = allineaZone(s)
  stessaLista('alla palude: nascono la brughiera, la palude e le ceneri', nate, [2, 3, 4])
  stessaLista('e si dimenticano i prati e il bosco', dimenticate, [0, 1])
  controlla('i mostri dei prati non ci sono più', !s.lista.some(q => q.zona === 0) && s.mostri[a.i] === undefined && tanaDi(s, 'campi') === null)
  nota(`mostri in memoria: ${n0} dal villaggio, ${s.lista.length} alla palude`)
  dentro('in memoria al più un migliaio di mostri', s.lista.length, 300, 1000)
  stessaLista('ma i morti dei prati sono ricordati, per zona', s.mortiFuori.prati.map(([j, t]) => [j, t]).sort((x, y) => x[0] - y[0]),
              [[a.i % BLOCCO_ZONA, a.torna], [b.i % BLOCCO_ZONA, b.torna], [c.i % BLOCCO_ZONA, -1]].sort((x, y) => x[0] - y[0]))
  const salvo = JSON.parse(JSON.stringify(inSalvo(s)))
  uguale('e si salvano anche lontano', salvo.morti.prati.length, 3)
  cammina(s, 100, { x: p.x, y: p.y })
  seguiLEroe(m, m.partenza.x, m.partenza.y)
  allineaZone(s)
  const a2 = s.mostri[a.i], b2 = s.mostri[b.i], c2 = s.mostri[c.i]
  controlla('tornati nei prati: gli stessi mostri, con gli stessi indici', !!a2 && a2.tipo === a.tipo && a2.casa.x === a.casa.x && b2.tipo === b.tipo)
  controlla('chi doveva tornare nel frattempo è tornato', !a2.morto)
  controlla('chi torna più tardi è ancora morto, col suo passo', b2.morto && b2.torna === b.torna)
  controlla('il caporale anche, fino al giro dopo', c2.morto && c2.torna == null)
  const r = riprendiMondo({ mondo: m, eroe: 'cavaliere', giro: 7, salvato: salvo })
  controlla('rileggendo il salvato fatto lontano, i morti dei prati tornano morti', r.mostri[b.i].morto && r.mostri[c.i].morto)
}

/* ── quanto costa ── */
{
  ilMondoIntero()
  const s = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 })
  const perZona = m.zone.map((Z, z) => s.lista.filter(q => q.zona === z).length)
  nota(`mostri per zona: ${perZona.join(' · ')} (${s.lista.length} in tutto), erba per zona ${m.zone.map(Z => Z.area).join(' · ')}`)
  const p = m.pietre.find(q => q.chiave === 'zona:palude').accanto
  seguiLEroe(m, p.x, p.y)
  allineaZone(s)
  const t0 = performance.now()
  for (let i = 0; i < 600; i++) muoviMostri(s, { x: p.x + 0.5 + i / 100, y: p.y + 0.5 }, 1 / 60)
  const ms = (performance.now() - t0) / 600
  nota(`muoviMostri con ${s.lista.length} mostri in memoria: ${(ms * 1000).toFixed(0)} µs a fotogramma`)
  controlla('muoviMostri sta sotto il mezzo millisecondo a fotogramma', ms < 0.5, `${ms.toFixed(3)} ms`)
  seguiLEroe(m, m.partenza.x, m.partenza.y)
}

/* ── il signore non torna; svenire non perde rari e leggendari ── */
{
  ilMondoIntero()
  const raro = pezzoNuovo({ livello: 5, rarita: 'raro', rnd: seminato(3) })
  const legg = pezzoNuovo({ livello: 5, rarita: 'leggendario', rnd: seminato(5) })
  uguale('il pezzo raro è raro', COSE[raro].rarita, 'raro')
  uguale('il leggendario è leggendario', COSE[legg].rarita, 'leggendario')
  const p = perdeSvenendo({ gemme: 41, zaino: [raro, 'pozione', legg, 'spada@5', 'pozione-piccola'], mano: 'spada' })
  stessaLista('svenendo restano in tasca solo i rari e i leggendari', p.zaino, [raro, legg])
  uguale('metà delle gemme', p.gemme, 20)
  uguale('quello addosso resta', p.mano, 'spada')

  const s = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 5 })
  const sig = nelLuogo(s, 'landa', q => q.signore)
  const inc = incontro(s, { x: sig.fx - 0.6, y: sig.fy }, { tocco: sig.i })
  const debole = { eroe: 'cavaliere', roba: { ...ROBA_VUOTA(), gemme: 41, zaino: [raro, 'pozione', legg] }, crescita: null }
  const corsa = apriLoScontro(s, inc, debole)
  giocaFinoInFondo(corsa, () => false)
  const e = esitoDelloScontro(s, corsa)
  uguale('il signore della landa stende un eroe nuovo', e.come, 'svenuto')
  const tutto = r => [r.mano, r.mancina, r.corpo, r.collo, r.dito, r.dito2, ...r.zaino]
  controlla('e svenuto ha ancora i pezzi rari e leggendari (in tasca o addosso)', tutto(e.roba).includes(raro) && tutto(e.roba).includes(legg), JSON.stringify(e.roba))
  controlla('non la pozione', !e.roba.zaino.includes('pozione'))
  controlla('le gemme sono la metà o meno', e.roba.gemme <= 20)
  uguale('ci si risveglia al villaggio', e.risveglio && e.risveglio.citta, 'villaggio')
  uguale('accanto alla sua pietra', `${e.risveglio.x},${e.risveglio.y}`, `${m.villaggio.pietra.accanto.x},${m.villaggio.pietra.accanto.y}`)
  controlla('tutti a casa a dormire', s.lista.every(q => q.morto || (!q.sveglio && q.fx === q.casa.x + 0.5)))
  uguale('nessuna risposta sbagliata ha pagato niente', e.esp, 0)
  uguale('da ovunque, il villaggio', cittaDelRisveglio(m, 400, 50).citta, 'villaggio')

  // il signore, battuto, non torna nel giro (né i suoi caporali)
  const s2 = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 5 })
  const sig2 = s2.mostri[sig.i]
  const inc2 = incontro(s2, { x: sig2.fx - 0.6, y: sig2.fy }, { tocco: sig2.i })
  const c2 = apriLoScontro(s2, inc2, { eroe: 'cavaliere', roba: robaAttesa('cavaliere', 7), crescita: crescitaAttesa('cavaliere', 7) })
  giocaFinoInFondo(c2)
  const e2 = esitoDelloScontro(s2, c2)
  if (e2.come === 'vinto') {
    controlla('il signore battuto non torna', sig2.morto && sig2.torna == null)
    controlla('lascia un pezzo raro o meglio', e2.presi.concat(e2.rimasti).some(x => ['raro', 'leggendario'].includes(COSE[x] && COSE[x].rarita)), JSON.stringify(e2.presi))
    cammina(s2, 10000, { x: 0, y: 0 })
    controlla('neanche dopo diecimila passi', sig2.morto)
    uguale('la taglia del signore', taglieDaContare(e2.uccisi, { signore: true }), 1)
  } else nota(`(l'eroe atteso della fine storia contro il signore della landa, al 13–15: ${e2.come}; la taratura è dopo)`)
}

/* ── chi è vicino ── */
{
  const q = stato.lista[10]
  controlla('mostriVicini lo trova', mostriVicini(stato, q.fx, q.fy, 1).includes(q))
  dentro('e pochi attorno', mostriVicini(stato, q.fx, q.fy, SOPRA.vista).length, 1, 40)
}

seguiLEroe(m, m.partenza.x, m.partenza.y)
riassunto('il mondo di sopra: i mostri')
