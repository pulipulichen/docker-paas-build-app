REPO=$CI_PROJECT_NAME-$CI_PROJECT_NAMESPACE-database-$BUILD_DATABASE_MODULE
echo "REPO: $REPO"
TAG=$CI_COMMIT_SHORT_SHA
echo "TAG: $TAG"

mkdir -p ~/.docker
cp ./webapp-build/token/quay-token.json ~/.docker/config.json

if [ -f Dockerfile ]; then
  docker build -t $QUAY_PREFIX/$REPO:$TAG .
  docker push $QUAY_PREFIX/$REPO:$TAG
  
  echo $1
  if [ "$1" = "true" ] ; then
    mkdir ci.tmp/
    echo $TAG > ci.tmp/TAG_DATABASE_${BUILD_DATABASE_MODULE^^}.txt
  fi
fi
