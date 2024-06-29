import { serve } from '@hono/node-server';
import donate from './donate/route';
import jupiterSwap from './jupiter-swap/route';
import heliusStake from './helius/stake/route';
import sanctumTrade from './sanctum/trade/route';
import tensorBuyFloor from './tensor/buy-floor/route';
import meteoraSwap from './meteora/swap/route';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { serveStatic } from 'hono/serve-static';

const app = new OpenAPIHono();
app.use('/*', cors());

// Serve static files from the 'public' directory
app.use('/public/*', serveStatic({
  root: './public',
  getContent: async (path, c) => {
    // Implement your logic to fetch the content
    // For example, you can use fs.promises.readFile to read the file
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
app.route('/api/donate', donate);
app.route('/api/jupiter/swap', jupiterSwap);
app.route('/api/helius/stake', heliusStake);
app.route('/api/sanctum/trade', sanctumTrade);
app.route('/api/tensor/buy-floor', tensorBuyFloor);
app.route('/', meteoraSwap);
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

const port =  Number(process.env.PORT) || 3000;
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