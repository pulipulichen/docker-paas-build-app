TAG=20220610-1506

REPO=docker-paas-build-app


docker build -t pudding/$REPO:$TAG .

docker push pudding/$REPO:$TAG