# Lo standard degli sprite — progetto

> **Stato: proposta.** Niente di quello che segue è implementato. Oggi
> `atlante.py` è un ritagliatore multi-bersaglio (vedi `FORMATO.md`) e ogni
> gioco si scrive la sua tela. Questo file dice **dove si vuole arrivare** e
> perché, così chi lo riprende non deve ricostruire il ragionamento.
> Le cose ancora da decidere stanno in fondo, sotto «Quello che manca».

## Il problema, in una riga

Tre giochi disegnano con gli sprite — la fattoria, il sotterraneo, il
castello a tessere — e hanno **tre tele scritte tre volte**, tre modi di
posare una figura, tre idee di cosa sia un bordo. Ogni mondo nuovo riparte
da capo, e due sprite venuti da due fogli diversi non stanno insieme senza
che si veda da dove vengono.

## Cosa deve diventare `atlante.py`

Non un ritagliatore per gioco: un **normalizzatore**. Entrano N sorgenti
eterogenee — scale diverse, palette diverse, sfondi diversi, convenzioni
diverse — ed escono M atlanti **coerenti fra loro**, raggruppati per
famiglia e non per provenienza, già scalati a un'unità comune, con le
trasparenze risolte e il piede dichiarato allo stesso modo.

Il punto non è tagliare meglio. È che **chi costruisce un mondo trovi
sempre le stesse cose**, e possa metterle in scena con `grafica/atlante.js`
e `grafica/tessere.js` senza inventarsi una tela sua.

Due vincoli, che vengono prima di tutto il resto:

- **la sorgente è la verità** — sta in `sorgenti/`, versionata, non si
  modifica e non si butta; tutto si rigenera da lì;
- **il JSON è cache, non verità** — serve a non ricalcolare i tagli.
  Buttarlo via e rifare deve dare lo stesso risultato, byte per byte.

## Le famiglie

Il raggruppamento è **per famiglia**, non per foglio di provenienza: i
terreni con i terreni, i bordi con i bordi, gli attori con gli attori. Una
famiglia è un insieme di pezzi che si usano **insieme nella stessa scena** e
con le stesse regole.

Dentro una famiglia c'è la **materia**: neve, erba, acqua, roccia, strada,
legno. Un pattern di neve sta nei pattern di neve — e questo non è un
dettaglio di ordinamento, è la chiave con cui il gioco chiede: «dammi un
terreno di neve», «dammi il bordo fra neve e acqua».

## I socket, e perché bordi e transizioni sono la stessa cosa

Il pezzo concettuale che tiene insieme tutto.

Una tessera non è un'immagine: è **un'immagine più i suoi attacchi**. Per
ogni lato dichiara (o si misura) *che cosa c'è su quel lato*: erba, acqua,
strada, muro, niente. Due tessere si possono accostare se i lati che si
toccano dicono la stessa cosa.

Da questo discendono, senza aggiungere nessun concetto:

- **il bordo fra due materie** (erba→acqua, terra→muro, strada→terra) è una
  tessera i cui due lati opposti dichiarano materie diverse. Non è una
  categoria a parte: è un socket misto;
- **le transizioni** (la frangia dove l'erba diventa acqua) sono la stessa
  cosa vista dall'altra parte, e possono stare **in overlay** sopra un fondo
  dipinto una volta sola invece che dentro la tessera del fondo;
- **la strada che si innesta** è ancora la stessa regola: un lato che dice
  «strada, in mezzo» combacia solo con un altro che dice lo stesso.

`grafica/tessere.js` ha già le due metà di questo: `bordoOtto` (che forma ha
questa cella, guardando i vicini) e — dal lavoro sul castello — un modello a
socket con un risolutore. Lo standard deve **portare gli attacchi
nell'atlante**, misurati a monte, invece di farli dichiarare a mano da ogni
gioco.

## La griglia standard, e il puntatore

L'uscita è un **PNG a griglia fissa**: righe e colonne, non un mosaico di
rettangoli con un dizionario di coordinate. Chi lo usa non ha bisogno di una
tabella, ha bisogno di **un puntatore**:

> «dammi *animale 5*, sequenza *3*» → riga 5, colonna 3.

Una riga è una cosa (un animale, una torre, una materia), le colonne sono i
suoi fotogrammi o le sue varianti. Il dizionario dei nomi resta, ma diventa
*nome → riga*, non *nome → quattro numeri*: molto più corto, molto più
difficile da sbagliare, e leggibile a occhio sul PNG.

**Le misure.** Un file, una griglia: `terreni-32.png` è tutto 32×32,
`attori-32x48.png` è tutto 32×48. Chi è più grande va in un altro file
invece di allargare la cella di tutti — allineare tutto al più grande spreca
metà foglio in trasparenza, e su un telefono quello si paga. Ogni pezzo
dichiara comunque il suo **ingombro reale** e il suo **piede** (dove tocca
terra), perché la cella dice dove sta il pezzo, non come si appoggia.

## Il trasparenziatore

Fra le funzioni dell'attrezzo: **poter dichiarare un colore di sfondo da
scontornare**. C'è già mezzo pezzo (`fondo: "auto" | [r,g,b]` allaga dai
bordi, vedi `FORMATO.md`), e va portato a livello di standard perché è la
cosa che ogni sorgente nuova richiede — i fogli generati arrivano su fondo
bianco, i fogli scaricati su magenta o a scacchiera.

Attenzione al caso che si sbaglia sempre: **scontornare per colore buca il
soggetto** quando il soggetto ha addosso lo stesso colore (il cane bianco
sulla carta bianca). Si allaga dai bordi, non si sostituisce un colore.

## Gli attrezzi di controllo

Sono la parte che rende lo standard usabile, e vanno considerati parte del
motore, non contorno.

1. **Il foglio di contatto** (`--provini`, esiste) — ogni pezzo ingrandito
   col suo nome. È **il collaudo**: la normalizzazione automatica toglie
   l'unico posto dove un errore si vede, e un'euristica che si rompe in
   silenzio nei giochi per bambini se ne accorge il bambino, mesi dopo, e
   non lo sa dire. Nel disegno nuovo deve mostrare anche **l'accordo fra
   sorgenti**: pezzi di provenienza diversa nella stessa scena.
2. **Il banco dei mondi** (da fare) — un file che si apre e dove si
   **disegna un mondo**: si tracciano strade, si dipingono materie, si
   appoggiano oggetti, e si guarda se le tessere si innestano, se i bordi
   combaciano, se un oggetto sta in piedi dove lo metti. È il modo di
   scoprire che manca un pezzo *prima* di scoprirlo dentro un gioco.
3. **Il controllo dello standard** — che ogni pezzo stia nella sua griglia,
   che ogni famiglia dichiari le materie che usa, che nessun socket resti
   spaiato (un bordo erba→acqua senza il suo gemello acqua→erba).
4. **I prompt** — quando una sorgente manca si genera, e generare bene vuol
   dire chiedere bene: lo standard deve **preparare il prompt** (misura
   della cella, numero di fotogrammi, verso, fondo, stile di riferimento)
   invece di farlo riscrivere a mano ogni volta.

## Gli standard del settore, da guardare prima di inventare

Da verificare uno per uno prima di adottarli — qui c'è quello che so, non
una ricerca fatta:

- **autotiling a bitmask** (Godot «terrain sets», Tiled «Wang sets», il
  «blob» a 47 forme): è lo standard di fatto per i bordi fra materie, ed è
  già la strada di `bordoOtto`. La riduzione da 256 combinazioni a 47 forme
  non è una scelta nostra, è quella.
- **le griglie fisse** (Kenney, LPC): un foglio, una cella, tutto allineato.
  È esattamente il «puntatore riga/colonna» descritto sopra.
- **i formati di atlante** (TexturePacker, Aseprite): dizionario di
  rettangoli con `frame` / `spriteSourceSize` / `pivot`. Interessa il
  **pivot**, che è il nostro piede, e il fatto che dichiarino l'ingombro
  reale dentro una cella più grande.
- **WFC / modello a socket**: da lì viene il vocabolario degli attacchi.

Cosa prendiamo: i nomi e le forme, dove esistono già. Cosa non prendiamo:
un formato di terzi come nostro contratto — il build deve restare un file
solo e i moduli generati sono JS, non JSON caricato a runtime.

## Il contratto, e come si cambia

Lo standard deve essere **abbastanza nobile da usarlo senza pensarci**: chi
apre un gioco nuovo trova le famiglie con gli stessi nomi, il piede
dichiarato allo stesso modo, la tessera come misura unica, gli attacchi già
misurati.

E deve poter crescere: **se scopriamo che manca qualcosa, si potenzia il
motore e si migra tutto**. Non si congela e non si rompe — si porta avanti.
In pratica: il modulo generato dichiara la versione dello standard, gli
attrezzi sanno leggere anche la precedente, e la migrazione è un giro di
rigenerazione — che è possibile solo perché le sorgenti sono versionate e il
JSON è cache.

## Quello che manca (le decisioni da prendere)

- **un atlante per famiglia** (più file, si carica solo ciò che serve) o
  **uno solo diviso in famiglie** (un file, più semplice)? Confermato: più
  file, uno per griglia — ma va misurato quanto pesa in un HTML unico.
- **la normalizzazione ridipinge?** Riscalare e allineare è deciso;
  accordare le palette con una tinta d'ambiente (`tinge()` in
  `grafica/comune.js`) è la leva che fa stare insieme sorgenti diverse, ma
  su pezzi già coerenti li appiattisce. Da provare sul banco dei mondi.
- **dove finiscono gli attacchi**: dentro il modulo generato accanto ai
  pezzi, o in un file loro?
- **chi migra per primo**: la fattoria è il consumatore più grosso, il
  sotterraneo il più recente e il più isolato — probabilmente il secondo,
  proprio perché rompere lì costa meno.
