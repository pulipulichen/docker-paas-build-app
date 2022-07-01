
# =================================
# WEBSSH

if [ \( ${DOCKERFILE_USER} \) -o \( ${AUTH_PASSWORD} \) ]; then
  echo "$DOCKERFILE_USER:$AUTH_PASSWORD" | chpasswd
  echo "[WEBSSH] Username and password updated."
fi

/etc/init.d/ssh start

if [ "${ENABLE_EMAIL}" = "true" ]; then
  /etc/init.d/postfix start
  /etc/init.d/sendmail start
fi

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
    cp -aprf /paas_data/app/.[^.]* $DATA_PATH
    echo "Data is restored."
  fi
else
  echo "Data folder is not existing. /paas_data/app/"
fi

if [ \( ${DATABASE_SQLITE_HOST} \) ]; then
  chmod 777 "$DATABASE_SQLITE_HOST"

  if [ ! -f "${DATABASE_SQLITE_HOST}/.gitignore" ]; then
    echo "*\n!.gitignore" >> "${DATABASE_SQLITE_HOST}/.gitignore"
  fi
fi

if [ \( ${DATA_PATH} \) ]; then
  chmod 777 "$DATA_PATH"

  if [ ! -f "${DATA_PATH}/.gitignore" ]; then
    echo "*\n!.gitignore" >> "${DATA_PATH}/.gitignore"
  fi
fi
