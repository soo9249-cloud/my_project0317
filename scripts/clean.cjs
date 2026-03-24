/**
 * 로컬 빌드 산출물·캐시만 삭제합니다. node_modules는 건드리지 않습니다.
 * Git/Vercel 배포에는 .next가 포함되지 않으며, Vercel은 매번 원격에서 next build를 실행합니다.
 */
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const targets = [".next", path.join("node_modules", ".cache")];

for (const rel of targets) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    process.stdout.write(`removed: ${rel}\n`);
  }
}
