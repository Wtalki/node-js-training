#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const TASKS_FILENAME = 'tasks.json';
const tasksFilePath = path.resolve(process.cwd(), TASKS_FILENAME);

const STATUSES = {
	TODO: 'todo',
	IN_PROGRESS: 'in-progress',
	DONE: 'done',
};

function ensureTasksFileExists() {
	if (!fs.existsSync(tasksFilePath)) {
		fs.writeFileSync(tasksFilePath, '[]', 'utf8');
	}
}

function readTasks() {
	ensureTasksFileExists();
	try {
		const content = fs.readFileSync(tasksFilePath, 'utf8').trim();
		if (content === '') {
			return [];
		}
		const data = JSON.parse(content);
		return Array.isArray(data) ? data : [];
	} catch (err) {
		console.error('Error reading tasks file:', err.message);
		process.exitCode = 1;
		return [];
	}
}

function writeTasks(tasks) {
	try {
		fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2) + '\n', 'utf8');
	} catch (err) {
		console.error('Error writing tasks file:', err.message);
		process.exit(1);
	}
}

function generateNextId(tasks) {
	let maxId = 0;
	for (const task of tasks) {
		if (typeof task.id === 'number' && task.id > maxId) {
			maxId = task.id;
		}
	}
	return maxId + 1;
}

function printTask(task) {
	console.log(`[${task.id}] ${task.description} - ${task.status} (created: ${task.createdAt}${task.updatedAt ? `, updated: ${task.updatedAt}` : ''})`);
}

function listTasks(statusFilter) {
	const tasks = readTasks();
	let filtered = tasks;
	if (statusFilter) {
		filtered = tasks.filter(t => t.status === statusFilter);
	}
	if (filtered.length === 0) {
		if (statusFilter) {
			console.log(`No tasks with status "${statusFilter}".`);
		} else {
			console.log('No tasks found.');
		}
		return;
	}
	for (const task of filtered) {
		printTask(task);
	}
}

function addTask(description) {
	if (!description || description.trim() === '') {
		console.error('Description is required.');
		process.exit(1);
	}
	const tasks = readTasks();
	const now = new Date().toISOString();
	const newTask = {
		id: generateNextId(tasks),
		description: description.trim(),
		status: STATUSES.TODO,
		createdAt: now,
		updatedAt: now,
	};
	tasks.push(newTask);
	writeTasks(tasks);
	console.log(`Task added successfully (ID: ${newTask.id})`);
}

function updateTask(id, newDescription) {
	const tasks = readTasks();
	const numericId = Number(id);
	if (!Number.isInteger(numericId)) {
		console.error('Invalid task ID.');
		process.exit(1);
	}
	const idx = tasks.findIndex(t => t.id === numericId);
	if (idx === -1) {
		console.error(`Task with ID ${numericId} not found.`);
		process.exit(1);
	}
	if (!newDescription || newDescription.trim() === '') {
		console.error('New description is required.');
		process.exit(1);
	}
	tasks[idx].description = newDescription.trim();
	tasks[idx].updatedAt = new Date().toISOString();
	writeTasks(tasks);
	console.log(`Task updated successfully (ID: ${numericId})`);
}

function deleteTask(id) {
	const tasks = readTasks();
	const numericId = Number(id);
	if (!Number.isInteger(numericId)) {
		console.error('Invalid task ID.');
		process.exit(1);
	}
	const idx = tasks.findIndex(t => t.id === numericId);
	if (idx === -1) {
		console.error(`Task with ID ${numericId} not found.`);
		process.exit(1);
	}
	tasks.splice(idx, 1);
	writeTasks(tasks);
	console.log(`Task deleted successfully (ID: ${numericId})`);
}

function markTask(id, status) {
	const tasks = readTasks();
	const numericId = Number(id);
	if (!Number.isInteger(numericId)) {
		console.error('Invalid task ID.');
		process.exit(1);
	}
	const idx = tasks.findIndex(t => t.id === numericId);
	if (idx === -1) {
		console.error(`Task with ID ${numericId} not found.`);
		process.exit(1);
	}
	tasks[idx].status = status;
	tasks[idx].updatedAt = new Date().toISOString();
	writeTasks(tasks);
	const verb = status === STATUSES.DONE ? 'done' : (status === STATUSES.IN_PROGRESS ? 'in progress' : status);
	console.log(`Task marked as ${verb} (ID: ${numericId})`);
}

function printUsage() {
	console.log('Usage:');
	console.log('  task-cli add "Description"');
	console.log('  task-cli update <id> "New description"');
	console.log('  task-cli delete <id>');
	console.log('  task-cli mark-in-progress <id>');
	console.log('  task-cli mark-done <id>');
	console.log('  task-cli list [todo|in-progress|done]');
}

function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	if (!command) {
		printUsage();
		return;
	}
	switch (command) {
		case 'add': {
			const description = args.slice(1).join(' ').trim().replace(/^"|"$/g, '');
			addTask(description);
			break;
		}
		case 'update': {
			const id = args[1];
			const description = args.slice(2).join(' ').trim().replace(/^"|"$/g, '');
			updateTask(id, description);
			break;
		}
		case 'delete': {
			const id = args[1];
			deleteTask(id);
			break;
		}
		case 'mark-in-progress': {
			const id = args[1];
			markTask(id, STATUSES.IN_PROGRESS);
			break;
		}
		case 'mark-done': {
			const id = args[1];
			markTask(id, STATUSES.DONE);
			break;
		}
		case 'list': {
			const statusArg = args[1];
			let statusFilter = undefined;
			if (statusArg) {
				const normalized = statusArg.toLowerCase();
				if ([STATUSES.TODO, STATUSES.IN_PROGRESS, STATUSES.DONE].includes(normalized)) {
					statusFilter = normalized;
				} else {
					console.error('Invalid status. Use one of: todo, in-progress, done');
					process.exit(1);
				}
			}
			listTasks(statusFilter);
			break;
		}
		case 'help':
		default:
			printUsage();
	}
}

main();


