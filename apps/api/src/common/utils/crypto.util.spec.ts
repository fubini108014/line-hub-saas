import { randomBytes } from 'crypto';
import { encrypt, decrypt } from './crypto.util';

const VALID_KEY = randomBytes(32).toString('hex');

describe('crypto.util (AES-256-GCM)', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalKey;
  });

  it('round-trips plaintext through encrypt/decrypt', () => {
    const plain = 'line-channel-secret-1234567890';
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it('round-trips unicode and empty-ish strings', () => {
    for (const plain of ['中文密鑰測試🔐', ' ', 'a']) {
      expect(decrypt(encrypt(plain))).toBe(plain);
    }
  });

  it('produces iv:authTag:ciphertext format with a fresh IV each call', () => {
    const a = encrypt('same-input');
    const b = encrypt('same-input');
    expect(a.split(':')).toHaveLength(3);
    expect(a).not.toBe(b);
    expect(a.split(':')[0]).toHaveLength(32); // 16-byte IV in hex
  });

  it('rejects tampered ciphertext (auth tag mismatch)', () => {
    const [iv, tag, data] = encrypt('sensitive').split(':');
    const flipped = (parseInt(data.slice(0, 2), 16) ^ 0xff).toString(16).padStart(2, '0');
    expect(() => decrypt(`${iv}:${tag}:${flipped}${data.slice(2)}`)).toThrow();
  });

  it('rejects decryption with a different key', () => {
    const cipherText = encrypt('sensitive');
    process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex');
    expect(() => decrypt(cipherText)).toThrow();
  });

  it.each([
    ['missing', undefined],
    ['too short', 'abc123'],
    ['non-64-length', randomBytes(16).toString('hex')],
  ])('throws when ENCRYPTION_KEY is %s', (_label, key) => {
    if (key === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = key;
    expect(() => encrypt('x')).toThrow('ENCRYPTION_KEY');
  });
});
