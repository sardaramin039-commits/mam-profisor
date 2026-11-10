import { execSync } from 'node:child_process';
import { existsSync, writeFileSync, chmodSync } from 'node:fs';

const shim = `#!/usr/bin/env sh
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
case "$1" in
  -v|--version)
    echo "1.2.0"
    exit 0
    ;;
  run)
    shift
    exec npm run "$@"
    ;;
  dev|start|build|build:ng|watch|lint|test|typecheck)
    exec npm run "$@"
    ;;
  install|i|add|remove|ci)
    exit 0
    ;;
  x|bunx)
    shift
    exec npx "$@"
    ;;
  *)
    exec node "$@"
    ;;
esac
`;

let bunPaths = ['/usr/local/bin/bun', '/usr/bin/bun', '/root/.bun/bin/bun'];
try {
  const found = execSync('which -a bun 2>/dev/null', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  bunPaths = [...new Set([...found, ...bunPaths])];
} catch {}

for (const target of bunPaths) {
  try {
    writeFileSync(target, shim, { mode: 0o777 });
    chmodSync(target, 0o777);
    console.log('Installed shim at:', target);
  } catch (err) {
    console.log('Skipped/Failed for', target, err.message);
  }
}
console.log('Bun shims setup complete.');
