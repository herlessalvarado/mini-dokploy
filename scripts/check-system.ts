import { runCommand } from "../src/server/services/command";

async function main() {
  console.log("Checking git...");
  const git = await runCommand("git", ["--version"]);
  console.log(git.stdout);

  console.log("Checking docker...");
  const docker = await runCommand("docker", ["--version"]);
  console.log(docker.stdout);

  console.log("Checking docker swarm...");
  const swarm = await runCommand("docker", ["info", "--format", "{{.Swarm.LocalNodeState}}"]);
  console.log(`Swarm state: ${swarm.stdout}`);

  if (swarm.stdout !== "active") {
    console.log("");
    console.log("Docker Swarm is not active yet.");
    console.log("Run this before testing services:");
    console.log("docker swarm init");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});