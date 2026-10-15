# Le missioni «sconfiggi N»

15 ottobre 2026, decise dall'utente: «le missioni sono un po' troppo base… mancano le missioni tipo sconfiggi 8 orchi, piuttosto che solo
arrivare in fondo, giusto per insegnargli un po' a farmare». Sono il terzo tipo di missione (`tipo: 'conta'`), accanto a «trova» e a
«sconfiggi» un mostro col nome ([missioni.md](missioni.md)). Il codice: `dati/missioni.js` (le cinque, `titoloDi`, `faccia`, i guasti),
`motore/corsa.js` (`conti`, `contaPerLeMissioni`), `motore/missioni.js` (diario e promemoria), `Gioco.vue` (`fatteGiu`, `conti`).

## Come funziona

- **Una specie, un numero**: `specie` (la chiave in `dati/mostri.js`), `quanti`, `nomi` (il plurale per le frasi: «8 ratti»). Il titolo è
  «8 ratti», la faccia quella della specie. Niente `piano` che conti (c'è 0, solo per l'ordine del diario): vale in **tutta la discesa**.
- **Si conta dopo la presa e nella discesa giusta**: la Corsa conosce solo le missioni prese di quella discesa (`presePer`), quindi una
  missione non presa, finita o di un'altra discesa non conta niente. Altrimenti sarebbe già fatta il giorno che la si prende.
- **Conta ogni mostro di quella specie che muore lì, anche quelli tornati** ([ricomparsa.md](ricomparsa.md)): è il punto, farmare. Caporali
  e grossi della specie compresi; il bersaglio di un'altra missione (`missione`) no. Arrivata a N la missione è «fatta» (`missioniFatte`,
  come le altre), si dice con l'avviso di sempre e non si conta oltre.
- **Niente freccina e niente bersaglio**: i mostri sono sparsi. `rotta` e `discesaDaSeguire` la saltano, il diario non offre «segui questa»
  e `posaLeMissioni` non mette niente nel piano. Il diario dice «3 di 8» (`progresso`), il promemoria «Missione: sconfiggi 8 ratti (3 di 8)»
  (sempre in oro: vale su ogni piano). Chi la dà, aspettando, dice «Me ne servono ancora: 8 ratti, la scalinata antica».
- **Si consegna come le altre**: il «!», il dialogo («Non daranno più fastidio»), il premio in gemme. Niente monete: sono le domande in
  più di un mostro più duro, e qui non ce ne sono ([missioni-monete.md](missioni-monete.md)).

## Dove sta il conto

`avventura.conti` = `{ [id]: n }`, accanto a `avventura.missioni` (`cfg.avventure[eroe]`): nessun campo nel profilo oltre a `campagne`.
`Gioco.vue` lo scrive con le missioni fatte a ogni salvataggio (`fatteGiu`: ogni 8 secondi di gioco, a ogni piano, uscendo, a fine
discesa, con `pagehide`), e lo passa alla Corsa nuova (`conti`) e a `leggi` della sosta. Quindi sopravvive a uscita, sosta, portale,
svenimento e discesa lasciata («lascio perdere»), e al telefono posato nel mezzo. Il conto perso è al più quello degli ultimi secondi.
Un'avventura di prima non ha `conti` e riparte da zero, senza cambiare `VERSIONE` (la sosta non porta il conto: lo porta l'avventura,
che si scrive nello stesso salvataggio). Un valore storto (non un numero, negativo) vale zero.

## Le cinque, e perché quei numeri

Radici (senza seguito), una per discesa dalla scalinata in poi, con una persona che ha un motivo: ognuna si sblocca con la discesa
prima finita, come le sue sorelle. La specie è un abitante di strada di quella discesa (`mostri` in `dati/campagna.js`, un guasto lo
verifica). N sta **sotto la mediana dei mostri di quella specie in un giro intero della discesa** (dodici semi, tutti i piani: la tabella
sotto), perché chi gira tutto la fa quasi sempre da solo, e chi ne perde per strada ne rifà qualcuno con la ricomparsa (200 passi di base).

| id | chi | discesa | specie · N | in un giro (min · mediana · max) | premio |
|---|---|---|---|---|---|
| `topi` | il mugnaio | la scalinata antica | ratti · 8 | 10 · 15 · 20 | 💎 10 |
| `funghi` | il boscaiolo | la grotta della scaletta | funghi · 7 | 4 · 10 · 12 | 💎 15 |
| `polpi` | il pescatore | la scala sommersa | polpi · 8 | 11 · 16 · 17 | 💎 15 |
| `cinghiali` (ora bestie cornute) | il mugnaio | la botola | bestie cornute · 10 | 23 · 32 · 38 | 💎 20 |
| `scorpioni` | il minatore | la miniera | scorpioni · 10 | 18 · 24 · 26 | 💎 20 |

- **Le gemme** seguono la discesa (la tabella di [missioni.md](missioni.md): 💎 10–30) e stanno un po' sotto una «trova» a pari fatica:
  si cammina meno ma si ripete. I funghi (min 4) sono i più cari in giri: 7 vogliono il piano intero e qualche ritorno.
- **La torre e la cripta non ne hanno**: la torre ha già tre missioni insieme, la cripta due piani e pochi mostri (3 per specie). Il
  tetto di tre aperte regge comunque: chi non consegna mai ne vede sempre al più tre.
- **Il tono** è quello delle altre: una persona, un fastidio concreto, un favore («i ratti mi mangiano il grano, sconfiggine otto»).

Nei test: `unita/sotterraneo-missioni-conteggio` (i dati e i guasti, N sotto la mediana di un giro, il conto solo dopo la presa e nella
discesa giusta, anche con un mostro tornato, a N fatta e consegnata, il conto nell'avventura e nella sosta, diario, promemoria e dialogo,
nessuna freccina), `unita/sotterraneo-missioni` (l'albero con le diciassette). Nel diario `[data-progresso][data-fatti]` dentro
`[data-dettaglio-cosa][data-tipo="conta"]`.
