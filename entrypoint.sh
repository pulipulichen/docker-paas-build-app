CURRENT_DIR=`pwd`
cd /app/docker-paas-build-app/
rm -rf *
git reset --hard
git pull
cd $CURRENT_DIR
ls