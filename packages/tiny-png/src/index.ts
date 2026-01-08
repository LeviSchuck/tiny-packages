import { concat } from "./bytes.ts";
import { deflate } from "./compress.ts";
import { pngChunk } from "./pngBytes.ts";

export async function indexedPng(
  input: Uint8Array,
  width: number,
  height: number,
  colors: [number, number, number][]
): Promise<Uint8Array> {
  const inputView = new DataView(input.buffer);
  const inputLength = inputView.byteLength;

  // Let's make sure user data isn't going to error out a decoder
  let maxIndex = 0;
  for (let i = 0; i < inputLength; i++) {
    const index = inputView.getUint8(i);
    if (index > maxIndex) {
      maxIndex = index;
    }
  }

  if (colors.length <= maxIndex) {
    throw new Error(
      `Color palette does not have enough colors (${maxIndex + 1}). Only ${colors.length} were given!`
    );
  }
  if (inputLength != width * height) {
    throw new Error(
      `Input does not match dimensions ${width}x${height}. Only ${inputLength} bytes were given when ${width * height} are expected!`
    )
  } else if (inputLength == 0) {
    throw new Error(`Received empty input`);
  }

  // PNG Header
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: 8-bit Indexed
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdrData[8] = 8;
  ihdrData[9] = 3;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = pngChunk("IHDR", ihdrData);

  // PLTE: Build palette from colors array
  const plteData = new Uint8Array(colors.length * 3);
  const plteDataView = new DataView(plteData.buffer);
  for (let i = 0; i <= maxIndex; i++) {
    plteDataView.setUint8(i * 3, colors[i]![0]);
    plteDataView.setUint8(i * 3 + 1, colors[i]![1]);
    plteDataView.setUint8(i * 3 + 2, colors[i]![2]);
  }
  const plte = pngChunk("PLTE", plteData);

  // Swizzle the data into the format PNG expects
  const stride = width + 1;
  const uncompressed = new Uint8Array(stride * height);
  const uncompressedView = new DataView(uncompressed.buffer);
  for (let y = 0; y < height; y++) {
    uncompressed[y * stride] = 0;
    for (let x = 0; x < width; x++) {
      uncompressedView.setUint8(y * stride + 1 + x, inputView.getUint8(y * width + x));
    }
  }

  const idat = pngChunk("IDAT", await deflate(uncompressed));
  const iend = pngChunk("IEND", new Uint8Array(0));

  return concat(sig, ihdr, plte, idat, iend);
}
