/* ═══════════════════════════════════════════════════════════════════
   IL DITO — DA QUANTO IN LÀ UN TOCCO SMETTE DI ESSERE UN TOCCO

   Lo decidono due posti: il prato (`Gioco.vue`: toccare apre, muoversi
   trascina o sposta la vista) e lo scaffale del baule (`viste/Roba.vue`:
   toccare prende, strisciare scorre). Devono deciderlo **con lo stesso
   metro**, se no lo stesso dito che sul prato è un tocco nel baule
   diventa uno scorrimento; quindi il numero sta qui, una volta sola.

   Un mouse sta fermo dove lo lasci; un dito no: si appoggia largo, e
   mentre preme il punto che il telefono chiama «il dito» si sposta di
   qualche pixel da solo. Con la stessa misura per tutti e due, sul
   computer andava sempre e sul telefono si perdevano i tocchi — quelli
   di chi preme con più forza, cioè i bambini. Sedici pixel restano
   sotto quello che Android e iOS considerano ancora fermo, quindi non
   si ruba niente allo scorrimento.

   Ed è una **distanza vera**, non la somma dei due lati come prima: un
   dito che deriva di 9 px in diagonale ne fa 12,7 di distanza, ma 18 di
   somma, e veniva buttato via da una soglia che sulla verticale ne
   perdonava 16. Cioè: il tocco storto — quello dei bambini — si perdeva,
   e si perdeva più di quanto dicesse il numero scritto qui.
   ═══════════════════════════════════════════════════════════════════ */
export const SCARTO_DITO = 16
export const SCARTO_MOUSE = 6
