import multer from 'multer';

const storage = multer.memoryStorage();

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
