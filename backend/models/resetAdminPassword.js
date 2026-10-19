
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('Admin email not found in database');
    }

    if (user.role !== 'admin') {
      throw new Error('This account is not an admin');
    }

    const password = await new Promise(resolve => {
      rl.question('Enter a NEW admin password (minimum 12 characters): ', resolve);
    });

    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    console.log('Admin password reset successfully.');
  } catch (err) {
    console.error('Password reset failed:', err.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  }
}

resetPassword();
