import { PDFParse } from 'pdf-parse';

/**
 * Extracts raw text from a PDF file buffer.
 * @param {Buffer} buffer - The PDF file buffer.
 * @returns {Promise<string>} The extracted text.
 */
export const extractPdfText = async (buffer) => {
  if (!buffer) {
    throw new Error('No PDF buffer provided.');
  }
  
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text || '';
  } finally {
    await parser.destroy().catch(() => {});
  }
};
