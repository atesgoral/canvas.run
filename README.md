# CanvasRun

## Dev

Bring up a local MongoDB instance. With Docker:

```
docker run -p 27017:27017 mongo
```

To bring up the Node.js server:

```
yarn
node index
```

Or:

```
yarn global add nodemon
nodemon index
```

To bring up the Webpack development server:

```
cd client
yarn
yarn run dev
```

The Webpack development server will proxy API requests to the Node.js server.

To build the client:

```
cd client
yarn
yarn run build
```

The build artifacts will be placed under the dist directory which is served by the Node.js server.
