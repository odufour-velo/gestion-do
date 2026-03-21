
IMAGE=clasp-docker
SCRIPTID=1Pna-r9uyruBlI_1kB9YETYrXDPi531IoURTrKfVyfoCgYZ4FbDgdSQ9I

TEST_DEPLOYMENT_ID=AKfycbwDcFNWfIRDqyVyTV3_FNeWxRECAvGY81XL1bivDaWZrQxjsGV_ojbbaAVLuwBVbwbEhw

build:
	docker build -t $(IMAGE) .

build-dev:
	docker build --target dev -t $(IMAGE)-dev .
	docker build --target test -t $(IMAGE)-tester .

# NOTE: If clasp-creds does not exist, create it with:
# docker volume create clasp-creds
1st-login:
	docker run -it -p 9090:9090 -v $(PWD):/app -v clasp-creds:/root $(IMAGE) login --redirect-port 9090

login:
	docker run --rm -v $(PWD)/app:/app -v clasp-creds:/root $(IMAGE) list

clone:
	docker run --rm -v $(PWD)/app:/app -v clasp-creds:/root $(IMAGE) clone $(SCRIPTID)

push:
	docker run --rm -v $(PWD)/app:/app -v clasp-creds:/root $(IMAGE) push

pull:
	docker run --rm -v $(PWD)/app:/app -v clasp-creds:/root $(IMAGE) pull

deploy-test: push
	docker run --rm -v $(PWD)/app:/app -v clasp-creds:/root $(IMAGE) deploy --deploymentId $(TEST_DEPLOYMENT_ID) --description 'Auto-deploy'

# ========== LOCAL TESTING ==========

server-dev: build-dev
	docker run -it -p 3000:3000 -v $(PWD):/app $(IMAGE)-dev

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

