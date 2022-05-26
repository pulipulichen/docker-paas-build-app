if [ ${ENABLE_PULL_UPDATE} ]; then
  #echo "START GIT PULL"
  sh /app/docker-paas-build-app/update.sh
fi

#ls /app/docker-paas-build-app/
node /app/docker-paas-build-app/app-commit-restart.js