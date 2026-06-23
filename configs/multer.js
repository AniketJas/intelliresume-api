import multer from 'multer';
import fs from 'fs';

const uploadDir = './uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const originalName = file.originalname.toLowerCase();
  if (originalName.endsWith('.pdf') || originalName.endsWith('.docx')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Only PDF and DOCX files are allowed.'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
