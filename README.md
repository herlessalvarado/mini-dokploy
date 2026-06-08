# Mini-Dokploy

Mini-Dokploy is a small local deployment platform. It takes a Git repository, builds it using the provided Dockerfile, runs it as a Docker Swarm service, and exposes it through Traefik using a generated local domain.

The goal was to keep the project small, clear, and focused on the main deployment flow instead of trying to build a full production platform.

## Setup

### Requirements

Before running the project, make sure you have:

- Docker Desktop running
- Node.js 22
- pnpm
- Make

### Install dependencies

```bash
pnpm install
```

### Prepare the database

```bash
pnpm db:generate
pnpm db:migrate
```

### Start the full stack

```bash
make up
```

This starts everything needed locally:

- Docker Swarm, if it is not already active
- The shared Docker overlay network
- Traefik
- Mini-Dokploy itself

After the stack is running, open:

```txt
Mini-Dokploy UI:    http://localhost:3000
Traefik dashboard: http://localhost:8080/dashboard/
```

## Architecture

The app has four main pieces:

```txt
Browser UI
  ↓
Next.js / tRPC API
  ↓
Deployment service
  ↓
Docker Swarm + Traefik
```

The UI is intentionally simple. It lets the user create a deployment by entering:

- Git repository URL
- Dockerfile path
- Exposed port
- Optional custom Docker labels

The backend is built with Next.js Pages Router and tRPC. It validates the input, creates a deployment record in SQLite, and starts the deployment process.

SQLite stores the deployment state. For each deployment, it keeps the repo URL, Dockerfile path, exposed port, generated domain, Docker service name, image tag, status, and error message if something fails.

The deployment service is responsible for the actual work:

1. Clone the Git repository into a temporary folder
2. Build a Docker image from the provided Dockerfile
3. Create a Docker Swarm service from that image
4. Attach Traefik labels to the service
5. Update the deployment status in SQLite

Traefik is used as the reverse proxy. All deployed apps are accessed through Traefik on port `80`.

The deployed app is not served by Next.js directly. Next.js only manages the deployment lifecycle. The deployed app itself is served by Docker Swarm and Traefik.

The full deployment flow is:

```txt
User clicks Deploy
  ↓
tRPC validates the input
  ↓
SQLite row is created with status = building
  ↓
Repo is cloned
  ↓
Docker image is built
  ↓
Docker Swarm service is created
  ↓
Traefik labels are attached
  ↓
Traefik discovers the service
  ↓
Generated domain routes to the app
  ↓
SQLite status is updated to running
```

The UI supports:

- Listing deployments
- Creating deployments
- Redeploying deployments
- Removing deployments

## Tradeoffs and what I would build next

I kept the implementation focused on the core deployment flow. There are several things I would improve if this were going further.

### Deployment jobs run in-process

Right now, the deployment job is triggered from the tRPC mutation and runs in the same app process.

For this assignment, I think that is acceptable because the app is local and small. It also keeps the flow easier to understand.

In a production version, I would move this to a proper background worker with a queue. That would make deployments more reliable and easier to retry.

### SQLite is simple and good enough for local use

For a real multi-user product, I would probably use Postgres. That would be better for teams, audit logs, deployment history, and more complex queries.

### Deployment status is basic

A deployment is marked as `running` after the Docker service is created successfully.

That does not fully guarantee the app is healthy. In a more complete version, I would add health checks and only mark the deployment as ready after the app responds correctly.

### Logs are not streamed to the UI

The current version stores basic status and error messages, but it does not stream build or deploy logs to the browser.

This would be one of the first things I would add next. When a deployment fails, live logs would make the product much easier to use.

### What I would build next

If I had more time, I would add:

1. Live build and deployment logs in the UI
2. A real background job queue
3. Health checks before marking deployments as running
4. Deployment history for every redeploy
5. Better error messages and deployment details
6. Better UI states, filters, and confirmations
7. HTTPS support

## How I used AI tools, and where I did not

I used AI tools during the project, but mainly as a pair-programming and debugging assistant.

I used AI to help with:

- Planning the architecture
- Breaking the work into smaller steps
- Thinking through Docker Swarm and Traefik routing
- Debugging local issues with pnpm, Drizzle, Docker, and Traefik

I did not use AI as a replacement for testing or understanding the system.

For example, one issue I hit was that deployments were created and marked as running, but the generated domain returned `404`. AI helped me reason through possible causes, but the actual fix came from checking the Traefik logs and confirming that Traefik was not discovering Docker Swarm services correctly. After that, I updated the Traefik Swarm provider configuration and tested the route again.

Where I did not rely on AI blindly:

- I tested the full deployment flow locally
- I checked Docker services manually
- I inspected Traefik behavior through logs and the dashboard
- I verified that deployed apps were actually reachable through the generated `sslip.io` domains
- I made the final tradeoffs based on what was realistic for the time limit

So overall, AI helped me move faster and debug more efficiently, but the final implementation was validated by running the system end to end.
