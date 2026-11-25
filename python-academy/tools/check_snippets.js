// Runs every browser-runnable snippet in web/content.js with local python3.
// Usage: node tools/check_snippets.js
const fs = require("fs"), path = require("path"), { spawnSync } = require("child_process");
global.window = {};
eval(fs.readFileSync(path.join(__dirname, "../web/content.js"), "utf8"));
let failed = 0, ran = 0;
for (const t of window.TRACKS) t.steps.forEach((s, i) => {
  if (s.run === false) return;
  // top-level `await x()` is valid in Pyodide; wrap it for plain CPython
  const code = s.code.replace(/^await (.+?)(\s+#.*)?$/gm, "import asyncio; asyncio.run($1)");
  const r = spawnSync("python3", ["-c", code], { encoding: "utf8", timeout: 60000 });
  ran++;
  if (r.status !== 0) { failed++; console.log(`FAIL ${t.id}/${i + 1} ${s.title}\n${r.stderr}`); }
  else console.log(`ok   ${t.id}/${i + 1} ${s.title}`);
});
console.log(`\n${ran - failed}/${ran} snippets passed`);
process.exit(failed ? 1 : 0);
