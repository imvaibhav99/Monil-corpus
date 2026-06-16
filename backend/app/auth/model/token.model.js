import mongoose from 'mongoose';
import { toJSON } from '../../../helpers/plugins/toJSON.plugin.js';
import { tokenTypes } from '../../../config/tokens.js';

// Single collection for refresh / reset-password / verify-email tokens.
const tokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, index: true },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [tokenTypes.REFRESH, tokenTypes.RESET_PASSWORD, tokenTypes.VERIFY_EMAIL],
      required: true,
    },
    expires: { type: Date, required: true },
    blacklisted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

tokenSchema.plugin(toJSON);

export const Token = mongoose.model('Token', tokenSchema);
