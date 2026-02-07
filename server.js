const app = require('./app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Test database connection before starting server
async function startServer() {
  try {
    console.log('Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful');
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Personal Finance Tracker API Server`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log(`💻 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`\n⏰ Started at: ${new Date().toLocaleString()}`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🔧 Development Features:');
        console.log('  • Hot reload enabled');
        console.log('  • Detailed error messages');
        console.log('  • CORS: Allow all origins');
        console.log('  • Rate limiting: 1000 req/15min');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:');
    console.error(error.message);
    
    if (error.message.includes('database')) {
      console.error('\n🔍 Database connection troubleshooting:');
      console.error('  1. Check if PostgreSQL is running');
      console.error('  2. Verify database credentials in .env file');
      console.error('  3. Ensure database exists');
      console.error('  4. Run migrations: npm run migrate');
    }
    
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();