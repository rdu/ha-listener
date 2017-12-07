FROM node:9.2

WORKDIR /home
RUN apt update && apt -y install libmagic-dev libatlas-base-dev
RUN npm install node-pre-gyp -g
RUN npm install typescript -g
COPY . /home/ 
RUN npm install
RUN npm run build

EXPOSE 4242

ENTRYPOINT /bin/bash
