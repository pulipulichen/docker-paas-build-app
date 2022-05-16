TAG=20220516-2113

REPO=docker-paas-build-app

docker build -t pudding/$REPO:$TAG .
docker push pudding/$REPO:$TAG