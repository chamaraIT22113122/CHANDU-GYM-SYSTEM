const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const frontendPagesDir = path.join(__dirname, '..', 'react-frontend', 'src', 'pages');
const backendRoutesDir = path.join(__dirname, '..', 'express-backend', 'routes');

// Helper to recursively get files
function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

// 1. Migrate APIs (Basic structure translation)
const apiFiles = getAllFiles(path.join(srcDir, 'app', 'api')).filter(f => f.endsWith('route.ts'));
apiFiles.forEach(file => {
  const relativePath = path.relative(path.join(srcDir, 'app', 'api'), file);
  const dirName = path.dirname(relativePath);
  
  if (dirName === 'auth/login' || dirName === 'members' || dirName === 'attendance') return; // already done

  const routeName = dirName.replace(/\\/g, '/').replace(/\//g, '_').replace(/\[|\]/g, '');
  const outPath = path.join(backendRoutesDir, `${routeName}.ts`);
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Very basic replacements
  content = content.replace(/export async function GET\([^)]*\)\s*{/g, "router.get('/', async (req, res) => {");
  content = content.replace(/export async function POST\([^)]*\)\s*{/g, "router.post('/', async (req, res) => {");
  content = content.replace(/export async function PUT\([^)]*\)\s*{/g, "router.put('/', async (req, res) => {");
  content = content.replace(/export async function DELETE\([^)]*\)\s*{/g, "router.delete('/', async (req, res) => {");
  content = content.replace(/NextResponse\.json\(([^)]+)\)/g, "res.json($1)");
  content = content.replace(/import { NextResponse } from "next\/server";/g, "import { Router } from 'express';\nconst router = Router();");
  content = content.replace(/await request\.json\(\)/g, "req.body");
  
  content += "\nexport default router;\n";

  fs.writeFileSync(outPath, content);
  console.log(`Migrated API: ${dirName} -> ${routeName}.ts`);
});

// 2. Migrate Pages
const pageFiles = getAllFiles(path.join(srcDir, 'app')).filter(f => f.endsWith('page.tsx') && !f.includes('api\\'));
pageFiles.forEach(file => {
  const relativePath = path.relative(path.join(srcDir, 'app'), file);
  const dirName = path.dirname(relativePath);
  
  if (dirName === 'login' || dirName === 'admin' || dirName === '.') return; // already done or root
  
  const pageName = dirName.split(/\\|\//).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Page';
  const outPath = path.join(frontendPagesDir, `${pageName}.tsx`);
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Basic replacements
  content = content.replace(/"use client";\n/g, "");
  content = content.replace(/import Image from "next\/image";/g, "");
  content = content.replace(/<Image([^>]*)>/g, "<img$1>");
  content = content.replace(/import Link from "next\/link";/g, "import { Link } from 'react-router-dom';");
  content = content.replace(/import { useRouter[^}]* } from "next\/navigation";/g, "import { useNavigate } from 'react-router-dom';");
  content = content.replace(/useRouter\(\)/g, "useNavigate()");
  content = content.replace(/router\.push\(/g, "navigate(");
  content = content.replace(/export default function [a-zA-Z0-9_]+\(\)/g, `export default function ${pageName}()`);

  fs.writeFileSync(outPath, content);
  console.log(`Migrated Page: ${dirName} -> ${pageName}.tsx`);
});
