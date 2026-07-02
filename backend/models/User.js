const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  location: {
    lat: { type: Number },
    lon: { type: Number },
    district: { type: String },
    state: { type: String }
  },
  landSize: {
    type: Number, // in acres
    default: 0
  },
  landQuality: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  soilType: {
    type: String,
    enum: ['Sandy', 'Loamy', 'Clay', 'Sandy Loam', 'Clay Loam', 'Silt Loam'],
    default: 'Loamy'
  },
  favoriteCrops: [{
    type: String
  }],
  preferredLanguage: {
    type: String,
    enum: ['en', 'hi', 'ta'],
    default: 'en'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

