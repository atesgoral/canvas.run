# CanvasRun

## Dev

Make a copy of .env.example as .env and edit it accordingly.

Bring up a local MongoDB instance. With Docker:

```
docker run -p 27017:27017 mongo
```

To bring up the Node.js server:

```
npm install
npm start
```

Or:

```
npm install -g nodemon
nodemon index
```

To bring up the Webpack development server:

```
cd client
npm install
npm run dev
```

The Webpack development server will proxy API requests to the Node.js server.

To build the client:

```
cd client
npm install
npm build
```

The build artifacts will be placed under the dist directory which is served by the Node.js server.
