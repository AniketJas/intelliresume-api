import { upload } from '../configs/multer.js';

export const handleUploadMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('resume');

  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};
