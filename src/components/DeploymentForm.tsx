import { FormEvent, useState } from "react";

import { trpc } from "@/utils/trpc";
import { parseCustomLabels } from "@/utils/labels";

export function DeploymentForm() {
  const utils = trpc.useUtils();

  const [repoUrl, setRepoUrl] = useState("");
  const [dockerfilePath, setDockerfilePath] = useState("Dockerfile");
  const [exposedPort, setExposedPort] = useState("3000");
  const [customLabelsText, setCustomLabelsText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createDeployment = trpc.deployments.create.useMutation({
    onSuccess: async () => {
      await utils.deployments.list.invalidate();

      setRepoUrl("");
      setDockerfilePath("Dockerfile");
      setExposedPort("3000");
      setCustomLabelsText("");
      setFormError(null);
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    try {
      const customLabels = parseCustomLabels(customLabelsText);

      createDeployment.mutate({
        repoUrl,
        dockerfilePath,
        exposedPort: Number(exposedPort),
        customLabels,
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Invalid labels");
    }
  }

  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 20,
        marginTop: 24,
      }}
    >
      <h2>Create deployment</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="repoUrl">
            <strong>Git repo URL</strong>
          </label>
          <input
            id="repoUrl"
            type="url"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/user/repo"
            required
            style={{
              display: "block",
              width: "100%",
              padding: 8,
              marginTop: 4,
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="dockerfilePath">
            <strong>Dockerfile path</strong>
          </label>
          <input
            id="dockerfilePath"
            value={dockerfilePath}
            onChange={(event) => setDockerfilePath(event.target.value)}
            placeholder="Dockerfile"
            required
            style={{
              display: "block",
              width: "100%",
              padding: 8,
              marginTop: 4,
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="exposedPort">
            <strong>Exposed port</strong>
          </label>
          <input
            id="exposedPort"
            type="number"
            min="1"
            value={exposedPort}
            onChange={(event) => setExposedPort(event.target.value)}
            placeholder="3000"
            required
            style={{
              display: "block",
              width: "100%",
              padding: 8,
              marginTop: 4,
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="customLabels">
            <strong>Custom Docker labels</strong>{" "}
            <span style={{ color: "#666" }}>(optional, key=value per line)</span>
          </label>
          <textarea
            id="customLabels"
            value={customLabelsText}
            onChange={(event) => setCustomLabelsText(event.target.value)}
            placeholder={"com.example.owner=herless\ntraefik.http.middlewares.compress.compress=true"}
            rows={4}
            style={{
              display: "block",
              width: "100%",
              padding: 8,
              marginTop: 4,
              fontFamily: "monospace",
            }}
          />
        </div>

        {formError && (
          <p style={{ color: "red", marginBottom: 12 }}>Error: {formError}</p>
        )}

        <button
          type="submit"
          disabled={createDeployment.isPending}
          style={{
            padding: "8px 14px",
            cursor: createDeployment.isPending ? "not-allowed" : "pointer",
          }}
        >
          {createDeployment.isPending ? "Creating..." : "Deploy"}
        </button>
      </form>
    </section>
  );
}