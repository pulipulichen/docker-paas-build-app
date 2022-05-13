# =================================
# WEBSSH

if [ \( ${APP_USERNAME} \) -o \( ${AUTH_PASSWORD} \) ]; then
  echo "$APP_USERNAME:$AUTH_PASSWORD" | chpasswd
  echo "[WEBSSH] Username and password updated."
fi

# =================================
# Data Reset

if [ ${RESET_DATA} ]; then
  rm -rf ${DATA_PATH}/*  
fi

if [ -d /paas-data/app ]; then
  if [ "$(ls -A $DATA_PATH)" ]; then
    echo "$DATA_PATH is not empty."
  else
    cp -rf /paas-data/app -d $DATA_PATH
  fi
fi

# =================================
# Git Reset

if [ ${GIT_MODE} ]; then
  CURRENT_DIR=`pwd`

  cd /paas_app/app/
  git reset --hard
  git pull

  cd $CURRENT_DIR
fi

# =================================
# Original Command: