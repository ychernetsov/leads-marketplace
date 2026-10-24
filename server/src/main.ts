import cookieParser from 'cookie-parser';
import express from 'express';
import { authRouter } from './routes/auth.routes.js';
import { filesRouter } from './routes/files.routes.js';
import { webhooksRouter } from './routes/webhooks.routes.js';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
app.use('/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRouter);
app.use('/files', filesRouter);

app.get('/', (req, res) => {
    res.send({ 'message': 'Hello API'});
});

app.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
});
