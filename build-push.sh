TAG=20220617-0119

REPO=docker-paas-build-app

docker build -t pudding/$REPO:$TAG .

docker push pudding/$REPO:$TAG
docker rmi pudding/$REPO:$TAG