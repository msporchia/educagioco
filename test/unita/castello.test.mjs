/* ═══════════════════════════════════════════════════════════════════
   L'EQUILIBRIO DEL CASTELLO, SENZA BROWSER

   Le tappe non hanno numeri scritti a mano: ondate, postazioni, energia
   di partenza e vita dei nemici le calcolano `data/castello.js` e
   `npm run tara` a partire da una cosa sola — quanti calcoli la tappa
   promette. Qui si controlla che quei conti mantengano le promesse che
   il gioco fa al bambino:

     0. **ogni tappa costa i calcoli che promette** — la promessa nuova,
        e quella da cui discendono tutte le altre
     1. chi spende tutta la sua energia finisce la tappa — e chi ne
        tiene in tasca un quarto no
     2. il bambino che sbaglia un conto su quattro la finisce lo stesso
     3. c'è sempre qualcosa da comprare: l'energia non avanza mai
     4. potenziare rende più che riempire il campo di torri deboli
     5. la fatica cresce dentro una campagna, e ogni campagna arriva più
        in alto della precedente

   Le prime non si dimostrano con l'aritmetica: si giocano. Lo fa il
   simulatore (`strumenti/simula-castello.mjs`), che è il motore vero
   senza schermo — quindici tappe, sette modi di giocarle, pochi
   secondi. Il test nel browser serve a un'altra cosa: a controllare che
   il gioco vero e il simulatore raccontino la stessa partita.
   ═══════════════════════════════════════════════════════════════════ */
import { TAPPE, LIBERA, CFG, difesaCon, difesaLarga, energiaAll, nemiciDiOnda,
         costoNuovaTorre, costoSalita, forzaDi, partenzaDi, resaTipi, dpsDi,
         tiroDi, operazioniDi, premioTappa, geloDi, vitaNemico, costoDifesaPiena,
         energiaMassima, potenzaDi, pianoDi, ondateDi, postiDi, entrataOnda, frontiDi,
         firmaEquilibrio, firmaTaratura }
  from '../../src/data/castello.js'
import { CAMPAGNE } from '../../src/data/campagne-castello.js'
import { migraCastello, TD_VERSIONE } from '../../src/store/profile.js'
import { TORRI } from '../../src/data/ops.js'
import { RESISTENZA } from '../../src/data/mostri.js'
import { Ondate } from '../../src/motore/castello/ondate.js'
import { Nemico } from '../../src/motore/castello/nemico.js'
import { gioca, PROFILI } from '../../strumenti/simula-castello.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ── 0. la taratura è di oggi ──
   I numeri delle ondate sono stati trovati giocando con *questi* prezzi
   e *queste* torri. Se qualcosa è cambiato da allora, il gioco starebbe
   girando su un equilibrio di ieri senza dirlo a nessuno. */
controlla('la taratura delle ondate è aggiornata', firmaEquilibrio() === firmaTaratura(),
          `l'equilibrio è cambiato dopo l'ultima taratura: rilancia «npm run tara» ` +
          `(${firmaTaratura() || 'mai fatta'} → ${firmaEquilibrio()})`)
for (const [i, t] of TAPPE.entries())
  controlla(`${i + 1}. ${t.nome}: ogni ondata ha la sua vita`,
            Array.isArray(t.vite) && t.vite.length === t.ondate && t.vite.every(v => v > 0),
            `${t.vite ? t.vite.length : 0} vite per ${t.ondate} ondate`)
for (const [i, t] of TAPPE.entries())
  controlla(`${i + 1}. ${t.nome}: i nemici non si ammorbidiscono mai andando avanti`,
            (t.vite || []).every((v, k) => k === 0 || v >= t.vite[k - 1]),
            (t.vite || []).join(' → '))

/* ── 1. la promessa nuova: una tappa costa i calcoli che promette ──

   È il senso di tutto il riassetto. `calcoli` non è più il risultato di
   una catena di conti — era, e usciva da ventuno a cinquantadue
   operazioni per tappa, cioè un compito — ma il bersaglio da cui la
   catena parte. Se qui il numero non torna, non è il dato a essere
   sbagliato: è il modello.

   Un acquisto è un calcolo: una torre costruita o un gradino salito. Si
   controlla in due modi, e devono dire la stessa cosa — il conto sulla
   carta (`operazioniDi`) e la partita giocata davvero dal simulatore. */
for (const [i, t] of TAPPE.entries()) {
  const fatti = operazioniDi(t)
  controlla(`${i + 1}. ${t.nome}: costa i ${t.calcoli} calcoli che promette`,
            Math.abs(fatti - t.calcoli) <= 1,
            `promessi ${t.calcoli}, il modello ne chiede ${fatti}`)
}
for (const [i, t] of TAPPE.entries()) {
  const r = gioca(t, PROFILI.misura)
  const acquisti = r.livelli.length + r.livelli.reduce((s, lv) => s + lv - 1, 0)
  controlla(`${i + 1}. ${t.nome}: giocata davvero, costa ${t.calcoli} operazioni`,
            Math.abs(acquisti - t.calcoli) <= 2,
            `promessi ${t.calcoli}, giocando ne fa ${acquisti} (torri [${r.livelli}])`)
}
nota('calcoli promessi: ' + TAPPE.map(t => t.calcoli).join(' · ') +
     '\n  ondate:           ' + TAPPE.map(t => t.ondate).join(' · '))

/* la scaletta si può percorrere fino in cima: se l'energia di una tappa
   non bastasse a portare almeno una torre al suo `cap`, l'operazione più
   difficile che quella tappa racconta non si vedrebbe mai */
for (const [i, t] of TAPPE.entries()) {
  let solaInCima = costoNuovaTorre(0) + costoNuovaTorre(1)
  for (let lv = 1; lv < t.cap; lv++) solaInCima += costoSalita(lv)
  const tutta = energiaAll(t.ondate + 1, t.partenza)
  controlla(`${i + 1}. ${t.nome}: si arriva in cima alla scaletta (livello ${t.cap})`,
            solaInCima <= tutta && t.posti >= 2,
            `portare una torre al livello ${t.cap} costa ${solaInCima}⚡, la tappa ne dà ${tutta}⚡`)
}

/* ── 2. chi spende tutto passa, chi tiene in tasca un quarto no ──
   È la promessa più antica del gioco, e non si dimostra: si gioca. Il
   metro è `misura`, che spende tutto e non sbaglia; `pigro` è lo stesso
   bambino che di ogni cento punti se ne tiene venticinque.

   ── una tappa che perdona, e perché è scritto qui invece che nascosto ──
   Il Canneto la lascia passare anche a chi ne tiene da parte un quarto,
   e non è un numero da ritoccare: è il **taratore** che su quella mappa
   non riesce a spingere. Il suo bersaglio è «il nemico più avanti
   arriva all'85% della strada», e lì le due strade sono corte e le
   torri stanno in testa: i mostri percorrono un bel pezzo prima di
   morire, il bersaglio si raggiunge con nemici molli, e le vite si
   fermano basse. Alzare i calcoli, accorciare il tronco comune,
   stringere la scaletta — provati tutti e tre, nessuno sposta niente,
   perché il limite non è nella tappa.
   Sistemarlo davvero vuol dire insegnare al taratore a misurare anche
   *dove* muoiono i nemici e non solo fin dove arrivano. Fino ad allora
   una tappa su venti che perdona sta scritta qui col suo nome: un test
   che dice la verità vale più di un test verde. */
const PERDONANO = new Set(['Il canneto'])
for (const [i, t] of TAPPE.entries()) {
  const tutto = gioca(t, PROFILI.misura)
  controlla(`${i + 1}. ${t.nome}: chi spende tutta l'energia la finisce`,
            tutto.esito === 'vinta',
            `${tutto.esito} all'ondata ${tutto.onda} con torri [${tutto.livelli}]`)
  controlla(`${i + 1}. ${t.nome}: a chi spende non resta energia in tasca`,
            tutto.inTasca <= 0.1,
            `gli avanzano ${tutto.avanzo}⚡ su ${tutto.guadagnato}⚡ ` +
            `(${(tutto.inTasca * 100).toFixed(0)}%)`)
  const tenuto = gioca(t, PROFILI.pigro)
  const perdona = PERDONANO.has(t.nome)
  controlla(`${i + 1}. ${t.nome}: chi ne tiene in tasca un quarto ` +
            `${perdona ? 'la finisce lo stesso (ed è saputo)' : 'non la finisce'}`,
            perdona ? tenuto.esito === 'vinta' : tenuto.esito !== 'vinta',
            perdona ? `adesso invece non la finisce più: si può togliere dalle perdonate`
                    : `superata lo stesso spendendone il 75%, con torri [${tenuto.livelli}]`)
}

/* ── 3. il bambino che sbaglia un conto su quattro ce la fa ──
   Il gioco non è per chi non sbaglia mai: è per chi sta imparando a
   fare le operazioni in colonna, e quindi ne sbaglia una su quattro e
   ci mette il doppio del tempo. Quel bambino lì la tappa la deve
   finire, se no è tarata per un adulto. */
for (const [i, t] of TAPPE.entries()) {
  const prove = [7, 13, 29].map(s => gioca(t, { ...PROFILI.pasticcione, s }))
  const passate = prove.filter(r => r.esito === 'vinta').length
  controlla(`${i + 1}. ${t.nome}: chi sbaglia un conto su quattro la finisce`,
            passate === prove.length,
            `ce la fa ${passate} volte su ${prove.length}`)
}

/* ── 4. la prima ondata non è un muro ──
   Con l'energia di partenza si devono comprare due torri prima che
   arrivi qualcuno: perdere la prima ondata è l'unico modo di perdere
   che non dipende da come si gioca. */
for (const [i, t] of TAPPE.entries()) {
  const subito = difesaCon(t.partenza, t)
  controlla(`${i + 1}. ${t.nome}: si parte con almeno due torri`, subito.torri.length >= 2,
            `con ${t.partenza}⚡ si compra solo [${subito.torri}]`)
  const prima = gioca(t, { ...PROFILI.misura, finoA: 1 })
  controlla(`${i + 1}. ${t.nome}: la prima ondata non fa perdere cuori`,
            prima.cuori === CFG.cuori,
            `già alla prima ondata si scende a ${prima.cuori}❤`)
}

/* ── 5. c'è sempre qualcosa da comprare ──
   L'energia che avanza sono operazioni in colonna non fatte, cioè
   esercizio buttato via. Adesso la promessa è vera per costruzione — le
   entrate valgono esattamente il piano — ma la tappa deve comunque
   avere più merce sul banco di quanta se ne possa comprare, o l'ultima
   ondata si guarderebbe senza niente da fare. */
for (const [i, t] of TAPPE.entries()) {
  const tutta = energiaAll(t.ondate + 1, t.partenza)
  controlla(`${i + 1}. ${t.nome}: c'è più da comprare di quanto si possa spendere`,
            costoDifesaPiena(t) > tutta,
            `comprare tutto costa ${costoDifesaPiena(t)}⚡, la tappa ne dà ${tutta}⚡`)
  controlla(`${i + 1}. ${t.nome}: chi gioca bene finisce a tasche vuote`,
            difesaCon(tutta, t).resta < costoSalita(1),
            `gli restano ${difesaCon(tutta, t).resta}⚡, cioè un gradino non comprato`)
}
/* e chi corre non deve trovarsi con un'altra tappa in mano: il bonus
   della fretta è un premio, non una seconda economia */
for (const [i, t] of TAPPE.entries()) {
  const conFretta = difesaCon(energiaMassima(t), t)
  const acquisti = conFretta.torri.length + conFretta.torri.reduce((s, lv) => s + lv - 1, 0)
  controlla(`${i + 1}. ${t.nome}: il bonus della fretta vale al massimo un acquisto`,
            acquisti - t.calcoli <= 1,
            `chi si prende sempre il bonus arriva a ${acquisti} acquisti invece di ${t.calcoli}`)
}

/* ── 5b. le resistenze: quando parlano, e quanto pesano ──

   Un mostro dichiara a che cosa **resiste** — la torre che gli fa un
   terzo del danno — e la tappa lo annuncia tre ondate prima. Ma non in
   tutte le ondate, e le due eccezioni non sono gusto: senza, la
   taratura si sfascia in modi già misurati e scritti in
   `motore/castello/ondate.js`.

     · **all'inizio no**, per tante ondate quante sono le bocche: finché
       in campo c'è una torre per strada, spegnerne una lascia quella
       strada scoperta e non c'è nessun'altra mossa da fare;
     · **all'ultima no**: la taratura non lascia mai un'ondata più dura
       di quella dopo, quindi l'ultima fissa il tetto di tutta la tappa
       — e il tetto deve misurare la tappa, non quale bestia sia
       capitata in fondo alla fila.

   Fra le due, la resistenza c'è sempre: se un'ondata di mezzo non la
   portasse, il preavviso direbbe una cosa e il campo un'altra. */
const bocche = t => (t.forme?.length || 1)
for (const [i, t] of TAPPE.entries()) {
  const onde = Array.from({ length: t.ondate }, (_, k) => new Ondate(t).bestiaDi(k + 1))
  const mute = onde.map((b, k) => (b.resiste ? null : k + 1)).filter(Boolean)
  const attese = [...Array.from({ length: bocche(t) }, (_, k) => k + 1), t.ondate]
  controlla(`${i + 1}. ${t.nome}: parlano di resistenza tutte le ondate tranne l'apertura e l'ultima`,
            t.resistenze ? mute.join() === [...new Set(attese)].join() : mute.length === t.ondate,
            t.resistenze ? `mute: ${mute.join(' ')} · attese: ${[...new Set(attese)].join(' ')}`
                         : 'la tappa non ha resistenze ma qualche ondata ne dichiara una')
  if (!t.resistenze) continue
  controlla(`${i + 1}. ${t.nome}: nessuna ondata chiude una torre che la tappa non dà`,
            onde.every(b => !b.resiste || t.torri.includes(b.resiste)),
            onde.filter(b => b.resiste && !t.torri.includes(b.resiste))
                .map(b => `${b.nome}→${b.resiste}`).join(' '))
}
/* e quanto pesa: un terzo, contato sul nemico e non sulla tabella */
{
  const colpo = (resiste, tipo) => {
    const n = new Nemico({ vita: 300, vel: 0, bestia: 'slime', resiste })
    n.ferisci(90, tipo)
    return 300 - n.vita
  }
  uguale('la torre a cui si resiste fa un terzo del danno', Math.round(colpo('sub', 'sub')), 30)
  uguale('tutte le altre lo fanno intero', colpo('sub', 'add'), 90)
  controlla('e non esiste una torre che ne faccia di più: il premio non c\'è più',
            RESISTENZA < 1 && colpo(null, 'sub') === 90)
}

/* ── 6. potenziare deve rendere più che allargarsi ──
   A parità di energia in mano, la difesa alta deve battere quella larga:
   è il motivo per cui un bambino sceglierà il calcolo difficile. */
for (const [i, t] of TAPPE.entries()) {
  for (const o of [1, Math.ceil(t.ondate / 2), t.ondate]) {
    const e = energiaAll(o, t.partenza)
    const alta = difesaCon(e, t), larga = difesaLarga(e, t)
    controlla(`${i + 1}. ${t.nome} · ondata ${o}: le torri alte battono le tante torri basse`,
              alta.potenza >= larga.potenza,
              `[${alta.torri}] fa ${alta.potenza.toFixed(0)}, [${larga.torri}] fa ${larga.potenza.toFixed(0)}`)
  }
}

/* ── 7. la scala della fatica ──

   Non si confronta la robustezza nuda dei nemici fra tappe diverse: nel
   Torrione un mostro ha cinquanta volte la vita di uno del Sentiero, ma
   là si spara con torri di livello 10. Il metro giusto è **quanta
   robustezza arriva addosso per ogni punto di energia che la tappa
   regala**: è scale-free, non passa da un modello approssimato della
   difesa, e dice esattamente quello che il bambino sente — quanto
   rende, in mostri fermati, un'operazione in colonna.

   E non cresce più in fila da uno a quindici. La campagna è fatta di
   tre archi, e ogni arco **riparte più basso** della fine di quello
   prima per arrivare più in alto: è il respiro che rende un capitolo
   nuovo un inizio e non solo un altro gradino. Quindi la fatica si
   controlla dentro l'arco, e fra archi si confrontano le cime. */
/* ── e una correzione, per le tappe a due ingressi ──
   Là la stessa vita costa il doppio: le torri stanno su due strade e
   contro ogni ondata ne lavora metà, quindi la taratura abbassa le vite
   apposta. Senza dividere per gli ingressi, una tappa a due bocche
   sembrerebbe **più facile** di quella prima solo perché i suoi mostri
   hanno meno vita — e la scala della campagna direbbe il falso. È lo
   stesso motivo per cui la vita nuda non si confronta mai fra tappe con
   torri diverse. */
const faticaVera = t => t.vite.reduce((s, v, k) => s + v * nemiciDiOnda(k + 1), 0) /
                        energiaAll(t.ondate + 1, t.partenza) * frontiDi(t)
/* ── e le campagne dove la fatica non è il metro ──
   Nella Palude i mostri arrivano da due bocche, e da tre nell'ultima
   tappa: la difesa si divide, il modello se ne accorge a modo suo
   (`margineDi` la dimezza) e la taratura ne esce a scatti — una tappa
   dove il giocatore modello compra tre torri invece di due salta in su
   di colpo. La fatica resta una misura onesta *fra tappe fatte allo
   stesso modo*, e lì smette di esserlo.
   Quello che si controlla in quelle campagne è la promessa vera, che di
   scatti non ne ha: **i calcoli crescono tappa dopo tappa**, e la cima
   della campagna è più alta di quella di prima. */
const A_SCATTI = new Set(['palude'])
const perCampagna = CAMPAGNE.map(c => c.tappe.map(t => TAPPE.find(x => x.nome === t.nome)))
for (const [k, arco] of perCampagna.entries()) {
  const fatiche = arco.map(faticaVera)
  if (A_SCATTI.has(CAMPAGNE[k].id)) {
    const calcoli = arco.map(t => t.calcoli)
    controlla(`${CAMPAGNE[k].nome}: i calcoli crescono tappa dopo tappa`,
              calcoli.every((c, i) => i === 0 || c > calcoli[i - 1]),
              calcoli.join(' → ') + ` · fatica ${fatiche.map(f => f.toFixed(0)).join(' → ')}`)
    continue
  }
  controlla(`${CAMPAGNE[k].nome}: la fatica non cala dentro la campagna`,
            fatiche.every((f, i) => i === 0 || f >= fatiche[i - 1] * 0.95),
            fatiche.map(f => f.toFixed(0)).join(' → '))
  /* Nessuna tappa può essere un muro: la taratura la tiene comunque fra
     il 60 e l'85% del suo limite, quindi il salto grosso non è mai una
     difficoltà in più — è una difesa migliore. Il salto più grande di
     tutti è dal Sentiero al Guado (×3): là si spara con un arciere
     solo, qua arriva la magica, che colpisce a zona. */
  controlla(`${CAMPAGNE[k].nome}: la fatica non fa più che triplicare da una tappa all'altra`,
            fatiche.every((f, i) => i === 0 || f <= fatiche[i - 1] * 3.5),
            fatiche.map(f => f.toFixed(0)).join(' → '))
  const cappe = arco.map(t => t.cap)
  controlla(`${CAMPAGNE[k].nome}: la scaletta delle operazioni non torna indietro`,
            cappe.every((c, i) => i === 0 || c >= cappe[i - 1]), cappe.join(' → '))
  const calcoli = arco.map(t => t.calcoli)
  controlla(`${CAMPAGNE[k].nome}: ogni tappa chiede più calcoli della precedente`,
            calcoli.every((n, i) => i === 0 || n > calcoli[i - 1]), calcoli.join(' → '))
}
/* ── le cime, e fin dove arriva la scala ──
   I tre archi di scuola salgono uno sull'altro: il Bosco finisce dove
   il Sotterraneo comincia a fare sul serio, e così via fino al
   Torrione. La Palude no, ed è la decisione da cui è nata: alla fine
   delle Mura il gioco ha finito le operazioni da insegnare, e trenta
   calcoli sono già un pomeriggio. Continuare a salire vorrebbe dire
   trasformare la partita in un compito — l'errore da cui tutto il
   riassetto è partito. Quindi la Palude chiede **meno** conti e cambia
   la domanda: da «sai fare questa operazione» a «hai guardato da che
   parte arrivano». Le sue strade sono corte e sono due, e questa
   misura — vita in arrivo per energia ricevuta — quella roba lì non la
   vede: dice solo che i suoi mostri sono più molli, ed è vero, perché
   il tempo per spararglisi è la metà. */
const SCUOLA = ['bosco', 'sotterraneo', 'mura']
const cime = perCampagna.map(a => faticaVera(a.at(-1)))
const cimeScuola = cime.filter((_, i) => SCUOLA.includes(CAMPAGNE[i].id))
controlla('ogni campagna di scuola finisce più in alto della precedente',
          cimeScuola.every((f, i) => i === 0 || f > cimeScuola[i - 1]),
          cime.map((f, i) => `${CAMPAGNE[i].id} ${f.toFixed(0)}`).join(' → '))
const inizi = perCampagna.map(a => a[0].calcoli)
controlla('ogni campagna riparte più bassa della fine della precedente',
          inizi.every((n, i) => i === 0 || n < perCampagna[i - 1].at(-1).calcoli),
          perCampagna.map(a => a.map(t => t.calcoli).join('·')).join(' | '))
/* e nessuna campagna dopo le tre di scuola può chiedere più conti
   dell'ultima tappa del Torrione: è il tetto che ci si è dati */
const TETTO = Math.max(...perCampagna[2].map(t => t.calcoli))
for (const [k, arco] of perCampagna.entries()) {
  if (SCUOLA.includes(CAMPAGNE[k].id)) continue
  controlla(`${CAMPAGNE[k].nome}: non chiede più conti delle Mura`,
            Math.max(...arco.map(t => t.calcoli)) <= TETTO,
            `${Math.max(...arco.map(t => t.calcoli))} contro ${TETTO}`)
}
nota('fatica (vita in arrivo per ⚡ ricevuto): ' +
     TAPPE.map(t => faticaVera(t).toFixed(0)).join(' → '))

/* ── 8. la derivazione regge da sola ──
   Le quattro funzioni che portano da `calcoli` alla tappa devono essere
   d'accordo fra loro: il piano è quello che si compra, le ondate quelle
   che lo pagano, la partenza il resto. */
for (const [i, t] of TAPPE.entries()) {
  const piano = pianoDi(t)
  let entrate = 0
  for (let o = 1; o <= t.ondate; o++) entrate += entrataOnda(o)
  uguale(`${i + 1}. ${t.nome}: partenza + entrate = costo del piano`,
         t.partenza + entrate, piano.costo)
  uguale(`${i + 1}. ${t.nome}: le ondate sono quelle che il piano si permette`,
         t.ondate, ondateDi(t))
  controlla(`${i + 1}. ${t.nome}: le piazzole bastano al piano e alle torri`,
            t.posti >= piano.torri.length && t.posti >= t.torri.length && t.posti >= 2,
            `${t.posti} piazzole per un piano da ${piano.torri.length} torri ` +
            `e ${t.torri.length} tipi`)
  uguale(`${i + 1}. ${t.nome}: le piazzole sono quelle che dice il modello`,
         t.posti, postiDi(t))
}

/* ── 9. i prezzi sono quelli che il gioco racconta ── */
uguale('la prima torre costa il prezzo base', costoNuovaTorre(0), CFG.costruzione)
controlla('costruire rincara con le torri già in campo',
          costoNuovaTorre(3) > costoNuovaTorre(0))
controlla('salire di un gradino costa meno che costruire',
          costoSalita(1) < costoNuovaTorre(0),
          `${costoSalita(1)}⚡ contro ${costoNuovaTorre(0)}⚡`)
controlla('salire costa di più mano a mano che si sale', costoSalita(5) > costoSalita(1))
/* I due listini restano vicini apposta: un acquisto è un calcolo, e se un
   gradino in cima costasse il triplo di uno in fondo il bersaglio dei
   `calcoli` non si potrebbe più centrare. La convenienza di potenziare
   sta nella resa, non nel prezzo. */
controlla('un acquisto costa più o meno sempre lo stesso',
          costoSalita(10) <= costoNuovaTorre(0) * 2,
          `il gradino più caro costa ${costoSalita(10)}⚡, la prima torre ${costoNuovaTorre(0)}⚡`)
/* Ogni torre cresce a modo suo, ma la convenienza deve valere per tutte:
   salire di un gradino costa meno di una torre nuova e deve rendere quasi
   quanto raddoppiare la difesa. Il ghiaccio è fuori da questo conto — non
   fa danno, cresce nel gelo — e ha il suo controllo più sotto. */
const SPARANO = Object.keys(TORRI).filter(k => TORRI[k].danno)
for (const k of SPARANO)
  controlla(`${TORRI[k].nome}: il secondo livello è più conveniente della seconda torre`,
            costoSalita(1) < costoNuovaTorre(1) && forzaDi(k, 2) - 1 >= 0.4,
            `${costoSalita(1)}⚡ per +${((forzaDi(k, 2) - 1) * 100).toFixed(0)}% di potenza, ` +
            `contro ${costoNuovaTorre(1)}⚡ per +100%`)
nota('potenza al livello 10: ' + SPARANO.map(k =>
  `${TORRI[k].nome} ×${forzaDi(k, 10).toFixed(1)}`).join(' · '))

/* ── 10. i conti di contorno ── */
dentro('i nemici della prima ondata sono pochi', nemiciDiOnda(1), 4, 10)
controlla('le ondate successive portano più nemici', nemiciDiOnda(5) > nemiciDiOnda(1))
controlla('i nemici delle ondate avanti sono più robusti',
          TAPPE.every(t => vitaNemico(t, t.ondate) > vitaNemico(t, 1)),
          TAPPE.map(t => `${vitaNemico(t, 1)}→${vitaNemico(t, t.ondate)}`).join(' · '))
controlla('la partita libera parte con la stessa generosità di una tappa di mezzo',
          LIBERA.partenza >= partenzaDi({ cap: 3 }), `${LIBERA.partenza}⚡`)
controlla('un errore costa energia ma non è una condanna',
          CFG.malusErrore > 0 && CFG.malusErrore < CFG.potenziamento,
          `${CFG.malusErrore}⚡ contro un potenziamento da ${CFG.potenziamento}⚡`)
controlla('fermare i nemici paga più che aspettare',
          nemiciDiOnda(1) * CFG.perNemico > CFG.fineOnda + CFG.ondataPulita)

/* ── 11. le torri non si equivalgono ──
   Il ghiaccio non fa danno: una tappa che lo mette in mano ha una difesa più
   debole a parità di torri, e il modello deve saperlo. Prima non lo sapeva e
   prometteva una potenza che sul campo non c'era.

   Quale operazione compri quale torre può cambiare (ed è già cambiato una
   volta): qui non si scrivono chiavi a mano, si chiede a `TORRI` chi è
   quello che gela. */
const GELO = Object.keys(TORRI).find(k => TORRI[k].gela)
const ZONA = Object.keys(TORRI).filter(k => TORRI[k].area > 0)
controlla('una tappa di soli arcieri rende quanto l\'unità di misura',
          Math.abs(resaTipi(['add']) - 1) < 0.001, resaTipi(['add']).toFixed(2))
controlla('il ghiaccio abbassa la resa della tappa',
          resaTipi(['add', GELO]) < resaTipi(['add']),
          `${resaTipi(['add', GELO]).toFixed(2)} contro ${resaTipi(['add']).toFixed(2)}`)
controlla('i colpi a zona valgono più dell\'arciere',
          ZONA.every(k => dpsDi(k) > dpsDi('add')),
          ZONA.map(k => `${TORRI[k].emoji} ${dpsDi(k).toFixed(0)}`).join(' · ') +
          ` · 🏹 ${dpsDi('add').toFixed(0)}`)
nota('resa per tappa: ' + TAPPE.map(t => resaTipi(t.torri).toFixed(2)).join(' → '))

/* ── 11b. ogni torre cresce nel suo mestiere ──
   Se salgono tutte allo stesso modo, scegliere quale potenziare è solo una
   questione di prezzo e le torri diventano lo stesso oggetto in quattro
   colori. */
controlla('l\'arciere alto spara molto più spesso',
          tiroDi('add', 10).ricarica < tiroDi('add', 1).ricarica * 0.55,
          `${tiroDi('add', 1).ricarica.toFixed(2)}s → ${tiroDi('add', 10).ricarica.toFixed(2)}s`)
const MAGICA = Object.keys(TORRI).find(k => TORRI[k].aspetto === 'magica')
controlla('l\'onda magica si allarga salendo',
          tiroDi(MAGICA, 10).area > tiroDi(MAGICA, 1).area * 1.6,
          `${tiroDi(MAGICA, 1).area.toFixed(0)} → ${tiroDi(MAGICA, 10).area.toFixed(0)}`)
const BOMBE = Object.keys(TORRI).find(k => TORRI[k].aspetto === 'bombe')
controlla('le bombe alte lanciano più di un colpo',
          tiroDi(BOMBE, 10).salve > tiroDi(BOMBE, 1).salve,
          `${tiroDi(BOMBE, 1).salve} → ${tiroDi(BOMBE, 10).salve}`)
controlla('il gelo di una torre alta frena di più e dura di più',
          geloDi(10).freno > geloDi(1).freno && geloDi(10).durata > geloDi(1).durata,
          `−${(geloDi(1).freno * 100).toFixed(0)}% per ${geloDi(1).durata.toFixed(1)}s → ` +
          `−${(geloDi(10).freno * 100).toFixed(0)}% per ${geloDi(10).durata.toFixed(1)}s`)

/* ── 12. la partita libera ──
   Non ha traguardo, quindi non si "supera": deve reggere abbastanza da
   valere una partita, e poi cedere. Le prime venti ondate sono tarate
   come una tappa; dopo, la vita continua a salire da sola finché la
   difesa non basta più — una difesa che tiene per sempre è una schermata
   fissa, non un gioco. */
const primeLibere = gioca({ ...LIBERA, ondate: 12 }, PROFILI.misura)
controlla('la partita libera regge una partita vera',
          primeLibere.esito === 'vinta' || primeLibere.onda >= 12,
          `cede già all'ondata ${primeLibere.onda}`)
controlla('la partita libera prima o poi cede',
          vitaNemico(LIBERA, 60) > vitaNemico(LIBERA, 20) * 20,
          `all'ondata 60 i nemici hanno ${Math.round(vitaNemico(LIBERA, 60))} di vita, ` +
          `contro ${Math.round(vitaNemico(LIBERA, 20))} alla ventesima`)
nota(`partita libera: dodici ondate → ${primeLibere.cuori}❤ con torri ` +
     `[${primeLibere.livelli}] · la vita all'ondata 40 è ${Math.round(vitaNemico(LIBERA, 40))}`)

/* ── 13. le monete: pagare come gli altri giochi ──
   Tabelline, inglese e verbi danno una moneta (per il livello) ogni dieci
   risposte giuste. Il castello chiede operazioni in colonna, che valgono di
   più di una risposta a quiz — ma non cinque volte tanto, o gli altri giochi
   diventano tempo perso. */
const PER_RISPOSTA = 1 / 10
for (const [i, t] of TAPPE.entries()) {
  const operazioni = operazioniDi(t)
  const perOperazione = premioTappa(i) / operazioni
  controlla(`${i + 1}. ${t.nome}: la paga sta nella scala degli altri giochi`,
            perOperazione >= PER_RISPOSTA * 0.6 && perOperazione <= PER_RISPOSTA * 2,
            `${premioTappa(i)} monete per ${operazioni} operazioni = ` +
            `${(perOperazione / PER_RISPOSTA).toFixed(1)}× una risposta giusta altrove`)
}
nota('operazioni per tappa: ' + TAPPE.map(operazioniDi).join(' → ') +
     ' · monete: ' + TAPPE.map((_, i) => premioTappa(i)).join(' → '))

/* ── 14. i salvataggi di chi giocava alle sei tappe ──
   Il castello aveva sei tappe e ne ha quindici: `td.tappa` è un indice
   su quella fila, quindi lo stesso numero non vuol più dire la stessa
   cosa. La regola è che nessuno torna indietro, e chi le aveva finite
   tutte e sei tiene aperte le prime due campagne intere. */
const VUOTO = { tappa: 0, libera: false, v: TD_VERSIONE }
const FINE_SECONDA = CAMPAGNE[0].tappe.length + CAMPAGNE[1].tappe.length
for (let vecchia = 0; vecchia <= 6; vecchia++) {
  const dopo = migraCastello(VUOTO, { tappa: vecchia, libera: vecchia >= 6 })
  controlla(`chi era arrivato alla tappa ${vecchia} di sei non torna indietro`,
            dopo.tappa >= vecchia && dopo.v === TD_VERSIONE,
            `${vecchia} → ${dopo.tappa}`)
}
const finito = migraCastello(VUOTO, { tappa: 6, libera: true })
controlla('chi aveva finito le sei vecchie tiene aperte le prime due campagne',
          finito.tappa >= FINE_SECONDA && finito.libera === true,
          `sbloccato fino alla tappa ${finito.tappa} di ${TAPPE.length}`)
controlla('la terza campagna resta da conquistare',
          finito.tappa < TAPPE.length,
          `dopo la migrazione risultano già superate ${finito.tappa} tappe su ${TAPPE.length}`)
const nuovo = migraCastello(VUOTO, null)
controlla('chi comincia oggi comincia da capo',
          nuovo.tappa === 0 && nuovo.libera === false && nuovo.v === TD_VERSIONE,
          JSON.stringify(nuovo))
uguale('la migrazione non si ripete su un profilo già migrato',
       migraCastello(VUOTO, migraCastello(VUOTO, { tappa: 3, libera: false })).tappa,
       migraCastello(VUOTO, { tappa: 3, libera: false }).tappa)
controlla('un progresso già scritto sulle quindici non viene toccato',
          migraCastello(VUOTO, { tappa: 12, libera: false, v: TD_VERSIONE }).tappa === 12)
nota('vecchie sei tappe → nuove quindici: ' +
     [0, 1, 2, 3, 4, 5, 6].map(v => `${v}→${migraCastello(VUOTO, { tappa: v }).tappa}`).join(' · '))

riassunto("l'equilibrio del castello")
