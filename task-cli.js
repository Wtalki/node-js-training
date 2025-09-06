import fs, { read } from 'fs'
import path from 'path'

const TASKS_FILENAME='task.json'
const taskFilePath = path.resolve(process.cwd(),TASKS_FILENAME)
console.log(taskFilePath)

export const STATUSES = ['todo', 'in-progress', 'done'];

function ensureTasksFileExists(){
	if(!fs.existsSync(taskFilePath)){
		fs.writeFileSync(taskFilePath,'[]','utf8')
	}
}

function readTasks(){
	ensureTasksFileExists()
	try{
		const content = fs.readFileSync(taskFilePath,'utf8').trim();
		if(content === '') return [];
		const data = JSON.parse(content)
		return Array.isArray(data) ? data : [];
	}catch(err){
		console.log('error reading task',err.message)
		process.exitCode = 1;
		return [];
	}
}

export function writeTasks(tasks){
	try{
		fs.writeFileSync(taskFilePath,JSON.stringify(tasks,null,2),'utf8')
	}catch(err){
		console.log(err.message)
		process.exit(1)
	}
}

export function generateNextId(tasks){
	let maxId=0;
	for (const task of tasks){
		if(typeof task.id === 'number' && task.id > maxId){
			maxId=task.id;
		}
	}
	return maxId+1;
}

export function addTask(description){
	if(!description || description.trim() === ''){
		console.log('description is required')
		process.exit(1)
	}
	const tasks = readTasks();
	const now = new Date().toISOString();
	const newTask = {
		id:generateNextId(tasks),
		description:description.trim(),
		status:STATUSES.TODO,
		created_at:now,
		updated_at:now
	}
	tasks.push(newTask)
	writeTasks(tasks)
	console.log(`Task added successfully (ID: ${newTask.id})`)

}

export function updateTask(id,newDescription){
	const tasks = readTasks();
	const numericId = Number(id);

	if(!Number.isInteger(numericId)){
		console.error(" Invalid task id")
		process.exit(1)
	}

	const idx = tasks.findIndex(task => task.id == numericId);
	if(idx === -1){
		console.error(' Task with numeric id does not exist')
		process.exit(1)
	}

	if(!newDescription || newDescription.trim() === ''){
		console.error('New description is required')
		process.exit(1)
	}

	tasks[idx].description = newDescription.trim();
	tasks[idx].updated_at = new Date().toISOString();

	writeTasks(tasks)
	console.log(`Task updated successfully (ID: ${id})`)
}

export function DeleteTask(id){
	const tasks = readTasks();
	const numericId = Number(id);
	if(!Number.isInteger(numericId)){
		console.error(' Invalid task id')
		process.exit(1)
	}
	
	const idx = tasks.findIndex(task => task.id == numericId);
	if(idx === -1){
		console.error(' Task with numeric id does not exist')
		process.exit(1)
	}

	console.log(idx)
	tasks.splice(idx,1);
	writeTasks(tasks)
	console.log(`Task deleted successfully (ID: ${id})`)
}

function markTask(id,status){
	const tasks = readTasks();
	const numericId = Number(id);
	if(!Number.isInteger(numericId)){
		console.error(' Invalid task id')
		process.exit(1)
	}
	const idx = tasks.findIndex(task => task.id == numericId);
	if(idx === -1){
		console.error(' Task with numeric id does not exist')
		process.exit(1)
	}

	tasks[idx].status = status;
	tasks[idx].updated_at = new Date().toISOString();

	writeTasks(tasks)
	console.log(`Task marked successfully (ID: ${id})`)
}

function printUsage(){
	console.log('Usage:');
  console.log('  task-cli add "Description"');
  console.log('  task-cli update <id> "New description"');
  console.log('  task-cli delete <id>');
  console.log('  task-cli mark-in-progress <id>');
  console.log('  task-cli mark-done <id>');
  console.log('  task-cli list [todo|in-progress|done]');
}

export function main(){
	const args = process.argv.slice(2);
	const command = args[0];
	if(!command){
		printUsage();
		return;
	}
	console.log(args[1])
	switch(command){
		case 'add':
			addTask(args.slice(1).join(' '));
			break;
		case 'list':
			const tasks =readTasks();
			console.log(tasks)
			break;
		case 'update':
			updateTask(args[1],args.slice(2).join(' '));
			break;
		case 'delete':
			DeleteTask(args[1]);
			break;
		case 'mark-in-progress':
			markTask(args[1],'in-progress');
			break;
		case 'mark-done':
			markTask(args[1],'done');
			break;
		default:
			printUsage();
	}
}
main()