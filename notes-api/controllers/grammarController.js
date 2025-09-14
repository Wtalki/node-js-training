import { simpleGrammarCheck } from '../services/markdown.js';

export async function checkGrammar(req, res) {
  const text = String((req.body && req.body.text) || '');
  const issues = simpleGrammarCheck(text);
  res.json({ issues });
}


