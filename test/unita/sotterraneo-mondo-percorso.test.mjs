/* ═══════════════════════════════════════════════════════════════════
   IL MONDO A PERCORSO DEL SOTTERRANEO — il generatore a blocchi

   Il mondo di sopra si genera da un seme fisso e non cambia mai: la
   mappa si impara, e la nebbia salvata vale solo su quella. Nel
   telefono si genera a zone (quella dove si è e le due accanto):
   caricarle una per volta deve dare esattamente il mondo di tutte
   insieme, se no una zona ricaricata non è più quella di prima. Qui
   le firme del seme scelto senza guasti, a blocchi come tutto, la
   terra dopo con la stessa mappa e i mostri più forti, la strada (le
   pietre a 200–230 passi, nessuna scorciatoia fra le file, la storia
   in fila, la cripta vicina), il villaggio uguale alla sua pianta, le
   chiavi di sempre, il tempo di una zona.
   docs/sotterraneo/mondo-aperto-generatore.md
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scheletroDelMondo, caricaZona, scaricaZona, caricaTutto, tieniAttorno, zonaDi, zoneAttorno, livelloDi, baseDi, listaDi,
  misuraDelMondo, generaMondoPercorso, mascheraDelMondo, ERBA, ACQUA, ROCCIA } from '../../src/giochi/sotterraneo/motore/mondo-percorso.js'
import { MONDO_PERCORSO, ZONE_DEL_MONDO, INGRESSI_DEL_MONDO, VILLAGGIO, LUOGHI, cittaDiOggi, pietraDiOggi } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
// le regioni del mondo ad anelli (tolto il 20 ottobre 2026), con le chiavi e i nomi: le taglie salvate le nominano, non cambiano più
const REGIONI_DI_PRIMA = [["villaggio","Il villaggio"],["cimitero","Il cimitero vecchio"],["campi","I campi"],["colle","Il colle delle rovine"],["brughiera","La brughiera"],["frutteto","Il frutteto"],["mulino","La valle del mulino"],["bosco","Il bosco vecchio"],["lago","Il lago"],["passo","Il passo"],["gola","La gola dei venti"],["vetta","La vetta dei troll"],["monte","Il monte"],["corvi","Il colle dei corvi"],["foresta","La foresta nera"],["ossa","La valle delle ossa"],["landa","La landa vecchia"],["guado","Il guado"],["palude","La palude"],["accampamento","Il prato dell'accampamento"],["secco","Il bosco secco"],["ceneri","La piana delle ceneri"],["rovine","Le rovine del guado"],["colline","Le colline di roccia"],["lupi","Il bosco dei lupi"]].map(([chiave, nome]) => ({ chiave, nome }))
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { creaTerra } from '../../src/giochi/sotterraneo/motore/terra.js'
import { passiDa } from '../../src/giochi/sotterraneo/motore/mondo-aperto-strade.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const m = generaMondoPercorso()
const { W, H } = m
const id = (x, y) => y * W + x
const passiA = c => m.passi[id(c.x, c.y)]

/* ── il seme scelto ── */
stessaLista('il seme scelto non ha guasti', m.guasti, [])
uguale('la firma dello scheletro è quella della scheda (cambiare il generatore cambia il mondo dei bambini e la nebbia salvata)', m.firma, MONDO_PERCORSO.firma)
uguale('e quella delle celle', m.firmaCelle, MONDO_PERCORSO.firmaCelle)
uguale(`${MONDO_PERCORSO.largo} celle in largo`, W, 504)
uguale(`${MONDO_PERCORSO.alto} in alto`, H, 300)
{
  const m2 = generaMondoPercorso()
  uguale('lo stesso seme dà lo stesso mondo', m2.firmaCelle, m.firmaCelle)
  controlla('cella per cella', m.terreno.every((v, k) => v === m2.terreno[k] && m.strada[k] === m2.strada[k] && m.quota[k] === m2.quota[k]))
  controlla('un altro seme dà un altro mondo', scheletroDelMondo(MONDO_PERCORSO.seme + 1).firma !== m.firma)
}
nota(`seme ${m.seme}, firme ${m.firma}/${m.firmaCelle}, strada ${m.lunghezza} celle, ${m.ms} ms (scheletro ${m.msScheletro})`)

/* ── il generatore è un dato puro: niente Vue, three o DOM in quello che importa ── */
{
  const QUI = dirname(fileURLToPath(import.meta.url))
  const visti = new Set(), coda = [resolve(QUI, '../../src/giochi/sotterraneo/motore/mondo-percorso.js')]
  const fuori = []
  while (coda.length) {
    const f = coda.pop(); if (visti.has(f)) continue; visti.add(f)
    const testo = readFileSync(f, 'utf8')
    for (const [, dove] of testo.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)) {
      if (dove.startsWith('.')) coda.push(resolve(dirname(f), dove)); else fuori.push(dove)
    }
    controlla(`${f.split('/src/')[1]} non tocca il DOM`, !/\b(document|window)\./.test(testo))
  }
  stessaLista('nessun import fuori dal repo', fuori, [])
}

/* ── a blocchi come tutto insieme ── */
{
  const s = scheletroDelMondo()
  uguale('lo scheletro ha la stessa firma', s.firma, m.firma)
  controlla('nessuna zona caricata, le celle ancora vuote', s.zonaCaricata.every(c => !c) && s.zona.every(v => v === -1))
  // in un ordine qualunque, con al più tre zone caricate (quella dove si è e le accanto), come nel telefono
  const firme = []
  for (const k of [6, 3, 0, 5, 1, 4, 2]) {
    const prima = listaDi(s, 'decoro').length
    const c = caricaZona(s, k)
    firme[k] = c.firma
    for (let z = 0; z < 7; z++) if (s.zonaCaricata[z] && !zoneAttorno(s, k).includes(z)) scaricaZona(s, z)
    controlla(`caricando la zona ${k} il decoro cresce`, listaDi(s, 'decoro').length > 0 && c.decoro.length > 0, `${prima}`)
  }
  for (let k = 0; k < 7; k++) uguale(`la zona ${k} caricata da sola è quella di tutte insieme`, firme[k], m.carico[k].firma)
  // e scaricando le liste se ne vanno
  const tante = listaDi(s, 'decoro').length + listaDi(s, 'case').length + listaDi(s, 'campi').length
  for (let k = 0; k < 7; k++) scaricaZona(s, k)
  uguale('scaricate tutte, nessuna lista resta', listaDi(s, 'decoro').length + listaDi(s, 'case').length + listaDi(s, 'campi').length, 0)
  controlla('prima ce n\'erano', tante > 0, `${tante}`)
  caricaTutto(s)
  const CAMPI = ['terreno', 'zona', 'reg', 'arco', 'ponte', 'varco', 'strada', 'blocco', 'riservato', 'zonaCitta', 'campo', 'isola', 'quota', 'cintura']
  for (const c of CAMPI) controlla(`${c}: cella per cella uguale a tutto insieme`, s[c].every((v, k) => Object.is(v, m[c][k])))
  for (const l of ['decoro', 'case', 'campi']) uguale(`${l}: le stesse liste`, JSON.stringify(listaDi(s, l)), JSON.stringify(listaDi(m, l)))
  misuraDelMondo(s)
  uguale('e le stesse misure', s.firmaCelle, m.firmaCelle)
  // tenere attorno all'eroe: la zona dove sta e le due accanto
  const t = scheletroDelMondo()
  const pz = m.pietre.find(q => q.chiave === 'zona:palude')
  uguale('la pietra della palude sta nella palude', tieniAttorno(t, pz.x, pz.y), 3)
  stessaLista('tenute la brughiera, la palude e le ceneri', t.zonaCaricata, [false, false, true, true, true, false, false])
  uguale('il villaggio è della prima zona', zonaDi(t, m.partenza.x, m.partenza.y), 0)
  // una zona sola, sul fresco: quanto ci mette (in Node; sul Note 7 da tre a cinque volte tanto)
  const u = scheletroDelMondo()
  const ms = []
  for (const k of [3, 0]) { const a = performance.now(); caricaZona(u, k); ms.push(Math.round(performance.now() - a)) }
  dentro('una zona si genera in molto meno di mezzo secondo (ms, la palude)', ms[0], 0, 400)
  dentro('anche la prima, col villaggio (ms)', ms[1], 0, 500)
  dentro('lo scheletro (ms)', u.msScheletro, 0, 400)
  nota(`una zona: palude ${ms[0]} ms, prati ${ms[1]} ms; lo scheletro ${u.msScheletro} ms`)
}

/* ── le terre: la stessa mappa, i mostri più forti ── */
{
  const t2 = generaMondoPercorso(MONDO_PERCORSO.seme, { terra: 2 })
  uguale('la seconda terra ha la stessa firma', t2.firma, m.firma)
  uguale('e le stesse celle', t2.firmaCelle, m.firmaCelle)
  stessaLista('le fasce delle zone salgono di 14', t2.zone.map(z => z.fascia), m.zone.map(z => z.fascia.map(v => v + 14)))
  stessaLista('e i livelli dei dungeon', t2.ingressi.map(q => q.livello), m.ingressi.map(q => q.livello + 14))
  uguale('la zona 1 della seconda terra comincia subito sopra la landa', t2.zone[0].fascia[0], m.zone[6].fascia[1])
  const t9 = scheletroDelMondo(MONDO_PERCORSO.seme, { terra: 9 })
  uguale('oltre la quinta terra non si sale più', t9.zone[0].fascia[0], 1 + 14 * 4)
  uguale('le terre hanno un nome', t2.terraDi.terra, 2)
}

/* ── le zone, i luoghi, i confini ── */
stessaLista('le sette zone in fila', m.zone.map(z => z.chiave), ['prati', 'bosco', 'brughiera', 'palude', 'ceneri', 'monte', 'landa'])
stessaLista('le fasce della prima terra', m.zone.map(z => z.fascia), ZONE_DEL_MONDO.map(z => z.fascia))
for (const Z of m.zone) {
  controlla(`${Z.nome}: le domande della sua fascia`, Z.dif > 0 && Z.dif < 1)
  dentro(`${Z.nome}: celle d'erba (si gira a cercare i mostri)`, Z.area, 8000, 18000)
  controlla(`${Z.nome}: la sua pietra`, m.pietre.some(q => q.chiave === `zona:${Z.chiave}` && q.zona === Z.chiave))
}
{
  const vecchie = REGIONI_DI_PRIMA.map(r => r.chiave).sort()
  stessaLista('i luoghi sono le regioni di prima, con le chiavi di prima', m.regioni.map(r => r.chiave).sort(), vecchie)
  for (const R of m.regioni.slice(1)) {
    controlla(`${R.chiave}: la tana del signore`, !!R.tana)
    controlla(`${R.chiave}: ha erba`, R.celle > 300, `${R.celle}`)
    uguale(`${R.chiave}: sta nella sua zona`, m.zone[R.zona].luoghi.includes(R.chiave), true)
    for (const k of [...(R.abitanti || []), ...(R.caporale ? [R.caporale] : [])]) controlla(`${R.chiave}: ${k} è nel catalogo dei mostri`, !!MOSTRI[k])
  }
  for (const [k, L] of Object.entries(LUOGHI)) uguale(`${k}: il nome di prima`, L.nome, REGIONI_DI_PRIMA.find(r => r.chiave === k).nome)
}
uguale('sei confini', m.confini.length, 6)
for (const c of m.confini) {
  uguale(`${c.nome}: il tipo della scheda`, c.tipo, ZONE_DEL_MONDO[c.i].confine.tipo)
  controlla(`${c.nome}: non ha grata`, !('grata' in c) && !('apre' in c))
  controlla(`${c.nome}: ha il suo passaggio`, c.celle.length >= 3, `${c.celle.length}`)
  controlla(`${c.nome}: da una riva si arriva all'altra`, c.rive.every(r => passiA(r) >= 0))
  if (c.tipo === 'ponte') controlla(`${c.nome}: il ponte sta sopra l'acqua`, c.quota > -0.25 && c.celle.some(p => p.acqua))
}
// il livello sale lungo la strada, e nel villaggio non ci sono mostri
{
  uguale('nel villaggio il livello è 0', livelloDi(m, m.partenza.x, m.partenza.y), 0)
  const lungo = m.tracciato.filter((_, i) => i % 20 === 0).map(p => livelloDi(m, Math.round(p.x), Math.round(p.y)))
  controlla('lungo la strada il livello non scende mai', lungo.every((v, i) => !i || v >= lungo[i - 1] - 0.01), lungo.map(v => v.toFixed(1)).join(' '))
  dentro('in fondo alla landa', lungo[lungo.length - 1], 14, 15)
}
// la base senza zona caricata è quella delle celle sulla strada e ai confini
{
  let diverse = 0, viste = 0
  for (const c of m.confini) for (const p of c.celle) { viste++; if (baseDi(m, p.x, p.y).terreno !== m.terreno[id(p.x, p.y)]) diverse++ }
  for (const p of m.tracciato.filter((_, i) => i % 7 === 0)) { const x = Math.round(p.x), y = Math.round(p.y); viste++; if (baseDi(m, x, y).zona !== m.zona[id(x, y)]) diverse++ }
  uguale(`la base dice il vero sui confini e sulla strada (${viste} celle)`, diverse, 0)
}

/* ── i quattordici ingressi ── */
{
  const NUOVI = ['cerchio', 'corvaia', 'palafitta', 'fornace', 'cava', 'tombe']
  uguale('quattordici ingressi, due per zona', m.ingressi.length, 14)
  for (const Z of m.zone) uguale(`${Z.nome}: due dungeon`, m.ingressi.filter(q => q.zona === Z.chiave).length, 2)
  stessaLista('i sette della storia con le chiavi e l\'ordine della campagna', m.ingressi.filter(q => q.storia).sort((a, b) => a.indice - b.indice).map(q => q.chiave), CAMPAGNA.map(t => t.chiave))
  stessaLista('i sei nuovi, senza indice', m.ingressi.filter(q => q.indice == null).map(q => q.chiave).sort(), NUOVI.slice().sort())
  uguale('il pozzo senza fondo è l\'abisso', m.ingressi.find(q => q.chiave === 'abisso').indice, -1)
  for (const q of m.ingressi) {
    const D = INGRESSI_DEL_MONDO[q.chiave]
    uguale(`${q.chiave}: il nome`, q.nome, D.nome)
    uguale(`${q.chiave}: nella zona della scheda`, q.zona, ZONE_DEL_MONDO.find(z => z.dungeon.some(d => d.chiave === q.chiave)).chiave)
    controlla(`${q.chiave}: un po' sopra i mostri della sua zona`, q.livello >= m.zone.find(z => z.chiave === q.zona).fascia[0], `${q.livello}`)
    uguale(`${q.chiave}: una stradina dalla porta`, m.strada[id(q.accanto.x, q.accanto.y)] > 0, true)
  }
  // la storia in fila anche a piedi
  const storia = m.ingressi.filter(q => q.storia).sort((a, b) => a.indice - b.indice)
  for (let i = 1; i < storia.length; i++) controlla(`${storia[i].nome} più lontana di ${storia[i - 1].nome}`, passiA(storia[i].accanto) > passiA(storia[i - 1].accanto))
  nota('passi dalla piazza:', m.ingressi.map(q => `${q.chiave} ${passiA(q.accanto)}`).join(' · '))
}

/* ── la strada: ogni posto si raggiunge, le pietre a 200–230 passi, nessuna scorciatoia fra le file, la cripta vicina ── */
for (const z of m.posti) controlla(`${z.tipo} ${z.chiave}: ci si arriva dalla piazza`, passiA(z.accanto) >= 0)
{
  const p = m.distanze.pietre.map(f => f.passi)
  uguale('sei tratti fra le pietre delle zone', p.length, 6)
  for (const f of m.distanze.pietre) dentro(`da ${f.da} a ${f.a}: 200–230 passi (45–50 secondi a piedi)`, f.passi, 200, 230)
  nota('da pietra a pietra:', p.join(' · '))
  const pz = m.pietre.filter(q => q.chiave.startsWith('zona:'))
  const cammina = (x, y) => m.calpestabile(x, y)
  for (let i = 0; i + 2 < pz.length; i++) {
    const da = passiDa(W, H, cammina, pz[i].accanto), poi = passiDa(W, H, cammina, pz[i + 1].accanto)
    const a1 = da[id(pz[i + 1].accanto.x, pz[i + 1].accanto.y)], b = poi[id(pz[i + 2].accanto.x, pz[i + 2].accanto.y)], a2 = da[id(pz[i + 2].accanto.x, pz[i + 2].accanto.y)]
    controlla(`da ${pz[i].zona} a ${pz[i + 2].zona} non c'è scorciatoia`, a2 >= 0.8 * (a1 + b), `${a2} contro ${a1 + b}`)
  }
  const cripta = m.ingressi.find(q => q.chiave === 'altare')
  dentro('la cripta a pochi passi dalla piazza', passiA(cripta.accanto), 20, 80)
  uguale('la cripta sta nella cintura', m.cintura[id(cripta.accanto.x, cripta.accanto.y)], 1)
  uguale('la piazza sta nella cintura', m.cintura[id(m.partenza.x, m.partenza.y)], 1)
  let lontane = 0
  for (let k = 0; k < W * H; k++) if (m.cintura[k] && m.zona[k] > 1) lontane++
  uguale('la cintura non va oltre il bosco', lontane, 0)
  // la maschera va a motore/terra.js così com'è
  const terra = creaTerra(mascheraDelMondo(m))
  for (const q of [cripta, m.ingressi.find(q => q.chiave === 'tombe'), m.terre])
    controlla(`creaTerra trova la strada dalla piazza a ${q.chiave}`, !!terra.strada(m.partenza, q.accanto))
}

/* ── il villaggio: la sua pianta, una città sola ── */
{
  const v = m.villaggio
  uguale('una città sola', m.citta.length, 1)
  controlla('niente forte né rifugio', !m.posti.some(q => q.citta === 'forte' || q.citta === 'rifugio' || q.chiave === 'forte' || q.chiave === 'rifugio'))
  stessaLista('40×26', [v.w, v.h], [40, 26])
  for (const l of VILLAGGIO.lotti) {
    const q = m.posti.find(z => z.tipo === l.tipo && z.chiave === l.chiave && z.citta === 'villaggio')
    controlla(`${l.tipo} ${l.chiave}: dove dice la pianta`, q && q.x === v.x + l.x && q.y === v.y + l.y && q.accanto.x === v.x + l.accanto.x && q.accanto.y === v.y + l.accanto.y)
  }
  stessaLista('i quattro mercanti', v.mercanti.map(q => q.chiave).sort(), ['armaiolo', 'erborista', 'incantatrice', 'rigattiere'])
  stessaLista('la ragazza del pozzo e il capitano', v.persone.map(q => q.chiave).sort(), ['capitano', 'ragazza'])
  for (const t of ['minatore', 'portale', 'pietra', 'bacheca', 'cartello', 'pozzo']) controlla(`il villaggio ha ${t}`, !!v[t])
  for (const q of [...v.mercanti, ...v.persone, v.minatore]) {
    controlla(`${q.chiave}: chi lo cerca si ferma davanti, a sud`, q.accanto.y > q.piede.y)
    uguale(`${q.chiave}: e sulla piazza`, m.strada[id(q.accanto.x, q.accanto.y)], 3)
  }
  let campi = 0, piazza = 0
  for (let y = v.y; y < v.y + v.h; y++) for (let x = v.x; x < v.x + v.w; x++) { const k = id(x, y); if (m.campo[k]) campi++; if (m.strada[k] === 3) piazza++ }
  uguale('niente campi nel villaggio', campi, 0)
  uguale('la piazza della pianta', piazza, VILLAGGIO.piazza.w * VILLAGGIO.piazza.h)
  controlla('dal cancello parte la strada maestra', m.strada[id(v.cancello.x, v.cancello.y)] === 2)
  controlla('il villaggio è spianato', [...v.mercanti, v.pietra].every(q => Math.abs(m.quota[id(q.accanto.x, q.accanto.y)] - v.quota) < 0.01))
}

/* ── i salvataggi di prima ── */
uguale('una taglia del forte si rilegge sul villaggio', cittaDiOggi('forte'), 'villaggio')
uguale('e una del rifugio', cittaDiOggi('rifugio'), 'villaggio')
uguale('il villaggio resta il villaggio', cittaDiOggi('villaggio'), 'villaggio')
uguale('la pietra del forte è quella del villaggio', pietraDiOggi('forte'), 'villaggio')
uguale('la pietra davanti alla cripta è quella dei prati', pietraDiOggi('altare'), 'zona:prati')
uguale('quella delle miniere è del monte', pietraDiOggi('fondo'), 'zona:monte')
uguale('una pietra di zona resta quella', pietraDiOggi('zona:landa'), 'zona:landa')

/* ── il terreno ── */
{
  const conta = [0, 0, 0]
  for (let k = 0; k < W * H; k++) conta[m.terreno[k]]++
  controlla('c\'è erba, acqua e roccia', conta[ERBA] > 50000 && conta[ACQUA] > 1000 && conta[ROCCIA] > 30000, conta.join('/'))
  controlla('ogni cella ha la sua zona', m.zona.every(v => v >= 0 && v < 7))
  controlla('la quota è un numero ovunque', m.quota.every(Number.isFinite))
  const decoro = listaDi(m, 'decoro')
  controlla('un ingombro del decoro non sta su una strada né su un lotto', decoro.filter(d => d.blocca).every(d => { const k = id(Math.floor(d.x), Math.floor(d.y)); return !m.strada[k] && m.blocco[k] === 2 }))
  nota(`erba ${conta[ERBA]}, acqua ${conta[ACQUA]}, roccia ${conta[ROCCIA]}; decoro ${decoro.length}, case ${listaDi(m, 'case').length}, campi ${listaDi(m, 'campi').length}`)
}

riassunto('il mondo a percorso')
