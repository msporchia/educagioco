/* ═══════════════════════════════════════════════════════════════════
   IL MONDO DI SOPRA: COSA SI SALVA E DOVE SI VA — docs/sotterraneo/mondo-sopra-contratto.md, mondo-aperto-dati.md

   Il mondo a percorso tenuto una volta, con le zone che seguono l'eroe.
   La nebbia è un bit per cella in base64 (504×300 celle, 25 200
   caratteri): torna uguale, e un codice che non torna è nebbia nuova.
   La prima volta si vede la piazza, e chi ha già finito delle discese
   ritrova la strada maestra fino a loro e accesa la pietra della loro
   zona. Il travaso di un salvataggio di prima del percorso (nebbia da
   3 734 caratteri, pietre `altare` e `forte`, `sopra` vecchio). Una
   città sola: il portale gemello, il minatore e il capitano stanno nel
   villaggio. Le otto pietre, il viaggio, il cartello, nessuna grata.
   ═══════════════════════════════════════════════════════════════════ */
import { ilMondo, ilMondoIntero, seguiLEroe, terraDelMondo, nebbiaInBase64, nebbiaDaBase64, mondoNuovo, mondoDaSalvato, mondoDaSalvare,
         cittaDelDungeon, portaleDella, postiDi, nomeDellaPietra, difDellaPietra, meteDelViaggio, pietraAccanto, minatoreDi, capitanoDi,
         pietreDiOggi, frecceDelCartello, dungeonDi, dungeonDellIndice, cittaDi, zonaInCella,
         VISTA_MONDO } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { INGRESSI_DEL_MONDO, ZONE_DEL_MONDO } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const m = ilMondo()
uguale('il mondo è generato una volta sola per pagina', ilMondo(), m)
stessaLista('all\'inizio sono caricati i prati (col villaggio) e il bosco', m.zonaCaricata.map((c, k) => (c ? k : -1)).filter(k => k >= 0), [0, 1])
const visto = (n, c) => n[c.y * m.W + c.x] === 1
const ingresso = k => postiDi(m, 'ingresso').find(p => p.chiave === k)
const tappeCon = finite => CAMPAGNA.map((t, i) => ({ indice: i, chiave: t.chiave, fatta: i < finite, stelle: i < finite ? 2 : 0 }))

/* ── la nebbia in base64 ── */
{
  const n = new Uint8Array(m.W * m.H)
  for (let k = 0; k < n.length; k++) n[k] = (k * 7919 % 13) < 5 ? 1 : 0
  const s = nebbiaInBase64(n)
  uguale('504×300 celle sono 25 200 caratteri', s.length, 25200)
  const r = nebbiaDaBase64(s, m.W, m.H)
  controlla('e tornano uguali, cella per cella', r && r.every((v, k) => v === n[k]))
  uguale('un codice d\'altra misura è nebbia nuova', nebbiaDaBase64(s.slice(1), m.W, m.H), null)
  uguale('quello del mondo ad anelli (3 734 caratteri) anche', nebbiaDaBase64('A'.repeat(3734), m.W, m.H), null)
  uguale('niente codice, niente nebbia', nebbiaDaBase64(undefined, m.W, m.H), null)
}

/* ── la prima volta ── */
{
  const { nebbia, pietre } = mondoNuovo(m, tappeCon(2))
  controlla('la piazza si vede', visto(nebbia, m.partenza))
  stessaLista('la cripta e le cantine finite: accesa la pietra dei prati', pietre, ['zona:prati'])
  for (const k of ['altare', 'cantine']) controlla(`e la strada fino ${k === 'altare' ? 'alla cripta' : 'alle cantine'} è scoperta`, visto(nebbia, ingresso(k).accanto))
  controlla('anche la pietra dei prati', visto(nebbia, m.pietre.find(p => p.chiave === 'zona:prati').accanto))
  controlla('la torre, non ancora finita, resta nella nebbia', !visto(nebbia, ingresso('torre').accanto))
  uguale('la firma di prima (m, terra, tappe) vale ancora', mondoNuovo(m, null, tappeCon(2)).pietre.join(), 'zona:prati')
  const nuova = mondoNuovo(m, [])
  const viste = nuova.nebbia.reduce((s, v) => s + v, 0)
  controlla('un eroe nuovo vede solo attorno alla piazza', viste > 0 && viste <= Math.ceil(Math.PI * (VISTA_MONDO + 1) ** 2), viste)
}

/* ── il travaso di chi ha giocato sul mondo ad anelli ── */
{
  const vecchio = { nebbia: 'A'.repeat(3733) + 'w', dove: { x: 80, y: 60 }, giro: 3, pietre: ['villaggio', 'forte', 'altare', 'cantine', 'gallerie'],
                    parlato: true, divieti: ['torre'], novita: { ragazza: { n: 2, v: '' } }, quest: { stati: { 't:forte:esplora-regione:palude:2': 'presa' }, fatte: 4 },
                    sopra: { v: 1, eroe: 'cavaliere', giro: 3, passi: 900, morti: [[4, 1200], [17, -1]], forze: null, perTerra: [] } }
  const r = mondoDaSalvato(m, vecchio, tappeCon(4))
  uguale('una firma che manca è un mondo cambiato: il travaso', r.travasato, true)
  controlla('la nebbia si rifà (della misura nuova)', r.nebbia instanceof Uint8Array && r.nebbia.length === m.W * m.H)
  controlla('dalle discese finite: scoperta la strada fino alla tana dei ragni', visto(r.nebbia, ingresso('gallerie').accanto) && visto(r.nebbia, ingresso('altare').accanto))
  controlla('ma non la palude', !visto(r.nebbia, ingresso('cisterna').accanto))
  uguale('si ricomincia nella piazza', r.dove, null)
  uguale('i mostri morti per indice si buttano: con un\'altra mappa sono altri mostri', r.sopra, null)
  stessaLista('le pietre: le città vecchie sono il villaggio, i dungeon la loro zona', r.pietre, ['villaggio', 'zona:prati', 'zona:bosco'])
  uguale('il giro resta', r.giro, 3)
  uguale('chi ti ha parlato, i divieti e le novità restano', [r.parlato, r.divieti.join(), r.novita.ragazza.n].join(), 'true,torre,2')
  uguale('le taglie restano (si rifanno dall\'id)', r.quest.stati['t:forte:esplora-regione:palude:2'], 'presa')
  const salvo = JSON.parse(JSON.stringify(mondoDaSalvare(m, { ...r, dove: { x: 120, y: 200 } })))
  uguale('si salva con la firma della mappa', salvo.firma, m.firma)
  uguale('e la nebbia in base64', salvo.nebbia.length, 25200)
  const di = mondoDaSalvato(m, salvo, tappeCon(4))
  uguale('riletto con la stessa firma: niente travaso', di.travasato, false)
  controlla('la stessa nebbia', di.nebbia.every((v, k) => v === r.nebbia[k]))
  uguale('e dove si era', `${di.dove.x},${di.dove.y}`, '120,200')
  const storta = mondoDaSalvato(m, { ...salvo, nebbia: 'xyz' }, tappeCon(4))
  controlla('stessa firma ma nebbia storta: nebbia nuova, il posto resta', storta.nebbia.length === m.W * m.H && storta.dove && storta.dove.x === 120 && !storta.travasato)
  const primo = mondoDaSalvato(m, null, [])
  controlla('mai salvato: nuovo, nella piazza', primo.nuovo && !primo.travasato && primo.dove === null && visto(primo.nebbia, m.partenza))
  stessaLista('pietreDiOggi: senza doppioni né chiavi che non ci sono', pietreDiOggi(['rifugio', 'forte', 'labirinto', 'boh', 'zona:monte']), ['villaggio', 'zona:ceneri', 'zona:monte'])
}

/* ── una città sola: il villaggio serve tutto ── */
{
  for (const k of Object.keys(INGRESSI_DEL_MONDO)) uguale(`${dungeonDi(k).nome}: il gemello sta nel villaggio`, cittaDelDungeon(m, k), 'villaggio')
  uguale('dal portale si sbuca accanto al gemello del villaggio', portaleDella(m, 4).citta, 'villaggio')
  uguale('una sosta del forte (le chiavi di prima) è nel villaggio', cittaDi(m, 'forte').chiave, 'villaggio')
  uguale('il minatore sta nel villaggio', minatoreDi(m).citta, 'villaggio')
  uguale('anche dopo la sesta porta', minatoreDi(m, 6).citta, 'villaggio')
  uguale('e il capitano', capitanoDi(m).citta, 'villaggio')
  uguale('i dungeon della scheda: l\'indice della storia', dungeonDellIndice(4).chiave, 'cisterna')
  uguale('e la loro zona', dungeonDi('cerchio').zona, 'brughiera')
  uguale('la zona di una cella', zonaInCella(m, ingresso('torre').accanto.x, ingresso('torre').accanto.y).chiave, 'bosco')
}

/* ── le pietre del viaggio ── */
{
  const pietre = postiDi(m, 'pietra')
  uguale('otto pietre: il villaggio e una per zona', pietre.length, 8)
  stessaLista('le chiavi', pietre.map(p => p.chiave), ['villaggio', ...ZONE_DEL_MONDO.map(z => `zona:${z.chiave}`)])
  uguale('il nome dice dove sta', nomeDellaPietra('zona:bosco'), 'La pietra del bosco vecchio')
  uguale('anche dai prati', nomeDellaPietra('zona:prati'), 'La pietra dei prati del cimitero')
  uguale('una chiave di prima (la cripta) è la pietra della sua zona', nomeDellaPietra('altare'), 'La pietra dei prati del cimitero')
  uguale('nel villaggio', nomeDellaPietra('villaggio'), 'La pietra del villaggio')
  uguale('le domande di una pietra sono quelle della sua zona', difDellaPietra(m, 'zona:palude'), m.zone[3].dif)
  uguale('quelle del villaggio, dei prati', difDellaPietra(m, 'villaggio'), m.zone[0].dif)
  stessaLista('da una pietra di zona accesa: il villaggio sempre, e le altre accese', meteDelViaggio(m, 'zona:bosco', ['zona:bosco', 'zona:monte']).map(v => v.chiave), ['villaggio', 'zona:monte'])
  stessaLista('dalla pietra del villaggio, le accese delle zone: si torna avanti', meteDelViaggio(m, 'villaggio', ['villaggio', 'zona:prati', 'altare']).map(v => v.chiave), ['zona:prati'])
  stessaLista('da una spenta da nessuna parte', meteDelViaggio(m, 'zona:palude', ['villaggio', 'zona:prati']), [])
  const v = pietre.find(p => p.chiave === 'villaggio')
  uguale('accanto alla pietra, quella è la pietra', (pietraAccanto(m, v.accanto.x + 0.5, v.accanto.y + 0.5) || {}).chiave, 'villaggio')
  uguale('lontano, nessuna', pietraAccanto(m, m.partenza.x + 0.5, m.partenza.y - 2.5), null)
  const prati = pietre.find(p => p.chiave === 'zona:prati')
  controlla('il viaggio arriva dove ci si ferma davanti alla pietra, e ci si cammina', terraDelMondo(m).passa(prati.accanto.x, prati.accanto.y))
}

/* ── il cartello: la strada maestra ── */
{
  const f = frecceDelCartello(m, 'villaggio')
  uguale('una freccia: la strada maestra, dal cancello', f.length, 1)
  controlla('che va verso i prati, fuori dal cancello a est', ['→', '↗', '↘'].includes(f[0].verso), f[0].verso)
  stessaLista('e porta a tutti i dungeon', [...f[0].posti].sort(), Object.keys(INGRESSI_DEL_MONDO).sort())
  stessaLista('e a tutte le zone', f[0].zone, ZONE_DEL_MONDO.map(z => z.chiave))
}

/* ── le zone seguono l'eroe, la terra con loro ── */
{
  const t0 = terraDelMondo(m)
  uguale('finché non si carica niente di nuovo, la terra è la stessa', terraDelMondo(m), t0)
  const p = m.pietre.find(q => q.chiave === 'zona:palude')
  controlla('la palude, mai caricata, non si cammina', !t0.passa(p.accanto.x, p.accanto.y))
  const s = seguiLEroe(m, p.accanto.x, p.accanto.y)
  uguale('alla pietra della palude: la zona', s.zona, 3)
  stessaLista('si caricano la brughiera, la palude e le ceneri', s.caricate, [2, 3, 4])
  stessaLista('e si buttano i prati e il bosco', s.scaricate, [0, 1])
  const t1 = terraDelMondo(m)
  controlla('la terra nuova cammina la palude', t1 !== t0 && t1.passa(p.accanto.x, p.accanto.y))
  controlla('e i prati, scaricati, restano scritti', t1.passa(m.partenza.x, m.partenza.y))
  uguale('restando lì non cambia niente', seguiLEroe(m, p.accanto.x + 1, p.accanto.y).caricate.length, 0)
  seguiLEroe(m, m.partenza.x, m.partenza.y)
}

/* ── nessuna grata: tutto il mondo si cammina dalla piazza ── */
{
  const tutto = ilMondoIntero()
  uguale('(lo stesso mondo, tutto caricato)', tutto, m)
  const terra = terraDelMondo(m)
  const dist = terra.raggiungibili(m.partenza)
  for (const c of m.confini) controlla(`${c.nome}: si passa sempre, da una riva all'altra`, c.rive.every(r => dist.has(r.y * m.W + r.x)))
  controlla('ogni ingresso si raggiunge dalla piazza', m.ingressi.every(q => dist.has(q.accanto.y * m.W + q.accanto.x)))
  const sopra = await import('../../src/giochi/sotterraneo/motore/mondo-sopra.js')
  controlla('le grate di prima non ci sono più (né aperturaDi né chiusoPerche)', !('aperturaDi' in sopra) && !('chiusoPerche' in sopra))
  seguiLEroe(m, m.partenza.x, m.partenza.y)
}

riassunto('il mondo di sopra: cosa si salva')
