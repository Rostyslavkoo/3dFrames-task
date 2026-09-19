import { readFileSync } from 'fs';


const text = readFileSync(process.argv[2], 'utf-8');
const vertices = text
      .split('\n')
      .filter(line => line.startsWith('v '))
      .map(line => line.trim().split(/\s+/).slice(1).map(Number));

const xs = vertices.map(v => v[0]);
const ys = vertices.map(v => v[1]);
const zs = vertices.map(v => v[2]);

console.log('X:', Math.min(...xs), '→', Math.max(...xs));
console.log('Y:', Math.min(...ys), '→', Math.max(...ys));
console.log('Z:', Math.min(...zs), '→', Math.max(...zs));