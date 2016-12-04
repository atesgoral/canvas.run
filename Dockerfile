FROM node

RUN npm install -g wait-for-port nodemon

COPY . /api/

WORKDIR /api

RUN npm install

CMD bin/start.sh
