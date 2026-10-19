
require('dotenv').config();

const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('MONGODB_URI missing from .env');
    return;
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000
  });

  try {
    await client.connect();
    await client.db().command({ ping: 1 });
    console.log('SUCCESS: MongoDB Atlas connected!');
  } catch (err) {
    console.log('Error name:', err.name);
    console.log('Error message:', err.message);

    if (err.reason?.servers) {
      for (const [address, server] of err.reason.servers) {
        console.log('Server:', address);
        console.log(
          'Server error:',
          server.error?.message || 'No additional detail'
        );
      }
    }
  } finally {
    await client.close().catch(() => {});
  }
}

testConnection();
