import cloudinary from '../configs/cloudinary.js';

/**
 * Uploads a file buffer directly to Cloudinary using upload_stream.
 * @param {Buffer} buffer - The file buffer in memory.
 * @returns {Promise<object>} The Cloudinary upload result.
 */
export const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'intelliresume/resumes',
      },
      (error, result) => {
        if (error) {
          console.error("[uploadToCloudinary] Error uploading file stream to Cloudinary:", error);
          return reject(error);
        }
        resolve(result);
      }
    );
    
    uploadStream.end(buffer);
  });
};
