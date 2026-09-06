import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const backend = spawn("npm", ["run", "dev"], {
  cwd: join(root, "backend"),
  shell: true,
  stdio: "inherit",
});

const frontend = spawn("npm", ["run", "dev"], {
  cwd: join(root, "frontend"),
  shell: true,
  stdio: "inherit",
});

function killAll() {
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on("SIGINT", killAll);
process.on("SIGTERM", killAll);

backend.on("close", killAll);
frontend.on("close", killAll);
