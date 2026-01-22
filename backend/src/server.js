const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Routes
const tankRoutes = require('./routes/tanks');
const sensorRoutes = require('./routes/sensors');
const alertRoutes = require('./routes/alerts');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);
app.use('/api/tanks', tankRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  socket.on('subscribe_tank', (tankId) => {
    socket.join(`tank_${tankId}`);
    console.log(`Client ${socket.id} subscribed to tank ${tankId}`);
  });
  
  socket.on('unsubscribe_tank', (tankId) => {
    socket.leave(`tank_${tankId}`);
    console.log(`Client ${socket.id} unsubscribed from tank ${tankId}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };
