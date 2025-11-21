import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  externalId: {
    type: String,
    default: null,
    index: true,
  },
  googleId: {
    type: String,
    default: null,
    index: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    default: null,
    index: true,
  },
  password: {
    type: String,
    default: null,
  },
  picture: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    required: true,
    enum: ['student', 'employer'],
  },
  companyId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for faster queries
userSchema.index({ name: 1, role: 1 });
// `email` and `googleId` already have `index: true` set on their field
// definitions above. Removing duplicate schema-level indexes to avoid
// Mongoose duplicate index warnings.

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

