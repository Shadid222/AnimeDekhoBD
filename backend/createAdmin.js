
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();

    const user = await User.findOne({ email }).select(
      'username email role'
    );

    if (!user) {
      console.log('এই email দিয়ে কোনো user পাওয়া যায়নি।');
    } else {
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();
