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
         applicaPartenza, etaDelBambino, ETA_DIFETTO, scegliEta,
         ritoccoSapere, ritocca, giocoAcceso } from '../../src/store/profile.js'
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

/* un anno dopo: si rimette la fascia senza toccare i progressi */
state.profile.coins = 123
accendiSapere('divisioni', false)
applicaPartenza('quarta')
uguale('rimessa la fascia, gli anni salgono', etaDelBambino(), 9.5)
controlla('il castello ricompare', giocoAcceso('torri'))
controlla('e le scelte fatte a mano sui saperi si riscrivono',
  sapereAcceso('divisioni'))
uguale('le monete non si toccano', state.profile.coins, 123)

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

scegliEta(7)
uguale('l\'età si cambia a mano', etaDelBambino(), 7)
scegliEta(99)
uguale('e un numero assurdo non entra', etaDelBambino(), 7)

nota('l\'archivio qui è quello in memoria: fuori dal browser è il ripiego previsto')
riassunto('Chi gioca: roster, migrazione, salvataggio')
