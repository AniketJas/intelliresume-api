import crypto from 'crypto';
import { extractPdfText } from '../services/pdf.service.js';
import { extractDocxText } from '../services/docx.service.js';
import { analyzeResume as getGeminiAnalysis } from '../services/gemini.service.js';
import { uploadToCloudinary } from '../services/cloudinary.service.js';
import Resume from '../models/resume.model.js';

export const analyzeResume = async (req, res) => {
  try {
    console.log("[analyzeResume] Entry:", {
      userId: req.user?.id,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype
    });
    const file = req.file;

    if (!file) {
      console.warn("[analyzeResume] Exit: No file uploaded");
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a PDF or DOCX file.',
      });
    }

    const userId = req.user.id;
    const fileName = file.originalname;

    const fileExt = fileName.toLowerCase().split('.').pop();
    const allowedExtensions = ['pdf', 'docx'];

    if (!allowedExtensions.includes(fileExt)) {
      console.warn("[analyzeResume] Exit: Unsupported file format", { fileName, fileExt });
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format. Only PDF and DOCX files are allowed.',
      });
    }

    if (file.size > 10 * 1024 * 1024) {
      console.warn("[analyzeResume] Exit: File size exceeds limit", { size: file.size });
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the 10MB limit.',
      });
    }

    const fileBuffer = file.buffer;

    let extractedText = '';
    if (fileExt === 'pdf') {
      extractedText = await extractPdfText(fileBuffer);
    } else if (fileExt === 'docx') {
      extractedText = await extractDocxText(fileBuffer);
    }

    if (!extractedText || !extractedText.trim()) {
      console.warn("[analyzeResume] Exit: Failed to extract text from file", { fileName });
      return res.status(400).json({
        success: false,
        message: 'Failed to extract text from the uploaded file.',
      });
    }

    // Generate SHA-256 hash of the extracted resume text
    const resumeHash = crypto
      .createHash("sha256")
      .update(extractedText)
      .digest("hex");

    // Check whether a resume already exists for this user and hash
    const existingResume = await Resume.findOne({ userId, resumeHash });
    if (existingResume) {
      console.log("[analyzeResume] Exit: Resume already analyzed", { resumeId: existingResume._id, userId });
      return res.status(200).json({
        success: true,
        message: "Resume already analyzed",
        data: {
          resumeId: existingResume._id,
          analysis: existingResume.analysis,
        },
      });
    }

    // Upload the file buffer to Cloudinary since it's a new unique resume
    let fileUrl = '';
    let fileId = '';
    try {
      const uploadResult = await uploadToCloudinary(file.buffer);
      fileUrl = uploadResult.secure_url;
      fileId = uploadResult.public_id;
    } catch (uploadError) {
      console.error("[analyzeResume] Cloudinary upload failed:", uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload resume to cloud storage.',
        error: uploadError.message,
      });
    }

    // Call Gemini to analyze resume (only if it doesn't already exist)
    const analysis = await getGeminiAnalysis(extractedText);

    const newResume = new Resume({
      userId,
      fileName,
      extractedText,
      resumeHash,
      fileUrl,
      fileId,
      analysis,
    });

    try {
      await newResume.save();
    } catch (error) {
      // Handle race condition: if two requests arrive simultaneously,
      // the second request will fail with a duplicate key error (code 11000)
      if (error.code === 11000) {
        console.warn("[analyzeResume] Duplicate key error (race condition). Fetching existing resume...");
        const existing = await Resume.findOne({ userId, resumeHash });
        if (existing) {
          console.log("[analyzeResume] Exit: Success (recovered from race condition)", { resumeId: existing._id, userId });
          return res.status(200).json({
            success: true,
            message: 'Resume already analyzed',
            data: {
              resumeId: existing._id,
              analysis: existing.analysis,
            },
          });
        }
      }
      throw error;
    }

    console.log("[analyzeResume] Exit: Success", { resumeId: newResume._id, userId });
    return res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully',
      data: {
        resumeId: newResume._id,
        analysis,
      },
    });

  } catch (error) {
    console.error("[analyzeResume] Error:", error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

export const getUserAnalyses = async (req, res) => {
  console.log("[getUserAnalyses] Entry:", { userId: req.user?.id, query: req.query });
  try {
    const userId = req.user.id;

    // Validate page and limit query parameters
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 20) limit = 20;

    const skip = (page - 1) * limit;

    // Use Promise.all to fetch paginated resumes, count, and overall best score concurrently
    const [resumes, totalRecords, bestScoreRecord] = await Promise.all([
      Resume.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Resume.countDocuments({ userId }),
      Resume.findOne({ userId }).sort({ "analysis.overallScore": -1 }).select("analysis.overallScore")
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    const bestScore = bestScoreRecord?.analysis?.overallScore || 0;

    console.log("[getUserAnalyses] Exit: Success", {
      userId,
      count: resumes.length,
      totalRecords,
      bestScore,
      page,
      totalPages
    });

    return res.status(200).json({
      success: true,
      data: {
        resumes,
        bestScore,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords,
          limit,
          hasNextPage,
          hasPreviousPage
        }
      }
    });
  } catch (error) {
    console.error("[getUserAnalyses] Error:", error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};
