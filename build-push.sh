TAG=20220528-0142

REPO=docker-paas-build-app


docker build -t pudding/$REPO:$TAG .

docker push pudding/$REPO:$TAG