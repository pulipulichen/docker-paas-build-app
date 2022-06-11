TAG=20220611-2339

REPO=docker-paas-build-app


docker build -t pudding/$REPO:$TAG .

docker push pudding/$REPO:$TAG
docker rmi pudding/$REPO:$TAG