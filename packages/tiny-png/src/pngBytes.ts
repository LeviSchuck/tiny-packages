import { crc32 } from "./crc";
const ENCODER = new TextEncoder();

export function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const buf = new Uint8Array(4 + 4 + data.length + 4);
  const view = new DataView(buf.buffer);
  view.setUint32(0, data.length);
  buf.set(ENCODER.encode(type), 4);
  buf.set(data, 8);
  const checksum = crc32(buf.subarray(4, buf.length - 4));
  view.setUint32(buf.length - 4, checksum);
  return buf;
}