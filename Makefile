
IMAGE=clasp-docker
TEST_DEPLOYMENT_ID=AKfycbzOOO_1xdjW9pSXl70lao5Cy7_KBbPfTg0uw-XyrbdWKcSgpxagqJTBWtsiFwNpuWER

build:
	docker build -t $(IMAGE) .

build-dev:
	docker build --target dev -t $(IMAGE)-dev .
	docker build --target test -t $(IMAGE)-tester .

deploy-test-as-ci:
	docker build -t gas-deploy-local -f .docker/test/Dockerfile .
	docker run --rm --env-file .docker/test/.env gas-deploy-local

# NOTE: If clasp-creds does not exist, create it with:
# docker volume create clasp-creds
update-credentials:
	docker run -it -p 9090:9090 -v $(PWD):/app -v ${PWD}/creds:/root $(IMAGE) login --redirect-port 9090

push:
	docker run --rm -v $(PWD)/app:/app -v ${PWD}/creds:/root $(IMAGE) push

pull:
	docker run --rm -v $(PWD)/app:/app -v ${PWD}/creds:/root $(IMAGE) pull

deploy-test: push
	docker run --rm -v $(PWD)/app:/app -v ${PWD}/creds:/root $(IMAGE) deploy --deploymentId $(TEST_DEPLOYMENT_ID) --description 'Auto-deploy'

# ========== LOCAL TESTING ==========

server-dev: build-dev
	docker run -it -d --name do-server -p 3000:3000 -v $(PWD):/app $(IMAGE)-dev

test-unit:
	docker run --rm $(IMAGE)-tester npm test

test-unit-coverage:
	docker run --rm $(IMAGE)-tester npm run test:coverage

server:
	docker run -it -p 3000:3000 -v $(PWD):/app $(IMAGE) npm run server

# ========== SHORTCUTS ==========

help:
	@echo "Available commands:"
	@echo "  make build              - Build Docker image"
	@echo "  make test-unit          - Run Jest unit tests locally (inside Docker)"
	@echo "  make test-unit-coverage - Run Jest with coverage report (inside Docker)"
	@echo "  make server             - Start Express dev server at http://localhost:3000"
	@echo "  make push               - Push code to Google Apps Script"
	@echo "  make pull               - Pull code from Google Apps Script"
	@echo "  make deploy-test        - Deploy to test deployment"
	@echo "  make server      		 - Run Express server (inside Docker)"

