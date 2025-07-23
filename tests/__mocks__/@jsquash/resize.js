// Mock for @jsquash/resize
const resize = jest.fn().mockResolvedValue({
  data: new Uint8ClampedArray(300 * 300 * 4), // RGBA data
  width: 300,
  height: 300,
});

export default resize; 