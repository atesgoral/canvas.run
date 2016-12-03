FROM node

RUN npm install -g wait-for-port nodemon

COPY . /app/

WORKDIR /app

RUN npm install

WORKDIR /app/client

RUN npm install

WORKDIR /app

CMD [ "bin/start.sh" ]
