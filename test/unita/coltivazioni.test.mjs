/* Verifica dei campi della fattoria, senza browser e senza aspettare.
   Qui si *coltiva per davvero* — si semina, si sposta l'orologio in
   avanti, si raccoglie, si macina, si dà da mangiare — perché tutto il
   motore prende l'ora da fuori: è l'unico modo di provare in un secondo
   una cosa che in gioco dura un quarto d'ora.

   Le tre cose che questo file difende, e che sono decisioni di prodotto
   prima che di codice:
     1. **niente marcisce**, mai, per nessun motivo;
     2. **niente si perde** se non hai monete o se il granaio è pieno: la
        roba resta dove è e ti aspetta;
     3. **la fattoria non stampa monete**: coltivare conviene, ma di
        circa la metà — non dell'ottanta per cento — se no il money pit
        si sgonfia e gli esercizi non servono più a niente.
   `node test/esegui.mjs coltivazioni --niente-build` */
import { Fattoria } from '../../src/giochi/fattoria/motore/fattoria.js'
import {
  guastiDelleColture, COLTURE, RICETTE, PRODOTTI, PER_COLTURA, PER_RICETTA,
  SILI, SILO_BASE, SILO_PIU, MINUTO, capienza, costoIngrandimento,
  quantoCresciuto, stadioDi, minutiCheMancano,
} from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { CIBI, COCCOLE, cibiPer, serveA } from '../../src/giochi/fattoria/dati/bisogni.js'
import { PER_ID, laMacchina } from '../../src/giochi/fattoria/dati/catalogo.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* Una borsa che tiene il conto: qui l'economia È l'oggetto della prova,
   quindi `borsaInfinita()` non servirebbe a niente. */
function borsaTracciata(iniziale) {
  let n = iniziale
  return { quante: () => n, paga: c => { n -= c; return true }, saldo: () => n,
           regala: c => { n += c } }
}

const T0 = 1770000000000            // un'ora qualunque, fissa: niente Date.now()
const fra = minuti => T0 + minuti * MINUTO

/* Una fattoria con un campo, un mulino e **i due silos** già in mappa,
   senza passare dai gesti: qui si provano le regole della coltivazione,
   non quelle della posa (che hanno il loro file).

   I silos ci sono e sono già larghi (`silos`, cioè quante volte sono
   stati ingranditi) perché senza non si raccoglie niente e ogni prova
   qui sotto morirebbe sulla stessa riga. Il silo piccolo, e quello che
   manca del tutto, si provano apposta al punto 5. */
function conCampoEMulino(monete = 1000, ingranditi = 3) {
  const b = borsaTracciata(monete)
  const f = new Fattoria({ borsa: b })
  const c0 = 14
  const campo = { i: 900, id: 'orto', g: 0, x: c0, y: c0 }
  const mulino = { i: 901, id: 'mulino', g: 0, x: c0, y: c0 + 3 }
  const silo = { i: 902, id: SILI.terra.cosa, g: 0, x: c0 + 4, y: c0 }
  const bianco = { i: 903, id: SILI.stalla.cosa, g: 0, x: c0 + 6, y: c0 }
  f.cose.push(campo, mulino, silo, bianco)
  f.silos = { terra: ingranditi, stalla: ingranditi }
  /* Fattoria **cresciuta**: il livello apre le cose a poco a poco
     (`dati/livelli.js`) e qui si provano le regole della coltivazione,
     non gli sblocchi — che hanno il loro file (`unita/livelli-fattoria`).
     Senza questa riga il mulino non si posa e il mais non si semina. */
  f.speso = 100000
  return { f, b, campo, mulino, silo, bianco }
}

/* ══════════ 1. i dati stanno in piedi ══════════ */
const guasti = guastiDelleColture()
controlla('le colture non hanno guasti', guasti.length === 0, guasti.join(' · '))

controlla('c\'è almeno una coltura', COLTURE.length > 0)
controlla('c\'è almeno una ricetta', RICETTE.length > 0)

/* Il campo del catalogo è quello che si semina, e deve essere
   calpestabile: un campo che blocca il cane è un mobile, non un campo. */
{
  const campi = Object.values(PER_ID).filter(v => v.campo)
  controlla('c\'è almeno un campo in catalogo', campi.length > 0)
  for (const v of campi) controlla(`${v.id} si calpesta`, !!v.sotto)
  for (const r of RICETTE) {
    const macchine = Object.values(PER_ID).filter(v => v.macchina === r.dove)
    controlla(`la ricetta «${r.id}» ha una macchina in catalogo`, macchine.length > 0)
  }
}

/* ══════════ 2. il conto dell'orologio ══════════ */
uguale('appena seminato non è cresciuto', quantoCresciuto(T0, 10, T0), 0)
uguale('a metà tempo è a metà', quantoCresciuto(T0, 10, fra(5)), 0.5)
uguale('a tempo scaduto è pronto', quantoCresciuto(T0, 10, fra(10)), 1)
/* Il tetto a 1 È la regola «niente marcisce»: se il conto potesse
   passare l'uno, qualcuno prima o poi ci appenderebbe uno stato «secco». */
uguale('e una settimana dopo è ancora esattamente pronto',
       quantoCresciuto(T0, 10, fra(60 * 24 * 7)), 1)
/* Un telefono a cui si cambia la data indietro non deve rompere niente:
   senza il taglio a zero il campo risulterebbe seminato nel futuro. */
uguale('un orologio andato indietro non manda il conto sotto zero',
       quantoCresciuto(T0, 10, T0 - 99999999), 0)

uguale('il maturo si mostra solo a crescita finita',
       stadioDi(PER_COLTURA.grano, 0.999),
       PER_COLTURA.grano.stadi[PER_COLTURA.grano.stadi.length - 2])
uguale('e a crescita finita sì', stadioDi(PER_COLTURA.grano, 1),
       PER_COLTURA.grano.stadi[PER_COLTURA.grano.stadi.length - 1])
uguale('quanto manca si dice in minuti interi', minutiCheMancano(T0, 10, fra(7.2)), 3)
uguale('e pronto vuol dire zero', minutiCheMancano(T0, 10, fra(10)), 0)

/* ══════════ 3. il giro completo: semino, aspetto, raccolgo ══════════ */
{
  const { f, b, campo } = conCampoEMulino(100)
  const grano = PER_COLTURA.grano
  const saldo0 = b.saldo()

  uguale('un campo appena posato è vuoto', f.statoCampo(campo).vuoto, true)

  const s = f.seminaCampo(campo, 'grano', T0)
  controlla('si semina', s.ok)
  uguale('e la semina si paga', b.saldo(), saldo0 - grano.semina)

  uguale('due volte sullo stesso campo non si può',
         f.seminaCampo(campo, 'mais', T0).motivo, 'gia-seminato')

  const meta = f.statoCampo(campo, fra(grano.minuti / 2))
  uguale('a metà strada non è pronto', meta.pronto, false)
  controlla('e dice quanti minuti mancano', meta.manca > 0)
  uguale('raccoglierlo prima non si può',
         f.raccogli(campo, fra(1)).motivo, 'non-e-pronto')
  uguale('e non è costato niente provarci', b.saldo(), saldo0 - grano.semina)

  const dopo = fra(grano.minuti)
  uguale('a tempo scaduto è pronto', f.statoCampo(campo, dopo).pronto, true)
  const r = f.raccogli(campo, dopo)
  controlla('si raccoglie', r.ok)
  uguale('e la roba è nel granaio', f.quantoHo('grano'), grano.resa)
  uguale('e il campo è tornato vuoto', f.statoCampo(campo, dopo).vuoto, true)
  uguale('il giro è costato semina più raccolta',
         b.saldo(), saldo0 - grano.semina - grano.raccolta)
}

/* ══════════ 4. NIENTE MARCISCE, E NIENTE SI PERDE ══════════
   Le tre facce della stessa decisione. È la parte del file che non va
   «migliorata» aggiungendo una scadenza: un raccolto che si perde
   trasforma il premio in un dovere, e il dovere si smette (il perché
   lungo sta in `dati/coltivazioni.js`). */
{
  const { f, campo } = conCampoEMulino()
  f.seminaCampo(campo, 'grano', T0)
  const dopoUnMese = fra(60 * 24 * 30)
  const s = f.statoCampo(campo, dopoUnMese)
  uguale('un campo lasciato un mese è pronto', s.pronto, true)
  controlla('e si raccoglie ancora', f.raccogli(campo, dopoUnMese).ok)
}

{
  /* A zero monete il raccolto **resta**: chi non può pagare torna dopo
     qualche esercizio e lo trova lì. */
  const { f, b, campo } = conCampoEMulino(PER_COLTURA.grano.semina)
  f.seminaCampo(campo, 'grano', T0)
  uguale('finite le monete, seminare ha svuotato la borsa', b.saldo(), 0)
  const dopo = fra(PER_COLTURA.grano.minuti)
  const no = f.raccogli(campo, dopo)
  uguale('a zero monete non si raccoglie', no.ok, false)
  uguale('e dice che sono le monete', no.motivo, 'poche-monete')
  uguale('ma il campo è ancora pronto', f.statoCampo(campo, dopo).pronto, true)
  uguale('e il granaio è ancora vuoto', f.quantoHo('grano'), 0)
  b.regala(50)
  controlla('arrivate le monete, si raccoglie', f.raccogli(campo, dopo).ok)
}

{
  /* Silo pieno: stessa cosa. Non si raccoglie **e non si paga**, il
     campo aspetta. Mezzo campo raccolto non esiste. */
  const { f, b, campo } = conCampoEMulino()
  f.granaio.grano = f.capienzaDi('terra')
  f.seminaCampo(campo, 'grano', T0)
  const dopo = fra(PER_COLTURA.grano.minuti)
  const saldo = b.saldo()
  const no = f.raccogli(campo, dopo)
  uguale('col silo pieno non si raccoglie', no.ok, false)
  uguale('e dice perché', no.motivo, 'silo-pieno')
  uguale('e quale silo', no.famiglia, 'terra')
  uguale('senza pagare niente', b.saldo(), saldo)
  uguale('e il campo resta pronto', f.statoCampo(campo, dopo).pronto, true)
  uguale('il silo non è andato oltre il tetto',
         f.quantoHo('grano'), f.capienzaDi('terra'))
}

{
  /* E senza silo **è un'altra cosa da fare**, quindi è un altro motivo:
     costruirlo, non ingrandirlo. Dirlo storto manda a spendere 120
     monete per la cosa sbagliata. */
  const { f, campo, silo } = conCampoEMulino()
  f.cose.splice(f.cose.indexOf(silo), 1)
  f.seminaCampo(campo, 'grano', T0)
  const no = f.raccogli(campo, fra(PER_COLTURA.grano.minuti))
  uguale('senza il silo del raccolto non si raccoglie', no.ok, false)
  uguale('e il motivo è che il silo manca', no.motivo, 'silo-manca')
  uguale('la capienza senza silo è zero, non piccola', f.capienzaDi('terra'), 0)
  uguale('ma il silo della stalla è ancora suo e funziona',
         f.quantoCiSta('uova') > 0, true)
}

/* ══════════ 5. I DUE SILOS ══════════
   Piccoli, condivisi, separati e si ingrandiscono pagando. Sono quattro
   decisioni di prodotto, e ognuna qui sotto ha la sua riga: il perché
   sta in `dati/coltivazioni.js`. */
{
  const { f } = conCampoEMulino(1000, 0)
  uguale('un silo appena costruito tiene poco', f.capienzaDi('terra'), SILO_BASE)
  uguale('e il conto è quello del dato', capienza(0), SILO_BASE)

  /* **Condiviso**: il tetto è del silo, non del singolo prodotto. Era
     per prodotto, ed era la cosa che non si capiva. */
  f.metti('grano', 3)
  uguale('tre grani riempiono tre posti', f.quantoHoNelSilo('terra'), 3)
  uguale('e del mais ce ne sta quello che avanza',
         f.quantoCiSta('mais'), SILO_BASE - 3)
  const fuori = f.metti('mais', SILO_BASE + 1)
  uguale('quello che non ci sta torna indietro invece di sparire', fuori, 4)
  uguale('e il silo è esattamente pieno', f.quantoHoNelSilo('terra'), SILO_BASE)

  /* **Separati**: il raccolto colmo non ferma le uova. È il motivo per
     cui i silos sono due e non uno grande. */
  uguale('col raccolto pieno le uova entrano lo stesso',
         f.quantoCiSta('uova'), SILO_BASE)

  /* **Si ingrandisce**, e il prossimo costa di più. */
  const primo = f.costoDellIngrandimento('terra')
  uguale('il primo ingrandimento costa quello che dice il dato',
         primo, costoIngrandimento(0))
  const su = f.ingrandisci('terra')
  controlla('si ingrandisce', su.ok)
  uguale(`e ci stanno ${SILO_PIU} cose in più`, f.capienzaDi('terra'), SILO_BASE + SILO_PIU)
  controlla('il prossimo costa di più', f.costoDellIngrandimento('terra') > primo)
  uguale('e non ha toccato l\'altro silo', f.capienzaDi('stalla'), SILO_BASE)

  uguale('togliere più di quello che c\'è non si può', f.togli('zucche', 1), false)
}

{
  /* A monete finite non si ingrandisce, e non si perde niente. */
  const { f } = conCampoEMulino(3, 0)
  const no = f.ingrandisci('terra')
  uguale('a corto di monete non si ingrandisce', no.ok, false)
  uguale('e dice che sono le monete', no.motivo, 'poche-monete')
  uguale('il silo è rimasto com\'era', f.capienzaDi('terra'), SILO_BASE)
}

{
  /* Un silo che non c'è non si ingrandisce: si costruisce. */
  const { f, silo } = conCampoEMulino(1000, 0)
  f.cose.splice(f.cose.indexOf(silo), 1)
  uguale('un silo non costruito non si ingrandisce',
         f.ingrandisci('terra').motivo, 'silo-manca')
}

{
  /* **Ogni roba dice chi la usa**, perché è l'unica cosa che una riga di
     scaffale può dire di utile — e perché una roba che non serve a
     niente occuperebbe per sempre uno dei quattro posti di un silo. */
  for (const id of Object.keys(PRODOTTI)) {
    const usi = serveA(id)
    controlla(`«${id}»: premendolo si legge chi lo usa`, usi.length > 0)
    for (const u of usi)
      controlla(`«${id}» → ${u.che} «${u.nome}»: ha un nome e una faccia`,
                !!u.nome && !!u.emoji)
    /* Una ricetta deve dire **in quale macchina**: «3 grani» senza il
       mulino è un'informazione che non si può usare. */
    for (const u of usi.filter(u => u.che === 'ricetta'))
      controlla(`«${id}» → ${u.nome}: dice in che macchina`, !!laMacchina(u.dove))
  }
}

{
  /* Ogni prodotto sta in un silo che esiste: uno senza casa non si
     raccoglierebbe mai, e nessuno lo direbbe. */
  for (const [id, pr] of Object.entries(PRODOTTI))
    controlla(`«${id}» ha un silo dove stare`, !!SILI[pr.silo])
  controlla('e tutti e due i silos hanno qualcosa dentro',
            Object.keys(SILI).every(fam =>
              Object.values(PRODOTTI).some(pr => pr.silo === fam)))
}

/* ══════════ 6. il mulino ══════════ */
{
  const { f, b, mulino } = conCampoEMulino(100)
  const r = PER_RICETTA.mangime
  uguale('un mulino appena posato è fermo', f.statoMacchina(mulino).ferma, true)

  const senza = f.avvia(mulino, 'mangime', T0)
  uguale('senza roba non parte', senza.ok, false)
  uguale('e dice che manca la roba', senza.motivo, 'manca-roba')
  controlla('e dice quanta', f.cheMancaPer('mangime').manca.length > 0)

  for (const [k, n] of Object.entries(r.prende)) f.metti(k, n)
  const saldo = b.saldo()
  controlla('con la roba parte', f.avvia(mulino, 'mangime', T0).ok)
  uguale('la roba se n\'è andata dal granaio subito', f.quantoHo('grano'), 0)
  uguale('e ha pagato il suo', b.saldo(), saldo - r.costo)
  uguale('due lavori insieme non si possono',
         f.avvia(mulino, 'mangime', T0).motivo, 'sta-lavorando')
  uguale('e ritirarlo prima non si può',
         f.ritira(mulino, fra(1)).motivo, 'non-e-pronto')

  const dopo = fra(r.minuti)
  const fine = f.ritira(mulino, dopo)
  controlla('a tempo scaduto si ritira', fine.ok)
  uguale('ritirare è gratis', fine.costo, 0)
  uguale('e la pappa è in granaio', f.quantoHo('mangime'), r.resa)
  uguale('il mulino è tornato fermo', f.statoMacchina(mulino, dopo).ferma, true)
}

/* ══════════ 7. la pappa prodotta finisce nella ciotola ══════════
   Il mangime va bene per tutti e **non costa monete**: è già stato
   pagato coltivandolo. Quello che scala è il granaio. */
{
  const { f, b } = conCampoEMulino()
  const mangime = CIBI.find(c => c.id === 'mangime')
  controlla('il mangime esiste fra i cibi', !!mangime)
  uguale('e non costa monete', mangime.prezzo, 0)
  for (const fam of ['cane', 'gatto', 'pappagallo'])
    controlla(`va bene per il ${fam}`, cibiPer(fam).some(c => c.id === 'mangime'))

  f.compraBestia('cane-beagle', 90, 'Birba')
  f.stato('cane-beagle').pancia = 0.2
  const saldo = b.saldo()

  const senza = f.nutri('cane-beagle', mangime)
  uguale('senza mangime in granaio non si dà', senza.ok, false)
  uguale('e dice che manca la roba, non le monete', senza.motivo, 'manca-roba')

  f.metti('mangime', 2)
  const si = f.nutri('cane-beagle', mangime)
  controlla('col mangime in granaio si dà', si.ok)
  uguale('senza spendere monete', b.saldo(), saldo)
  uguale('e il granaio si scala di uno', f.quantoHo('mangime'), 1)
  controlla('e la pancia è salita', f.stato('cane-beagle').pancia > 0.2)
}

/* ══════════ 8. L'ECONOMIA: CONVIENE, MA DELLA METÀ ══════════
   Il conto che tiene in piedi il money pit. Per ogni pappa prodotta si
   confronta quanto costa **in monete** con quella comprata che riempie
   la stessa pancia. Coltivare deve convenire — se no nessuno lo fa — ma
   se convenisse dell'ottanta per cento nessuno comprerebbe più niente e
   la fattoria smetterebbe di bruciare le monete guadagnate altrove.

   Il vero freno non è questo rapporto: è il tempo, contato qui sotto. */
{
  /* Quanto costa in monete un'unità di prodotto coltivato: il giro del
     campo diviso la resa, più quello che chiede la macchina. */
  const costoDi = ricetta => {
    let monete = ricetta.costo
    for (const [k, quanti] of Object.entries(ricetta.prende)) {
      const c = COLTURE.find(c => c.da === k)
      controlla(`«${k}» si può coltivare`, !!c)
      monete += quanti * (c.semina + c.raccolta) / c.resa
    }
    return monete / ricetta.resa
  }
  const minutiDi = ricetta => {
    let m = ricetta.minuti
    for (const [k, quanti] of Object.entries(ricetta.prende)) {
      const c = COLTURE.find(c => c.da === k)
      m += quanti * c.minuti / c.resa
    }
    return m / ricetta.resa
  }

  /* Quanto costa **una pancia intera** comprandola, al prezzo migliore
     che il negozio fa. È la tariffa con cui si paragona tutto: prima si
     cercava il cibo comprato con lo *stesso* `quanto`, e finché i cibi
     prodotti erano due e ricalcavano i comprati funzionava. Adesso i
     recinti rendono un uovo che riempie 0,45 e un tartufo che riempie
     0,90, e cibi comprati con quei numeri non ce ne sono: cercarli non
     trovava niente e il controllo si spegneva da solo — cioè la cosa
     peggiore che possa fare un controllo. A tariffa, invece, si
     paragona qualunque cosa con qualunque altra. */
  const tariffa = Math.min(...CIBI.filter(c => !c.da).map(c => c.prezzo / c.quanto))
  nota(`comprata, una pancia intera costa 🪙${tariffa.toFixed(1)}`)

  for (const r of RICETTE) {
    /* **Ogni cosa che esce da una macchina deve servire a qualcosa.**
       Non «deve finire in una ciotola»: la lana non si mangia, si mette
       addosso a un cane (`COCCOLE`), ed è il primo prodotto che esce
       dalla catena senza passare dalla pancia. Un prodotto senza nessuna
       uscita sarebbe roba che si accumula in granaio per sempre, e in
       granaio c'è un tetto: dopo un po' i recinti smetterebbero di
       poter ritirare, senza che niente dica perché. */
    const pappa = CIBI.find(c => c.da === r.da)
    const carezza = COCCOLE.find(c => c.da === r.da)
    const ingrediente = RICETTE.some(x => (x.prende || {})[r.da])
    controlla(`«${r.id}» rende roba che serve a qualcosa`,
              !!pappa || !!carezza || ingrediente)
    if (!pappa) {
      nota(`${r.emoji} ${r.nome}: 🪙${costoDi(r).toFixed(1)} e ` +
           `${minutiDi(r).toFixed(0)} min · non si mangia, ` +
           `serve a «${(carezza || {}).nome || 'un\'altra ricetta'}»`)
      continue
    }
    const mio = costoDi(r), suo = pappa.quanto * tariffa
    dentro(`${r.nome.toLowerCase()} costa fra il 35% e l'80% della stessa ` +
           `pancia comprata (${mio.toFixed(1)} contro ${suo.toFixed(1)})`,
           mio / suo, 0.35, 0.8)
    nota(`${r.emoji} ${r.nome}: 🪙${mio.toFixed(1)} e ${minutiDi(r).toFixed(0)} min ` +
         `contro 🪙${suo.toFixed(1)} subito · riempie ${Math.round(pappa.quanto * 100)}% di pancia`)
  }

  /* E la fattoria non stampa monete: nessuna strada rende più di quanto
     costa. Il controllo è secco perché la tentazione è concreta — un
     «vendi il raccolto» sembra sempre una buona idea. */
  for (const c of COLTURE)
    controlla(`seminare ${c.nome.toLowerCase()} costa, non rende`,
              c.semina >= 0 && c.raccolta >= 0)
  const rendeMonete = Object.getOwnPropertyNames(Fattoria.prototype)
    .filter(n => /vend/i.test(n))
  uguale('non esiste nessun modo di vendere niente', rendeMonete.length, 0)
}

/* ══════════ 9. quello che si salva e si rilegge ══════════ */
{
  const { f, campo, mulino } = conCampoEMulino()
  f.seminaCampo(campo, 'mais', T0)
  f.metti('grano', 3)
  f.avvia(mulino, 'mangime', T0)

  const g = new Fattoria({ dato: JSON.parse(JSON.stringify(f.serializza())) })
  const campo2 = g.cose.find(c => c.i === campo.i)
  const mulino2 = g.cose.find(c => c.i === mulino.i)
  uguale('il campo si ricorda cosa ha dentro', campo2.coltura, 'mais')
  uguale('e da quando', campo2.seminato, T0)
  uguale('il mulino si ricorda cosa sta facendo', mulino2.lavoro.ricetta, 'mangime')
  uguale('il granaio si rilegge', g.quantoHo('grano'), 0)

  /* Un salvataggio di ieri con una coltura che oggi non esiste più non
     deve restare seminato di niente per sempre. */
  const rotto = JSON.parse(JSON.stringify(f.serializza()))
  rotto.cose.find(c => c.i === campo.i).coltura = 'fagioli-magici'
  rotto.granaio.polvere = 12
  const h = new Fattoria({ dato: rotto })
  uguale('una coltura che non esiste più lascia il campo vuoto',
         h.statoCampo(h.cose.find(c => c.i === campo.i)).vuoto, true)
  uguale('e un prodotto che non esiste più non entra in granaio',
         h.quantoHo('polvere'), 0)
}

/* ══════════ 10. quello che sta crescendo non si mette via ══════════
   Non è un divieto per il gusto di dire no: nel baule non c'è posto per
   un grano a metà crescita, e metterlo via vorrebbe dire buttarlo. */
{
  const { f, campo, mulino } = conCampoEMulino()
  f.seminaCampo(campo, 'grano', T0)
  uguale('un campo seminato non si mette via', f.mettiVia(campo).motivo, 'campo-seminato')
  f.metti('grano', 3)
  f.avvia(mulino, 'mangime', T0)
  uguale('un mulino al lavoro nemmeno', f.mettiVia(mulino).motivo, 'sta-lavorando')
  controlla('raccolto, il campo si mette via',
            (f.raccogli(campo, fra(60)), f.mettiVia(campo).ok))
}

/* ══════════ 11. cosa vede chi disegna ══════════
   La scena non conosce il grano: chiede cosa si vede e riceve un nome di
   tessera e un fumetto. Se questo contratto si rompe, a schermo i campi
   restano tutti uguali e non se ne accorge nessun altro test. */
{
  const { f, campo, mulino } = conCampoEMulino()
  uguale('un campo vuoto non ha niente sopra', f.aspettoDellaCosa(campo, T0), null)
  f.seminaCampo(campo, 'grano', T0)
  const a1 = f.aspettoDellaCosa(campo, fra(1))
  controlla('appena seminato si vede qualcosa o niente, ma non un errore', !!a1)
  uguale('e non c\'è nessun invito a raccogliere', a1.fumetto, null)
  const a2 = f.aspettoDellaCosa(campo, fra(60))
  controlla('a maturazione la tessera è quella del maturo',
            a2.sopra === PER_COLTURA.grano.stadi[PER_COLTURA.grano.stadi.length - 1])
  controlla('e compare l\'invito a raccogliere', !!a2.fumetto)
  /* *Ribalta il controllo di prima*, che chiedeva `ripeti: true`. Uno
     stadio non è più una tesserina da mettere su ogni cella: è il campo
     intero, aiuola compresa, e il mais maturo è alto il doppio del suo
     piede. `alto` è quello che la scena guarda per ordinarlo come un
     oggetto invece che come terreno — chi passa dietro a un campo di
     grano deve sparirci dentro, non camminarci sopra. */
  uguale('e il campo si disegna intero, non una cella per volta', a2.ripeti, undefined)
  uguale('ed è alto: chi ci passa dietro ci finisce dietro', a2.alto, true)

  f.metti('grano', 3)
  f.avvia(mulino, 'mangime', T0)
  controlla('un mulino al lavoro lo dice', !!f.aspettoDellaCosa(mulino, fra(1)).fumetto)
}

nota(`${COLTURE.length} colture, ${RICETTE.length} ricette, ` +
     `${Object.keys(PRODOTTI).length} prodotti · silos da ${SILO_BASE} ` +
     `(+${SILO_PIU} a 🪙${[0, 1, 2, 3].map(costoIngrandimento).join(', 🪙')}…)`)

/* Una coltura che rende più di quanto tenga un silo appena costruito
   non si raccoglie finché non lo si ingrandisce. Non è un guasto — il
   cartello lo dice, e il campo aspetta — ma è una cosa da sapere
   quando si tocca una resa, quindi si scrive invece di scoprirla
   giocando. */
for (const c of COLTURE)
  if (c.resa > SILO_BASE)
    nota(`${c.emoji} ${c.nome}: rende ${c.resa}, e un silo nuovo ne tiene ` +
         `${SILO_BASE} — va ingrandito prima di raccoglierlo`)

riassunto('i campi della fattoria')
