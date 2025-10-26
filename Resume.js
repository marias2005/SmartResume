// models/Resume.js
import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
  userId: { type: String, default: null },
  name: String,
  role: String,
  sections: Object, // e.g. { summary: '', experience: [...], skills: [...] }
  layout: { type: String, default: 'simple' },
  metadata: Object
}, { timestamps: true });

export default mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);
