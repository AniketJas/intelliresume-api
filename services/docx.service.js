import mammoth from 'mammoth';

/**
 * Extracts raw text from a DOCX file buffer.
 * @param {Buffer} buffer - The DOCX file buffer.
 * @returns {Promise<string>} The extracted text.
 */
export const extractDocxText = async (buffer) => {
  if (!buffer) {
    throw new Error('No DOCX buffer provided.');
  }
  
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
};
