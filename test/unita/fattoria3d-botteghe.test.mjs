/* Le botteghe del paese della fattoria 3D (giro G7), senza browser: pasticceria, osteria, mensa e merceria sono quelle della 2D (prezzo,
   livello, clienti per mestiere, un cliente per bancone, una merce sola, 2–4 pezzi, il prossimo fra 10 e 20 minuti, +25% del banco, la fama a
   cuori: cinque per un bancone in più, fino a tre); pagano esperienza e mai monete, dentro il tetto di 🪙6 al minuto; si mettono dove si
   vuole come ogni edificio; lo stato di prima si legge, quello rotto si rimette in forma.
   `node test/esegui.mjs fattoria3d-botteghe`
   tempo: 1 */
import {
  BOTTEGHE, TIPI_DI_BOTTEGA, SORELLA_2D, MERCE_3D, prodotto2D, PEZZI_MIN, PEZZI_MAX, ATTESA_MIN, ATTESA_MAX, CUORI, BANCONI_MAX, PIU_DEL_BANCO, premioInBottega,
} from '../../src/giochi/fattoria3d/dati/botteghe.js'
import {
  guastiDelleBotteghe, famaDi, componiCliente, leggiLeBotteghe, merciDellaBottega, livelloDellaMerce, aggiornaLaBottega, botteghePosate,
} from '../../src/giochi/fattoria3d/motore/botteghe.js'
import * as D2 from '../../src/giochi/fattoria/dati/botteghe.js'
import { premioPer, CLIENTI as CLIENTI_2D } from '../../src/giochi/fattoria/dati/mercato.js'
import { PER_ID as VOCI_2D } from '../../src/giochi/fattoria/dati/catalogo.js'
import { livelloDellaVoce } from '../../src/giochi/fattoria/dati/livelli.js'
import { EDIFICI, PEZZI, TIPI_DI_EDIFICIO } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { guastiDelCatalogo } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { guastiDeiLivelli, sogliaDi, livelloPer, ULTIMO } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { guastiDelMondo, POSTI_STORICI } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { guastiDegliAlberi } from '../../src/giochi/fattoria3d/dati/alberi.js'
import { guastiDellaScala } from '../../src/giochi/fattoria3d/motore/taratura.js'
import { guastiDelleCarte, DISEGNI } from '../../src/giochi/fattoria3d/dati/carte.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { Fattoria } from '../../src/giochi/fattoria/motore/fattoria.js'
import { statoDa2D, pezzoPer } from '../../src/giochi/fattoria3d/motore/migra.js'
import { normalizza, statoIniziale } from '../../src/giochi/fattoria3d/motore/stato.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const MIN = 60000
const sequenza = (seme = 7) => { let x = seme; return () => (x = (x * 16807) % 2147483647) / 2147483647 }

/** Una fattoria al livello `liv` con la bottega `tipo` messa (se `tipo`); `t.ora` è l'orologio, `b.monete` le monete (non devono muoversi). */
function mondo({ liv = ULTIMO, tipo = null, stato = null, rnd = sequenza() } = {}) {
  const b = { monete: 5000 }, t = { ora: 1_000_000_000 }
  const f = new Fattoria3d({ stato, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd })
  f.s.esperienza = sogliaDi(liv)
  if (tipo) f.s.posseduti[tipo] = true
  f.tick()
  return { f, b, t }
}
const dai = (f, k, n) => { if (COLTURE[k]) f.s.merci[k] = (f.s.merci[k] || 0) + n; else if (k === 'lana') f.s.lana += n; else f.s.prodotti[k] = (f.s.prodotti[k] || 0) + n }
const primo = (f, tipo) => f.vistaBottega(tipo).banconi.find(x => x.cliente)      // il bancone col cliente: { id, cliente (chi è), chiede, xp, pronto }
const forniscilo = (f, c) => { for (const x of c.chiede) dai(f, x.k, x.manca) }

/* ══════════ 1. i dati sono quelli della 2D ══════════ */
const guasti = guastiDelleBotteghe()
controlla('i dati delle botteghe non hanno guasti (il tetto compreso)', guasti.length === 0, guasti.join(' · '))
controlla('anche quelli della 2D non ne hanno (il confronto ha senso)', D2.guastiDelleBotteghe().length === 0)
stessaLista('le costanti sono quelle della 2D', [PEZZI_MIN, PEZZI_MAX, ATTESA_MIN, ATTESA_MAX, CUORI, BANCONI_MAX, PIU_DEL_BANCO], [D2.PEZZI_MIN, D2.PEZZI_MAX, D2.ATTESA_MIN, D2.ATTESA_MAX, D2.CUORI, D2.BANCONI_MAX, D2.PIU_DEL_BANCO])
stessaLista('e sono quelle del documento: 2–4 pezzi, 10–20 minuti, 5 cuori, 3 banconi, +25%', [PEZZI_MIN, PEZZI_MAX, ATTESA_MIN, ATTESA_MAX, CUORI, BANCONI_MAX, PIU_DEL_BANCO], [2, 4, 10, 20, 5, 3, 1.25])
stessaLista('quattro botteghe: pasticceria, osteria, mensa, merceria', TIPI_DI_BOTTEGA, ['bottega_pasticceria', 'bottega_osteria', 'bottega_mensa', 'bottega_merceria'])
{
  const attesi = { bottega_pasticceria: [180, 21], bottega_osteria: [220, 29], bottega_mensa: [200, 36], bottega_merceria: [240, 43] }
  for (const tipo of TIPI_DI_BOTTEGA) {
    const v = VOCI_2D[SORELLA_2D[tipo]], E = EDIFICI[tipo]
    stessaLista(`${tipo}: costa e arriva come in 2D`, [E.prezzo, E.liv], [v.prezzo, livelloDellaVoce(v)])
    stessaLista(`${tipo}: 🪙${attesi[tipo][0]}, livello ${attesi[tipo][1]}`, [E.prezzo, E.liv], attesi[tipo])
    controlla(`${tipo}: è un edificio unico e non una macchina`, E.bottega && E.categoria === 'edifici' && TIPI_DI_EDIFICIO.includes(tipo) && !PEZZI[tipo] && !Object.values(RICETTE).some(r => r.dove === tipo))
    stessaLista(`${tipo}: i clienti sono quelli della 2D`, BOTTEGHE[tipo].clienti, v.posto.clienti)
    const resto = v.posto.chiede.filter(p => !MERCE_3D(p))
    controlla(`${tipo}: di ciò che la 2D chiede la 3D non ha solo ${resto.join(', ') || 'niente'} (la merenda e le caramelle)`, resto.every(p => ['merenda', 'caramelle'].includes(p)), resto.join())
    stessaLista(`${tipo}: le altre merci ci sono tutte, nell'ordine della 2D`, BOTTEGHE[tipo].merci, v.posto.chiede.map(MERCE_3D).filter(Boolean))
    controlla(`${tipo}: ogni merce esiste (raccolto, ricetta, uova, latte, tartufi o lana)`, BOTTEGHE[tipo].merci.every(k => COLTURE[k] || RICETTE[k] || ['uova', 'latte', 'tartufi', 'lana'].includes(k)))
  }
  uguale('la pasticceria 3D ha il nome nuovo: `pasticceria` resta il Pastificio', EDIFICI.pasticceria.nome, 'Pastificio')
  stessaLista('i nomi delle merci: il carota 3D è la carote 2D, il foraggio resta foraggio', [prodotto2D('carota'), prodotto2D('foraggio_carote'), MERCE_3D('carote'), MERCE_3D('fragole')], ['carote', 'foraggio', 'carota', 'fragola'])
}
{
  const g = [...guastiDelCatalogo(), ...guastiDeiLivelli(), ...guastiDelMondo(), ...guastiDegliAlberi(), ...guastiDellaScala(), ...guastiDelleCarte()]
  controlla('catalogo, livelli, mondo, alberi, scala e carte sono sani con le botteghe dentro', g.length === 0, g.join(' · '))
  controlla('ogni bottega ha il suo posto di prima (solo per i controlli: nuovo) e il suo disegno di carta', TIPI_DI_BOTTEGA.every(t => POSTI_STORICI[t] && POSTI_STORICI[t].nuovo && DISEGNI[t]))
}

/* ══════════ 2. un cliente è sempre un cliente di quel mestiere, e il premio è il +25% del banco ══════════ */
{
  let n = 0, fuori = ''
  for (const tipo of TIPI_DI_BOTTEGA) for (let liv = EDIFICI[tipo].liv; liv <= ULTIMO; liv += 3) for (let seme = 1; seme <= 25; seme++) {
    const { f } = mondo({ liv, rnd: sequenza(liv * 97 + seme), tipo }), rnd = sequenza(seme + liv)
    const c = componiCliente(f, tipo, rnd, 1, []); n++
    if (!c) { fuori = `${tipo} liv ${liv}: nessun cliente`; continue }
    const [[k, q]] = Object.entries(c.chiede), p2 = prodotto2D(k)
    if (Object.keys(c.chiede).length !== 1) fuori = `${tipo}: più di una merce`
    if (!BOTTEGHE[tipo].merci.includes(k)) fuori = `${tipo}: ${k} non è nel suo elenco`
    if (livelloDellaMerce(k) > liv) fuori = `${tipo} liv ${liv}: ${k} non si fa ancora`
    if (!(q >= PEZZI_MIN && q <= PEZZI_MAX)) fuori = `${tipo}: ${q} pezzi`
    if (!BOTTEGHE[tipo].clienti.includes(c.chi)) fuori = `${tipo}: il cliente ${c.chi} non è suo`
    const chi = CLIENTI_2D.find(x => x.id === c.chi)
    if (chi.vuole && !chi.vuole.includes(p2) && BOTTEGHE[tipo].clienti.some(id => { const y = CLIENTI_2D.find(z => z.id === id); return !y.vuole || y.vuole.includes(p2) })) fuori = `${tipo}: ${c.chi} non vuole ${p2}`
    if (c.xp !== Math.round(premioPer({ [p2]: q }) * 1.25) || c.xp !== D2.premioInBottega(p2, q)) fuori = `${tipo}: premio ${c.xp} per ${q} ${k}`
    if (!(c.xp >= 1)) fuori = `${tipo}: premio non positivo`
  }
  controlla(`${n} clienti composti: una merce sola, 2–4 pezzi, dell'elenco, già fattibile, di un suo mestiere, col +25% della 2D`, fuori === '', fuori)
}
{
  // la mensa è per i bambini: la maestra e il bidello; l'osteria quattro mestieri; una merce che un mestiere vuole va a lui
  stessaLista('mensa: maestra e bidello', BOTTEGHE.bottega_mensa.clienti, ['maestra', 'bidello'])
  stessaLista('osteria: oste, cuoco, pizzaiolo, cuoco del sushi', BOTTEGHE.bottega_osteria.clienti, ['oste', 'cuoco', 'pizzaiolo', 'sushi'])
  stessaLista('merceria: sarta e lavandaia', BOTTEGHE.bottega_merceria.clienti, ['sarta', 'lavandaia'])
  stessaLista('pasticceria: pasticcera e maestra', BOTTEGHE.bottega_pasticceria.clienti, ['pasticcera', 'maestra'])
  const visti = new Set()
  for (let seme = 1; seme <= 300; seme++) { const { f } = mondo({ tipo: 'bottega_osteria', rnd: sequenza(seme) }); const c = componiCliente(f, 'bottega_osteria', sequenza(seme * 100003 + 11), 1, []); if (c) visti.add(c.chi) }
  controlla('all\'osteria, col tempo, vengono tutti e quattro i mestieri', visti.size === 4, [...visti].join())
}
{
  // il tetto: nessun cliente di nessuna bottega rende più di 🪙6 al minuto di lavoro, con i minuti della 3D
  const { f } = mondo({ tipo: 'bottega_osteria' })
  controlla('premioInBottega è il banco ×1,25 arrotondato, con lo stesso conto', premioInBottega('pane', 3) === Math.round(premioPer({ pane: 3 }) * PIU_DEL_BANCO))
  controlla('e una merce che la 3D non ha non esiste', MERCE_3D('merenda') === null && MERCE_3D('caramelle') === null && merciDellaBottega(f, 'bottega_osteria').every(Boolean))
}

/* ══════════ 3. mettere la bottega: come ogni edificio, e non lavora se non c'è ══════════ */
{
  const { f, b } = mondo({ liv: 21 })
  const tipo = 'bottega_pasticceria'
  stessaLista('non tua: la vista lo dice', [f.vistaBottega(tipo).stato, f.vistaBottega(tipo).banconi.length, f.vistaBottega(tipo).prezzo], ['non-tua', 0, 180])
  stessaLista('e non si consegna né si rifiuta', [f.consegnaBottega(tipo, 1).motivo, f.rifiutaBottega(tipo, 1).motivo], ['niente-bottega', 'niente-bottega'])
  controlla('senza bottega non arriva nessun cliente', f.s.botteghe[tipo] === undefined && f.botteghePronte() === 0 && botteghePosate(f).length === 0)
  const sotto = mondo({ liv: 20 }).f
  uguale('sotto il livello 21 non si compra', sotto.compraPezzo(tipo).motivo, 'non-sbloccato')
  const prima = b.monete
  const r = f.compraEdificio(tipo)
  controlla('al 21 si compra e si mette dove ci sta', r.ok && f.s.posseduti[tipo] && b.monete === prima - 180)
  controlla('una seconda no: è unica', f.compraPezzo(tipo).motivo === 'gia-tuo')
  f.tick()
  const v = f.vistaBottega(tipo)
  stessaLista('messa, la bottega apre con un bancone e un cliente', [v.stato, v.banconi.length, !!v.banconi[0].cliente, v.fama.banconi, v.fama.cuori], ['aperta', 1, true, 1, 0])
  controlla('il cliente ha un mestiere, una merce, un premio', v.banconi[0].cliente.id && v.banconi[0].chiede.length === 1 && v.banconi[0].xp >= 1 && BOTTEGHE[tipo].clienti.includes(v.banconi[0].cliente.id))
  const via = f.mettiVia(f.cosaDi(tipo).id)
  controlla('si può mettere via (non lavora), il cliente resta salvato', via.ok && !f.s.posseduti[tipo] && f.s.botteghe[tipo].banconi.length === 1)
  uguale('e nel magazzino non fa niente', f.vistaBottega(tipo).stato, 'non-tua')
}

/* ══════════ 4. consegnare: esperienza e mai monete, la roba scende, l'attesa è di 10–20 minuti ══════════ */
{
  const { f, b, t } = mondo({ liv: 30, tipo: 'bottega_osteria' })
  const tipo = 'bottega_osteria'
  const c = primo(f, tipo)
  const r0 = f.consegnaBottega(tipo, c.id)
  controlla('senza la roba non si consegna: dice cosa manca', !r0.ok && r0.motivo === 'mancano' && Object.keys(r0.mancano)[0] === c.chiede[0].k && r0.mancano[c.chiede[0].k] === c.chiede[0].n)
  uguale('e non cambia niente', f.s.esperienza, sogliaDi(30))
  stessaLista('un cliente che non c\'è', [f.consegnaBottega(tipo, 999).motivo, f.rifiutaBottega(tipo, 999).motivo], ['non-esiste', 'non-esiste'])
  f.prendiEventi()
  forniscilo(f, c)
  controlla('con la roba il cliente è pronto e il cartello conta uno', f.bottegaPronta(tipo) === 1 && f.botteghePronte() === 1)
  const xp0 = f.s.esperienza
  const r = f.consegnaBottega(tipo, c.id)
  controlla('si consegna: l\'esperienza sale del premio, nessuna moneta entra', r.ok && r.xp === c.xp && f.s.esperienza === xp0 + c.xp && b.monete === 5000)
  controlla('la roba è partita', f.scortaDi(c.chiede[0].k) === 0)
  const e = f.prendiEventi().filter(x => x.tipo === 'bottega')
  controlla('l\'evento dice bottega, cliente ed esperienza', e.length === 1 && e[0].bottega === tipo && e[0].xp === c.xp && e[0].cliente === c.cliente.id)
  const v = f.vistaBottega(tipo)
  controlla('il bancone ora aspetta: 10–20 minuti', v.banconi[0].attesa && v.banconi[0].minuti >= ATTESA_MIN && v.banconi[0].minuti <= ATTESA_MAX && r.attesa >= ATTESA_MIN && r.attesa <= ATTESA_MAX)
  uguale('e un cuore è acceso', v.fama.cuori, 1)
  // finché non è l'ora, nessuno
  t.ora += (ATTESA_MIN - 1) * MIN; f.tick()
  controlla('prima dei dieci minuti nessun cliente', !primo(f, tipo))
  t.ora += (ATTESA_MAX - ATTESA_MIN + 2) * MIN; f.tick()
  controlla('dopo venti ne arriva un altro', !!primo(f, tipo) && primo(f, tipo).cliente.id)
  uguale('il premio non è mai moneta: le monete sono rimaste quelle', b.monete, 5000)
}
{
  // «non mi va»: costa quanto una consegna (stesso intervallo), non dà esperienza, non è un cuore
  const { f, t } = mondo({ liv: 30, tipo: 'bottega_mensa' })
  const tipo = 'bottega_mensa', c = primo(f, tipo), xp = f.s.esperienza
  const r = f.rifiutaBottega(tipo, c.id)
  controlla('rifiutare: ok, 10–20 minuti d\'attesa, niente esperienza, niente cuore', r.ok && r.attesa >= ATTESA_MIN && r.attesa <= ATTESA_MAX && f.s.esperienza === xp && f.vistaBottega(tipo).fama.cuori === 0)
  t.ora += ATTESA_MAX * MIN + 1; f.tick()
  controlla('e il cliente dopo arriva', !!primo(f, tipo))
}

/* ══════════ 5. la fama: cinque cuori un bancone, fino a tre, e il bancone nuovo ha subito il suo cliente ══════════ */
{
  stessaLista('famaDi: 0 consegne = un bancone, 0 cuori', [famaDi(null).banconi, famaDi({ consegne: 0 }).cuori], [1, 0])
  stessaLista('4 consegne = un bancone, 4 cuori; 5 = due banconi e i cuori ripartono', [famaDi({ consegne: 4 }).banconi, famaDi({ consegne: 4 }).cuori, famaDi({ consegne: 5 }).banconi, famaDi({ consegne: 5 }).cuori], [1, 4, 2, 0])
  stessaLista('10 = tre banconi (il massimo); 99 = tre, cuori pieni, piena', [famaDi({ consegne: 10 }).banconi, famaDi({ consegne: 99 }).banconi, famaDi({ consegne: 99 }).cuori, famaDi({ consegne: 99 }).piena], [3, 3, 5, true])
  const { f, t } = mondo({ liv: 40, tipo: 'bottega_mensa' })
  const tipo = 'bottega_mensa'
  let cresciuta = 0, ultima = null
  for (let n = 1; n <= 12; n++) {
    t.ora += (ATTESA_MAX + 1) * MIN; f.tick()
    const c = primo(f, tipo)
    if (!c) { controlla(`consegna ${n}: c'è un cliente`, false); break }
    forniscilo(f, c)
    const r = f.consegnaBottega(tipo, c.id)
    if (!r.ok) { controlla(`consegna ${n} riuscita`, false, r.motivo); break }
    ultima = r
    if (r.cresciuta) cresciuta++
    if (n === 4) uguale('dopo 4 consegne, un bancone', f.vistaBottega(tipo).banconi.length, 1)
    if (n === 5) uguale('alla quinta il bancone è due, e il secondo ha già un cliente', f.vistaBottega(tipo).banconi.filter(x => x.cliente).length, 1)
  }
  uguale('la bottega è cresciuta due volte in dodici consegne (alla 5ª e alla 10ª)', cresciuta, 2)
  const v = f.vistaBottega(tipo)
  stessaLista('dodici consegne: tre banconi, famosa (cuori pieni)', [v.banconi.length, v.fama.cuori, v.fama.piena], [3, CUORI, true])
  controlla('i clienti dei banconi chiedono merci diverse (se la bottega ne ha di diverse)', (() => { const ks = v.banconi.filter(x => x.cliente).map(x => x.chiede[0].k); return new Set(ks).size === ks.length })())
  controlla('con le consegne che salgono la fama non scende mai e si ferma a tre banconi', Array.from({ length: 60 }, (_, n) => famaDi({ consegne: n }).banconi).every((b, i, a) => b <= 3 && (i === 0 || b >= a[i - 1])))
  stessaLista('il salvataggio tiene le consegne', [f.serializza().botteghe[tipo].consegne, normalizza(f.serializza()).botteghe[tipo].consegne], [ultima ? 12 : 0, 12])
}

/* ══════════ 6. cosa si può chiedere dipende dal livello ══════════ */
{
  for (const tipo of TIPI_DI_BOTTEGA) {
    const { f } = mondo({ liv: EDIFICI[tipo].liv, tipo })
    controlla(`${tipo}: appena aperta ha almeno tre merci già chiedibili, tutte già fattibili`, merciDellaBottega(f, tipo).length >= 3 && merciDellaBottega(f, tipo).every(k => livelloDellaMerce(k) <= EDIFICI[tipo].liv))
  }
  const alto = mondo({ liv: ULTIMO, tipo: 'bottega_osteria' }).f, basso = mondo({ liv: 29, tipo: 'bottega_osteria' }).f
  controlla('più sale il livello più merci chiede (il sushi non è per il livello 29)', merciDellaBottega(alto, 'bottega_osteria').length > merciDellaBottega(basso, 'bottega_osteria').length && !merciDellaBottega(basso, 'bottega_osteria').includes('sushi'))
  controlla('uova, latte, tartufi e lana contano col livello del pezzo che li fa', Number.isFinite(livelloDellaMerce('uova')) && Number.isFinite(livelloDellaMerce('latte')) && Number.isFinite(livelloDellaMerce('lana')) && Number.isFinite(livelloDellaMerce('tartufi')))
}

/* ══════════ 7. lo stato: uno di prima si legge, uno rotto si rimette in forma ══════════ */
{
  const vecchio = statoIniziale(); delete vecchio.botteghe
  const n = normalizza(vecchio)
  controlla('uno stato di prima (senza botteghe) si legge: nascono vuote', JSON.stringify(n.botteghe) === '{}')
  controlla('lo stato nuovo parte con `botteghe` vuoto', JSON.stringify(statoIniziale().botteghe) === '{}')
  for (const rotto of [null, 5, 'x', [], { bottega_osteria: 5 }, { bottega_osteria: { banconi: 'x' } }, { qualunque: { consegne: 3 } }, { bottega_osteria: { consegne: 'x', banconi: [1, 'a', { chiede: 'x' }, { chiede: { grano: 9 } }, { chiede: { pane: 99 } }, { chiede: { pane: 2, pasta: 2 } }] } }]) {
    let ok = true, r
    try { r = normalizza({ botteghe: rotto }).botteghe } catch (e) { ok = false }
    controlla(`uno stato rotto non lancia e dà botteghe in forma (${JSON.stringify(rotto)})`, ok && r && typeof r === 'object' && Object.values(r).every(b => b.consegne >= 0 && Array.isArray(b.banconi) && b.banconi.length <= BANCONI_MAX && b.banconi.every(x => x === null || x.dal > 0 || (x.chiede && Object.keys(x.chiede).length === 1))))
  }
  controlla('le botteghe che non esistono si scartano', Object.keys(leggiLeBotteghe({ pasticceria: { consegne: 4 }, bottega_mensa: { consegne: 4 } })).join() === 'bottega_mensa')
  const buono = leggiLeBotteghe({ bottega_osteria: { consegne: 7, prossimo: 3, banconi: [{ id: 2, chi: 'oste', chiede: { pane: 3 }, xp: 99999 }, { dal: 5000 }, { id: 9, chi: 'boh', chiede: { sushi: 99 } }, null, { dal: 1 }] } }).bottega_osteria
  controlla('di un cliente buono si tiene il valido: premio ricalcolato dalla 2D, mestiere sconosciuto → un altro, banconi al più tre', buono.consegne === 7 && buono.banconi.length === 3 && buono.banconi[0].xp === premioInBottega('pane', 3) && buono.banconi[1].dal === 5000 && buono.banconi[2] === null && buono.prossimo >= 3)
  // il giro completo: salva, rileggi, stesso stato
  const { f, t } = mondo({ liv: 40, tipo: 'bottega_mensa' })
  const c = primo(f, 'bottega_mensa'); forniscilo(f, c); f.consegnaBottega('bottega_mensa', c.id)
  t.ora += 21 * MIN; f.tick()
  const salvato = JSON.parse(JSON.stringify(f.serializza()))
  const g = new Fattoria3d({ stato: salvato, borsa: { quante: () => 0, paga: () => true }, ora: () => t.ora, rnd: sequenza(5) })
  stessaLista('salvata e riletta, la bottega ha le stesse consegne e lo stesso cliente', [g.s.botteghe.bottega_mensa.consegne, JSON.stringify(g.vistaBottega('bottega_mensa').banconi.map(x => x.cliente && x.cliente.id)), g.s.posseduti.bottega_mensa],
    [f.s.botteghe.bottega_mensa.consegne, JSON.stringify(f.vistaBottega('bottega_mensa').banconi.map(x => x.cliente && x.cliente.id)), true])
  // un cliente che chiede una merce che non c'è più nell'elenco sparisce e il bancone si riempie
  const rotta = JSON.parse(JSON.stringify(salvato)); rotta.botteghe.bottega_mensa.banconi = [{ id: 1, chi: 'maestra', chiede: { cavallo: 3 }, xp: 5 }]
  const h = new Fattoria3d({ stato: rotta, borsa: { quante: () => 0, paga: () => true }, ora: () => t.ora, rnd: sequenza(6) })
  controlla('un cliente con una merce inesistente non resta: il bancone si riempie con uno vero', !!primo(h, 'bottega_mensa') && BOTTEGHE.bottega_mensa.merci.includes(primo(h, 'bottega_mensa').chiede[0].k))
}

/* ══════════ 7b. la fattoria 2D che si porta: le sue botteghe diventano le nostre, con la fama ══════════ */
{
  stessaLista('le quattro botteghe 2D hanno la loro sorella 3D', ['pasticceria', 'osteria', 'mensa', 'merceria'].map(pezzoPer), TIPI_DI_BOTTEGA)
  const f2 = new Fattoria()
  f2.speso = 20000
  f2.cose.push({ i: 1, id: 'osteria', g: 0, x: 20, y: 20 }, { i: 2, id: 'mensa', g: 0, x: 40, y: 40 })
  f2.prossimo = 3
  f2.botteghe = { osteria: { consegne: 7, prossimo: 4, banconi: [] }, mensa: { consegne: 0, prossimo: 1, banconi: [] } }
  const s = statoDa2D(JSON.parse(JSON.stringify(f2.serializza())), { ora: 1_000_000_000 })
  controlla('le botteghe arrivano nel magazzino, gratis, e non sono da regalare', s && s.magazzino.bottega_osteria === 1 && s.magazzino.bottega_mensa === 1 && !Object.keys(s.daRegalare).some(k => k === 'cosa:osteria' || k === 'cosa:mensa'))
  controlla('la fama si porta dietro (le consegne), quella a zero no', s.botteghe.bottega_osteria && s.botteghe.bottega_osteria.consegne === 7 && !s.botteghe.bottega_mensa)
  controlla('il livello tiene ciò che si ha (almeno quello dell\'osteria)', livelloPer(s.esperienza) >= EDIFICI.bottega_osteria.liv)
}

/* ══════════ 8. nessun gioco paga una risposta sbagliata: le botteghe non toccano le monete, e il tetto tiene ══════════ */
{
  const { f, b } = mondo({ liv: ULTIMO, tipo: 'bottega_pasticceria' })
  let tot = 0
  for (const tipo of TIPI_DI_BOTTEGA) f.s.posseduti[tipo] = true
  f.tick()
  for (const tipo of TIPI_DI_BOTTEGA) for (const x of f.vistaBottega(tipo).banconi) if (x.cliente) { forniscilo(f, x); const r = f.consegnaBottega(tipo, x.id); if (r.ok) tot += r.xp }
  controlla('quattro botteghe in mappa, tutti i clienti serviti: esperienza sì, monete no', tot > 0 && b.monete === 5000)
  controlla('un cliente composto ha sempre un premio dentro il tetto di 🪙6 al minuto della 3D', guastiDelleBotteghe().length === 0)
}

riassunto('Le botteghe della fattoria 3D')
