export async function deflate(uncompressed: Uint8Array<ArrayBuffer>) : Promise<Uint8Array> {
  // Compress using native ZLIB (deflate)
  const cs = new CompressionStream("deflate");
  const writer = cs.writable.getWriter();
  writer.write(uncompressed);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }
  const compressedData = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    compressedData.set(chunk, offset);
    offset += chunk.length;
  }
  return compressedData;
}