import { trpc } from "@/utils/trpc";

export default function Home() {
  const deploymentsQuery = trpc.deployments.list.useQuery();

  return (
    <main style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <h1>Mini-Dokploy</h1>
      <p>Local deployment platform for Git + Docker + Traefik.</p>

      <section style={{ marginTop: 32 }}>
        <h2>Deployments</h2>

        {deploymentsQuery.isLoading && <p>Loading deployments...</p>}

        {deploymentsQuery.error && (
          <p style={{ color: "red" }}>
            Error: {deploymentsQuery.error.message}
          </p>
        )}

        {deploymentsQuery.data?.length === 0 && <p>No deployments yet.</p>}

        {deploymentsQuery.data && deploymentsQuery.data.length > 0 && (
          <ul>
            {deploymentsQuery.data.map((deployment) => (
              <li key={deployment.id}>
                <strong>{deployment.name}</strong> — {deployment.status} —{" "}
                {deployment.domain}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}