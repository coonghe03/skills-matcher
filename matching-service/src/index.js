require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, service: 'matching-service', ts: new Date().toISOString() }));
app.use('/', routes);

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));
app.use((err, req, res, next) => {
  console.error('Matching error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5100;
app.listen(PORT, () => console.log(`Matching service on http://localhost:${PORT}`));
