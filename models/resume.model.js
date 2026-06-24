import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    resumeHash: {
      type: String,
      required: true,
      index: true,
    },
    fileUrl: {
      type: String,
      required: false,
    },
    fileId: {
      type: String,
      required: false,
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Compound index to prevent duplicate records for the same user and resume text
resumeSchema.index({ userId: 1, resumeHash: 1 }, { unique: true });

// Check if model already exists to prevent OverwriteModelError in serverless/hot-reload environments
const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);

export default Resume;
