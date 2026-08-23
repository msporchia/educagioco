/* ═══════════════════════════════════════════════════════════════════
   CHI GIOCA — il roster, la migrazione, il salvataggio da portare via

   Senza browser: fuori dal browser `store/storage.js` degrada da solo
   all'archivio in memoria, che per questi controlli è un archivio come
   un altro — si scrive, si rilegge, si enumera.

   Qui si prova la cosa che il resto dei test non può vedere: che
   l'elenco dei giocatori si **ricostruisce da quello che c'è**, e non da
   un elenco di nomi scritto nel codice. È la ragione per cui questo repo
   può diventare pubblico, e finora `store/profile.js` non aveva un solo
   test suo.
   ═══════════════════════════════════════════════════════════════════ */
import { state, init, creaGiocatore, selectPlayer, nomeDi, migraProfilo,
         rinominaGiocatore, eliminaGiocatore,
         esportaTutto, importaTutto, persist,
         aspettoDi, scegliAspetto,
         sapereAcceso, accendiSapere, saperiSpenti,
         spostaLEta, etaDelBambino, ETA_DIFETTO,
         ritoccoSapere, ritocca, giocoAcceso, giocoForzato, fissaGioco, fissaSapere,
         rimettiAiDifetti } from '../../src/store/profile.js'
import { save, load, remove, chiavi, flush } from '../../src/store/storage.js'
import { SAPERI } from '../../src/data/saperi.js'
import { PERSONE } from '../../src/giochi/fattoria/dati/atlante.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

/* L'archivio è uno solo per tutto il file: fra un caso e l'altro si
   svuota a mano, altrimenti il roster di prima resta fra i piedi. */
async function pulisci() {
  for (const k of await chiavi('')) await remove(k)
  state.giocatori = []
  state.player = ''
}

const profiloFinto = (monete = 0) => ({ v: 6, coins: monete, items: {}, totals: { math: 0 } })

/* ── 1. il primo avvio dopo l'aggiornamento ──
   Il roster non c'è ancora, ma i profili sì: vanno ritrovati. */
await pulisci()
save('profilo:Abc', profiloFinto(10))
save('profilo:Xyz', profiloFinto(20))
await flush()
await init()

stessaLista('i giocatori si ricostruiscono dalle chiavi',
  state.giocatori.map(g => g.id), ['Abc', 'Xyz'])
uguale('e l\'id fa anche da nome, finché non lo cambiano', nomeDi('Abc'), 'Abc')
uguale('i progressi di chi c\'era sono ancora i suoi', state.profile.coins, 10)
controlla('e adesso l\'elenco è scritto nero su bianco', Array.isArray(await load('giocatori')))

/* ── 2. le chiavi dei profili non si toccano ──
   È il patto di questa migrazione: nessun dato copiato, nessuno
   cancellato, e una build vecchia ripubblicata ritrova tutto. */
const dopo = await chiavi('profilo:')
stessaLista('le chiavi dei profili sono rimaste dov\'erano', dopo, ['profilo:Abc', 'profilo:Xyz'])

/* ── 3. il roster salvato ha la precedenza ──
   Una volta che esiste, comanda lui: è lì che vivono i nomi veri, e
   ricostruirlo dalle chiavi cancellerebbe ogni rinomina. */
await pulisci()
save('profilo:g1', profiloFinto(5))
save('giocatori', [{ id: 'g1', nome: 'Nina' }])
await flush()
await init()
uguale('un giocatore solo', state.giocatori.length, 1)
uguale('e si chiama come dice il roster, non come la chiave', nomeDi('g1'), 'Nina')

/* ── 4. un telefono appena installato ──
   Nessun profilo, nessun roster: non si inventa nessuno. Inventarlo
   vorrebbe dire scrivere un nome nel codice. */
await pulisci()
await init()
uguale('nessun giocatore', state.giocatori.length, 0)
uguale('e nessuno sta giocando', state.player, '')
persist()
stessaLista('senza giocatore non si scrive niente nell\'archivio', await chiavi('profilo:'), [])

/* ── 5. il primo nome ── */
const id1 = await creaGiocatore('  Nina  ')
uguale('il nome si ripulisce', nomeDi(id1), 'Nina')
uguale('e si entra subito dentro', state.player, id1)
controlla('l\'id è opaco: non si porta dietro il nome', !/nina/i.test(id1))

const id2 = await creaGiocatore('Bea')
controlla('il secondo id è diverso dal primo', id1 !== id2)
uguale('e adesso sono in due', state.giocatori.length, 2)

let rifiutato = false
try { await creaGiocatore('   ') } catch (e) { rifiutato = true }
controlla('un nome vuoto non crea nessuno', rifiutato)

/* ── 6. due bambini possono chiamarsi uguale ──
   Sullo schermo sì, nell'archivio no: è l'id che tiene separati i
   progressi, e infatti il secondo non eredita le monete del primo. */
const id3 = await creaGiocatore('Nina')
controlla('stesso nome, id diverso', id3 !== id1)
uguale('e progressi suoi', state.profile.coins, 0)

/* ── 6b. rinominare non sposta niente ──
   È il patto di id e nome separati: cambia l'etichetta, il salvataggio
   resta esattamente dov'era. Se un giorno la rinomina copiasse i dati
   sotto una chiave nuova, questo controllo diventerebbe rosso. */
await pulisci()
save('profilo:g1', profiloFinto(55))
save('giocatori', [{ id: 'g1', nome: 'Nina' }])
await flush()
await init()
await rinominaGiocatore('g1', '  Ninetta ')
uguale('il nome cambia', nomeDi('g1'), 'Ninetta')
stessaLista('la chiave del salvataggio non si muove', await chiavi('profilo:'), ['profilo:g1'])
uguale('e i progressi sono ancora tutti lì', (await load('profilo:g1')).coins, 55)
uguale('anche dopo aver riaperto il gioco',
  (await load('giocatori')).find(g => g.id === 'g1').nome, 'Ninetta')

let nomeVuoto = false
try { await rinominaGiocatore('g1', '  ') } catch (e) { nomeVuoto = true }
controlla('un nome vuoto non passa', nomeVuoto)
uguale('e il nome di prima resta', nomeDi('g1'), 'Ninetta')

/* ── 6c. eliminare butta via davvero ── */
save('profilo:g2', profiloFinto(66))
state.giocatori.push({ id: 'g2', nome: 'Bea' })
await flush()
await selectPlayer('g2')

await eliminaGiocatore('g2')
uguale('la voce sparisce dal roster', state.giocatori.length, 1)
stessaLista('e il salvataggio pure', await chiavi('profilo:'), ['profilo:g1'])
uguale('chi cancella se stesso finisce nell\'altro profilo', state.player, 'g1')
uguale('con i progressi giusti', state.profile.coins, 55)

/* Cancellato l'ultimo si torna al primo avvio: è la verità, non c'è più
   nessuno. Inventarne uno al volo vorrebbe dire scrivere un nome nel
   codice, che è la cosa da cui è partito tutto. */
await eliminaGiocatore('g1')
uguale('senza più nessuno il roster è vuoto', state.giocatori.length, 0)
uguale('e non sta giocando nessuno', state.player, '')
stessaLista('nell\'archivio non resta nessun profilo', await chiavi('profilo:'), [])

/* ── 7. il campo `v` arriva fino alla migrazione ──
   Il gancio esiste perché l'informazione «da quale versione viene questo
   profilo» si perde al primo avvio della build nuova: qui si prova che
   chi la vuole la trova, non che oggi qualcuno la usi. */
uguale('un profilo che non c\'era non ha niente da migrare',
  migraProfilo({ coins: 1 }, 0).coins, 1)
uguale('e uno che c\'era passa di qui con la sua versione',
  migraProfilo({ coins: 2 }, 6).coins, 2)

/* ── 7b. LA FASCIA CHE HA IMPARATO A SPEGNERE DOPO ──
   Le partenze scrivono le eccezioni una volta sola, alla creazione:
   quando l'elenco di una fascia impara che un pezzo di scuola arriva
   dopo, chi ha già il profilo continua a ricevere quelle domande. È
   così che il difetto è finito in mano a un genitore giocando invece
   che da qui, e la migrazione esiste per quello.

   La parte da non sbagliare non è scrivere: è **non scrivere sopra a
   un grande**. La regola è che si tocca una chiave solo nella fascia
   in cui il difetto è nuovo, perché lì l'assenza non può essere la
   traccia di una riaccensione — riaccendere un sapere al suo difetto
   cancella la voce e non lascia niente. Se questo controllo fosse
   sbagliato porterebbe via una scelta di un genitore **senza che
   nessuno se ne accorga**, che è il modo peggiore di rompersi. */
{
  const ieri = (settings) => ({ ...profiloFinto(0), settings })

  await pulisci()
  save('giocatori', [{ id: 'g1', nome: 'Otto' }, { id: 'g2', nome: 'Sei' },
                     { id: 'g3', nome: 'SenzaEta' }, { id: 'g4', nome: 'Oggi' }])
  /* un bambino di terza come lo scriveva la build di ieri: tre saperi
     spenti e niente altro */
  save('profilo:g1', ieri({ eta: 8, sa: { divisioni: false, misure: false, conversioni: false } }))
  /* uno di prima a cui un grande aveva **riacceso** la stima: nel
     profilo non c'è scritto niente, perché riaccendere cancella la
     voce — ed è esattamente il caso in cui una migrazione distratta
     gliela rispegne */
  save('profilo:g2', ieri({ eta: 6.5, sa: { moltiplicazioni: false, problemi: false } }))
  /* e uno nato prima che l'età esistesse */
  save('profilo:g3', ieri({ sa: {} }))
  /* uno già aggiornato: non deve passare di qui una seconda volta */
  save('profilo:g4', { ...profiloFinto(0), v: 7, settings: { eta: 8, sa: {} } })
  await flush()
  await init()

  await selectPlayer('g1')
  const sa1 = state.profile.settings.sa
  uguale('a otto anni i cubetti nascosti si spengono', sa1['geo:cubetti'], false)
  uguale('e le viste dall\'alto', sa1['geo:viste'], false)
  controlla('ma il gruppo «I solidi» resta acceso', sapereAcceso('solidi'))
  controlla('e la stima pure, perché si insegna in una riga', sapereAcceso('stima'))
  uguale('quello che c\'era resta dov\'era', sa1.divisioni, false)

  await selectPlayer('g2')
  const sa2 = state.profile.settings.sa
  controlla('la stima riaccesa a mano a sei anni e mezzo resta accesa',
            sapereAcceso('stima'), JSON.stringify(sa2))
  uguale('e le due spente a mano restano spente', sa2.problemi, false)
  uguale('mentre «Com\'è fatto un animale» arriva adesso', sa2.adattamento, false)

  await selectPlayer('g3')
  uguale('un profilo senza età vale nove anni, e a nove non si spegne niente',
         Object.keys(state.profile.settings.sa).length, 0)

  await selectPlayer('g4')
  uguale('e chi era già aggiornato non si tocca',
         Object.keys(state.profile.settings.sa).length, 0)

  /* ── e il cestino non rimigra due volte ──
     Una copia messa da parte **oggi** porta con sé la versione di
     oggi, quindi rimetterla non la fa ripassare di qui; una fatta
     prima dell'aggiornamento ha ancora la sua, e viene migrata come
     tutte le altre. Basta che il timbro finisca nella copia: se
     `selectPlayer` non lo scrivesse, un ripristino rifarebbe il giro e
     riscriverebbe sopra le scelte fatte nel frattempo. */
  await selectPlayer('g1')
  uguale('un profilo appena letto porta la versione di oggi', state.profile.v, 7)
}

/* ── 8. il salvataggio da portare via ── */
await pulisci()
save('profilo:g1', profiloFinto(100))
save('profilo:g2', profiloFinto(200))
save('giocatori', [{ id: 'g1', nome: 'Nina' }, { id: 'g2', nome: 'Bea' }])
await flush()
await init()

const uscita = await esportaTutto()
stessaLista('nel file ci sono tutti i profili dell\'archivio',
  Object.keys(uscita.profili).sort(), ['g1', 'g2'])
uguale('con i progressi veri', uscita.profili.g2.coins, 200)
stessaLista('e i nomi viaggiano col file',
  uscita.giocatori.map(g => g.nome), ['Nina', 'Bea'])

/* Un profilo orfano — roster perso, voce cancellata per sbaglio — deve
   finire nel salvataggio lo stesso: è l'ultimo momento utile per
   accorgersene, e lasciarlo fuori vorrebbe dire buttarlo. */
save('profilo:g9', profiloFinto(999))
await flush()
const conOrfano = await esportaTutto()
controlla('anche un profilo fuori dal roster viene salvato', !!conOrfano.profili.g9)

/* ── 9. rimettere dentro un salvataggio ── */
await pulisci()
await init()
const nomi = await importaTutto(uscita)
stessaLista('tornano i nomi, non gli id', nomi.sort(), ['Bea', 'Nina'])
uguale('e con loro i progressi', (await load('profilo:g2')).coins, 200)
uguale('il roster si ricostruisce dal file', state.giocatori.length, 2)
controlla('e qualcuno sta giocando', !!state.player)

/* ── 10. i salvataggi di ieri si aprono ancora ──
   Il file scaricato prima di questa versione ha un'altra firma e non ha
   l'elenco dei nomi. Si accetta lo stesso: quello che conta è che abbia
   la forma di un salvataggio, non come si chiamava. Rifiutarlo vorrebbe
   dire dire a un genitore che il backup fatto apposta non vale più. */
await pulisci()
await init()
const vecchio = { tipo: 'una-firma-di-ieri', v: 1, profili: { Abc: profiloFinto(42) } }
const tornati = await importaTutto(vecchio)
stessaLista('un salvataggio con la firma vecchia entra', tornati, ['Abc'])
uguale('con i suoi progressi', (await load('profilo:Abc')).coins, 42)
uguale('e chi non ha un nome nel file si chiama come il suo id', nomeDi('Abc'), 'Abc')

let scartato = false
try { await importaTutto({ tipo: 'roba', profili: 'no' }) } catch (e) { scartato = true }
controlla('un file che non è un salvataggio viene rifiutato', scartato)

let vuoto = false
try { await importaTutto({ profili: {} }) } catch (e) { vuoto = true }
controlla('e uno senza nessun profilo dentro pure', vuoto)

/* ── 11. con che faccia si vede in mappa ──
   Come il nome: un attributo del bambino, e non un campo che serve a un
   gioco. `PERSONE` viene dall'atlante degli sprite (generato, non è un
   elenco scritto qui), e ci deve essere almeno un personaggio o questo
   file di test è la prima cosa che se ne accorge. */
controlla('c\'è almeno un personaggio scelto in PERSONE', PERSONE.length > 0)

await pulisci()
await init()
const id4 = await creaGiocatore('Uga')
controlla('un profilo appena creato ha già un aspetto valido', PERSONE.includes(aspettoDi()))

controlla('si può scegliere un personaggio dell\'atlante', scegliAspetto(PERSONE[0]))
uguale('e resta quello scelto', aspettoDi(), PERSONE[0])

controlla('un nome che PERSONE non ha viene rifiutato', scegliAspetto('non-esiste') === false)
uguale('l\'aspetto di prima non si tocca', aspettoDi(), PERSONE[0])

/* Un salvataggio di ieri non ha `aspetto`, e uno rovinato a mano potrebbe
   puntare a un personaggio che l'atlante non ha più: in tutti e due i
   casi si ricade sul primo di PERSONE, senza piantare il gioco. */
state.profile.aspetto = 'personaggio-tolto-da-un-aggiornamento'
uguale('un aspetto che non esiste più ricade sul primo disponibile', aspettoDi(), PERSONE[0])
delete state.profile.aspetto
uguale('e un profilo senza il campo pure', aspettoDi(), PERSONE[0])

/* Chi lo sceglie in fase di creazione — la schermata dei genitori, quando
   aggiunge un fratellino senza entrarci — non passa da `state.profile`:
   va applicato al profilo scritto su disco. */
const secondo = PERSONE[PERSONE.length - 1]
const id5 = await creaGiocatore('Bibi', false, null, secondo)
const salvato = await load('profilo:' + id5)
uguale('l\'aspetto scelto alla creazione arriva sul profilo salvato', salvato.aspetto, secondo)

/* ── i saperi che nascono spenti ──
   Quasi tutti i macrogruppi sono accesi finché qualcuno non li spegne,
   e la voce nel profilo esiste solo per le eccezioni. I pochi che
   `data/saperi.js` dichiara `difetto: false` — congiuntivo,
   condizionale, passato remoto, trapassato: roba che a scuola arriva
   dopo — girano al contrario, e la parte che conta è che il salvataggio
   resti fatto di eccezioni anche per loro. Se il difetto finisse scritto
   nel profilo, cambiarlo un domani non toccherebbe nessuno di quelli
   già creati. */
await pulisci()
await init()
await creaGiocatore('Nuovo')
const NASCONO_SPENTI = SAPERI.filter(s => s.difetto === false).map(s => s.chiave)

controlla('ce n\'è almeno uno che nasce spento', NASCONO_SPENTI.length > 0)
controlla('un profilo appena creato non li ha accesi',
  NASCONO_SPENTI.every(c => !sapereAcceso(c)))
controlla('e chi fa le domande se li ritrova fra quelli da evitare',
  NASCONO_SPENTI.every(c => saperiSpenti().includes(c)))
uguale('senza che nel profilo sia scritto niente',
  NASCONO_SPENTI.filter(c => state.profile.settings.sa?.[c] !== undefined).length, 0)

const tardivo = NASCONO_SPENTI[0]
accendiSapere(tardivo, true)
controlla('acceso a mano, resta acceso', sapereAcceso(tardivo))
uguale('e stavolta il profilo lo scrive, perché è l\'eccezione',
  state.profile.settings.sa[tardivo], true)
controlla('e non è più fra quelli da evitare', !saperiSpenti().includes(tardivo))

accendiSapere(tardivo, false)
controlla('rispento, torna al suo difetto', !sapereAcceso(tardivo))
uguale('e la voce sparisce dal salvataggio', state.profile.settings.sa[tardivo], undefined)

/* l'altra metà della regola non si muove: chi nasce acceso si comporta
   come sempre, e il `false` è la sua unica eccezione */
uguale('un sapere normale nasce acceso', sapereAcceso('presente'), true)
accendiSapere('presente', false)
uguale('spegnerlo scrive false', state.profile.settings.sa.presente, false)
accendiSapere('presente', true)
uguale('riaccenderlo toglie la voce', state.profile.settings.sa.presente, undefined)

/* ── da dove parte, e fin dove pescano le domande ──
   Una partenza scrive tre cose in una volta: quali giochi si vedono,
   cosa si dà per scontato, e **la fascia delle domande** — l'arco di
   manopola che compete a quel bambino (`quiz/nucleo/classi.js`). La
   terza è quella che si vede meno di tutte: se non arrivasse, un
   bambino di sei anni si troverebbe le domande di quarta senza che
   niente sembri rotto, e nessun controllo di forma se ne accorgerebbe.

   E il contrario, che conta uguale: chi il profilo ce l'aveva già non
   deve trovarsi la fascia addosso. Il difetto è la scala di scuola, cioè
   quello che il gioco faceva prima che la fascia esistesse. */
await pulisci()
await init()
await creaGiocatore('SenzaScelta')
uguale('un profilo senza partenza è trattato come quelli di ieri',
  etaDelBambino(), ETA_DIFETTO)
uguale('e non si scrive niente nel salvataggio', state.profile.settings.eta, undefined)

await pulisci()
await init()
await creaGiocatore('Piccola', true, 'prima')
uguale('chi parte da «prima o seconda» ha sei anni e mezzo', etaDelBambino(), 6.5)
controlla('e il castello non ce l\'ha in home', !giocoAcceso('torri'))
controlla('ma il dungeon sì: le domande adesso sanno farsi piccole',
  giocoAcceso('dungeon'))
controlla('e le moltiplicazioni restano fuori dalle domande',
  saperiSpenti().includes('moltiplicazioni'))

/* ── SPOSTARE L'ETÀ ──
   Una manopola sola, in anni, e la fascia è una conseguenza. Le due
   cose da non sbagliare sono i due versi:

     · **dentro la stessa fascia non si tocca niente.** È la promessa
       che rende la manopola usabile: senza, ogni mezzo anno
       cancellerebbe quello che un grande ha sistemato a mano, e
       spostarla diventerebbe una cosa che non si fa.
     · **cambiando fascia si riparte dai difetti**, ed è per questo che
       la schermata lo fa confermare quando c'è qualcosa da perdere. */
state.profile.coins = 123
accendiSapere('divisioni', false)

const dentro = spostaLEta(7)
uguale('mezzo anno dentro la stessa fascia sposta gli anni', etaDelBambino(), 7)
controlla('e non riscrive niente', !dentro.riscrive)
controlla('quello che era spento a mano resta spento', !sapereAcceso('divisioni'))

const fuori = spostaLEta(9.5)
uguale('cambiando fascia gli anni salgono', etaDelBambino(), 9.5)
controlla('e stavolta riscrive', fuori.riscrive)
controlla('il castello ricompare', giocoAcceso('torri'))
controlla('e le scelte fatte a mano sui saperi si riscrivono',
  sapereAcceso('divisioni'))
uguale('le monete non si toccano', state.profile.coins, 123)

/* L'età fine non si riallinea a quella della fascia: 7,5 sta nella
   fascia degli 8 e deve restare 7,5, se no la manopola si sposterebbe
   da sola sotto il dito. */
spostaLEta(7.5)
uguale('la manopola resta dove l\'hanno messa', etaDelBambino(), 7.5)

/* ── il ritocco ──
   L'interruttore dei saperi aveva due posizioni, e il «no» è una
   risposta grossa. Il ritocco è quella piccola: un gradino su o giù —
   mezzo anno di scuola — su una taratura che abbiamo sbagliato noi. */
uguale('di partenza nessun gruppo è ritoccato', ritoccoSapere('problemi'), 0)
ritocca('problemi', -1)
uguale('ritoccato, si ricorda', ritoccoSapere('problemi'), -1)
uguale('e si scrive nel profilo', state.profile.settings.ritocchi.problemi, -1)
uguale('non si va oltre tre gradini', ritocca('problemi', 9), 3)
ritocca('problemi', 0)
uguale('a zero torna al difetto', ritoccoSapere('problemi'), 0)
uguale('e la voce sparisce', state.profile.settings.ritocchi.problemi, undefined)

/* ── l'età si sposta da una parte sola ──
   `scegliEta` non c'è più: scriveva il numero e basta, e lasciava in
   casa i giochi dell'età di prima. Chi sposta l'età passa da
   `spostaLEta`, che decide anche cosa fare di giochi e saperi — e un
   numero assurdo non entra da nessuna delle due parti. */
spostaLEta(7)
uguale('l\'età si cambia a mano', etaDelBambino(), 7)
spostaLEta(99)
uguale('e un numero assurdo non entra', etaDelBambino(), 7)

/* ── LE TRE POSIZIONI DI UN GIOCO ──
   Spento, com'è di partenza, o **tenuto comunque**. La terza è nuova, e
   la sua prova è che si scriva `true` per esteso: acceso è l'assenza,
   quindi un `true` che finisse cancellato per abitudine lascerebbe il
   gioco a decidere all'età senza che nessuno se ne accorga. */
{
  fissaGioco('dungeon', 'no')
  uguale('spento si scrive false', state.profile.settings.giochi.dungeon, false)
  controlla('e il gioco è spento', !giocoAcceso('dungeon'))

  fissaGioco('dungeon', 'si')
  uguale('tenuto comunque si scrive true', state.profile.settings.giochi.dungeon, true)
  controlla('e si riconosce', giocoForzato('dungeon'))
  controlla('un gioco forzato è anche acceso', giocoAcceso('dungeon'))

  fissaGioco('dungeon', 'difetto')
  uguale('e «come dice l\'età» non lascia nessuna voce',
         state.profile.settings.giochi.dungeon, undefined)
  controlla('né una forzatura', !giocoForzato('dungeon'))
}

/* ── E LE TRE POSIZIONI DI UN PEZZO DI SCUOLA ──
   Le divisioni del castello non hanno domande nel mazzo: la loro tacca
   non sposta niente di mezzo anno, sceglie **chi decide** — ed è la
   stessa forma dei giochi, con la stessa trappola. «Come dice l'età»
   non vuol dire «nessuna eccezione»: a otto anni la partenza le spegne,
   quindi rimettere quella riga deve **scrivere** `false`. Se cancellasse
   e basta, «rimetti questa riga» e «rimetti tutto» lascerebbero due
   profili diversi, e la riga resterebbe ambra appena dopo aver rimesso
   tutto — che è il momento in cui è più evidente che sta mentendo. */
{
  spostaLEta(8)
  fissaSapere('divisioni', 'si')
  controlla('«l\'ha già fatto» le accende contro l\'età', sapereAcceso('divisioni'))
  uguale('e non lascia scritto un difetto', state.profile.settings.sa.divisioni, undefined)

  fissaSapere('divisioni', 'no')
  controlla('«non l\'ha ancora fatto» le spegne', !sapereAcceso('divisioni'))
  uguale('scrivendo l\'eccezione', state.profile.settings.sa.divisioni, false)

  fissaSapere('divisioni', 'difetto')
  uguale('e «come dice l\'età» scrive quello che la partenza scriverebbe',
         state.profile.settings.sa.divisioni, false)

  /* la prova che le due strade portano allo stesso posto: si rimette la
     riga, si rimette tutto, e i due salvataggi devono coincidere */
  /* l'ordine delle chiavi non è il dato: una mappa di eccezioni dice la
     stessa cosa comunque siano scritte */
  const eccezioni = () => Object.entries(state.profile.settings.sa || {})
    .map(([k, v]) => `${k}=${v}`).sort().join(' ')
  const unaRiga = eccezioni()
  fissaSapere('divisioni', 'si')
  rimettiAiDifetti()
  uguale('rimettere la riga e rimettere tutto lasciano lo stesso profilo',
         eccezioni(), unaRiga)

  /* e dove l'età non lo spegne, «come dice l'età» non scrive niente */
  spostaLEta(9.5)
  fissaSapere('divisioni', 'no')
  fissaSapere('divisioni', 'difetto')
  uguale('a 9,5 anni la voce sparisce, perché il difetto è acceso',
         state.profile.settings.sa.divisioni, undefined)
  controlla('e le divisioni sono accese', sapereAcceso('divisioni'))
}

/* ── E IL TASTO CHE RIMETTE TUTTO ──
   Butta le eccezioni e riparte dai difetti della fascia, ritocchi
   compresi. Le due cose che non deve fare sono le due che
   spaventerebbero: **non tocca l'età** e **non tocca i progressi**. */
{
  spostaLEta(8)
  const monete = state.profile.coins
  fissaGioco('torri', 'no')
  fissaGioco('dungeon', 'si')
  ritocca('math:x7', 2)
  const sapere = SAPERI.map(x => x.chiave).find(c => !saperiSpenti().includes(c))
  accendiSapere(sapere, false)

  const mossa = rimettiAiDifetti()
  controlla('rimettere dice di aver fatto qualcosa', !!mossa)
  uguale('e conta quello che ha buttato', mossa.perde.giochi, 2)
  uguale('coi ritocchi', mossa.perde.ritocchi, 1)
  uguale('non resta nessun ritocco', ritoccoSapere('math:x7'), 0)
  uguale('né il gioco spento a mano', state.profile.settings.giochi.torri, undefined)
  uguale('né quello tenuto a mano', state.profile.settings.giochi.dungeon, undefined)
  controlla('il pezzo di scuola torna acceso', !saperiSpenti().includes(sapere))
  uguale('l\'età resta quella che era', etaDelBambino(), 8)
  uguale('e le monete non si toccano', state.profile.coins, monete)
  uguale('rimettere due volte non ha più niente da fare',
         rimettiAiDifetti(), null)
}

nota('l\'archivio qui è quello in memoria: fuori dal browser è il ripiego previsto')
riassunto('Chi gioca: roster, migrazione, salvataggio')
