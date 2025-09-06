## Task CLI – How it works

This document explains the internal design of `task-cli.js` so you can understand and extend it.

### Overview
- **Goal**: Manage tasks from the command line.
- **Storage**: A `tasks.json` file in the current working directory (CWD). Each folder has its own task list.
- **No dependencies**: Uses only Node’s built-in `fs` and `path` modules.

### Data model (task object)
- `id`: number (auto-increment: 1 + max id)
- `description`: string (required)
- `status`: `todo` | `in-progress` | `done`
- `createdAt`: ISO date-time string
- `updatedAt`: ISO date-time string

`tasks.json` is an array of these task objects. The file is created automatically if missing.

### File paths and creation
- The CLI resolves `tasks.json` using `path.resolve(process.cwd(), 'tasks.json')`.
- On first run, if the file does not exist, it writes an empty array `[]`.

### Core helpers
- `ensureTasksFileExists()`: Creates `tasks.json` with `[]` when missing.
- `readTasks()`: Returns an array of tasks. Gracefully handles empty/corrupted files (returns `[]` and sets `process.exitCode`).
- `writeTasks(tasks)`: Writes tasks back to disk in pretty JSON (2-space indentation). Exits with non-zero code on failure.
- `generateNextId(tasks)`: Scans existing tasks to return `maxId + 1`.
- `printTask(task)`: Single-line human-readable output for a task.

#### Function-by-function details
- `ensureTasksFileExists()`
  - If `tasks.json` does not exist in the CWD, creates it with `[]`.
  - Keeps the tool self-contained per directory.

- `readTasks()`
  - Reads `tasks.json`, trims whitespace, parses JSON.
  - Empty file → returns `[]`.
  - Parse error → logs error, sets `process.exitCode = 1`, returns `[]`.

- `writeTasks(tasks)`
  - Serializes with `JSON.stringify(tasks, null, 2)` for readability.
  - Appends a trailing newline for nicer diffs.

- `generateNextId(tasks)`
  - Iterates tasks, tracks `maxId`, returns `maxId + 1`.
  - ID is not reused after deletions (simple and predictable).

- `printTask(task)`
  - Outputs `[id] description - status (created: ISO, updated: ISO)`.


### Command parsing
- The CLI reads `process.argv.slice(2)` to get positional arguments.
- `command = args[0]` determines the action: `add`, `update`, `delete`, `mark-in-progress`, `mark-done`, `list`, `help`.
- Descriptions can contain spaces; they’re taken by joining the remaining args and trimming quotes.

### Commands
- add "Description"
  - Validates non-empty description.
  - Creates a task with `status: 'todo'` and timestamps.
  - Persists to `tasks.json` and prints the new ID.

- update <id> "New description"
  - Validates numeric ID exists and non-empty new description.
  - Updates `description` and `updatedAt`.

- delete <id>
  - Validates numeric ID exists.
  - Removes the task from the array and writes the file.

- mark-in-progress <id>
  - Validates numeric ID exists.
  - Sets `status` to `in-progress`, updates `updatedAt`.

- mark-done <id>
  - Validates numeric ID exists.
  - Sets `status` to `done`, updates `updatedAt`.

- list [todo|in-progress|done]
  - Without an argument: prints all tasks.
  - With a valid status: filters by that status.
  - Prints a friendly message if nothing to show.

#### Command flow in `main()`
- Parses `process.argv.slice(2)` → `args`.
- `command = args[0]` determines the case:
  - `add` → `addTask(join(args.slice(1)))`
  - `update` → `updateTask(args[1], join(args.slice(2)))`
  - `delete` → `deleteTask(args[1])`
  - `mark-in-progress` → `markTask(args[1], 'in-progress')`
  - `mark-done` → `markTask(args[1], 'done')`
  - `list` → optional `status = args[1]` validation, then `listTasks(status)`
  - default/`help` → prints usage

### Error handling
- Input validation errors print a message and exit with non-zero code.
- Read errors set `process.exitCode = 1` but keep running to avoid crashing.
- Write errors exit immediately with non-zero code.

### Extending the CLI
- New status values: Add to the `STATUSES` object, and allow it in `list` parsing.
- New commands: Add a new `case` in the `switch (command)` and implement a small helper similar to `addTask`.
- Sorting or searching: Read tasks, transform/filter/sort the array, then print with `printTask`.

### Running
- Direct:
  - `node task-cli.js add "Buy groceries"`
- As a command (optional):
  - `npm link` (run once in this folder)
  - `task-cli add "Buy groceries"`

### Tips (Windows/PowerShell)
- Always wrap multi-word descriptions in quotes, e.g. `"Buy groceries and cook"`.


