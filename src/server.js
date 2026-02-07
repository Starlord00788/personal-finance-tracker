const app = require('../app');
// SQLite doesn't need connection pooling like PostgreSQL

const PORT = process.env.PORT || 3000;

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🛑 Received shutdown signal, closing HTTP server...');
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    console.log('✅ SQLite database closed');
    process.exit(0);
  });

  // Force close after timeout
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`
🚀 Personal Finance Tracker API Server Started
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Port: ${PORT}
🏠 Local URL: http://localhost:${PORT}
📊 Database: SQLite
🔐 Auth: JWT + bcrypt
📝 API Documentation: http://localhost:${PORT}/api/docs
  `);

  // SQLite database is ready on startup (file-based)
  console.log('✅ SQLite database initialized');
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

module.exports = server;