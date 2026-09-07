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
  if (file.endsWith('api.ts')) return; // skip api.ts

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace fetch(`${import.meta.env.VITE_API_URL || ""}/api...`) with apiFetch("/api...")
  const regex = /fetch\(\s*`\$\{import\.meta\.env\.VITE_API_URL \|\| ""\}(\/api.*?)`\s*(,|(?=\)))/g;
  
  let match;
  let hasReplaced = false;
  
  while ((match = regex.exec(content)) !== null) {
    hasReplaced = true;
  }
  
  if (hasReplaced) {
    content = content.replace(regex, 'apiFetch(`$1`$2');
    
    // Add import statement at the top if not exists
    if (!content.includes("import { apiFetch } from")) {
      const depth = file.substring(srcDir.length + 1).split(path.sep).length - 1;
      const relativePrefix = depth === 0 ? './' : '../'.repeat(depth);
      const importPath = `${relativePrefix}lib/api`;
      
      const importLines = content.split('\n');
      const firstNonCommentLineIndex = importLines.findIndex(l => !l.trim().startsWith('//') && l.trim() !== '');
      importLines.splice(Math.max(0, firstNonCommentLineIndex), 0, `import { apiFetch } from "${importPath}";`);
      content = importLines.join('\n');
    }
    
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
});

console.log(`Updated ${modifiedCount} files.`);
