
require('dotenv').config();

const mongoose = require('mongoose');
const readline = require('readline');
const User = require('./models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!email) {
      throw new Error('ADMIN_EMAIL is missing from .env');
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Database connected:', mongoose.connection.name);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error(
        'This email already exists. No account was changed.'
      );
    }

    const username = (
      await ask('Enter admin username: ')
    ).trim();

    const password = await ask(
      'Enter a NEW password (minimum 12 characters): '
    );

    if (!username) {
      throw new Error('Username cannot be empty');
    }

    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }

    const admin = new User({
      username,
      email,
      password,
      role: 'admin'
    });

    await admin.save();

    console.log('\nAdmin account created successfully!');
    console.log('Username:', admin.username);
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
  } catch (err) {
    console.error('\nAdmin creation failed:', err.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();
