PUBLIC_NETWORK=dokploy-public
STACK_NAME=mini-dokploy

up:
	docker swarm init || true
	docker network create --driver overlay --attachable $(PUBLIC_NETWORK) || true
	docker build -t mini-dokploy:local .
	docker stack deploy -c docker-compose.yml $(STACK_NAME)
	@echo ""
	@echo "Mini-Dokploy:     http://localhost:3000"
	@echo "Traefik dashboard: http://localhost:8080"
	@echo ""

down:
	docker stack rm $(STACK_NAME) || true

services:
	docker service ls

logs:
	docker service logs -f $(STACK_NAME)_mini-dokploy

traefik-logs:
	docker service logs -f $(STACK_NAME)_traefik