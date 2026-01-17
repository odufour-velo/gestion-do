
IMAGE=clasp-docker
SCRIPTID=1Pna-r9uyruBlI_1kB9YETYrXDPi531IoURTrKfVyfoCgYZ4FbDgdSQ9I

build:
	docker build -t $(IMAGE) .

build-test:
	docker build --target test -t $(IMAGE)-tester .

test:
	docker run --rm $(IMAGE)-tester

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
