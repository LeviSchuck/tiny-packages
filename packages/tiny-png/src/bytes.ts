export function concat(...bytes: Uint8Array[]) : Uint8Array<ArrayBuffer> {
  const output = new Uint8Array(
    bytes.reduceRight((acc, i) => acc + i.length, 0)
  );
  let offset = 0;
  for (const chunk of bytes) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}
