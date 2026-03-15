const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

const steps = [
  {
    name: 'Prisma schema validation',
    cmd: 'npx prisma validate',
    cwd: path.join(root, 'apps', 'api'),
  },
  { name: 'Prettier format check', cmd: 'npx prettier --check "**/*.{ts,tsx,json}"', cwd: root },
  {
    name: 'API build (TypeScript)',
    cmd: 'npx tsc -p tsconfig.json',
    cwd: path.join(root, 'apps', 'api'),
  },
  { name: 'Web build (Next.js)', cmd: 'npm run build', cwd: path.join(root, 'apps', 'web') },
  { name: 'API tests', cmd: 'npx jest', cwd: path.join(root, 'apps', 'api') },
];

let failed = false;

for (const step of steps) {
  console.log(`\n=== ${step.name} ===\n`);
  try {
    execSync(step.cmd, { stdio: 'inherit', cwd: step.cwd });
  } catch {
    console.error(`\n FAILED: ${step.name}\n`);
    process.exit(1);
  }
}

console.log('\n=== All checks passed ===\n');
