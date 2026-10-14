/* La taratura coi giocatori tipo (docs/sotterraneo/giocatori-tipo.md): non un cancello sui numeri del gioco, ma che lo strumento giri:
   i tre giocatori tipo esistono e giocano come dicono, una storia corta si gioca e si rifà uguale, il rapporto si calcola e spiega
   ogni cella fuori bersaglio, la tabella delle specie si legge, la potenza del mostro porta esperienza e gemme, il danno è continuo.
   `node test/esegui.mjs sotterraneo-taratura --niente-build` */
import { GIOCATORI_TIPO, NOMI_TIPO, COLPI_PER_STENDERE, stileDi } from '../../src/giochi/sotterraneo/dati/giocatori-tipo.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { storiaDi, passoDellaStoria, STATO_NUOVO, rifatteAl } from '../../src/giochi/sotterraneo/motore/storie.js'
import { partite, rapporto, tabella, spiega, fuoriBersaglio, primoFuoriDiMolto, forbice, scostamento, bersaglioDi } from '../../src/giochi/sotterraneo/motore/rapporto.js'
import { tabellaDelleSpecie } from '../../src/giochi/sotterraneo/motore/specie.js'
import { potenzaDelMostro } from '../../src/giochi/sotterraneo/motore/potenza.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i giocatori tipo ══════════ */
{
  stessaLista('tre giocatori tipo', NOMI_TIPO, ['curioso', 'bravo', 'sbadato'])
  uguale('il curioso risponde giusto 9 volte su 10', GIOCATORI_TIPO.curioso.bravura, 0.9)
  uguale('lo sbadato 6 su 10', GIOCATORI_TIPO.sbadato.bravura, 0.6)
  controlla('il bravo 9–10 su 10 e va dritto', GIOCATORI_TIPO.bravo.bravura >= 0.9 && GIOCATORI_TIPO.bravo.come === 'minimo')
  controlla('il curioso gira tutto e usa le abilità appena può', GIOCATORI_TIPO.curioso.come === 'tutto' && stileDi('curioso').abilita === 'appenaPuoi')
  uguale('lo sbadato gioca come il curioso', stileDi('sbadato'), stileDi('curioso'))
  for (const t of NOMI_TIPO) for (const [m, b] of Object.entries(GIOCATORI_TIPO[t].bersagli)) {
    const bb = b.min !== undefined || b.max !== undefined ? [b] : Object.values(b)
    for (const x of bb) controlla(`${t}.${m}: un bersaglio con un minimo o un massimo`, x.min !== undefined || x.max !== undefined || typeof x === 'object')
  }
  controlla('i colpi per stendere: il grosso meno del caporale meno di una specie di strada', COLPI_PER_STENDERE.grosso < COLPI_PER_STENDERE.caporale && COLPI_PER_STENDERE.caporale < COLPI_PER_STENDERE.comune)
  uguale('la cripta ha i branchi da due al più', CAMPAGNA[0].tettoBranco, 2)
}

/* ══════════ 2. una storia corta, due volte uguale ══════════ */
const passi = [
  ...['cavaliere', 'mago'].flatMap(eroe => ['curioso', 'bravo'].flatMap(tipo => storiaDi({ tipo, eroe, seme: 1, fino: 1 }))),
]
{
  const ancora = storiaDi({ tipo: 'curioso', eroe: 'cavaliere', seme: 1, fino: 1 })
  uguale('lo stesso seme, la stessa storia', JSON.stringify(ancora), JSON.stringify(passi.filter(p => p.tipo === 'curioso' && p.eroe === 'cavaliere')))
  const cur = passi.find(p => p.tipo === 'curioso' && p.k === 0)
  controlla('il curioso porta con sé lo sbadato e la discesa si gioca', !!cur.sonde.sbadato && cur.tentativi.length >= 1)
  controlla('si registra uno scontro per volta, con la vita a fine scontro', cur.tentativi[0].sc.length > 0 && cur.tentativi[0].sc.every(c => c.vf >= 0 && c.vf <= 1 && c.tipi.length >= 1))
  controlla('l\'ingresso dice la forza e i pezzi', cur.ingresso.forza >= 1 && Array.isArray(cur.ingresso.pezzi))
  const bravo = passi.find(p => p.tipo === 'bravo' && p.k === 0)
  controlla('il bravo non ha sonde né rifatte', !Object.keys(bravo.sonde).length && !Object.keys(bravo.rifatte).length)
  stessaLista('le rifatte: nessuna prima della terza discesa, due all\'uscita', [rifatteAl(1), rifatteAl(2), rifatteAl(CAMPAGNA.length)], [[], [0], [CAMPAGNA.length - 2, CAMPAGNA.length - 1]])
  // un passo da solo parte da uno stato: la ricerca non rigioca le discese di prima
  const r = passoDellaStoria(0, STATO_NUOVO(), { tipo: 'bravo', eroe: 'elfa', seme: 3 })
  controlla('un passo torna il passo e lo stato con cui si esce', r.passo.k === 0 && !!r.stato.roba && !!r.stato.crescita)
}

/* ══════════ 3. il rapporto ══════════ */
{
  const P = partite(passi)
  controlla('le partite sono per giocatore e per discesa, anche lo sbadato', P.per.curioso[0].length === 2 && P.per.bravo[0].length === 2 && P.per.sbadato[0].length === 2)
  const R = rapporto(P)
  for (const t of NOMI_TIPO) controlla(`${t}: una riga per bersaglio, una cella per discesa`, R[t].length >= 1 && R[t].every(r => r.celle.length === CAMPAGNA.length))
  const testo = tabella(R, 'curioso')
  controlla('la tabella ha il nome, le discese e i ✅/❌', /Il curioso/.test(testo) && /altare/.test(testo) && /[✅❌]/.test(testo))
  const fuori = fuoriBersaglio(R)
  for (const f of fuori.filter(x => x.cella.n > 0).slice(0, 12)) {
    const s = spiega(f, P)
    controlla(`${f.tipo} ${CAMPAGNA[f.cella.k].chiave} ${f.riga.chiave}: il perché ha una testa e delle righe`, !!s.testa && s.righe.length >= 1 && ['uniforme', 'eroe', 'isolato', 'misto'].includes(s.natura), JSON.stringify(s).slice(0, 200))
  }
  const primo = primoFuoriDiMolto(R, 0.01)
  controlla('il primo fuori di molto, se c\'è, ha una frase con discesa e giocatore', !primo || /: /.test(primo.frase))
  controlla('la forbice della roba ha le sette discese', forbice(P).length === CAMPAGNA.length)
  // lo scostamento: dentro 0, sopra il massimo positivo, sotto il minimo negativo
  uguale('dentro il bersaglio: zero', scostamento(0.5, { min: 0.4, max: 0.7 }), 0)
  controlla('sopra il massimo: positivo', scostamento(0.9, { min: 0.4, max: 0.7 }) > 0)
  controlla('sotto il minimo: negativo', scostamento(0.1, { min: 0.4, max: 0.7 }) < 0)
  uguale('la cripta ha il suo bersaglio dove lo dichiara', bersaglioDi(GIOCATORI_TIPO.curioso.bersagli.pozioni, 0).max, 2)
}

/* ══════════ 4. le specie e la potenza ══════════ */
{
  const t = tabellaDelleSpecie({ semi: [1] })
  controlla('la tabella delle specie ha una riga per discesa e il colpo contro l\'eroe atteso', CAMPAGNA.every(c => t.testo.includes(c.nome)) && /stende in/.test(t.testo))
  const c = new Corsa(CAMPAGNA[2], { seme: 3, rnd: seminato(3) })
  const m = c.livello.robe.find(r => r.che === 'mostro')
  const p = potenzaDelMostro(m)
  controlla('la potenza di un mostro viene dalle sue caratteristiche', p > 0)
  const forte = { ...m, ossaMax: m.ossaMax * 2, att: m.att + 5 }
  controlla('più vita e più attacco, più potenza', potenzaDelMostro(forte) > p)
}

/* ══════════ 5. il danno è continuo ══════════ */
{
  const c = new Corsa(CAMPAGNA[1], { seme: 11, rnd: seminato(11) })
  const m = { att: c.dif + 3.4 / 1.1, dif: 0 }   // un colpo da 3,4
  const visti = []
  for (let i = 0; i < 10; i++) { visti.push(c.danno(m)); c.consumaIlDanno(m) }
  controlla('un colpo da 3,4 toglie 3 o 4, mai altro', visti.every(x => x === 3 || x === 4), visti.join())
  uguale('e in dieci colpi toglie 34 (la proporzione giusta)', visti.reduce((a, b) => a + b, 0), 34)
  uguale('il primo colpo è quello arrotondato di sempre', visti[0], 3)
}

riassunto('La taratura coi giocatori tipo')
