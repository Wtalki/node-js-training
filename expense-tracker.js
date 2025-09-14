#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const STORE_FILENAME = 'expenses.json';
const storeFilePath = path.resolve(process.cwd(), STORE_FILENAME);

function printUsage() {
  console.log('Usage:');
  console.log('  expense-tracker add --description "Lunch" --amount 12.5');
  console.log('  expense-tracker update --id 3 --description "Brunch" --amount 9.99');
  console.log('  expense-tracker delete --id 3');
  console.log('  expense-tracker list');
  console.log('  expense-tracker summary');
  console.log('  expense-tracker summary --month 8');
}

function ensureStore() {
  if (!fs.existsSync(storeFilePath)) {
    fs.writeFileSync(storeFilePath, '[]', 'utf8');
  }
}

function readExpenses() {
  ensureStore();
  try {
    const content = fs.readFileSync(storeFilePath, 'utf8').trim();
    if (content === '') return [];
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error reading expenses:', err.message);
    process.exitCode = 1;
    return [];
  }
}

function writeExpenses(expenses) {
  try {
    fs.writeFileSync(storeFilePath, JSON.stringify(expenses, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing expenses:', err.message);
    process.exit(1);
  }
}

function generateNextId(expenses) {
  let maxId = 0;
  for (const exp of expenses) {
    if (typeof exp.id === 'number' && exp.id > maxId) {
      maxId = exp.id;
    }
  }
  return maxId + 1;
}

function parseArgs(argv) {
  const map = new Map();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        map.set(key, next);
        i++;
      } else {
        map.set(key, true);
      }
    }
  }
  return map;
}

function todayIsoDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addExpense(argsMap) {
  const description = (argsMap.get('description') || '').trim();
  const amountStr = argsMap.get('amount');
  const amount = amountStr != null ? Number(amountStr) : NaN;

  if (!description) {
    console.error('Description is required.');
    process.exit(1);
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    console.error('Amount must be a positive number.');
    process.exit(1);
  }

  const expenses = readExpenses();
  const expense = {
    id: generateNextId(expenses),
    date: todayIsoDate(),
    description,
    amount: Number(amount.toFixed(2))
  };
  expenses.push(expense);
  writeExpenses(expenses);
  console.log(`Expense added successfully (ID: ${expense.id})`);
}

function updateExpense(argsMap) {
  const idStr = argsMap.get('id');
  const id = Number(idStr);
  if (!Number.isInteger(id)) {
    console.error('Invalid id');
    process.exit(1);
  }
  const description = argsMap.has('description') ? String(argsMap.get('description')).trim() : undefined;
  const amount = argsMap.has('amount') ? Number(argsMap.get('amount')) : undefined;
  if (description === '' || (amount !== undefined && (!Number.isFinite(amount) || amount <= 0))) {
    console.error('Invalid description or amount.');
    process.exit(1);
  }

  const expenses = readExpenses();
  const idx = expenses.findIndex(e => e.id === id);
  if (idx === -1) {
    console.error('Expense not found');
    process.exit(1);
  }
  if (description !== undefined) expenses[idx].description = description;
  if (amount !== undefined) expenses[idx].amount = Number(amount.toFixed(2));
  writeExpenses(expenses);
  console.log('Expense updated successfully');
}

function deleteExpense(argsMap) {
  const idStr = argsMap.get('id');
  const id = Number(idStr);
  if (!Number.isInteger(id)) {
    console.error('Invalid id');
    process.exit(1);
  }
  const expenses = readExpenses();
  const idx = expenses.findIndex(e => e.id === id);
  if (idx === -1) {
    console.error('Expense not found');
    process.exit(1);
  }
  expenses.splice(idx, 1);
  writeExpenses(expenses);
  console.log('Expense deleted successfully');
}

function listExpenses() {
  const expenses = readExpenses();
  if (expenses.length === 0) {
    console.log('No expenses found.');
    return;
  }
  console.log('# ID  Date        Description                Amount');
  for (const e of expenses) {
    const id = String(e.id).padEnd(3, ' ');
    const date = String(e.date).padEnd(11, ' ');
    const desc = String(e.description).padEnd(25, ' ');
    const amt = `$${Number(e.amount).toFixed(2)}`;
    console.log(`# ${id} ${date} ${desc} ${amt}`);
  }
}

function summary(argsMap) {
  const expenses = readExpenses();
  const monthStr = argsMap.get('month');
  if (monthStr) {
    const month = Number(monthStr);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      console.error('Invalid month. Use 1-12.');
      process.exit(1);
    }
    const year = new Date().getFullYear();
    const total = expenses
      .filter(e => String(e.date).startsWith(`${year}-${String(month).padStart(2, '0')}`))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const monthName = new Date(year, month - 1, 1).toLocaleString('en', { month: 'long' });
    console.log(`# Total expenses for ${monthName}: $${total.toFixed(2)}`);
    return;
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  console.log(`# Total expenses: $${total.toFixed(2)}`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const argsMap = parseArgs(args.slice(1));

  switch (command) {
    case 'add':
      addExpense(argsMap);
      break;
    case 'update':
      updateExpense(argsMap);
      break;
    case 'delete':
      deleteExpense(argsMap);
      break;
    case 'list':
      listExpenses();
      break;
    case 'summary':
      summary(argsMap);
      break;
    default:
      printUsage();
  }
}

main();


