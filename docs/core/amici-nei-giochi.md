# Gli amici nei giochi

Come un gioco mostra dove sono arrivati gli amici e i loro record, dalla bacheca ([amici-bacheca.md](amici-bacheca.md)). **Il
grosso è comune** (`src/amici/`, `src/components/amici/`): il gioco dichiara cosa conta come «tappa» e sceglie dove mettere le
cose. Non legge la bacheca, non confronta, non scrive frasi.

## Cosa vede il bambino (in ogni gioco)

- **Sulla mappa, un pallino per amico** sulla tappa a cui è arrivato: l'iniziale nel suo colore (uno per posto nella lista,
  `COLORI`: due amici non ne hanno mai uno uguale). Niente emoji, che cambiano da un telefono all'altro. Accanto, dove c'è
  posto, il nome: «Leonardo è qui», «Leonardo e Ugo sono qui».
- **In cima alla mappa, chi è da raggiungere**: il più vicino fra quelli più avanti («Leonardo è 2 tappe più avanti di te.»,
  «Ugo è già alla sopravvivenza.»). Chi è dietro non si dice: sulla mappa basta il pallino, nessuno legge «sei ultimo».
- **Sotto la sfida senza fine, i record degli amici** sotto il proprio, dal più alto («Leonardo: 3:10»), e chi c'è senza un
  record. **La classifica vera è solo sui record**, dove il confronto è giusto a ogni età.
- **A fine partita senza fine, la notizia porta la misura**: «Hai superato Leonardo (3:10)!», oppure «Per Leonardo (3:10) ti
  sono mancati 25s». Un pareggio non supera nessuno; chi era già sotto il proprio record non è una notizia.
- Un amico mai incontrato online (senza nome) non si vede; un amico che in quel gioco non ha fatto niente nemmeno.

## «Leonardo ti ha superato», in home

Quando arriva la bacheca di un amico, `sorpassi` (in `src/amici/istantanea.js`, pura) la confronta con quella di prima e con dove
sono io adesso: se in un gioco è **passato davanti** (sulla mappa più avanti di me, o un record più alto del mio, e prima no), il
sorpasso si segna (`dati.sorpassi` in `store/amici.js`, salvato con gli amici). In home, sotto la riga degli amici, una riga per
ognuno dei due più recenti: il pallino, «Leonardo ti ha superato» o «Leonardo ha battuto il tuo record», e il gioco. Toccarla
apre il gioco; aprire il gioco (`usaAmici`) dice tutti i suoi sorpassi, che spariscono.
- **La prima bacheca di un amico non supera nessuno**: era già lì, e dire «ti ha superato» a tutti gli amici appena abbinati è falso.
- **Solo dove io ci sono già** (un posto, un record): in un gioco mai giocato nessuno mi ha superato.
- **Uno per gioco** (la tappa prima del record), il più recente per amico e gioco; al massimo `SORPASSI_MAX` in archivio.
- **Si dice solo se è ancora vero** (`sorpassiDaDire`): chi l'ho già ripreso non ha riga; nemmeno un amico senza nome o un gioco
  che il bambino non vede (spento o sperimentale).

## Come si aggiunge un gioco

**1. La dichiarazione**, nel manifesto (`src/giochi/<g>/gioco.js`) o, per un gioco vecchio, nella sua riga di
`src/data/giochi.js`:

```js
amici: { tappe: QUANTE_TAPPE, dove: 'alla sopravvivenza' },        // Survivors: tutto di serie
amici: { tappe: SCALETTA.length, dove: 'al volo infinito', tappa: p => posizioneOra(filaDi(p.mate)) },   // Asteroidi
amici: true,                                                       // solo record, nessuna mappa
amici: { percorsi: { coniglio: { tappe: 30, dove: 'al sentiero', tappa: p => … }, cane: { … } } },   // più mappe
```

- `tappe`: quanti nodi ha la mappa; il nodo `tappe` (dopo l'ultima) è la sfida senza fine. Senza, il gioco ha solo record.
- `tappa(profilo)`: dove è arrivato il bambino, un nodo da 0 a `tappe`. **Di serie** il cursore di `campagne[chiave]` (la tappa
  da fare, quella con `adesso`), e a campagna finita (`libera`) la sfida senza fine. Si scrive solo se il gioco tiene il suo
  avanzamento altrove. Deve leggere il profilo come lo legge la mappa del gioco: è lo stesso nodo su cui sta il proprio segno.
  **L'età non entra**: la `tappa` dice fin dove si è arrivati giocando, non cosa l'età apre (un manifesto non può leggere lo stato,
  e le tappe aperte dall'età senza averle giocate non sono un posto raggiunto).
- `dove`: come si dice essere arrivati alla sfida senza fine, per la riga in cima. Serve se ci sono `tappe`.
- `percorsi`: un gioco con più mappe indipendenti (un protagonista per strada, una campagna per terreno) ne dichiara una per
  chiave, ognuna con `tappe`, `dove` e **sempre** la sua `tappa` (il cursore di serie è di un percorso solo). La vista di una
  mappa chiede `usaAmici(CHIAVE, { percorso: 'cane' })`. Le chiavi sono di salvataggio: non si rinominano.
- **I record vengono da soli** dal `senzaFine` del manifesto: tutte le sfide, ciascuna sotto la sua chiave.

**2. Nel setup della vista**: `const amici = usaAmici(CHIAVE)` (`src/amici/usaAmici.js`; con più percorsi
`usaAmici(CHIAVE, { percorso })`, uno per mappa). È reattivo, e rilegge le bacheche entrando. Sulla mappa ci sono solo gli amici
che in quel percorso hanno un posto; i record sono di tutti. Dà:

| | |
|---|---|
| `amici.davanti` | la riga in cima, già in parole (vuota se nessuno è avanti) |
| `amici.sullaTappa(nodo)` | gli amici arrivati a quel nodo |
| `amici.allaFine(sfida?)` | chi è alla sfida senza fine e non ha un record di quella sfida |
| `amici.record(sfida?)` | i record di quella sfida, dal più alto, in parole |
| `amici.contro(valore, prima, sfida?)` | a fine partita: la frase contro i record (`prima` = `esito.prima` di `segnaPrimato`) |
| `amici.amici`, `amici.qui`, `amici.tappe` | per chi disegna da sé (la rotta degli asteroidi mette i pallini sulla tela) |

**3. Dove si mostrano**, coi componenti di `src/components/amici/` (colore e misura del testo li dà il gioco intorno):
- `<AmiciQui :amici="amici.sullaTappa(i)" />` sulla tappa: pallini e «… è qui»; `righe` per uno per riga con da quando.
- `<RecordAmici :record="amici.record()" />` sotto la sfida senza fine, e `<AmiciQui :amici="amici.allaFine()" />`.
- `amici.davanti` in cima alla mappa, con `data-amico-davanti`.
- `amici.contro(...)` sul cartello di fine, con `data-contro-amici`.
- `<PallinoAmico :amico="a" />` per un pallino da solo.
Una mappa che non ha posto per il nome sulla tappa mette solo i pallini e dice i nomi dove si tocca la tappa (la rotta: nel
fumetto). Niente fogli nuovi, niente tasti nuovi: gli amici stanno dentro le schermate che ci sono.

**4. La prova**: un `test/integrazione/amici-<gioco>.test.mjs` sul calco di `amici-survivors`: `seminaAmici` e `amicoDiProva`
(`test/aiuto/browser.mjs`) mettono gli amici già letti sul telefono, `__SERVIZIO_SFIDE__` punta a una porta chiusa. Si guarda
la riga in cima, i pallini sulla tappa giusta, i record, e nessun errore. In `unita/amici-bacheca` la riga che elenca i giochi
che dichiarano `amici` si allarga, e se il gioco ha una `tappa` sua, un controllo che la legga giusta.

## I giochi

| Gioco | Stato | Dove |
|---|---|---|
| Asteroidi (`mate`) | fatto | pallini sulla rotta (tela), nomi nel fumetto, record nel fumetto del volo, `data-contro-amici` a fine volo |
| Survivors | fatto | pallini e nomi sulla tappa, record sotto la sopravvivenza, a fine sopravvivenza |
| Codice Segreto (`codice`) | fatto | pallini e nomi sulla tappa, record sotto il gioco libero, `data-contro-amici` al codice sbagliato che chiude la fila |
| Passo passo (`passo`) | fatto | due percorsi, `coniglio` e `cane` (la mappa che si guarda): `tappa` è il posto della sua tappa di adesso sulla sua strada (`postoSullaStrada`, `motore/strade.js`), i numeri di tappe se le ha fatte tutte (è al suo sentiero); in cima `data-amico-davanti`, un pallino sotto la casella e il nome nel fumetto (sulla casella non c'è posto), sotto il sentiero i record di quella sfida e chi c'è senza, `data-contro-amici` sul cartello che chiude la serie (quando un 💡 pagato la chiude: «lascio perdere» non ha cartello) |
| Difendi il Castello (`torri`) | fatto | sul regno: `tappa` è la tappa da fare di `profile.td` (il nodo del cavaliere), le venti, e a campagna finita (`libera`) le partite libere; un pallino sotto lo scudo, il nome nel fumetto, in cima (fuori dal banco che si trascina) `data-amico-davanti`. Le libere sono quattro sfide: sul torrione i pallini di chi ha un record di quella, nel suo fumetto `RecordAmici` e chi è alle libere senza un record lì; chi è alle libere senza nessun record ha i pallini al centro del castello. `data-contro-amici` sul cartello di fine di una libera, con la sfida giocata |
| Il Robot (`costruttore`) | fatto | un pallino sotto il led (sotto il connettore, per il cantiere libero), il nome nel fumetto del led; in cima alla scheda `data-amico-davanti`. Niente record né frase di fine: il gioco non ha una sfida senza fine |
| Conta gli animali (`conta`) | fatto | sulla mappa a carte un pallino e il nome sotto la tappa di ognuno (`tappa` di serie: la tappa da fare, quella con `adesso`); in cima `data-amico-davanti`. Niente record né frase di fine. Finite le dodici tappe la mappa non ha un posto per la fine: chi c'è arrivato non ha un pallino, solo la riga in cima («è già in fondo alle tappe») |
| Prima e dopo (`prima`) | fatto | come Conta: sulla carta della tappa di ognuno (`tappa` di serie, quella con `adesso`) un pallino e il nome, in cima `data-amico-davanti`. Niente record né frase di fine. Finite le dieci tappe la mappa non ha un posto per la fine: chi c'è arrivato non ha un pallino, solo la riga in cima («è già in fondo alle storie») |
| Il laboratorio delle pozioni (`pozioni`) | fatto | come Conta: sulla tappa di ognuno (`tappa` di serie, quella con `adesso`) un pallino e il nome, in cima `data-amico-davanti`. Niente record né frase di fine. Finite le ventinove tappe la mappa non ha un posto per la fine: chi c'è arrivato non ha un pallino, solo la riga in cima («è già in fondo al laboratorio») |
| Il giardino (`giardino`) | fatto | come Conta, sperimentale (dietro l'interruttore dei genitori): sulla tappa di ognuno (`tappa` di serie, quella con `adesso`) un pallino e il nome, in cima `data-amico-davanti`. Niente record né frase di fine. Finite le nove tappe la mappa non ha un posto per la fine: chi c'è arrivato non ha un pallino, solo la riga in cima («è già in fondo al giardino») |
| Castle Battle (`arena`) | fatto | come Conta: sulla carta della tappa di ognuno (`tappa` di serie, quella con `adesso`) un pallino e il nome, in cima `data-amico-davanti`. Chi ha finito le dodici tappe sta alla battaglia infinita (`data-al="infinita"`, dentro `[data-infinita]`): pallino e nome sulla sua carta. Niente record né frase di fine: la battaglia infinita non ha un tempo da battere. La sala delle sfide a due non c'entra |
| La bancarella (`bancarella`) | fatto | sul giro del mondo, nei due livelli: `tappa` è la giornata da fare di `profile.mercato` (la stessa dove si posa l'aereo e il carretto), le sedici, e a giro finito la libera del Cairo (`tappe` = 16, il banco `∞`). Sul mondo un pallino sotto il nome della città di ognuno, nel fumetto della città i nomi; nella piazza un pallino sotto il banco della sua giornata, il nome nel fumetto del banco. In cima, fuori dal mondo e dalla piazza (che scorrono), `data-amico-davanti`. Una città chiusa non si apre: chi c'è dentro si vede sul mondo, non sul banco (si vede quando la città è aperta). Niente record né frase di fine: il gioco non ha una sfida senza fine |
| Il sotterraneo (`sotterraneo`) | fatto | nel mondo di sopra in 3D (`viste/Mondo3d.vue`): `tappa` è il cursore di serie di `campagne.sotterraneo`, cioè il massimo fra gli eroi (non la discesa dell'eroe aperto: `avventure.md`), le sette discese e poi l'abisso (`tappe` = 7, «all'abisso»). Un pallino accanto all'ingresso della discesa di ognuno, in basso a destra (sotto cadrebbe sui piedi dell'eroe che ci sta davanti; per chi ha finito le sette, accanto al pozzo dell'abisso), dentro il bersaglio dell'ingresso che la vista posa a ogni fotogramma: si vede quando l'ingresso è trovato. Il nome nel fumetto dell'ingresso (`FumettoMondo.vue`), aperto o chiuso che sia; in cima, con le carte di sopra (fuori dal mondo, che segue l'eroe), `data-amico-davanti`. I sei dungeon nuovi non sono tappe: lì nessuno. Niente record né frase di fine: il gioco non ha una sfida senza fine |
| English (`inglese`), Español (`spagnolo`) | fatto | sulla mappa del tesoro, sotto il nome della tappa di ognuno, i pallini e il nome (sulla mappa non c'è altro posto: una tappa aperta, toccata, parte); in cima, fuori dalla mappa che scorre, `data-amico-davanti`. `tappa` è `tappaDaFare` (`motore/travaso.js`): le tappe vinte stanno sotto l'id e non nel cursore, quindi il nodo è il posto nella fila di tutte le tappe della prima non vinta, che è dove la nave si ferma la prima volta (`adessoVero`); vinte tutte, `tappe` (è «in fondo alla mappa»: la mappa non ha un posto per la fine, solo la riga in cima). I mondi sono una fila (ognuno viene dopo uno solo), e l'«Sblocca tutti i livelli» dei grandi non conta. Niente record né frase di fine |

**Senza amici, e perché**: la fattoria (`fattoria3d`) non è una campagna (`tappe: 0`) e non ha record, quindi
non c'è un posto dove mettere un amico.

La colonna degli amici nell'albo (accanto al proprio record il migliore degli amici): non serve, deciso il 30/10; i
record degli amici stanno nei giochi, sotto la sfida senza fine.

Nei test: `integrazione/amici-rotta`, `integrazione/amici-survivors`, `integrazione/amici-codice`, `integrazione/amici-passo`, `integrazione/amici-costruttore`, `integrazione/amici-castello`, `integrazione/amici-conta`, `integrazione/amici-prima-dopo`, `integrazione/amici-pozioni`, `integrazione/amici-giardino`, `integrazione/amici-arena`, `integrazione/amici-sotterraneo`, `integrazione/amici-inglese`, `integrazione/amici-spagnolo`, `integrazione/amici-bancarella`, `integrazione/amici-sorpassi` (la riga in home; le regole in `unita/amici-bacheca`). Bersagli: in home `[data-sorpasso][data-gioco]`; `[data-amico-davanti]`; `[data-amici-qui]` (con
`[data-al]` dove serve) e dentro `[data-pallino-amico]`; `[data-record-amici]` con le righe `[data-record-amico]`;
`[data-contro-amici]`; in Passo passo i pallini sulla casella `[data-amici-casella][data-al]` (il posto sulla strada) e i nomi nel fumetto `[data-fumetto] [data-amici-qui]`; sulla rotta `[data-amico-in-rotta]` con `[data-al]` (il nodo); nel Robot i pallini sul led `[data-amici-led][data-al]` (`libero` per il connettore) e il nome nel fumetto `[data-fumetto] [data-amici-qui]`; nel castello i pallini `[data-amici-scudo][data-al]` (l'indice dello scudo, la chiave della libera, `libere` per il centro) e il nome nel fumetto `[data-fumetto] [data-amici-qui]`. In Conta i pallini e il nome stanno sulla carta della tappa, `[data-amici-qui][data-al]` (l'indice della tappa). In Prima e dopo, nelle pozioni e nel giardino uguale a Conta; in Castle Battle uguale, e `[data-infinita] [data-amici-qui]` per la battaglia infinita. Nel sotterraneo i pallini stanno accanto all'ingresso, in basso a destra, dentro il suo bersaglio, `[data-posto] [data-amici-posto][data-al]` (l'indice della discesa, `7` per l'abisso), e il nome nel fumetto, `[data-fumetto] [data-amici-qui][data-al]`. Nelle lingue i pallini e il nome stanno sotto il nome della tappa, `[data-amici-qui][data-al]` (il posto nella fila di tutte le tappe), e `[data-nave][data-porto]` dice su quale sta il segno del bambino. Nella bancarella i pallini stanno sotto la città, `[data-amici-citta][data-al]` (l'id della città), e sotto il banco, `[data-amici-banco][data-al]` (l'id della giornata, `libera` per il Cairo); i nomi nel fumetto, `[data-fumetto] [data-amici-qui]`.
