import { db } from '../services/db.js';

export function seedExercises(req, res) {
  try {
    const defaults = [
      { name: 'Push Up', description: 'Bodyweight push exercise', category: 'strength', muscle_group: 'chest' },
      { name: 'Squat', description: 'Bodyweight lower body exercise', category: 'strength', muscle_group: 'legs' },
      { name: 'Deadlift', description: 'Barbell posterior chain exercise', category: 'strength', muscle_group: 'back' },
      { name: 'Bench Press', description: 'Barbell chest press', category: 'strength', muscle_group: 'chest' },
      { name: 'Pull Up', description: 'Bodyweight pulling exercise', category: 'strength', muscle_group: 'back' },
      { name: 'Running', description: 'Cardio endurance', category: 'cardio', muscle_group: 'legs' },
      { name: 'Plank', description: 'Core stability', category: 'flexibility', muscle_group: 'core' }
    ];
    const insert = db.prepare('INSERT OR IGNORE INTO exercises (name, description, category, muscle_group) VALUES (?, ?, ?, ?)');
    const tx = db.transaction((rows) => {
      for (const r of rows) insert.run(r.name, r.description, r.category, r.muscle_group);
    });
    tx(defaults);
    return res.json({ inserted: defaults.length });
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export function listExercises(req, res) {
  try {
    const term = String(req.query.term || '').trim();
    let rows;
    if (term) {
      const like = `%${term}%`;
      rows = db.prepare('SELECT id, name, description, category, muscle_group FROM exercises WHERE name LIKE ? OR description LIKE ? OR category LIKE ? OR muscle_group LIKE ? ORDER BY name').all(like, like, like, like);
    } else {
      rows = db.prepare('SELECT id, name, description, category, muscle_group FROM exercises ORDER BY name').all();
    }
    return res.json(rows);
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}


