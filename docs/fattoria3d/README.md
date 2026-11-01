# 🚜 La fattoria

Il posto dove si spendono le monete, disegnato in 3D (three.js): il contadino cammina fino alle cose e le fa, il terreno si compra
a lotti (senza confini) dentro un recinto basso, i pezzi si trascinano dalla barra alla mappa. Dal 31/10/2026 è **la fattoria sola**:
la 2D è stata tolta e la 3D ha preso il suo posto in home e il suo nome. La chiave resta `fattoria3d` (le cartelle, i salvataggi,
questa cartella), il codice è in `src/giochi/fattoria3d/`, e quello che la 3D legge ancora della 2D (i numeri, i vecchi salvataggi da
convertire) sta in `src/giochi/fattoria3d/da2d/`. Le monete sono quelle vere.

- [presentazione.md](presentazione.md) — per chi arriva da fuori: cosa si fa, cosa allena, note per i genitori
- [regole.md](regole.md) — i principi: il posto dove si spende, niente si vende, niente marcisce, come si dice di no, quanto costa, le pecore, le macchine
- [catena.md](catena.md) — le regole dell'albero, venute dalla 2D: N → 1, ogni macchina un mestiere, le bocche, le confluenze, coltivare conviene la metà, i controlli
- [livelli.md](livelli.md) — l'esperienza (la spesa), le soglie a formula e la loro misura (`npm run tara:fattoria3d`), cosa arriva a ogni livello, il gating e le fattorie già salvate
- [merci-e-ricette.md](merci-e-ricette.md) — le merci e le ricette sono quelle della 2D: la faccia di ogni merce (`Faccia.vue`), le macchine e le ricette giuste, gli scarti, i vecchi salvataggi
- [edifici-liberi.md](edifici-liberi.md) — gli edifici sono pezzi liberi: si costruiscono dal menu e si mettono dove si vuole, uno per tipo; il «!» per quelli aperti dal livello e non costruiti; la migrazione dei vecchi posti fissi
- [mangime-e-catena.md](mangime-e-catena.md) — cosa mangiano le bestie (il mangime del fienile, come in 2D), la catena grano → becchime → uova e carote/erba → foraggio → latte e lana, l'audit di ogni ricetta contro la 2D e le deviazioni dichiarate
- [cortile-e-pentolone.md](cortile-e-pentolone.md) — il pentolone (le 4 ricette del mangime) e le bestie che mangiano da lui: anatre, maiali, capre; i numeri provvisori in `dati/cortile.js`
- [cortile-2.md](cortile-2.md) — il secondo cortile: conigliera (lana d'angora), alpaca (lana d'alpaca), asini (concime), arnie (fiori → miele), merenda e caramelle, e perché la peschiera non c'è; i numeri sono della 2D (`dati/cortile2.js`)
- [animali.md](animali.md) — pollaio e stalla: galline e mucche, uova e latte, i posti coi livelli, il caseificio e le ricette nuove
- [ordini.md](ordini.md) — il banco della bancarella: chi chiede raccolti e prodotti, il premio in esperienza (mai monete), rifiutare, lo stato v3
- [botteghe.md](botteghe.md) — le quattro botteghe del paese (pasticceria, osteria, mensa, merceria): edifici che chiedono, clienti per mestiere, la fama a cuori, i numeri della 2D
- [mongolfiera.md](mongolfiera.md) — la nave: tre file di casse (quattro dal livello 66) da riempire un po' alla volta, i bonus, la sorpresa della fiera, il viaggio e il ritorno, il segnaposto di prima che si chiude
- [vicini.md](vicini.md) — il trattore e i villaggi dei vicini: la fattoria visitabile come dato (snapshot), la cassa, il mercato che compra e che vende, la visita di sola lettura, e come domani entrerà quella di un amico
- [magazzini.md](magazzini.md) — i tre silos come edifici in mappa: si toccano per guardarci dentro e ingrandirli, crescono a ogni passo, il secondo da mettere quando sono al massimo; perché gli scomparti
- [in-comune.md](in-comune.md) — la fattoria in comune fra due amici: si gioca collegati, le mosse al posto della fattoria, il merge permissivo, la fila e la fotografia sul servizio
- [terreno.md](terreno.md) — i lotti da comprare, il recinto, gli alberi che si abbattono, le strade a pennello, la telecamera
- [mondo-infinito.md](mondo-infinito.md) — il mondo senza confini: lotti `a_b` qualunque, generazione per lotto, gli id salvati, la finestra della scena, il prezzo che si auto-limita
- [laghi.md](laghi.md) — i laghetti (biomi), gli stagni e i laghetti che costruisce il bambino, l'acqua, i ponti, il disegno, e dove la pesca si aggancia
- [geografia-e-pesca.md](geografia-e-pesca.md) — il mare a ovest e i laghi grandi a est (forme continue fra lotti), i salvataggi di prima che tengono i loro lotti, il molo, il porticciolo, i banchi di pesce, i pesciolini a istanze, il pesce, friggitoria e sushi bar, i livelli 17 e 18
- [bestie-di-casa.md](bestie-di-casa.md) — le bestie che si comprano e si curano (beagle, gatto rosso, coniglio, pappagallo): numeri della 2D, bisogni, ciotola, coccole, premio, battesimo, sposta, la veterinaria; il rapporto con i compagni gratis
- [addobbi.md](addobbi.md) — vestire le bestie (anche Watson e i gatti): i dodici addobbi della 2D tutti in vendita, comprare è mettere, il cassetto, gli agganci su ogni corpo, «Che eleganza»
- [compagni.md](compagni.md) — Watson e i gatti che girano per la fattoria, il contadino nuovo: quando arrivano, come sono fatti, come si muovono
- [guardaroba.md](guardaroba.md) — cambiare abito al contadino o alla contadina: il genere dal profilo, i capi e gli sblocchi, il salvataggio, come si aggiunge un pezzo
- [rotazione.md](rotazione.md) — ruotare i pezzi e gli edifici: `rot` 0–3 nello stato, l'ingombro e il davanti che seguono, il tasto ↻ col secondo dito
- [decorazioni.md](decorazioni.md) — le 206 decorazioni della 2D portate in 3D (verde, fiori, recinti e cartelli, raccolto, case e lampioni, arredo, acqua, bestiole, feste e fiera): le schede nuove del menu, gli id, le eccezioni, l'acqua e la fiera, il peso misurato e cosa manca
- [natale.md](natale.md) — gli alberi di Natale grandi (2×2, 3×3, 4×4), i bastoni di zucchero, i pacchi, la ghirlanda, la renna e la slitta: prezzi, livelli, lucine che lampeggiano, niente neve sopra
- [stagioni.md](stagioni.md) — Halloween e Natale come nella 2D (stesse finestre, `#stagione=`): cielo e luci, fiocchi, la neve sul prato e su ciò che guarda in alto, il ghiaccio, i ghiaccioli, il fiato, addobbi sugli edifici, le zucche e il pupazzo da comprare; il peso
- [guida.md](guida.md) — il `?`, il primo giro (la riga e l'anello), «E adesso?» e il consiglio col tasto sotto un «non si può»
- [scena.md](scena.md) — il disegno: i moduli di `scena3d/`, il dito, costruire trascinando, le opzioni di qualità e il peso
- [istanze.md](istanze.md) — i banchi di istanze (campi, pezzi fermi), il LOD dei compagni, l'ombra agganciata alla griglia; **come si aggiunge un pezzo istanziato**
- [limiti.md](limiti.md) — i limiti sul vecchio telefono: edifici, campi, recinti, pollai e stalle, stagioni e preset misurati sul Redmi imitato e nel log vero, chi pesa di più, le proposte; le leve `&stress=` e `&degrado=no`
- [file.md](file.md) — dove sta cosa in `src/giochi/fattoria3d/` (anche `da2d/`), e i bersagli dei test
- [parita/](parita/README.md) — **il registro di cosa la 3D ha preso dalla 2D** (la sostituzione è fatta il 31/10/2026): i criteri, le tabelle per area, le decisioni dell'utente, e la conversione dei salvataggi 2D ([parita/migrazione.md](parita/migrazione.md))
- [da-fare.md](da-fare.md) — le voci aperte

Vedi anche: [`../apprendimento/calibrazione.md`](../apprendimento/calibrazione.md) (quanto vale una moneta),
[`../core/convenzione-giochi.md`](../core/convenzione-giochi.md), [`../genitori/interruttori.md`](../genitori/interruttori.md).
