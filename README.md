# CanvasRun

## Dev

To bring up the Node.js server:

```
vagrant up
vagrant ssh
cd /vagrant
npm install
npm start
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
npm run build
```

The build artifacts will be placed under the dist directory which is served by the Node.js server.
