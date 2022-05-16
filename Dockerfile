FROM node:16.15.0-buster

RUN apt-get update
RUN apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    git \
    lsb-release

RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
RUN echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

RUN apt-get update
RUN apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# ---------------------

RUN mkdir /app
#COPY package.json /app/

WORKDIR /app
RUN git clone https://github.com/pulipulichen/docker-paas-build-app.git

WORKDIR /app/docker-paas-build-app

COPY package.json /app/docker-paas-build-app/
COPY entrypoint.sh /app/docker-paas-build-app/

RUN npm i

#RUN mkdir -p /app/scripts
#WORKDIR /app/scripts
COPY scripts /app/docker-paas-build-app/scripts/
COPY build-dockerfile.js /app/docker-paas-build-app/

WORKDIR /app/docker-paas-build-app/scripts/
#ENTRYPOINT [ "sh", "/app/docker-paas-build-app/entrypoint.sh" ]

