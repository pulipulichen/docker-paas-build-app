TAG=20220616-2122

REPO=docker-paas-build-app

docker build -t pudding/$REPO:$TAG .

docker push pudding/$REPO:$TAG
docker rmi pudding/$REPO:$TAG