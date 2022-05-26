if [ $ENABLE_PULL_UPDATE == "true" ]; then
  sh /app/docker-paas-build-app/update.sh
fi

node /app/docker-paas-build-app/app-commit-restart.js