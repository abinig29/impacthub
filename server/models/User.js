const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SUPER_ADMIN_EMAIL = 'fnigus33@gmail.com';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['super_admin', 'admin', 'volunteer', 'guest'], default: 'volunteer' },
  isApproved: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  qrCode: { type: String, default: '' },
  // Time tracking (precise)
  totalMinutes: { type: Number, default: 0 },
  totalHours: { type: Number, default: 0 }, // kept for compat
  weeklyMinutes: { type: Number, default: 0 },
  monthlyMinutes: { type: Number, default: 0 },
  // Stats
  projectsJoined: { type: Number, default: 0 },
  collaborationScore: { type: Number, default: 0 },
  sessionsAttended: { type: Number, default: 0 },
  missionsCompleted: { type: Number, default: 0 },
  impactScore: { type: Number, default: 0 },
  peopleHelped: { type: Number, default: 0 },
  // Reputation
  reliabilityScore: { type: Number, default: 100 },
  attendanceRate: { type: Number, default: 100 },
  missionCompletionRate: { type: Number, default: 100 },
  // Streak
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  // Gamification
  level: { type: String, enum: ['Beginner', 'Helper', 'Leader', 'Hero'], default: 'Beginner' },
  badges: [{ type: String }],
  xp: { type: Number, default: 0 },
  // Profile
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  location: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  language: { type: String, default: 'en' },
  // Activity chart data (last 7 days)
  weeklyActivityData: [{ date: String, minutes: Number }],
  // Missions the user joined
  joinedMissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mission' }],
  // Notifications
  unreadNotifications: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  // Auto-set super_admin for the owner email
  if (this.email === SUPER_ADMIN_EMAIL && this.role !== 'super_admin') {
    this.role = 'super_admin';
    this.isApproved = true;
  }
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (p) { return bcrypt.compare(p, this.password); };

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.methods.recalculate = function () {
  const h = this.totalHours || (this.totalMinutes / 60) || 0;
  const p = this.projectsJoined || 0;
  const c = this.collaborationScore || 0;
  const s = this.currentStreak || 0;
  this.totalHours = parseFloat((this.totalMinutes / 60).toFixed(2));
  this.impactScore = Math.round(h * 10 + p * 15 + c * 2 + s * 5);
  this.xp = this.impactScore;
  if (this.impactScore >= 500) this.level = 'Hero';
  else if (this.impactScore >= 200) this.level = 'Leader';
  else if (this.impactScore >= 50) this.level = 'Helper';
  else this.level = 'Beginner';
  const badges = new Set(this.badges || []);
  if (h >= 10) badges.add('🔥 10 Hours');
  if (h >= 50) badges.add('⭐ 50 Hours');
  if (h >= 100) badges.add('💎 100 Hours');
  if (c >= 50) badges.add('💙 Communicator');
  if (p >= 5) badges.add('🌍 Impact Maker');
  if (s >= 7) badges.add('🔄 Week Streak');
  if (s >= 30) badges.add('🏆 Month Streak');
  if (this.reliabilityScore >= 95) badges.add('✅ Reliable');
  this.badges = Array.from(badges);
  this.peopleHelped = Math.round(h * 3);
};

userSchema.statics.SUPER_ADMIN_EMAIL = SUPER_ADMIN_EMAIL;

module.exports = mongoose.model('User', userSchema);
