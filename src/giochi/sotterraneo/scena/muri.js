// Da che parte si vede una porta, guardando solo i vicini (gira in Node, unita/muri-sotterraneo).

// dal muro in cui sta: verticale = di fianco, orizzontale o incrocio = di fronte (ripiego). `chiuso` conta
// anche un'altra porta, o una colonna di porte accostate verrebbe di taglio in cima/fondo e di fronte in mezzo
export function versoDellaPorta(chiuso, x, y) {
  const muroInPiedi = chiuso(x, y - 1) && chiuso(x, y + 1)
  const muroSteso = chiuso(x - 1, y) && chiuso(x + 1, y)
  return muroInPiedi && !muroSteso ? 'fianco' : 'davanti'
}
