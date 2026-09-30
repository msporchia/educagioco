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
     4. salire rende un po' meno per ⚡ che costruire, e quando i posti
        finiscono è la strada: niente «una torre per tipo e tanti saluti»
     5. la fatica cresce dentro una campagna, e ogni campagna arriva più
        in alto della precedente

   Le prime non si dimostrano con l'aritmetica: si giocano. Lo fa il
   simulatore (`strumenti/simula-castello.mjs`), che è il motore vero
   senza schermo — quindici tappe, sette modi di giocarle, pochi
   secondi. Il test nel browser serve a un'altra cosa: a controllare che
   il gioco vero e il simulatore raccontino la stessa partita.
   ═══════════════════════════════════════════════════════════════════ */
import { TAPPE, LIBERE, LIBERA, CFG, difesaCon, difesaLarga, energiaAll, nemiciDiOnda,
         costoNuovaTorre, costoSalita, forzaDi, partenzaDi, resaTipi, dpsDi,
         tiroDi, operazioniDi, geloDi, vitaNemico, costoDifesaPiena,
         energiaMassima, potenzaDi, pianoDi, ondateDi, postiDi, entrataOnda, frontiDi,
         ingressiDi, firmaEquilibrio, firmaTaratura, sequenzaTorri, resaPerEnergia, resaDi,
         listinoDi, RAMI_DA }
  from '../../src/data/castello.js'
import { CAMPAGNE, LIBERE_RACCONTO } from '../../src/data/campagne-castello.js'
import { firmaImmunita, immuniDi, comune } from '../../src/data/mostri.js'
import { migraCastello, TD_VERSIONE } from '../../src/store/profile.js'
import { TORRI } from '../../src/data/ops.js'
import { PAGA } from '../../src/data/paghe.js'
import { Ondate } from '../../src/motore/castello/ondate.js'
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
/* ── lo stesso mostro, più avanti, non torna mai più molle ──
   Mostro per mostro, e non ondata per ondata: da quando c'è l'immunità
   il golem che solo le bombe aprono e il pipistrello che le bombe non
   toccano non stanno sulla stessa scala, e la taratura li spiana
   ognuno per conto suo (vedi `spiana` in `strumenti/tara-castello.mjs`).
   Il capo fa gruppo a sé, e le ondate miste pure. */
const chiDi = (t, o) => { const b = new Ondate(t).bestiaDi(o); return b.capo ? 'capo' : b.con ? 'mista' : b.id }
function ammorbiditi(t) {
  const v = t.vite || [], male = []
  for (let k = 0; k < v.length; k++) {
    const chi = chiDi(t, k + 1)
    for (let j = k + 1; j < v.length; j++)
      if (chiDi(t, j + 1) === chi) { if (v[j] < v[k]) male.push(`${chi} o${k + 1}→o${j + 1}`); break }
  }
  return male
}
for (const [i, t] of TAPPE.entries())
  controlla(`${i + 1}. ${t.nome}: lo stesso mostro non si ammorbidisce mai andando avanti`,
            !ammorbiditi(t).length, ammorbiditi(t).join(' · ') + ' · ' + (t.vite || []).join(' → '))

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
  /* le prime due della fila del giocatore modello, e la prima portata
     in cima: i prezzi sono quelli delle torri che si comprano davvero */
  const [a, b] = sequenzaTorri(t, 2)
  let solaInCima = costoNuovaTorre(0, a) + costoNuovaTorre(1, b)
  for (let lv = 1; lv < t.cap; lv++) solaInCima += costoSalita(lv, a)
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
   che dice la verità vale più di un test verde.
   Con le immunità il Canneto non perdona più — il troll che solo le
   bombe aprono tiene alta la tensione anche lì — e l'elenco è vuoto;
   resta perché la prossima tappa che perdona si scriva qui, e non si
   tolga il controllo. */
/* Con le piazzole sparse (docs/castello/piazzole.md) le isole non
   perdonano più, e perdona la gola: vedi docs/castello/taratura.md. */
const PERDONANO = new Set(['La gola'])
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
  /* con i prezzi diversi «meno di un gradino» non è più un numero solo:
     quello che resta non basta per la prossima cosa che comprerebbe */
  const finale = difesaCon(tutta, t)
  controlla(`${i + 1}. ${t.nome}: chi gioca bene finisce a tasche vuote`,
            finale.resta < finale.prossima && finale.resta < costoNuovaTorre(0),
            `gli restano ${finale.resta}⚡, e la prossima mossa ne costa ${finale.prossima}`)
}
/* e chi corre non deve trovarsi con un'altra tappa in mano: il premio
   della fretta è un premio, non una seconda economia. Da quando si può
   chiamare anche a ondata in corso il premio è più grosso — rende il
   tempo risparmiato — e il tetto è di **due** acquisti in tutta la
   tappa: il modello non lo conta (vedi `CFG.fretta`) */
for (const [i, t] of TAPPE.entries()) {
  const conFretta = difesaCon(energiaMassima(t), t)
  const acquisti = conFretta.torri.length + conFretta.torri.reduce((s, lv) => s + lv - 1, 0)
  controlla(`${i + 1}. ${t.nome}: la fretta vale al massimo due acquisti`,
            acquisti - t.calcoli <= 2,
            `chi si prende sempre il premio più grosso arriva a ${acquisti} acquisti invece di ${t.calcoli}`)
}

/* ── 5b. le immunità: ci sono sempre, e il preavviso dice il vero ──
   Un mostro è immune alle torri che non lo toccano, e non si accende né
   si spegne: è com'è fatto. Quello che il preavviso annuncia per ogni
   ondata deve essere esattamente quello che il mostro è — se no il
   nastro direbbe una cosa e il campo un'altra. Le regole delle file
   (chi si può ferire, nessuna torre che vince da sola, la prima ondata
   all'arciere) e i conti dell'immunità sul nemico stanno in
   `unita/immunita-castello`. */
for (const [i, t] of TAPPE.entries()) {
  const onde = Array.from({ length: t.ondate }, (_, k) => new Ondate(t).bestiaDi(k + 1))
  controlla(`${i + 1}. ${t.nome}: ogni ondata dice a cosa è immune, e dice il vero`,
            onde.every(b => b.immune.join() === immuniDi(b.id).join()),
            onde.map(b => `${b.nome}:${b.immune.join('+')}`).join(' '))
}

/* ── 6. salire rende un po' meno che costruire, finché ci sono posti ──
   Era il contrario: salire costava sempre meno di una torre nuova e
   rendeva di più, e il bambino faceva una torre per tipo e poi solo
   gradini («una per tipo e tanti saluti», l'utente). Adesso un ⚡ messo
   nei gradini rende un po' meno di un ⚡ messo in una torre appena
   costruita, e sempre meno salendo — si sale quando i posti finiscono,
   o quando serve il fuoco in un punto. Il conto è per ⚡ cumulato: la
   torre al livello k (costruzione più tutti i gradini) contro la stessa
   torre al livello 1, con la stima del modello (`dpsDi`); quanto vale
   davvero sulle carte lo misura `npm run dps`, in fondo. */
const cumulato = (k, lv) => {
  let e = costoNuovaTorre(0, k)
  for (let l = 1; l < lv; l++) e += costoSalita(l, k)
  return e
}
const perCumulato = (k, lv) =>
  (dpsDi(k, lv) / cumulato(k, lv)) / (dpsDi(k, 1) / cumulato(k, 1))
for (const k of Object.keys(TORRI)) {
  const r = [4, 7, 10].map(lv => perCumulato(k, lv))
  dentro(`${TORRI[k].nome}: al livello 4 un ⚡ rende un po' meno che in una torre nuova`,
         r[0], 0.7, 0.97)
  dentro(`${TORRI[k].nome}: al livello 10 ancora meno, ma non la metà`, r[2], 0.55, 0.9)
  controlla(`${TORRI[k].nome}: e cala salendo`, r[2] < r[0],
            r.map(x => x.toFixed(2)).join(' → '))
}
nota('resa per ⚡ cumulato (liv. 4 / 7 / 10 contro liv. 1): ' + Object.keys(TORRI).map(k =>
  `${TORRI[k].emoji} ${[4, 7, 10].map(lv => perCumulato(k, lv).toFixed(2)).join('/')}`).join(' · '))
/* e il giocatore modello lo sa: a parità di energia allarga finché i
   posti bastano, e in fondo alla tappa — posti finiti — la sua difesa
   batte quella di chi ha solo torri di livello 1 */
for (const [i, t] of TAPPE.entries()) {
  const e = energiaAll(t.ondate, t.partenza)
  const alta = difesaCon(e, t), larga = difesaLarga(e, t)
  controlla(`${i + 1}. ${t.nome}: a fine tappa salire batte il campo pieno di torri basse`,
            alta.potenza >= larga.potenza,
            `[${alta.torri}] fa ${alta.potenza.toFixed(0)}, [${larga.torri}] fa ${larga.potenza.toFixed(0)}`)
}
nota('a fine tappa il modello ha: ' + TAPPE.map(t =>
  `[${difesaCon(energiaAll(t.ondate, t.partenza), t).torri}]`).join(' '))

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
  /* Con le immunità la vita di un'ondata dipende da **quante torri la
     possono ferire**: un golem che solo le bombe aprono ha meno vita di
     un pipistrello che arcieri e magia prendono tutti e due, e quale
     mostro una tappa mette in fila sposta la fatica di un quarto in su
     o in giù. Quindi dentro la campagna si controlla che non crolli e
     che finisca più in alto di dove comincia.
     Da quando i comuni non sono immuni a niente lo scarto si è
     allargato, e il «non crolla» è sceso da tre quarti a tre quinti:
     una tappa di goblin e slime, che tutte le torri feriscono, ha le
     vite più alte del Bosco, e la radice — dove arrivano golem, arpia e
     scheletro — ne ha due terzi pur essendo più difficile (misurato:
     22 → 29 → 33 → 22 nel Bosco, e la cripta del Sotterraneo a 26
     dopo il 42 delle fogne). Quello che la fatica misura è la vita, e
     la vita di un immune vale di più: la difficoltà vera la tiene la
     taratura, fra il 60 e l'85% del limite di ogni ondata. */
  /* e da tre quinti a metà col passaggio alle carte a scacchiera: le
     fogne, la tappa a due bocche nel mezzo del Sotterraneo, salgono a 51
     e la cripta dopo di loro resta a 27 (misurato) — sono le due bocche
     che la fatica moltiplica, non la cripta che si ammorbidisce */
  controlla(`${CAMPAGNE[k].nome}: la fatica non crolla dentro la campagna`,
            fatiche.every((f, i) => i === 0 || f >= fatiche[i - 1] * 0.5),
            fatiche.map(f => f.toFixed(0)).join(' → '))
  controlla(`${CAMPAGNE[k].nome}: e finisce più in alto di dove comincia`,
            fatiche.at(-1) > fatiche[0], fatiche.map(f => f.toFixed(0)).join(' → '))
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
  /* uguali, tranne dove le ondate minime (tre) pagano già più del
     piano: lì avanza meno di un acquisto, e il conto dei calcoli resta
     quello (il sentiero, con due arcieri) */
  const avanzo = t.partenza + entrate - piano.costo
  controlla(`${i + 1}. ${t.nome}: partenza + entrate = costo del piano`,
            avanzo === 0 || (avanzo > 0 && t.ondate === 3 &&
                             avanzo < Math.min(...t.torri.map(k => costoSalita(1, k)))),
            `ho ${t.partenza + entrate} invece di ${piano.costo}`)
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
uguale('il prezzo base di una torre è quello scritto', costoNuovaTorre(0), CFG.costruzione)
controlla('costruire rincara con le torri già in campo',
          costoNuovaTorre(3) > costoNuovaTorre(0))
controlla('salire costa di più mano a mano che si sale', costoSalita(5) > costoSalita(1))
/* ── il carattere: le torri avanzate sono più care già alla prima pietra ──
   Il listino segue la scuola: l'arciere (addizione) costa poco, le bombe
   (divisione) più di tutte. Il ghiaccio, che non ferisce, costa meno di
   tutte — vale per quanto fa rendere gli altri. */
const PER_ASPETTO = a => Object.keys(TORRI).find(k => TORRI[k].aspetto === a)
const [ARC, MAG, GHI, BOM] = ['arciere', 'magica', 'ghiaccio', 'bombe'].map(PER_ASPETTO)
controlla('l\'arciere costa meno della magica, e la magica meno delle bombe',
          costoNuovaTorre(0, ARC) < costoNuovaTorre(0, MAG) &&
          costoNuovaTorre(0, MAG) < costoNuovaTorre(0, BOM),
          ['arciere', 'magica', 'bombe'].map(a => `${a} ${costoNuovaTorre(0, PER_ASPETTO(a))}⚡`).join(' · '))
controlla('il ghiaccio costa meno di tutte', Object.keys(TORRI).every(k => k === GHI ||
          costoNuovaTorre(0, GHI) < costoNuovaTorre(0, k)))
/* con quello che costa una bomba si fanno due arcieri, o uno portato al
   livello tre: tre scelte che si pesano (l'esempio è dell'utente) */
dentro('una bomba costa quanto due arcieri, più o meno',
       costoNuovaTorre(0, BOM) / (costoNuovaTorre(0, ARC) + costoNuovaTorre(1, ARC)), 0.75, 1.25)
dentro('o quanto un arciere portato al livello tre',
       costoNuovaTorre(0, BOM) / (costoNuovaTorre(0, ARC) + costoSalita(1, ARC) + costoSalita(2, ARC)),
       0.65, 1.25)
/* ── la regola: un ⚡ rende lo stesso, a meno del premio della scuola ──
   Il numero di `npm run dps` misurato col motore, qui preso dalla stima
   del modello (`dpsDi`), che è quella con cui il modello tara le tappe.
   Non deve essere esatto — la stima non vede l'ondata che si sfoltisce —
   ma non può stare lontano: il difetto di prima era un per otto. */
for (const k of Object.keys(TORRI))
  for (const lv of [1, 4, 7, 10])
    dentro(`${TORRI[k].nome} liv.${lv}: un ⚡ rende quanto dice il listino`,
           resaPerEnergia(k, lv) / resaDi(k), 0.72, 1.3)
nota('resa per ⚡ (arciere = 1): ' + Object.keys(TORRI).map(k =>
  `${TORRI[k].emoji} ${[1, 4, 7, 10].map(lv => resaPerEnergia(k, lv).toFixed(2)).join('/')}`).join(' · '))
/* Il listino si applica a tutto quello che una torre costa, costruirla e
   farla salire: la scala resta quasi piatta dentro ogni torre, perché
   un acquisto è un calcolo e un gradino in cima non può costare il
   triplo di uno in fondo. La convenienza di potenziare sta nella resa. */
for (const k of Object.keys(TORRI)) {
  controlla(`${TORRI[k].nome}: salire di un gradino costa meno che costruirla`,
            costoSalita(1, k) < costoNuovaTorre(0, k), `${costoSalita(1, k)}⚡ contro ${costoNuovaTorre(0, k)}⚡`)
  controlla(`${TORRI[k].nome}: un acquisto costa più o meno sempre lo stesso`,
            costoSalita(10, k) <= costoNuovaTorre(0, k) * 2)
}
/* Ogni torre cresce a modo suo, ma la convenienza deve valere per tutte:
   salire di un gradino costa meno di una torre nuova e deve rendere quasi
   quanto raddoppiare la difesa. */
const SPARANO = Object.keys(TORRI).filter(k => TORRI[k].danno)
for (const k of SPARANO)
  controlla(`${TORRI[k].nome}: il secondo livello è più conveniente della seconda torre`,
            costoSalita(1, k) < costoNuovaTorre(1, k) && forzaDi(k, 2) - 1 >= 0.4,
            `${costoSalita(1, k)}⚡ per +${((forzaDi(k, 2) - 1) * 100).toFixed(0)}% di potenza, ` +
            `contro ${costoNuovaTorre(1, k)}⚡ per +100%`)
nota('potenza al livello 10: ' + SPARANO.map(k =>
  `${TORRI[k].nome} ×${forzaDi(k, 10).toFixed(1)}`).join(' · '))

/* ── 10. i conti di contorno ── */
dentro('i nemici della prima ondata sono pochi', nemiciDiOnda(1), 4, 10)
controlla('le ondate successive portano più nemici', nemiciDiOnda(5) > nemiciDiOnda(1))
/* non ondata per ondata: l'ultima può essere il capo (la sua vita è
   scritta in nemici normali, e contro uno solo l'area non conta) o un
   mostro che una torre sola ferisce, e ha meno vita per quello. Quello
   che deve valere è che la tappa **salga**: l'ondata più robusta non è
   mai la prima */
controlla('l\'ondata più robusta della tappa non è la prima',
          TAPPE.every(t => Math.max(...t.vite.slice(1)) > t.vite[0]),
          TAPPE.map(t => `${t.vite[0]}→${Math.max(...t.vite.slice(1))}`).join(' · '))
controlla('le partite libere partono con la stessa generosità di una tappa di mezzo',
          LIBERE.every(l => l.partenza >= partenzaDi({ cap: 3 })), LIBERE.map(l => `${l.partenza}⚡`).join(' '))
controlla('un errore costa energia ma non è una condanna',
          CFG.malusErrore > 0 && CFG.malusErrore < CFG.potenziamento,
          `${CFG.malusErrore}⚡ contro un potenziamento da ${CFG.potenziamento}⚡`)
controlla('fermare i nemici paga più che aspettare',
          nemiciDiOnda(1) * CFG.perNemico > CFG.fineOnda + CFG.ondataPulita)

/* ── 11. le torri non si equivalgono, e costano di conseguenza ──
   La resa di una tappa è per ⚡ speso, con l'arciere di livello 1 come
   unità: prima era per torre, e diceva che il ghiaccio abbassava la
   tappa — con i prezzi uguali era vero. Adesso il ghiaccio costa la metà
   di una magica e rende per quello che costa.

   Quale operazione compri quale torre può cambiare (ed è già cambiato una
   volta): qui non si scrivono chiavi a mano, si chiede a `TORRI` chi è
   quello che gela. */
const GELO = Object.keys(TORRI).find(k => TORRI[k].gela)
const ZONA = Object.keys(TORRI).filter(k => TORRI[k].area > 0)
controlla('una tappa di soli arcieri rende quanto l\'unità di misura',
          Math.abs(resaTipi(['add']) - 1) < 0.001, resaTipi(['add']).toFixed(2))
dentro('il ghiaccio rende per quello che costa, come l\'arciere',
       resaTipi([GELO]), 0.9, 1.1)
controlla('le torri a zona fanno più dell\'arciere, e costano di più',
          ZONA.every(k => dpsDi(k) > dpsDi('add') && listinoDi(k) > listinoDi('add')),
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

/* ── 12. le partite libere, una per terreno ──
   Non hanno traguardo, quindi non si "superano": ognuna deve reggere
   abbastanza da valere una partita, e poi cedere. Le prime venti ondate
   sono tarate come una tappa; dopo, la vita continua a salire da sola
   finché la difesa non basta più — una difesa che tiene per sempre è
   una schermata fissa, non un gioco.

   Sono quattro, e ognuna si controlla **da sola**: hanno tracciati a
   due bocche diversi fra loro, e quello che una Y perdona un anello
   non lo perdona. La vecchia libera era a strada singola per paura che
   con due bocche non si tarasse: qui si misura, e se una non reggesse
   il test lo direbbe col nome. */
/* `regali: false` non è una dimenticanza: la libera regala un
   potenziamento ogni cinque ondate (`unita/regali-castello`), e quello
   che si controlla qui è **il pavimento** — la primissima partita di
   chi apre la modalità, che di regali non ne ha nessuno. È anche la
   partita su cui `npm run tara` la tara. */
/* ── una tappa senza rami è una tappa che al bivio non ci arriva ──
   Il bivio viene al gradino `RAMI_DA`: se la tappa lascia salire fin lì
   e il bivio non c'è, la torre cresce oltre il terzo gradino senza mai
   scegliere un mestiere, cioè sale a vuoto. «Quando una tappa non ha
   specializzazioni è solo perché il livello massimo non ci arriva»
   (l'utente). */
for (const t of [...TAPPE, ...LIBERE])
  controlla(`${t.nome} (${t.campagna}): senza rami solo se il tetto sta sotto il bivio`,
            t.rami || t.cap < RAMI_DA, `cap ${t.cap}, bivio al ${RAMI_DA}`)

uguale('le partite libere sono quattro, una per campagna',
       LIBERE.map(l => l.campagna).join(), CAMPAGNE.map(c => c.id).join())
uguale('e le loro chiavi sono quelle del racconto',
       LIBERE.map(l => l.chiave).join(), LIBERE_RACCONTO.map(l => l.chiave).join())
for (const l of LIBERE) {
  const ultima = TAPPE.filter(t => t.campagna === l.campagna).at(-1)
  const tutti = new Set(TAPPE.filter(t => t.campagna === l.campagna).flatMap(t => t.mostri))
  uguale(`${l.nome}: offre le torri dell'ultima tappa della sua campagna`,
         l.torri.join(), ultima.torri.join())
  uguale(`${l.nome}: i rami come nella sua campagna`, l.rami, !!ultima.rami)
  uguale(`${l.nome}: il terreno dell'ultima tappa`, l.ambiente, ultima.ambiente)
  /* tutti quelli della campagna, e più d'una volta solo un comune: la
     fila si allunga coi comuni quando le prime otto ondate lo chiedono
     (`filaCheRegge`) */
  controlla(`${l.nome}: tutti i mostri della campagna, e ripetuti solo i comuni`,
            [...tutti].every(m => l.mostri.includes(m)) && l.mostri.every(m => tutti.has(m)) &&
            l.mostri.every((m, i) => comune(m) || l.mostri.indexOf(m) === i),
            `${l.mostri.join(' ')} contro ${[...tutti].join(' ')}`)
  controlla(`${l.nome}: due ondate di fila non hanno le stesse immunità (due comuni sì)`,
            l.mostri.every((m, i) => {
              const dopo = l.mostri[(i + 1) % l.mostri.length]
              return (comune(m) && comune(dopo)) || firmaImmunita(m) !== firmaImmunita(dopo)
            }),
            l.mostri.map(m => firmaImmunita(m)).join(' '))
  /* due bocche, o una strada che si attraversa da sé: il bastione è
     l'anello vero, e la sua difesa si divide nel tempo (vedi
     `unita/ingressi-castello`) */
  controlla(`${l.nome}: ha più di una bocca, o un anello`,
            ingressiDi(l) >= 2 || l.incroci >= 1, `${ingressiDi(l)} bocche, incroci ${l.incroci || 0}`)
  controlla(`${l.nome}: ogni ondata tarata ha la sua vita`,
            Array.isArray(l.vite) && l.vite.length === 20 && l.vite.every(v => v > 0),
            `${l.vite ? l.vite.length : 0} vite`)
  controlla(`${l.nome}: lo stesso mostro non si ammorbidisce mai andando avanti`,
            !ammorbiditi({ ...l, ondate: 20 }).length, ammorbiditi({ ...l, ondate: 20 }).join(' · '))
  controlla(`${l.nome}: la vita continua a salire oltre la tabella`, l.oltre > 1, `×${l.oltre}`)
  /* si gioca **com'è in gioco** — `ondate: Infinity`, così le bocche
     insieme arrivano da dove le mette `ONDATE_TARATE` — e ci si ferma
     alla dodicesima: giocarla come una campagna da dodici cambierebbe
     quella regola, ed è proprio la disallineamento che ha fatto cedere
     il bivio alla sesta */
  const prime = gioca({ ...l, regali: false }, { ...PROFILI.misura, finoA: 12 })
  controlla(`${l.nome}: regge una partita vera, senza nessun regalo`,
            prime.esito === 'arrivato' && prime.cuori === CFG.cuori,
            `${prime.esito} all'ondata ${prime.onda} con ${prime.cuori}❤`)
  controlla(`${l.nome}: prima o poi cede`,
            vitaNemico(l, 60) > vitaNemico(l, 20) * 20,
            `all'ondata 60 i nemici hanno ${Math.round(vitaNemico(l, 60))} di vita, ` +
            `contro ${Math.round(vitaNemico(l, 20))} alla ventesima`)
  /* e dove cede davvero, giocata fino in fondo da chi corre: è il
     numero che i regali (`unita/regali-castello`) fanno salire */
  const fino = gioca({ ...l, regali: false }, PROFILI.pieno)
  controlla(`${l.nome}: giocata fino in fondo si perde`, fino.esito === 'persa',
            `${fino.esito} all'ondata ${fino.onda}`)
  nota(`${l.nome}: dodici ondate → ${prime.cuori}❤ con torri [${prime.livelli}] · ` +
       `cede all'ondata ${fino.onda} · la vita all'ondata 40 è ${Math.round(vitaNemico(l, 40))}`)
}
controlla('`LIBERA` è la prima delle quattro, per chi ne vuole una sola', LIBERA === LIBERE[0])

/* ── 13. le monete: un'operazione in colonna, pagata quando è fatta ──
   Niente premio di tappa: ogni conto senza errori vale PAGA.operazione nel
   momento in cui la torre sale (docs/apprendimento/calibrazione.md). Vale
   più di un asteroide — è un conto a più cifre, riporti compresi — ma non
   cinque volte tanto, o gli altri giochi diventano tempo perso. */
dentro('un\'operazione vale da due a cinque asteroidi', PAGA.operazione / PAGA.asteroide, 2, 5)
nota('operazioni per tappa: ' + TAPPE.map(operazioniDi).join(' → ') +
     ' · monete, tutte senza errori: ' + TAPPE.map(t => operazioniDi(t) * PAGA.operazione).join(' → '))

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
