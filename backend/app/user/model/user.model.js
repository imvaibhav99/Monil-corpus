import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import { toJSON } from '../../../helpers/plugins/toJSON.plugin.js';
import { paginate } from '../../../helpers/plugins/paginate.plugin.js';
import { roles } from '../../../config/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) throw new Error('Invalid email');
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // hidden by the toJSON plugin
    },
    role: {
      type: String,
      enum: roles,
      default: 'CLIENT',
    },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.statics.isEmailTaken = async function isEmailTaken(email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.methods.isPasswordMatch = async function isPasswordMatch(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.pre('save', async function preSave(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

export const User = mongoose.model('User', userSchema);
