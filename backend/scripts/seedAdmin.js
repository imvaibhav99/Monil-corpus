import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../app/user/model/user.model.js';

async function run() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Super Admin';

  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.');
    process.exit(1);
  }

  await connectDB();

  let user = await User.findOne({ email });
  if (user) {
    user.role = 'SUPER_ADMIN';
    user.password = password; // pre-save hook re-hashes
    user.isEmailVerified = true;
    await user.save();
    // eslint-disable-next-line no-console
    console.log(`Updated existing user as SUPER_ADMIN: ${email}`);
  } else {
    user = await User.create({
      name,
      email,
      password,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
    });
    // eslint-disable-next-line no-console
    console.log(`Created SUPER_ADMIN: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
