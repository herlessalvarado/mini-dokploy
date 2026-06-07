import { DeploymentForm } from "@/components/DeploymentForm";
import { DeploymentList } from "@/components/DeploymentList";

export default function Home() {
  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 32,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Mini-Dokploy</h1>
      <p>Local deployment platform for Git + Docker + Traefik.</p>

      <DeploymentForm />
      <DeploymentList />
    </main>
  );
}