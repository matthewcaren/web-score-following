export class AudioBuffer {
  dataArray: Float32Array;
  bufferSize: number;

  constructor(bufferSize: number) {
    this.dataArray = new Float32Array(bufferSize);
    this.bufferSize = bufferSize;
  }

  clearBuffer() {
    this.dataArray = new Float32Array(this.bufferSize);
  }
}

// Since we deal with a lot of possibly-empty sample buffers
export type MaybeFloat32Array = Float32Array | null;
