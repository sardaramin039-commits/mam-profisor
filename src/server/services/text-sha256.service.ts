const ROUND_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function rotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

function choose(x: number, y: number, z: number): number {
  return (x & y) ^ (~x & z);
}

function majority(x: number, y: number, z: number): number {
  return (x & y) ^ (x & z) ^ (y & z);
}

function sigma0(x: number): number {
  return rotateRight(x, 2) ^ rotateRight(x, 13) ^ rotateRight(x, 22);
}

function sigma1(x: number): number {
  return rotateRight(x, 6) ^ rotateRight(x, 11) ^ rotateRight(x, 25);
}

function gamma0(x: number): number {
  return rotateRight(x, 7) ^ rotateRight(x, 18) ^ (x >>> 3);
}

function gamma1(x: number): number {
  return rotateRight(x, 17) ^ rotateRight(x, 19) ^ (x >>> 10);
}

function processBlock(
  state: Uint32Array,
  bytes: Uint8Array,
  offset: number
): void {
  const schedule = new Uint32Array(64);

  for (let i = 0; i < 16; i += 1) {
    const index = offset + i * 4;
    schedule[i] =
      (bytes[index] << 24) |
      (bytes[index + 1] << 16) |
      (bytes[index + 2] << 8) |
      bytes[index + 3];
  }

  for (let i = 16; i < 64; i += 1) {
    schedule[i] = (
      gamma1(schedule[i - 2]) +
      schedule[i - 7] +
      gamma0(schedule[i - 15]) +
      schedule[i - 16]
    ) >>> 0;
  }

  let [a, b, c, d, e, f, g, h] = state;

  for (let i = 0; i < 64; i += 1) {
    const round1 = (h + sigma1(e) + choose(e, f, g) + ROUND_CONSTANTS[i] + schedule[i]) >>> 0;
    const round2 = (sigma0(a) + majority(a, b, c)) >>> 0;
    h = g;
    g = f;
    f = e;
    e = (d + round1) >>> 0;
    d = c;
    c = b;
    b = a;
    a = (round1 + round2) >>> 0;
  }

  state[0] = (state[0] + a) >>> 0;
  state[1] = (state[1] + b) >>> 0;
  state[2] = (state[2] + c) >>> 0;
  state[3] = (state[3] + d) >>> 0;
  state[4] = (state[4] + e) >>> 0;
  state[5] = (state[5] + f) >>> 0;
  state[6] = (state[6] + g) >>> 0;
  state[7] = (state[7] + h) >>> 0;
}

function pad(input: Uint8Array): Uint8Array {
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const output = new Uint8Array(paddedLength);
  output.set(input);
  output[input.length] = 0x80;

  const high = Math.floor(bitLength / 0x100000000);
  const low = bitLength >>> 0;
  const end = paddedLength - 8;

  output[end] = (high >>> 24) & 0xff;
  output[end + 1] = (high >>> 16) & 0xff;
  output[end + 2] = (high >>> 8) & 0xff;
  output[end + 3] = high & 0xff;
  output[end + 4] = (low >>> 24) & 0xff;
  output[end + 5] = (low >>> 16) & 0xff;
  output[end + 6] = (low >>> 8) & 0xff;
  output[end + 7] = low & 0xff;
  return output;
}

function toHex(state: Uint32Array): string {
  return Array.from(state, value => value.toString(16).padStart(8, '0')).join('');
}

export function sha256(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const padded = pad(bytes);
  const state = new Uint32Array([
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19
  ]);

  for (let offset = 0; offset < padded.length; offset += 64) {
    processBlock(state, padded, offset);
  }

  return toHex(state);
}
