FROM node

RUN npm install -g yarn
RUN yarn global add wait-for-port nodemon

COPY . /canvas.run/

WORKDIR /canvas.run
RUN yarn

CMD [ 'bin/start.sh' ]
