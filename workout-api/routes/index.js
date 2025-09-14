import { Router } from 'express';
import { migrate } from '../services/db.js';
import { signup, login } from '../controllers/authController.js';
import { seedExercises, listExercises } from '../controllers/exercisesController.js';
import { authRequired } from '../middlewares/authMiddleware.js';
import { createWorkout, updateWorkout, deleteWorkout, listWorkouts, report } from '../controllers/workoutsController.js';

migrate();

const router = Router();

router.get('/', (req, res) => res.json({ name: 'Workout Tracker API' }));

// Auth
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// Exercises
router.post('/exercises/seed', seedExercises);
router.get('/exercises', listExercises);

// Workouts
router.post('/workouts', authRequired, createWorkout);
router.put('/workouts/:id', authRequired, updateWorkout);
router.delete('/workouts/:id', authRequired, deleteWorkout);
router.get('/workouts', authRequired, listWorkouts);
router.get('/reports/summary', authRequired, report);

export default router;


