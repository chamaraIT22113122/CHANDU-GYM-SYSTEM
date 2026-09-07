import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

let exerciseData: any = null;

function getExerciseData() {
  if (!exerciseData) {
    try {
      const dataPath = path.join(__dirname, '../exercises.json');
      exerciseData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (e) {
      console.error('Failed to load exercises.json', e);
      exerciseData = { videoMap: {}, categories: {} };
    }
  }
  return exerciseData;
}

// Get mapping of exercise name -> video URL path
router.get('/videos', (req, res) => {
  try {
    const data = getExerciseData();
    res.json(data.videoMap);
  } catch (error) {
    console.error('Error serving exercise videos:', error);
    res.status(500).json({ error: 'Failed to scan videos' });
  }
});

// Get structured list of exercises categorized by folder
router.get('/list', (req, res) => {
  try {
    const data = getExerciseData();
    res.json(data.categories);
  } catch (error) {
    console.error('Error serving exercise list:', error);
    res.status(500).json({ error: 'Failed to get exercise list' });
  }
});

export default router;
