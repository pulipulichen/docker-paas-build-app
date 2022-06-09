
# =================================
# WEBSSH

if [ \( ${DOCKERFILE_USER} \) -o \( ${AUTH_PASSWORD} \) ]; then
  echo "$DOCKERFILE_USER:$AUTH_PASSWORD" | chpasswd
  echo "[WEBSSH] Username and password updated."
fi

/etc/init.d/ssh start

# =================================
# Data Reset

if [ ${RESET_DATA} ]; then
  rm -rf ${DATA_PATH}/*  
  echo "Data is reseted."
fi

if [ -d "/paas_data/app/" ]; then
  if [ "$(ls $DATA_PATH)" ]; then
    echo "$DATA_PATH is not empty."
  else
    cp -arf /paas_data/app/* $DATA_PATH
    echo "Data is restored."
  fi
else
  echo "Data folder is not existing. /paas_data/app/"
fi
