const fs = require('fs');
const path = require('path');

function getFilesRecursively(dir, fileList = []) {
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

const assetsDir = path.join(__dirname, '../assets/Exercise Pack');
const files = getFilesRecursively(assetsDir);

const videoMap = {};
const categories = {};

for (const file of files) {
  if (file.endsWith('.mp4')) {
    const basename = path.basename(file, '.mp4');
    const relativePath = file.substring(assetsDir.length).replace(/\\/g, '/');
    
    videoMap[basename.toLowerCase()] = `/assets/Exercise Pack${relativePath}`;

    const parts = relativePath.split('/').filter(Boolean);
    if (parts.length >= 3) {
      const category = parts[0];
      const muscleGroup = parts[1];
      if (category && muscleGroup) {
        if (!categories[category]) categories[category] = {};
        if (!categories[category][muscleGroup]) categories[category][muscleGroup] = [];
        categories[category][muscleGroup].push(basename);
      }
    }
  }
}

fs.writeFileSync(
  path.join(__dirname, '../express-backend/exercises.json'),
  JSON.stringify({ videoMap, categories }, null, 2)
);
console.log('Successfully generated exercises.json!');
