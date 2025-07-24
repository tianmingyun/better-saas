// Mock for Jimp
const mockJimp = {
  read: jest.fn().mockResolvedValue({
    getWidth: jest.fn().mockReturnValue(300),
    getHeight: jest.fn().mockReturnValue(300),
    cover: jest.fn().mockReturnThis(),
    quality: jest.fn().mockReturnThis(),
    getBufferAsync: jest.fn().mockResolvedValue(Buffer.from('mock-image-data')),
  }),
  MIME_JPEG: 'image/jpeg',
  MIME_PNG: 'image/png',
};

// Mock the default export
const jimp = jest.fn().mockImplementation(() => mockJimp);
Object.assign(jimp, mockJimp);

module.exports = jimp;