import { db } from '../services/db.js';

function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }

export function createWorkout(req, res) {
  try {
    const body = req.body || {};
    if (!isNonEmptyString(body.title)) return res.status(400).json({ errors: ['title is required'] });
    const exercises = Array.isArray(body.exercises) ? body.exercises : [];
    const now = new Date().toISOString();
    const scheduled = body.scheduledAt ? new Date(body.scheduledAt).toISOString() : null;
    const ins = db.prepare('INSERT INTO workouts (user_id, title, notes, scheduled_at, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?)');
    const info = ins.run(req.user.id, body.title.trim(), String(body.notes || ''), scheduled, 'pending', now, now);
    const workoutId = info.lastInsertRowid;
    const add = db.prepare('INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, comments) VALUES (?,?,?,?,?,?)');
    const tx = db.transaction((items) => {
      for (const it of items) {
        const sets = Number(it.sets || 0);
        const reps = Number(it.reps || 0);
        const weight = it.weight != null ? Number(it.weight) : null;
        add.run(workoutId, Number(it.exerciseId), sets, reps, weight, String(it.comments || ''));
      }
    });
    tx(exercises);
    return res.status(201).json({ id: workoutId });
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export function updateWorkout(req, res) {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const row = db.prepare('SELECT * FROM workouts WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!row) return res.status(404).json({ error: 'not_found' });
    const upd = db.prepare('UPDATE workouts SET title = ?, notes = ?, scheduled_at = ?, status = ?, updated_at = ? WHERE id = ?');
    const title = isNonEmptyString(body.title) ? body.title.trim() : row.title;
    const notes = body.notes != null ? String(body.notes) : row.notes;
    const scheduled = body.scheduledAt ? new Date(body.scheduledAt).toISOString() : row.scheduled_at;
    const status = body.status ? String(body.status) : row.status;
    upd.run(title, notes, scheduled, status, new Date().toISOString(), id);
    if (Array.isArray(body.exercises)) {
      db.prepare('DELETE FROM workout_exercises WHERE workout_id = ?').run(id);
      const add = db.prepare('INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, comments) VALUES (?,?,?,?,?,?)');
      const tx = db.transaction((items) => {
        for (const it of items) add.run(id, Number(it.exerciseId), Number(it.sets||0), Number(it.reps||0), it.weight!=null?Number(it.weight):null, String(it.comments||''));
      });
      tx(body.exercises);
    }
    return res.json({ id });
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export function deleteWorkout(req, res) {
  try {
    const id = Number(req.params.id);
    const n = db.prepare('DELETE FROM workouts WHERE id = ? AND user_id = ?').run(id, req.user.id).changes;
    if (n === 0) return res.status(404).end();
    return res.status(204).end();
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export function listWorkouts(req, res) {
  try {
    const status = String(req.query.status || 'pending');
    const rows = db.prepare('SELECT * FROM workouts WHERE user_id = ? AND status = ? ORDER BY COALESCE(scheduled_at, created_at) ASC').all(req.user.id, status);
    return res.json(rows);
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export function report(req, res) {
  try {
    const since = req.query.since ? new Date(String(req.query.since)).toISOString() : null;
    const base = 'SELECT COUNT(*) as workouts, SUM(we.sets) as total_sets, SUM(we.reps) as total_reps FROM workouts w LEFT JOIN workout_exercises we ON we.workout_id = w.id WHERE w.user_id = ? AND w.status = "completed"';
    const sql = since ? base + ' AND w.updated_at >= ?' : base;
    const row = since ? db.prepare(sql).get(req.user.id, since) : db.prepare(sql).get(req.user.id);
    return res.json(row);
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}


