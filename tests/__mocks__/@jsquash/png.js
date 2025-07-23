// Mock for @jsquash/png
export const decode = jest.fn().mockResolvedValue({
  data: new Uint8ClampedArray(300 * 300 * 4), // RGBA data
  width: 300,
  height: 300,
});

export const encode = jest.fn().mockResolvedValue(new ArrayBuffer(1024)); 