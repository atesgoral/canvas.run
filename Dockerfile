FROM atesgoral/node-yarn:0.17.2-node-6.9.1

COPY . /app/

WORKDIR /app

RUN yarn add nodemon
RUN yarn

CMD node_modules/.bin/nodemon index
