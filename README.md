## Task Tracker CLI

A beginner-friendly Node.js CLI to track your tasks using a local `tasks.json` file in the current directory.

### Install / Setup

- Ensure Node.js is installed.
- Optional: register a global `task-cli` command (from this folder):

```bash
npm link
```

You can also run via Node directly without linking:

```bash
node task-cli.js add "Buy groceries"
```

### Usage

```bash
# Add a task
task-cli add "Buy groceries"
# Output: Task added successfully (ID: 1)

# Update and delete
task-cli update 1 "Buy groceries and cook dinner"
task-cli delete 1

# Mark status
task-cli mark-in-progress 1
task-cli mark-done 1

# List tasks
task-cli list

# List by status
task-cli list todo
task-cli list in-progress
task-cli list done
```

### Task format

Each task is stored in `tasks.json` with:

- `id`: number
- `description`: string
- `status`: one of `todo`, `in-progress`, `done`
- `createdAt`: ISO string
- `updatedAt`: ISO string

The file is created automatically in the current working directory on first use.

### Notes

- No external libraries are used.
- Commands accept positional arguments. On Windows PowerShell, wrap descriptions in quotes.

### How it works

See the detailed explanation in `docs/task-cli-explained.md` for:

- Data model and storage in `tasks.json`
- Helper functions used by the CLI
- Command parsing and each command's flow
- Error handling and how to extend the tool


