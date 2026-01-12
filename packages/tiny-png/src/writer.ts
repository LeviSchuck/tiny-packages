/**
 * Calculate the optimal bit depth for indexed PNG based on the maximum color index
 * @param maxIndex - The highest palette index used in the image
 * @returns The bit depth (1, 2, 4, or 8)
 */
export function calculateBitDepth(maxIndex: number): 1 | 2 | 4 | 8 {
  if (maxIndex <= 1) return 1;
  if (maxIndex <= 3) return 2;
  if (maxIndex <= 15) return 4;
  return 8;
}

/**
 * Pack pixel indices into bytes according to the specified bit depth
 * @param inputView - DataView of original pixel data (1 byte per pixel)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param bitDepth - Target bit depth (1, 2, 4, or 8)
 * @returns Packed image data with filter bytes for each row
 */
export function packPixelData(
  inputView: DataView,
  width: number,
  height: number,
  bitDepth: 1 | 2 | 4 | 8
): Uint8Array<ArrayBuffer> {
  const pixelsPerByte = 8 / bitDepth;
  const bytesPerRow = Math.ceil(width / pixelsPerByte);
  const stride = bytesPerRow + 1; // +1 for filter byte
  const packed = new Uint8Array(stride * height);
  const packedView = new DataView(packed.buffer);

  for (let y = 0; y < height; y++) {
    // Set filter byte to 0 (None)
    packedView.setUint8(y * stride, 0);

    for (let x = 0; x < width; x++) {
      const pixelValue = inputView.getUint8(y * width + x);
      const byteIndex = y * stride + 1 + Math.floor(x / pixelsPerByte);
      const bitPosition = (pixelsPerByte - 1 - (x % pixelsPerByte)) * bitDepth;
      const currentValue = packedView.getUint8(byteIndex);
      packedView.setUint8(byteIndex, currentValue | (pixelValue << bitPosition));
    }
  }

  return packed;
}
