# Il terreno: ostacoli e macchie

Il campo non è più un prato senza fine e tutto uguale. Ci sono **ostacoli
che non si attraversano** (un bosco, una montagna, uno stagno), e girando
si trovano **macchie di altri posti**: neve in mezzo al prato, una pozza
di lava nel deserto. Il codice sta in `motore/terreno.js` (le regole, gira
in Node) e `dati/terreno.js` (i numeri per scenario); come si disegna sta
in [grafica.md](grafica.md).

## Le regole

- **Un ostacolo ferma l'eroe e i mostri, non le frecce.** Le frecce ci
  volano sopra: un mostro dietro un albero si colpisce lo stesso, e il
  bambino non deve imparare una regola di linea di tiro.
- **Ogni ostacolo è un'ellisse**, ed è quella che ferma. Alberi e massi
  sono il disegno di dentro; lo stagno ha la riva disegnata un po' oltre.
- **Niente recinti.** Il mondo è diviso in riquadri da 480 punti, e un
  ostacolo non esce dal suo riquadro, a 56 punti dal bordo. Due ostacoli
  vicini lasciano sempre un varco di almeno 112 punti: ci passano due colossi
  affiancati. Il punto di partenza ha 250 punti liberi intorno.
  Provato in `unita/survivors-terreno`.
- **Tutto si ricava dal seme**, che è il nome della tappa: la stessa tappa
  ha sempre la stessa carta. Riprendendo una partita non si salva niente
  del terreno (`motore/sosta.js` non cambia).
- **Le macchie** hanno gli ostacoli del loro posto: nella macchia di neve
  il bosco è di abeti innevati e lo stagno è ghiacciato. Quanti ostacoli,
  invece, lo decide la tappa: è una manopola di difficoltà, e una macchia
  di neve nel prato con la densità della neve rendeva la prima tappa tre
  volte più piena. Quali posti si
  trovano dentro quale scenario lo dice `macchie` in `dati/terreno.js`.
  Intorno alla partenza (900 punti) si è sempre nel posto della tappa.
- **Zone fitte e aperte.** Un rumore largo (1500 punti) decide quanti
  ostacoli ha un riquadro, da quasi nessuno a due. Un secondo rumore, più
  largo, decide il genere della zona (laghi, boschi o montagne): lì quel
  tipo esce quattro volte più spesso.
- **Le montagne sono creste**: lunghe e strette, di traverso o in piedi.
  Una montagna tonda sembrava un mucchio di sassi.

## I mostri e gli ostacoli

Un mostro gira intorno a un ostacolo **solo quando ci sbatte contro**
(`ATTENZIONE.muso`, 4 punti): prende la tangente dell'ellisse dalla parte
che lo porta verso l'eroe. Il pilota del banco lo vede da lontano
(`ATTENZIONE.occhio`, 30 punti), come un bambino che vede lo stagno.

Provato: coi mostri che giravano da 30 punti, come il pilota, la palude
fonda e la tana perdevano 10-20 punti di vittorie, perché un mostro non
perdeva tempo e l'eroe finiva schiacciato contro la riva. Sbattendo,
invece, l'ostacolo rallenta anche loro.

## I numeri

Misurati con `misure/survivors` e con 72 partite per casella, con e senza
ostacoli. La differenza media è di 2-3 punti, dentro il rumore:

- `ostacoli` per scenario è basso nelle tappe dei piccoli (prato 0.2,
  notte 0.5) e arriva a 0.75 nella grotta. Coi primi valori (0.7-1.1)
  il bambino che schiva a sprazzi perdeva 20 punti nella radura;
- le rocce e i boschi arrivano a 130 punti di raggio. A 160 la grotta e
  le dune perdevano 17 punti;
- nella palude l'acqua pesa 2.5 e non 4: lo stagno è l'ostacolo che più
  chiude chi scappa.

Nei test: `unita/survivors-terreno` (recinti, seme, aggirare, figure),
`misure/survivors` (le soglie per tappa, invariate).
