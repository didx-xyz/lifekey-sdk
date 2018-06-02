FROM node:carbon

RUN apt-get update -y && apt-get upgrade -y

ADD . /deps/lifekey-sdk

WORKDIR /deps/lifekey-sdk

RUN npm install
