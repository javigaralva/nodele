const prompts = require("prompts");
const chalk = require("chalk");
const i18n = require("./i18n/index.js")
const terminal_cols = process.stdout.columns;
const MAX_TRIES = 6;
const previous_gusses = [];

// initialize words and texts
const { TEXTS, WORDS } = i18n.load(process.argv[ 2 ] || "en");

// global results for showing all results at once
let glob_results = "";
let puzzle = "";

const wordlePrompt = {
  type: "text",
  name: "word",
  format: (value) => {
    return value.toUpperCase();
  },
  message: TEXTS.ENTER_A_5_LETTER_WORD_PROMPT,
  validate: (value) => {
    if (value.length != 5) {
      return TEXTS.WORD_MUST_BE_5_LETTERS;
    } else if (!/^[a-z]+$/i.test(value)) {
      return TEXTS.WORD_MUST_ONLY_CONTAIN_LETTERS;
    } else if (!WORDS.includes(value.toUpperCase())) {
      // WORDS is now in uppercase, so can directly check via includes
      return TEXTS.WORD_NOT_FOUND_IN_WORD_LIST;
    } else if (previous_gusses.includes(value.toUpperCase())) {
      // same word already entered
      return TEXTS.WORD_ALREADY_ENTERED;
    }
    return true;
  }
};

async function check(guess) {
  // clear previous results
  console.clear();
  let results = "";
  // loop over each letter in the word
  for (let i in guess) {
    // check if the letter at the specified index in the guess word exactly
    // matches the letter at the specified index in the puzzle
    if (guess[i] === puzzle[i]) {
      results += chalk.white.bgGreen.bold(` ${guess[i]} `);
      continue;
    }
    // check if the letter at the specified index in the guess word is at least
    // contained in the puzzle at some other position
    if (puzzle.includes(guess[i])) {
      results += chalk.white.bgYellow.bold(` ${guess[i]} `);
      continue;
    }
    // otherwise the letter doesn't exist at all in the puzzle
    results += chalk.white.bgGrey.bold(` ${guess[i]} `);
  }
  glob_results += results.padEnd(results.length + terminal_cols - 15, " ");
  // 15 in above code is 5 letters and 2 spaces in start and end of characters, 3 char for a letter, total 3 *5 =15
  // it has to be hardcoded as the chalk's result changes the number of characters
  process.stdout.write(glob_results);
}

async function play(tries) {
  // the user gets 5 tries to solve the puzzle not including the first guess
  if (tries < MAX_TRIES) {
    // ask the player for a guess word
    const response = await prompts(wordlePrompt);
    const guess = response.word;
    if (typeof guess === "undefined") {
      // this scenario happens when a user presses Ctrl+C and terminates program
      // previously it was throwing an error
      console.clear();
      console.log(TEXTS.GAME_CLOSED_GOODBYE);
      process.exit(0);
    }
    // add to already enterd words list
    previous_gusses.push(guess);
    // if the word matches, they win!
    if (guess == puzzle) {
      // show board again
      check(guess);
      console.log(TEXTS.WINNER);
    } else {
      check(guess);
      // this forces std out to print out the results for the last guess
      process.stdout.write("\n");
      // repeat the game and increment the number of tries
      play(++tries);
    }
  } else {
    console.log(i18n.stringTemplateParser(TEXTS.INCORRECT_THE_WORD_WAS_puzzle, {puzzle}));
  }
}

async function main() {
  // get a random word
  randomNumber = Math.floor(Math.random(WORDS.length) * WORDS.length);
  puzzle = WORDS[randomNumber].toUpperCase();
  // start the game
  try {
    await play(0);
  } catch {
    console.log(TEXTS.GAME_ENDED);
  }
}

main();
