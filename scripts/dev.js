const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function start(command, args, label) {
  const child = spawn(command, args, {
    cwd: root,
    shell: true,
    stdio: 'inherit'
  });

  child.on('exit', (code, signal) => {
    console.error(`\n[${label}] terminou com código ${code ?? signal ?? 'desconhecido'}.`);
    process.exit(code || 1);
  });

  return child;
}

console.log('Iniciando backend e frontend...');
start('npm', ['start'], 'backend');

// Usa npx para garantir que o binário 'serve' seja executado mesmo sem instalação global
start('npx', ['serve', 'frontend', '-l', '5500'], 'frontend');
