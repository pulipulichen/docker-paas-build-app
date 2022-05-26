TAG=20220526-1211

REPO=docker-paas-build-app

docker build -t pudding/$REPO:$TAG .
docker push pudding/$REPO:$TAG