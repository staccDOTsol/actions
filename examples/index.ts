import { serve } from '@hono/node-server';
import donate from './donate/route';
import jupiterSwap from './jupiter-swap/route';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { serveStatic } from 'hono/serve-static';
import mustacheExpress from 'mustache-express';
import express from 'express';

const app = new OpenAPIHono();
const expressApp = express();

expressApp.engine('mustache', mustacheExpress());
expressApp.set('view engine', 'mustache');
expressApp.set('views', __dirname + '/views');

app.use('/*', cors());

// Serve static files from the 'public' directory
app.use('/public/*', serveStatic({
  root: './public',
  getContent: async (path, c) => {
    const fs = require('fs').promises;
    try {
      const data = await fs.readFile(path);
      return new Response(data);
    } catch (error) {
      return null;
    }
  }
}));

// <--Actions-->
app.route('/', jupiterSwap);
// </--Actions-->

app.doc('/doc', {
  info: {
    title: 'An API',
    version: 'v1',
  },
  openapi: '3.1.0',
});

app.get(
  '/swagger-ui',
  swaggerUI({
    url: '/doc',
  }),
);

expressApp.get('/', (req: any, res: any) => {
  res.render('index', {
    title: 'My Canvas',
    description: 'A description of my canvas application.',
    imageUrl: 'https://my-canvas.com/preview-image.png',
    url: 'https://my-canvas.com'
  });
});

const port = Number(process.env.PORT) || 3000;
console.log(
  `Server is running on port ${port}
Visit http://localhost:${port}/swagger-ui to explore existing actions
Visit https://actions.dialect.to to unfurl action into a Blink
`,
);

serve({
  fetch: app.fetch,
  port,
});