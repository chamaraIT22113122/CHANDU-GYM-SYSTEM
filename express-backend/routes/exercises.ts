import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

function getFilesRecursively(dir: string, fileList: string[] = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Get mapping of exercise name -> video URL path
router.get('/videos', (req, res) => {
  try {
    const assetsDir = path.join(__dirname, '../../assets/Exercise Pack');
    const files = getFilesRecursively(assetsDir);
    
    // Create a map of exercise name (without extension) to its relative URL path
    const videoMap: Record<string, string> = {};
    
    for (const file of files) {
      if (file.endsWith('.mp4')) {
        const basename = path.basename(file, '.mp4');
        const relativePath = file.substring(assetsDir.length).replace(/\\/g, '/');
        // Add to map
        videoMap[basename.toLowerCase()] = `/assets/Exercise Pack${relativePath}`;
      }
    }
    
    res.json(videoMap);
  } catch (error) {
    console.error('Error scanning exercise videos:', error);
    res.status(500).json({ error: 'Failed to scan videos' });
  }
});

// Get structured list of exercises categorized by folder
router.get('/list', (req, res) => {
  try {
    const assetsDir = path.join(__dirname, '../../assets/Exercise Pack');
    const files = getFilesRecursively(assetsDir);
    
    // structure: { "Barbell": { "Arm": ["Barbell Bicep Curl", ...], ... } }
    const categories: Record<string, Record<string, string[]>> = {};
    
    for (const file of files) {
      if (file.endsWith('.mp4')) {
        const basename = path.basename(file, '.mp4');
        const relativePath = file.substring(assetsDir.length).replace(/\\/g, '/');
        // e.g. relativePath is "/Barbell/Arm/Barbell Bicep Curl.mp4"
        const parts = relativePath.split('/').filter(Boolean);
        if (parts.length >= 3) {
          const category = parts[0];
          const muscleGroup = parts[1];
          if (!categories[category]) categories[category] = {};
          if (!categories[category][muscleGroup]) categories[category][muscleGroup] = [];
          categories[category][muscleGroup].push(basename);
        }
      }
    }
    
    res.json(categories);
  } catch (error) {
    console.error('Error scanning exercise list:', error);
    res.status(500).json({ error: 'Failed to get exercise list' });
  }
});

export default router;
