const mongoose = require('mongoose');

const onboardingTokenSchema = new mongoose.Schema({
  onboardingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Onboarding', required: true },
  candidateEmail: { type: String, required: true },
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date },
}, { timestamps: true });

onboardingTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OnboardingToken', onboardingTokenSchema);
