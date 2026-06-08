import { trpc } from "@/utils/trpc";

export function DeploymentList() {
  const utils = trpc.useUtils();

  const deploymentsQuery = trpc.deployments.list.useQuery(undefined, {
    refetchInterval: 3000,
  });

  const redeployMutation = trpc.deployments.redeploy.useMutation({
    onSuccess: async () => {
      await utils.deployments.list.invalidate();
    },
  });

  const removeMutation = trpc.deployments.remove.useMutation({
    onSuccess: async () => {
      await utils.deployments.list.invalidate();
    },
  });

  return (
    <section style={{ marginTop: 32 }}>
      <h2>Deployments</h2>

      {deploymentsQuery.isLoading && <p>Loading deployments...</p>}

      {deploymentsQuery.error && (
        <p style={{ color: "red" }}>Error: {deploymentsQuery.error.message}</p>
      )}

      {redeployMutation.error && (
        <p style={{ color: "red" }}>
          Redeploy error: {redeployMutation.error.message}
        </p>
      )}

      {removeMutation.error && (
        <p style={{ color: "red" }}>
          Remove error: {removeMutation.error.message}
        </p>
      )}

      {deploymentsQuery.data?.length === 0 && <p>No deployments yet.</p>}

      {deploymentsQuery.data && deploymentsQuery.data.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 12,
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Domain</th>
                <th style={thStyle}>Repo</th>
                <th style={thStyle}>Port</th>
                <th style={thStyle}>Error</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {deploymentsQuery.data.map((deployment) => {
                const isBuilding = deployment.status === "building";
                const isRemoved = deployment.status === "removed";

                return (
                  <tr key={deployment.id}>
                    <td style={tdStyle}>{deployment.name}</td>

                    <td style={tdStyle}>
                      <strong>{deployment.status}</strong>
                    </td>

                    <td style={tdStyle}>
                      {isRemoved ? (
                        <span>-</span>
                      ) : (
                        <a
                          href={`http://${deployment.domain}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {deployment.domain}
                        </a>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <span title={deployment.repoUrl}>
                        {truncate(deployment.repoUrl, 32)}
                      </span>
                    </td>

                    <td style={tdStyle}>{deployment.exposedPort}</td>

                    <td style={tdStyle}>
                      {deployment.errorMessage
                        ? truncate(deployment.errorMessage, 40)
                        : "-"}
                    </td>

                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          disabled={
                            isBuilding ||
                            isRemoved ||
                            redeployMutation.isPending
                          }
                          onClick={() =>
                            redeployMutation.mutate({ id: deployment.id })
                          }
                        >
                          Redeploy
                        </button>

                        <button
                          type="button"
                          disabled={
                            isBuilding || isRemoved || removeMutation.isPending
                          }
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Remove ${deployment.name}?`,
                            );

                            if (confirmed) {
                              removeMutation.mutate({ id: deployment.id });
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: 8,
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: 8,
  verticalAlign: "top",
};

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}
