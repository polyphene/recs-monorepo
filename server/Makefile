prisma-studio: ## Run prisma studio from docker container
	docker compose exec graphql-yoga-server npx prisma studio

prisma-generate: ## Run prisma generate in docker container
	docker compose exec graphql-yoga-server npx prisma generate

prisma-migrate-dev: ##  Migrate last db changes
	docker compose exec graphql-yoga-server npx prisma migrate dev --name "${NAME}"

prisma-status: ## Check migration status in container
	docker compose exec graphql-yoga-server npx prisma migrate status

prisma-reset: ## Reset the migration in the container
	docker compose exec graphql-yoga-server npx prisma migrate reset
