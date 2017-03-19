FROM docker pull atesgoral/node-yarn:0.17.2-node-6.9.1

RUN yarn global add wait-for-port nodemon

COPY . /app/

WORKDIR /app

RUN yarn

CMD bin/start.sh
