// Le frasi componibili del mondo «Io e le mie cose». Stesso formato di
// che-cose.js; `niente` toglie le regole che qui darebbero una frase giusta.
export default {
  mondo: 'mie-cose',
  frasi: [
    /* ── 1. I like / I do not like ── */
    { id: 'e-like-chocolate', tappa: 'mie-cose-1', forma: 'i-like', it: 'mi piace il cioccolato', en: 'I like chocolate' },
    { id: 'd-like-pizza', tappa: 'mie-cose-1', forma: 'i-like', it: 'ti piace la pizza?', en: 'do you like pizza' },
    { id: 'm-like-apples', tappa: 'mie-cose-1', forma: 'i-like', it: 'mi piacciono le mele', en: 'I like apples' },
    { id: 'm-not-milk', tappa: 'mie-cose-1', forma: 'i-like', it: 'non mi piace il latte', en: 'I do not like milk' },
    { id: 'm-like-cake', tappa: 'mie-cose-1', forma: 'i-like', it: 'ti piace la torta?', en: 'do you like cake' },
    { id: 'm-bananas-yellow', tappa: 'mie-cose-1', forma: 'plurale', it: 'le banane sono gialle', en: 'the bananas are yellow' },
    { id: 'e-apple-red', tappa: 'mie-cose-1', forma: 'it-is', it: 'la mela è rossa', en: 'the apple is red' },

    /* ── 2. this is my … ── */
    { id: 'e-she-sister', tappa: 'mie-cose-2', forma: 'this-is-my', it: 'lei è mia sorella', en: 'she is my sister' },
    { id: 'e-he-brother', tappa: 'mie-cose-2', forma: 'this-is-my', it: 'lui è mio fratello', en: 'he is my brother' },
    { id: 'e-teacher', tappa: 'mie-cose-2', forma: 'this-is-my', it: 'lei è la mia maestra', en: 'she is my teacher' },
    { id: 'm-my-mother', tappa: 'mie-cose-2', forma: 'this-is-my', it: 'questa è mia mamma', en: 'this is my mother' },
    { id: 'm-your-father', tappa: 'mie-cose-2', forma: 'this-is-my', it: 'questo è tuo papà?', en: 'is this your father' },
    { id: 'e-i-am-leo', tappa: 'mie-cose-2', forma: 'this-is-my', it: 'io sono Leo', en: 'I am Leo' },
    { id: 'm-my-friend', tappa: 'mie-cose-2', forma: 'this-is-my', it: 'tu sei mio amico', en: 'you are my friend' },
    { id: 'e-cat-white', tappa: 'mie-cose-2', forma: 'this-is-my', it: 'il mio gatto è bianco', en: 'my cat is white' },

    /* ── 3. have got ── */
    { id: 'e-have-dog', tappa: 'mie-cose-3', forma: 'have-got', it: 'ho un cane', en: 'I have got a dog' },
    { id: 'd-have-dog', tappa: 'mie-cose-3', forma: 'have-got', it: 'hai un cane?', en: 'have you got a dog' },
    { id: 'e-two-brothers', tappa: 'mie-cose-3', forma: 'have-got', it: 'ho due fratelli', en: 'I have got two brothers' },
    { id: 'e-hat-red', tappa: 'mie-cose-3', forma: 'this-is-my', it: 'il mio cappello è rosso', en: 'my hat is red' },
    { id: 'm-red-hat', tappa: 'mie-cose-3', forma: 'have-got', it: 'ho un cappello rosso', en: 'I have got a red hat' },
    { id: 'm-not-coat', tappa: 'mie-cose-3', forma: 'have-got', it: 'non ho un cappotto', en: 'I have not got a coat' },
    { id: 'm-scarf', tappa: 'mie-cose-3', forma: 'have-got', it: 'hai una sciarpa?', en: 'have you got a scarf',
      trappole: [{ en: 'have you got a shirt', it: 'hai una maglietta?', parola: 'scarf',
                   perche: 'scarf è la sciarpa, shirt la maglietta' }] },

    /* ── 4. has got ── */
    { id: 'e-she-hair', tappa: 'mie-cose-4', forma: 'has-got', it: 'lei ha i capelli lunghi', en: 'she has got long hair' },
    // «ha» non dice se è lui o lei: «she has got blue eyes» sarebbe giusta anche lei
    { id: 'e-blue-eyes', tappa: 'mie-cose-4', forma: 'has-got', it: 'ha gli occhi azzurri', en: 'he has got blue eyes',
      varianti: ['she has got blue eyes'], niente: ['lui-lei'] },
    { id: 'm-dog-ears', tappa: 'mie-cose-4', forma: 'has-got', it: 'il cane ha le orecchie grandi', en: 'the dog has got big ears' },
    { id: 'm-pink-nose', tappa: 'mie-cose-4', forma: 'has-got', it: 'il gatto ha il naso rosa', en: 'the cat has got a pink nose' },
    { id: 'm-monkey-legs', tappa: 'mie-cose-4', forma: 'has-got', it: 'la scimmia ha le gambe lunghe', en: 'the monkey has got long legs' },
    { id: 'm-has-she-hat', tappa: 'mie-cose-4', forma: 'has-got', it: 'lei ha un cappello?', en: 'has she got a hat' },

    /* ── 5. I don't like (contratta) ── */
    { id: 'm-not-soup', tappa: 'mie-cose-5', forma: 'i-like', it: 'non mi piace la zuppa', en: 'I do not like soup' },
    { id: 'm-like-carrots', tappa: 'mie-cose-5', forma: 'i-like', it: 'ti piacciono le carote?', en: 'do you like carrots' },
    { id: 'm-like-strawberries', tappa: 'mie-cose-5', forma: 'i-like', it: 'mi piacciono le fragole', en: 'I like strawberries' },
    { id: 'm-not-tomatoes', tappa: 'mie-cose-5', forma: 'i-like', it: 'non mi piacciono i pomodori', en: 'I do not like tomatoes' },
    { id: 'm-like-pasta', tappa: 'mie-cose-5', forma: 'i-like', it: 'mi piace la pasta', en: 'I like pasta' },
    { id: 'm-rice-yes', tappa: 'mie-cose-5', forma: 'i-like', it: 'ti piace il riso?', en: 'do you like rice' },
  ],
}
