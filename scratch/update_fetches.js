const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../react-frontend/src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace fetch("http://localhost:5000/api/...
  content = content.replace(/fetch\(['"`]http:\/\/localhost:5000\/api(.*?)(['"`])/g, 'fetch(`${import.meta.env.VITE_API_URL || ""}/api$1`');
  
  // Replace fetch("/api/...
  // Look for exact matches of fetch("/api... or fetch('/api... or fetch(`/api...
  content = content.replace(/fetch\(['"`]\/api(.*?)(['"`])/g, 'fetch(`${import.meta.env.VITE_API_URL || ""}/api$1`');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
});

console.log(`Updated ${modifiedCount} files.`);
