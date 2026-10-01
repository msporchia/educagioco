// Le frasi componibili del mondo «In seconda». Stesso formato di prima.js;
// `niente` toglie le regole che qui darebbero una frase giusta.
export default {
  mondo: 'seconda',
  frasi: [
    /* ── Mi piace! ── */
    { id: 'e-like-chocolate', tappa: 'seconda-mi-piace', forma: 'i-like', it: 'mi piace il cioccolato', en: 'I like chocolate' },
    { id: 'd-like-pizza', tappa: 'seconda-mi-piace', forma: 'i-like', it: 'ti piace la pizza?', en: 'do you like pizza' },
    { id: 'm-like-apples', tappa: 'seconda-mi-piace', forma: 'i-like', it: 'mi piacciono le mele', en: 'I like apples' },
    { id: 'm-not-milk', tappa: 'seconda-mi-piace', forma: 'i-like', it: 'non mi piace il latte', en: 'I do not like milk' },
    { id: 'm-like-cake', tappa: 'seconda-mi-piace', forma: 'i-like', it: 'ti piace la torta?', en: 'do you like cake' },
    { id: 'm-like-strawberries', tappa: 'seconda-mi-piace', forma: 'i-like', it: 'mi piacciono le fragole', en: 'I like strawberries' },
    { id: 'm-not-tomatoes', tappa: 'seconda-mi-piace', forma: 'i-like', it: 'non mi piacciono i pomodori', en: 'I do not like tomatoes' },
    { id: 'm-like-carrots', tappa: 'seconda-mi-piace', forma: 'i-like', it: 'ti piacciono le carote?', en: 'do you like carrots' },
    { id: 'm-not-soup', tappa: 'seconda-mi-piace', forma: 'i-like', it: 'non mi piace la zuppa', en: 'I do not like soup' },
    { id: 'm-like-pasta', tappa: 'seconda-mi-piace', forma: 'i-like', it: 'mi piace la pasta', en: 'I like pasta' },

    /* ── Questo è mio ── */
    { id: 'e-she-sister', tappa: 'seconda-mio', forma: 'this-is-my', it: 'lei è mia sorella', en: 'she is my sister' },
    { id: 'e-he-brother', tappa: 'seconda-mio', forma: 'this-is-my', it: 'lui è mio fratello', en: 'he is my brother' },
    { id: 'm-my-mother', tappa: 'seconda-mio', forma: 'this-is-my', it: 'questa è mia mamma', en: 'this is my mother' },
    { id: 'm-your-father', tappa: 'seconda-mio', forma: 'this-is-my', it: 'questo è tuo papà?', en: 'is this your father' },
    { id: 'm-my-friend', tappa: 'seconda-mio', forma: 'this-is-my', it: 'tu sei mio amico', en: 'you are my friend' },
    { id: 'e-cat-white', tappa: 'seconda-mio', forma: 'this-is-my', it: 'il mio gatto è bianco', en: 'my cat is white' },
    { id: 'e-hat-red', tappa: 'seconda-mio', forma: 'this-is-my', it: 'il mio cappello è rosso', en: 'my hat is red' },
    { id: 'e-i-happy', tappa: 'seconda-mio', forma: 'this-is-my', it: 'io sono felice', en: 'I am happy' },
    { id: 'd-you-happy', tappa: 'seconda-mio', forma: 'this-is-my', it: 'sei felice?', en: 'are you happy' },
    { id: 'e-i-tired', tappa: 'seconda-mio', forma: 'this-is-my', it: 'sono stanco', en: 'I am tired' },
    { id: 'm-brother-hungry', tappa: 'seconda-mio', forma: 'this-is-my', it: 'mio fratello ha fame', en: 'my brother is hungry' },
    { id: 'm-he-father', tappa: 'seconda-mio', forma: 'this-is-my', it: 'lui è mio padre', en: 'he is my father' },
    { id: 'm-she-tired', tappa: 'seconda-mio', forma: 'this-is-my', it: 'lei è stanca', en: 'she is tired' },

    /* ── Ho un… ── */
    { id: 'e-have-dog', tappa: 'seconda-ho', forma: 'have-got', it: 'ho un cane', en: 'I have got a dog' },
    { id: 'd-have-dog', tappa: 'seconda-ho', forma: 'have-got', it: 'hai un cane?', en: 'have you got a dog' },
    { id: 'e-two-brothers', tappa: 'seconda-ho', forma: 'have-got', it: 'ho due fratelli', en: 'I have got two brothers' },
    { id: 'm-red-hat', tappa: 'seconda-ho', forma: 'have-got', it: 'ho un cappello rosso', en: 'I have got a red hat' },
    { id: 'm-not-coat', tappa: 'seconda-ho', forma: 'have-got', it: 'non ho un cappotto', en: 'I have not got a coat' },
    { id: 'm-scarf', tappa: 'seconda-ho', forma: 'have-got', it: 'hai una sciarpa?', en: 'have you got a scarf',
      trappole: [{ en: 'have you got a shirt', it: 'hai una maglietta?', parola: 'scarf',
                   perche: 'scarf è la sciarpa, shirt la maglietta' }] },
    { id: 'm-blue-trousers', tappa: 'seconda-ho', forma: 'have-got', it: 'ho i pantaloni blu', en: 'I have got blue trousers' },
    { id: 'm-twelve-crayons', tappa: 'seconda-ho', forma: 'have-got', it: 'ho dodici pastelli', en: 'I have got twelve crayons' },
    { id: 'm-have-sister', tappa: 'seconda-ho', forma: 'have-got', it: 'hai una sorella?', en: 'have you got a sister' },
    { id: 'm-not-got-cat', tappa: 'seconda-ho', forma: 'have-got', it: 'non ho un gatto', en: 'I have not got a cat' },
    { id: 'm-not-got-sister', tappa: 'seconda-ho', forma: 'have-got', it: 'non ho una sorella', en: 'I have not got a sister' },

    /* ── Lei ha… (contratta) ── */
    { id: 'e-she-hair', tappa: 'seconda-ha', forma: 'has-got', it: 'lei ha i capelli lunghi', en: 'she has got long hair' },
    // «ha» non dice se è lui o lei: «she has got blue eyes» sarebbe giusta anche lei
    { id: 'e-blue-eyes', tappa: 'seconda-ha', forma: 'has-got', it: 'ha gli occhi azzurri', en: 'he has got blue eyes',
      varianti: ['she has got blue eyes'], niente: ['lui-lei'] },
    { id: 'm-dog-ears', tappa: 'seconda-ha', forma: 'has-got', it: 'il cane ha le orecchie grandi', en: 'the dog has got big ears' },
    { id: 'm-pink-nose', tappa: 'seconda-ha', forma: 'has-got', it: 'il gatto ha il naso rosa', en: 'the cat has got a pink nose' },
    { id: 'm-horse-legs', tappa: 'seconda-ha', forma: 'has-got', it: 'il cavallo ha le gambe lunghe', en: 'the horse has got long legs' },
    { id: 'm-has-she-hat', tappa: 'seconda-ha', forma: 'has-got', it: 'lei ha un cappello?', en: 'has she got a hat' },
    { id: 'm-brother-ball', tappa: 'seconda-ha', forma: 'has-got', it: 'mio fratello ha una palla', en: 'my brother has got a ball' },
    { id: 'm-baby-small', tappa: 'seconda-ha', forma: 'has-got', it: 'il bebè ha le mani piccole', en: 'the baby has got small hands' },
    { id: 'm-has-he-eyes', tappa: 'seconda-ha', forma: 'has-got', it: 'lui ha gli occhi azzurri?', en: 'has he got blue eyes' },
    { id: 'm-has-dog-ears', tappa: 'seconda-ha', forma: 'has-got', it: 'il cane ha le orecchie grandi?', en: 'has the dog got big ears' },
  ],
}
