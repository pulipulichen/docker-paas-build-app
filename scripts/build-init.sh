if [ ${RESET_DATA} ]; then
  rm -rf ${DATA_PATH}/*  
fi

if [ -d /data/database ]; then
  if [ "$(ls -A $DATA_PATH)" ]; then
    echo "$DATA_PATH is not empty."
  else
    cp -rf /data/database -d $DATA_PATH
  fi
fi
# Original Command: