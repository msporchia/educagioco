/* ═══════════════════════════════════════════════════════════════════
   IL MONDO DI SOPRA: COSA SI SALVA E DOVE SI VA — docs/sotterraneo/mondo-aperto-dati.md

   La nebbia del mondo è un bit per cella in base64 (160×140 celle,
   3 734 caratteri): torna uguale, e un codice che non torna è nebbia
   nuova. La prima volta si vede la piazza, e chi ha già finito delle
   discese ritrova la strada fino a loro e le loro pietre accese. Il
   portale gemello sta nella città che serve il dungeon (il villaggio se
   quella non si raggiunge). Le undici pietre: chi accende cosa, dove si
   va, con quali domande. Il minatore sale al rifugio dopo la sesta porta.
   ═══════════════════════════════════════════════════════════════════ */
import { ilMondo, aperturaDi, terraDelMondo, nebbiaInBase64, nebbiaDaBase64, mondoNuovo, cittaDelDungeon, portaleDella,
         postiDi, nomeDellaPietra, difDellaPietra, meteDelViaggio, pietraAccanto, minatoreDi, chiusoPerche, VISTA_MONDO } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { DUNGEON, CITTA } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const m = ilMondo()
uguale('il mondo è generato una volta sola per pagina', ilMondo(), m)
const tutto = terraDelMondo(m, () => true)

/* ── la nebbia in base64 ── */
{
  const n = new Uint8Array(m.W * m.H)
  for (let k = 0; k < n.length; k++) n[k] = (k * 7919 % 13) < 5 ? 1 : 0
  const s = nebbiaInBase64(n)
  uguale('160×140 celle sono 3 734 caratteri', s.length, 3734)
  const r = nebbiaDaBase64(s, m.W, m.H)
  controlla('e tornano uguali, cella per cella', r && r.every((v, k) => v === n[k]))
  uguale('un codice d\'altra misura è nebbia nuova', nebbiaDaBase64(s.slice(1), m.W, m.H), null)
  uguale('l\'esadecimale della terra dipinta anche', nebbiaDaBase64('f'.repeat(768), m.W, m.H), null)
  uguale('niente codice, niente nebbia', nebbiaDaBase64(undefined, m.W, m.H), null)
}

/* ── la prima volta ── */
{
  const tappe = CAMPAGNA.map((t, i) => ({ indice: i, chiave: t.chiave, fatta: i < 2, stelle: i < 2 ? 2 : 0 }))
  const { nebbia, pietre } = mondoNuovo(m, tutto, tappe)
  const visto = c => nebbia[c.y * m.W + c.x] === 1
  controlla('la piazza si vede', visto(m.partenza))
  stessaLista('le pietre delle discese finite sono accese', pietre, ['altare', 'cantine'])
  for (const k of ['altare', 'cantine']) controlla(`e la strada fino ${k === 'altare' ? 'alla cripta' : 'alle cantine'} è scoperta`, visto(postiDi(m, 'ingresso').find(p => p.chiave === k).accanto))
  controlla('la torre, non ancora finita, resta nella nebbia', !visto(postiDi(m, 'ingresso').find(p => p.chiave === 'torre').accanto))
  const nuova = mondoNuovo(m, tutto, [])
  const viste = nuova.nebbia.reduce((s, v) => s + v, 0)
  controlla('un eroe nuovo vede solo attorno alla piazza', viste > 0 && viste <= Math.ceil(Math.PI * (VISTA_MONDO + 1) ** 2), viste)
}

/* ── il portale gemello nella città che serve il dungeon ── */
{
  const attese = { altare: 'villaggio', cantine: 'villaggio', torre: 'villaggio', gallerie: 'villaggio', cisterna: 'forte', labirinto: 'forte', fondo: 'rifugio', abisso: 'rifugio' }
  for (const d of DUNGEON) uguale(`${d.nome}: il gemello sta ${attese[d.chiave]}`, cittaDelDungeon(m, d.chiave), attese[d.chiave])
  uguale('dal portale delle sale allagate si sbuca al forte', portaleDella(m, 4, tutto).citta, 'forte')
  const chiuso = terraDelMondo(m, aperturaDi([]).aperto)
  uguale('se il forte non si raggiunge (una sosta da un cheat), nel villaggio', portaleDella(m, 4, chiuso).citta, 'villaggio')
  uguale('l\'abisso risale al rifugio', portaleDella(m, -1, tutto).citta, 'rifugio')
}

/* ── le pietre del viaggio ── */
{
  const pietre = postiDi(m, 'pietra')
  uguale('undici pietre: tre città e otto ingressi', pietre.length, 11)
  stessaLista('una per città', pietre.filter(p => p.citta).map(p => p.chiave).sort(), CITTA.map(c => c.chiave).sort())
  uguale('il nome dice dove sta', nomeDellaPietra('altare'), 'La pietra della cripta dei re')
  uguale('anche in città', nomeDellaPietra('villaggio'), 'La pietra del villaggio')
  uguale('le domande della pietra di un dungeon sono quelle del suo inizio', difDellaPietra(m, 'cantine'), CAMPAGNA[1].dif[0])
  uguale('quelle del villaggio, della prima discesa', difDellaPietra(m, 'villaggio'), CAMPAGNA[0].dif[0])
  const mete = meteDelViaggio(m, 'villaggio', ['villaggio', 'altare'])
  stessaLista('da una pietra accesa si va alle altre accese', mete.map(v => v.chiave), ['altare'])
  stessaLista('da una spenta da nessuna parte', meteDelViaggio(m, 'torre', ['villaggio', 'altare']), [])
  const v = pietre.find(p => p.chiave === 'villaggio')
  uguale('accanto alla pietra, quella è la pietra', (pietraAccanto(m, v.accanto.x + 0.5, v.accanto.y + 0.5) || {}).chiave, 'villaggio')
  uguale('lontano, nessuna', pietraAccanto(m, m.partenza.x + 0.5, m.partenza.y - 4.5), null)
  controlla('il viaggio arriva dove ci si ferma davanti alla pietra, e ci si cammina', mete.every(x => tutto.passa(x.arrivo.x, x.arrivo.y)))
}

/* ── chi sta dove, e le grate ── */
uguale('il minatore sta nel villaggio', minatoreDi(m, 0).citta, 'villaggio')
uguale('e dopo la sesta porta al rifugio', minatoreDi(m, 6).citta, 'rifugio')
{
  const ap = aperturaDi([])
  const ponte = m.passaggi.find(q => q.nome === 'Il ponte del guado')
  controlla('la grata del guado è chiusa all\'inizio', !ap.aperto(ponte))
  controlla('e dice cosa la apre', /Si apre quando finisci la tana dei ragni/.test(chiusoPerche(ponte, ap)), chiusoPerche(ponte, ap))
  const eta = aperturaDi(CAMPAGNA.map((t, i) => ({ indice: i, fatta: i < 4, perEta: i === 4 })))
  uguale('chiusa per l\'età non promette niente', chiusoPerche(ponte, eta), 'Questa strada, per ora, resta chiusa.')
  const finite = aperturaDi(CAMPAGNA.map((t, i) => ({ indice: i, fatta: i < 4 })))
  controlla('finite quattro discese si alza', finite.aperto(ponte))
}

riassunto('il mondo di sopra: cosa si salva')
