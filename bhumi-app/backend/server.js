require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const proposalRoutes = require('./routes/proposals');
const parcelRoutes = require('./routes/parcels');
const compensationRoutes = require('./routes/compensation');
const possessionRoutes = require('./routes/possession');
const rehabilitationRoutes = require('./routes/rehabilitation');
const documentRoutes = require('./routes/documents');
const satelliteRoutes = require('./routes/satellite');
const chatbotRoutes = require('./routes/chatbot');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'bhumi-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api', proposalRoutes);            // /api/projects, /api/proposals
app.use('/api/parcels', parcelRoutes);
app.use('/api/compensation', compensationRoutes);
app.use('/api/possession', possessionRoutes);
app.use('/api/rehabilitation', rehabilitationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/satellite', satelliteRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Bhumi backend running on http://localhost:${PORT}`);
});
