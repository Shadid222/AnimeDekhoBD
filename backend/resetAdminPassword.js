
require('dotenv').config();

const bcrypt = require('bcryptjs');
const readline = require('readline');
const db = require('./db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function resetPassword() {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!email) {
      throw new Error('ADMIN_EMAIL is missing from .env');
    }

    const result = await db.query(
      `SELECT id, username, email, role
       FROM public.users
       WHERE lower(trim(email)) = $1
       LIMIT 1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      throw new Error('Admin account not found');
    }

    if (user.role !== 'admin') {
      throw new Error('This account is not an admin');
    }
rl.question('Enter a NEW password (minimum 4 characters): ', async password => {
      try {
       if (password.length < 4) {
  throw new Error('Password must be at least 4 characters');
}

        const hash = await bcrypt.hash(password, 10);

        await db.query(
          'UPDATE public.users SET password = $1 WHERE id = $2',
          [hash, user.id]
        );

        console.log('Admin password updated successfully.');
      } catch (err) {
        console.error('Password reset failed:', err.message);
        process.exitCode = 1;
      } finally {
        rl.close();
        await db.pool.end();
      }
    });
  } catch (err) {
    console.error('Password reset failed:', err.message);
    rl.close();
    await db.pool.end().catch(() => {});
    process.exitCode = 1;
  }
}

resetPassword();
