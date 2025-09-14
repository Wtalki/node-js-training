#!/usr/bin/env node

import { createInterface } from 'readline';
import { stdin as input, stdout as output } from 'process';
import { promises as fs } from 'fs';
import path from 'path';

const SCORES_FILE_PATH = path.resolve(process.cwd(), 'number-guess-scores.json');

function createPrompt() {
  const rl = createInterface({ input, output });
  const ask = (question) => new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
  const close = () => rl.close();
  return { ask, close };
}

async function readHighScores() {
  try {
    const content = await fs.readFile(SCORES_FILE_PATH, 'utf8');
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return {};
  } catch (error) {
    return {};
  }
}

async function writeHighScores(scores) {
  const json = JSON.stringify(scores, null, 2);
  await fs.writeFile(SCORES_FILE_PATH, json, 'utf8');
}

function printWelcome() {
  console.log('Welcome to the Number Guessing Game!');
  console.log("I'm thinking of a number between 1 and 100.");
  console.log('Rules:');
  console.log('- Choose a difficulty which sets your number of chances.');
  console.log("- Enter a number between 1 and 100 each turn. You'll be told if it's higher or lower.");
  console.log("- Type 'hint' to get a clue. Each hint costs 1 chance. Up to 2 hints per round.\n");
}

async function chooseDifficulty(ask) {
  console.log('Please select the difficulty level:');
  console.log('1. Easy (10 chances)');
  console.log('2. Medium (5 chances)');
  console.log('3. Hard (3 chances)');
  while (true) {
    const choice = (await ask('Enter your choice: ')).toLowerCase();
    if (choice === '1' || choice === 'easy' || choice === 'e') {
      console.log('Great! You have selected the Easy difficulty level.');
      return { name: 'easy', chances: 10 };
    }
    if (choice === '2' || choice === 'medium' || choice === 'm') {
      console.log('Great! You have selected the Medium difficulty level.');
      return { name: 'medium', chances: 5 };
    }
    if (choice === '3' || choice === 'hard' || choice === 'h') {
      console.log('Great! You have selected the Hard difficulty level.');
      return { name: 'hard', chances: 3 };
    }
    console.log('Invalid choice. Please select 1 (Easy), 2 (Medium), or 3 (Hard).');
  }
}

function randomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHint(secretNumber, priorGuesses, hintIndex) {
  // hintIndex is 0-based: 0 => first hint, 1 => second hint
  if (hintIndex === 0) {
    const parity = secretNumber % 2 === 0 ? 'even' : 'odd';
    return `Hint: The number is ${parity}.`;
  }
  // Second hint: range half
  const inLowerHalf = secretNumber <= 50;
  const rangeText = inLowerHalf ? 'between 1 and 50' : 'between 51 and 100';
  // If we have prior guesses, provide a proximity hint relative to the closest guess
  if (priorGuesses.length > 0) {
    const closest = priorGuesses.reduce((best, g) => {
      const d = Math.abs(g - secretNumber);
      if (best === null || d < best.delta) return { guess: g, delta: d };
      return best;
    }, null);
    if (closest && closest.delta > 0) {
      return `Hint: The number is ${rangeText} and is within ${closest.delta <= 10 ? '10' : '20'} of your closest guess (${closest.guess}).`;
    }
  }
  return `Hint: The number is ${rangeText}.`;
}

async function askYesNo(ask, question) {
  while (true) {
    const ans = (await ask(`${question} (y/n): `)).toLowerCase();
    if (['y', 'yes'].includes(ans)) return true;
    if (['n', 'no'].includes(ans)) return false;
    console.log("Please answer with 'y' or 'n'.");
  }
}

async function playRound(ask, difficulty, highScores) {
  const secretNumber = randomIntInclusive(1, 100);
  const maxChances = difficulty.chances;
  console.log("\nLet's start the game!");
  console.log(`You have ${maxChances} chance${maxChances === 1 ? '' : 's'} to guess the correct number.`);
  const startTimeMs = Date.now();

  let attempts = 0; // numeric guesses only
  let remaining = maxChances;
  let hintsUsed = 0;
  const priorGuesses = [];

  while (remaining > 0) {
    const raw = await ask("Enter your guess (or type 'hint'): ");

    if (raw.toLowerCase() === 'hint' || raw.toLowerCase() === 'h') {
      if (hintsUsed >= 2) {
        console.log('No hints left.');
        continue;
      }
      // A hint costs 1 chance
      remaining -= 1;
      const hint = generateHint(secretNumber, priorGuesses, hintsUsed);
      hintsUsed += 1;
      console.log(hint);
      console.log(`Chances left: ${remaining}`);
      continue;
    }

    const guess = Number(raw);
    if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
      console.log('Please enter a valid integer between 1 and 100.');
      continue;
    }

    attempts += 1;
    remaining -= 1;
    priorGuesses.push(guess);

    if (guess === secretNumber) {
      const durationMs = Date.now() - startTimeMs;
      const durationSec = (durationMs / 1000).toFixed(1);
      console.log(`Congratulations! You guessed the correct number in ${attempts} attempt${attempts === 1 ? '' : 's'} and ${durationSec}s.`);

      // Update high score for this difficulty if improved
      const currentBest = highScores[difficulty.name];
      if (!currentBest || attempts < currentBest.attempts || (attempts === currentBest.attempts && durationMs < (currentBest.durationMs || Infinity))) {
        highScores[difficulty.name] = {
          attempts,
          durationMs,
          timestamp: new Date().toISOString()
        };
        await writeHighScores(highScores);
        console.log('(New high score!)');
      }

      return { won: true, attempts, durationMs, secretNumber };
    }

    if (guess < secretNumber) {
      console.log(`Incorrect! The number is greater than ${guess}.`);
    } else {
      console.log(`Incorrect! The number is less than ${guess}.`);
    }
    console.log(`Chances left: ${remaining}`);
  }

  console.log(`\nOut of chances! The number was ${secretNumber}.`);
  return { won: false, attempts, durationMs: Date.now() - startTimeMs, secretNumber };
}

async function printHighScores(highScores) {
  const easy = highScores.easy ? `${highScores.easy.attempts} attempts, ${(highScores.easy.durationMs / 1000).toFixed(1)}s` : '—';
  const medium = highScores.medium ? `${highScores.medium.attempts} attempts, ${(highScores.medium.durationMs / 1000).toFixed(1)}s` : '—';
  const hard = highScores.hard ? `${highScores.hard.attempts} attempts, ${(highScores.hard.durationMs / 1000).toFixed(1)}s` : '—';
  console.log('\nHigh Scores (fewest attempts):');
  console.log(`- Easy:   ${easy}`);
  console.log(`- Medium: ${medium}`);
  console.log(`- Hard:   ${hard}`);
}

async function main() {
  const { ask, close } = createPrompt();
  try {
    printWelcome();
    const highScores = await readHighScores();

    let continuePlaying = true;
    while (continuePlaying) {
      const difficulty = await chooseDifficulty(ask);
      await playRound(ask, difficulty, highScores);
      await printHighScores(await readHighScores());
      continuePlaying = await askYesNo(ask, 'Play again');
      console.log('');
    }

    console.log('Thanks for playing!');
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  } finally {
    close();
  }
}

main();


