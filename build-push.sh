TAG=20220609-2337

REPO=docker-paas-build-app


docker build -t pudding/$REPO:$TAG .

docker push pudding/$REPO:$TAG