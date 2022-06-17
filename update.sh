CURRENT_DIR=`pwd`
cd /app/docker-paas-build-app/
rm -rf *.sh *.js scripts
git reset --hard > /dev/null 2>&1
git pull > /dev/null 2>&1
cd $CURRENT_DIR 