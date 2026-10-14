/* La taratura coi giocatori tipo (docs/sotterraneo/giocatori-tipo.md): non un cancello sui numeri del gioco, ma che lo strumento giri:
   i tre giocatori tipo esistono e giocano come dicono, una storia corta si gioca e si rifà uguale, il rapporto si calcola e spiega
   ogni cella fuori bersaglio, la tabella delle specie si legge, la potenza del mostro porta esperienza e gemme, il danno è continuo; le strade di
   spesa, la fine della discesa e i checkpoint (una tappa da un checkpoint dà gli stessi numeri del giro intero, la firma dice cosa rifare).
   `node test/esegui.mjs sotterraneo-taratura --niente-build` */
import { GIOCATORI_TIPO, NOMI_TIPO, COLPI_PER_STENDERE, stileDi, STRADE, NOMI_STRADA, RISALITA, sogliaDiRisalita } from '../../src/giochi/sotterraneo/dati/giocatori-tipo.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { storiaDi, passoDellaStoria, STATO_NUOVO, rifatteAl, lineeDelGiro, compatta } from '../../src/giochi/sotterraneo/motore/storie.js'
import { allaBottega, gioca } from '../../src/giochi/sotterraneo/motore/banco.js'
import { ROBA_VUOTA } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { eroeAtteso } from '../../src/giochi/sotterraneo/motore/forza.js'
import { dannoPerRisposta, attesoA } from '../../src/giochi/sotterraneo/motore/fine.js'
import { fineDi, tabellaFine, tabellaAtteso, rigaDellaStrada, chiVinceBevendo, tabellaArmi, riassuntoDi } from '../../src/giochi/sotterraneo/motore/rapporto-fine.js'
import { firmeDelleDiscese, scrivi, leggi, validi, scegli } from '../../strumenti/sotterraneo-checkpoint.mjs'
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { partite, rapporto, tabella, spiega, fuoriBersaglio, primoFuoriDiMolto, forbice, scostamento, bersaglioDi } from '../../src/giochi/sotterraneo/motore/rapporto.js'
import { tabellaDelleSpecie } from '../../src/giochi/sotterraneo/motore/specie.js'
import { potenzaDelMostro } from '../../src/giochi/sotterraneo/motore/potenza.js'
import { prezziAlLivello } from '../../src/giochi/sotterraneo/motore/salti.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
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
  uguale('lo sbadato gioca come il curioso', JSON.stringify(stileDi('sbadato')), JSON.stringify(stileDi('curioso')))
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

/* ══════════ 6. le strade di spesa ══════════ */
{
  stessaLista('due strade: arma prima e beve tutto', NOMI_STRADA, ['armaPrima', 'beveTutto'])
  uguale('arma prima è lo stile di sempre', JSON.stringify(stileDi('curioso', 'armaPrima')), JSON.stringify(GIOCATORI_TIPO.curioso.stile))
  controlla('beve tutto beve prima, anche nello scontro', stileDi('curioso', 'beveTutto').beviSotto > stileDi('curioso').beviSotto && stileDi('bravo', 'beveTutto').beviNelloScontro === true)
  uguale('lo sbadato su una strada è il curioso su quella', JSON.stringify(stileDi('sbadato', 'beveTutto')), JSON.stringify(stileDi('curioso', 'beveTutto')))
  // con poche gemme, chi compra le pozioni prima ha più pozioni e meno pezzi
  const con = spesa => allaBottega({ ...ROBA_VUOTA(), gemme: 150 }, { finite: 1, eroe: 'cavaliere', seme: 5, spesa })
  const pozioni = r => r.zaino.filter(k => COSE[k].usa === 'cura').length
  const pezzi = r => [r.mano, r.mancina, r.corpo, r.collo, r.dito, r.dito2].filter(Boolean).length
  const meglio = con(STRADE.armaPrima.spesa), bevo = con(STRADE.beveTutto.spesa)
  controlla('pozioni prima: più pozioni', pozioni(bevo) > pozioni(meglio), `${pozioni(bevo)} contro ${pozioni(meglio)}`)
  controlla('pozioni prima: meno pezzi addosso', pezzi(bevo) < pezzi(meglio), `${pezzi(bevo)} contro ${pezzi(meglio)}`)
  // la storia di una strada si gioca e porta la strada nel passo, con quello che si aveva prima di spendere
  const p = storiaDi({ tipo: 'sbadato', eroe: 'nano', seme: 2, fino: 1, strada: 'beveTutto' })
  controlla('il passo dice la strada e il giocatore', p.every(x => x.strada === 'beveTutto' && x.tipo === 'sbadato'))
  controlla('il passo dice cosa si aveva prima di spendere', p[1].prima.gemme >= 0 && p[1].prima.poz >= 0 && p[0].prima.gemme === 0)
  // le linee di un giro: la base porta sonde e rifatte, le altre sono compatte e più corte
  const linee = lineeDelGiro({ eroi: ['mago', 'nano'], semi: 5, semiStrade: 3 })
  uguale('sei linee: tre giocatori su due strade', linee.length, 6)
  controlla('la base è il curioso e il bravo di arma prima, con le loro storie', linee.filter(l => l.base).map(l => l.id).join() === 'armaPrima·curioso,armaPrima·bravo' && linee[0].storie.length === 10)
  controlla('le altre sono corte e compatte', linee.filter(l => !l.base).every(l => l.storie.length === 6 && l.compatta))
  uguale('solo il curioso di base porta lo sbadato come sonda', linee.filter(l => l.sonde.length).map(l => l.id).join(), 'armaPrima·curioso')
  const intero = storiaDi({ tipo: 'bravo', eroe: 'mago', seme: 1, fino: 0 })[0]
  controlla('un passo compatto tiene l\'esito e perde gli scontri', compatta(intero).tentativi.every(t => t.v !== undefined && t.sc === undefined) && intero.tentativi[0].sc.length > 0)
}

/* ══════════ 7. a che punto è l'eroe alla fine ══════════ */
{
  const cur = passi.filter(p => p.tipo === 'curioso'), F = fineDi(cur)
  uguale('la fine della discesa 0 ha una voce per storia', F[0].n, 2)
  controlla('la discesa 2 non è stata giocata: nessuna voce', F[2].n === 0)
  controlla('le letture hanno senso: forza, danno, valore, gemme', F[0].dpa.every(x => x > 0) && F[0].valore.every(x => x >= 0) && F[0].gemme.every(x => x >= 0))
  const t = tabellaFine(F, 'prova')
  controlla('la tabella ha una riga per misura con le code e la mediana', /forza sull'atteso/.test(t) && /danno a risposta/.test(t) && /·/.test(t))
  controlla('l\'atteso ha una riga per misura', /livello/.test(tabellaAtteso()) && /valore roba/.test(tabellaAtteso()))
  const a = attesoA('mago', 1)
  controlla('l\'eroe atteso si legge come gli altri', a.liv === 2 && a.dpa > 0 && a.vita > 0)
  controlla('un eroe più avanti toglie di più a ogni risposta, contro lo stesso mostro', dannoPerRisposta(eroeAtteso('cavaliere', 8), 2) > dannoPerRisposta(eroeAtteso('cavaliere', 2), 2))
  const r = rigaDellaStrada(F)
  controlla('la riga della strada ha vinte alla prima, bloccati, dove si ferma', r.allaPrima.length === 7 && r.bloccati.length === 7 && 'ferma' in r)
  const b = chiVinceBevendo(F)
  controlla('chi vince bevendo ha le due metà', b.beve.n + b.altri.n > 0 && 'quota' in b)
}

/* ══════════ 8. i checkpoint ══════════ */
{
  // una tappa dal checkpoint dà gli stessi numeri del giro intero: lo stato passa per un file e torna
  const intera = storiaDi({ tipo: 'curioso', eroe: 'elfa', seme: 2, fino: 2 })
  let stato = STATO_NUOVO()
  const tappe = []
  for (let k = 0; k <= 1; k++) { const r = passoDellaStoria(k, stato, { tipo: 'curioso', eroe: 'elfa', seme: 2, sonde: ['sbadato'], rifai: rifatteAl(k) }); tappe.push(r.passo); stato = r.stato }
  const dir = mkdtempSync(join(tmpdir(), 'taratura-'))
  scrivi(dir, 1, { firma: 'f1', linee: { 'armaPrima·curioso': [{ passo: tappe[1], stato }] } })
  const letto = leggi(dir, 1).linee['armaPrima·curioso'][0]
  const ripresa = passoDellaStoria(2, letto.stato, { tipo: 'curioso', eroe: 'elfa', seme: 2, sonde: ['sbadato'], rifai: rifatteAl(2) })
  uguale('la tappa dal checkpoint è la tappa del giro intero', JSON.stringify(ripresa.passo), JSON.stringify(intera[2]))
  uguale('e anche la discesa prima, riletta dal file', JSON.stringify(letto.passo), JSON.stringify(intera[1]))
  uguale('la testa si legge senza il corpo', leggi(dir, 1, { soloLaTesta: true }).firma, 'f1')

  // la firma: una riga ritoccata cambia quella discesa e le dopo, non le prima
  const radice = join(dir, 'gioco')
  mkdirSync(radice, { recursive: true })
  writeFileSync(join(radice, 'a.js'), 'import { b } from \'./b.js\'\nexport const a = b\n')
  writeFileSync(join(radice, 'b.js'), 'export const b = 1\n')
  const campagna = { CAMPAGNA: [{ forza: 1 }, { forza: 2 }, { forza: 3 }], TETTO: 9 }
  const firme = opz => firmeDelleDiscese({ entrate: ['a.js'], radice, campagna, righe: 3, ...opz })
  const base = firme({})
  uguale('la stessa campagna, le stesse firme', firme({}).join(), base.join())
  const ritoccata = firme({ campagna: { ...campagna, CAMPAGNA: [{ forza: 1 }, { forza: 5 }, { forza: 3 }] } })
  controlla('una riga ritoccata: la prima resta, quella e le dopo cambiano', ritoccata[0] === base[0] && ritoccata[1] !== base[1] && ritoccata[2] !== base[2])
  controlla('un valore della campagna che non è una riga cambia tutte', firme({ campagna: { ...campagna, TETTO: 8 } }).every((f, k) => f !== base[k]))
  controlla('i valori provati a mano per tutte cambiano tutte', firme({ generale: 'livelli.A=40' }).every((f, k) => f !== base[k]))
  controlla('un dato extra (come si gioca) cambia tutte', firme({ extra: { tentativi: 3 } }).every((f, k) => f !== base[k]))
  writeFileSync(join(radice, 'b.js'), '// un commento in testa\n/* e un blocco\n   su due righe */\nexport const b = 1\n')
  uguale('un commento ritoccato non cambia le firme', firme({}).join(), base.join())
  writeFileSync(join(radice, 'b.js'), 'export const b = 2\n')
  controlla('un file importato da un file importato cambia tutte', firme({}).every((f, k) => f !== base[k]))
  writeFileSync(join(radice, 'b.js'), 'export const b = 1\n')

  // quanti checkpoint di fila valgono, e che storie hanno
  const storie = [{ passo: { eroe: 'mago', seme: 1 }, stato: 1 }, { passo: { eroe: 'mago', seme: 2 }, stato: 2 }]
  for (let k = 0; k < 3; k++) scrivi(dir, k, { firma: base[k], linee: { l: storie } })
  uguale('tre checkpoint buoni', validi(dir, base, { l: ['mago|1', 'mago|2'] }), 3)
  uguale('un giro più piccolo si serve da quelli salvati', validi(dir, base, { l: ['mago|2'] }), 3)
  uguale('uno più grande no', validi(dir, base, { l: ['mago|1', 'mago|3'] }), 0)
  uguale('e una linea che non c\'è nemmeno', validi(dir, base, { altra: ['mago|1'] }), 0)
  uguale('le storie richieste, nell\'ordine in cui si chiedono', scegli(storie, ['mago|2', 'mago|1']).map(x => x.stato).join(), '2,1')
  uguale('una discesa toccata e quelle dopo si rifanno, le prima restano', validi(dir, ritoccata, { l: ['mago|1'] }), 1)
  scrivi(dir, 1, { firma: 'vecchia', linee: { l: storie } })
  uguale('una discesa vecchia in mezzo: valgono quelle prima, non quelle dopo anche se tornano', validi(dir, base, { l: ['mago|1'] }), 1)
  rmSync(dir, { recursive: true, force: true })
}

/* ══════════ 9. le risalite: tornare su dal portale a spendere ══════════ */
{
  controlla('la soglia sale col livello e non scende', [1, 2, 5, 10, 14].every((L, i, v) => i === 0 || sogliaDiRisalita(L) >= sogliaDiRisalita(v[i - 1])))
  const prezzi = prezziAlLivello('cavaliere', 8, 1)
  const med = v => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)]
  controlla('i salti di un livello hanno un prezzo, e i sogni costano di più', prezzi.salti.length > 0 && prezzi.sogni.length > 0 && med(prezzi.sogni) > med(prezzi.salti))
  // una discesa della miniera giocata con molte gemme in tasca: sale, cammina davvero fino al portale e spende
  const k = 4, eroe = 'cavaliere'
  const via = (acceso, extra = {}) => {
    RISALITA.acceso = acceso
    try { return gioca(CAMPAGNA[k], { seme: 11, bravura: 0.9, come: 'tutto', eroe, roba: { ...robaAttesa(eroe, k), gemme: 900 }, crescita: crescitaAttesa(eroe, k), stile: stileDi('curioso'),
                                       risalita: { spesa: STRADE.armaPrima.spesa, finite: k, seme: 5, botteghe: {}, obiettivo: 100 }, ...extra }) } finally { RISALITA.acceso = 1 }
  }
  const con = via(1), senza = via(0)
  controlla('con le risalite accese sale almeno una volta, camminando', con.risalite.length >= 1 && con.risalite.every(r => r.ca >= 0 && r.sp >= 0 && Array.isArray(r.pz)), JSON.stringify(con.risalite).slice(0, 200))
  uguale('spente, non sale mai', senza.risalite.length, 0)
  controlla('le armi nuove si contano: trovate e inutili sono numeri', Number.isInteger(con.armi.trovati) && Number.isInteger(con.armi.inutili))
  controlla('chi sale spende: non finisce con le gemme di partenza', con.risalite.some(r => r.sp > 0) && con.corsa.roba.gemme < 900 + con.esito.gemme)
  uguale('lo stesso seme, la stessa discesa', JSON.stringify(via(1).risalite), JSON.stringify(con.risalite))
  // una storia con le risalite porta i numeri nel passo e nelle tabelle
  const p = storiaDi({ tipo: 'curioso', eroe: 'mago', seme: 3, fino: 2 })
  controlla('il passo ha le armi comprate prima di scendere, e le risalite per tentativo', p.every(x => Number.isInteger(x.pre)) && p[2].tentativi.every(t => Array.isArray(t.ri) && t.ar))
  const F = fineDi(p)
  controlla('la fine ha le risalite e le armi', F[1].n === 1 && F[1].ris.length === 1 && F[1].comprati.length === 1 && F[1].trovati.length === 1)
  controlla('la tabella delle armi ha comprate, trovate, utili e inutili', /comprate/.test(tabellaArmi(F, 'x')) && /utili in tutto/.test(tabellaArmi(F, 'x')) && /inutili/.test(tabellaArmi(F, 'x')))
  controlla('il riassunto per il prima → dopo ha le misure', riassuntoDi(F)[1].utili != null && riassuntoDi(F)[1].ris != null)
  // il banco pescato resta lo stesso fra una visita e l'altra (senza gemme: comprare lo cambierebbe)
  const botteghe = {}
  allaBottega({ ...robaAttesa('mago', 3), gemme: 50 }, { finite: 3, eroe: 'mago', seme: 4, crescita: crescitaAttesa('mago', 3), scaffale: true, botteghe })
  const banchi = JSON.stringify(botteghe.banchi)
  allaBottega({ ...robaAttesa('mago', 3), gemme: 0 }, { finite: 3, eroe: 'mago', seme: 99, crescita: crescitaAttesa('mago', 3), scaffale: true, botteghe })
  uguale('riaprire la bottega non cambia il banco', JSON.stringify(botteghe.banchi), banchi)
}

riassunto('La taratura coi giocatori tipo')
