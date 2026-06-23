import fs from 'fs';
import { extractPdfText } from '../services/pdf.service.js';
import { extractDocxText } from '../services/docx.service.js';
import { analyzeResume as getGeminiAnalysis } from '../services/gemini.service.js';
import Resume from '../models/resume.model.js';

export const analyzeResume = async (req, res) => {
  console.log("ANALYZE CONTROLLER HIT");
  try {
    const file = req.file;

    if (!file) {
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
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format. Only PDF and DOCX files are allowed.',
      });
    }

    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the 5MB limit.',
      });
    }

    const fileBuffer = fs.readFileSync(file.path);

    let extractedText = '';
    if (fileExt === 'pdf') {
      extractedText = await extractPdfText(fileBuffer);
    } else if (fileExt === 'docx') {
      extractedText = await extractDocxText(fileBuffer);
    }

    if (!extractedText || !extractedText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Failed to extract text from the uploaded file.',
      });
    }

    const analysis = await getGeminiAnalysis(extractedText);

    const newResume = new Resume({
      userId,
      fileName,
      extractedText,
      analysis,
    });

    await newResume.save();

    return res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully',
      data: {
        resumeId: newResume._id,
        analysis,
      },
    });

  } catch (error) {
    console.error('Error in analyzeResume controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

export const getUserAnalyses = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: resumes,
    });
  } catch (error) {
    console.error('Error fetching user analyses:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};
