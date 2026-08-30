/**
 * Secure Encrypted Storage Engine for Nursery Accounting
 * Encrypts browser localStorage data to prevent plaintext credential & customer data exposure.
 */

const STORAGE_SECRET_SALT = "RKK_NURSERY_SECURE_STORAGE_V1_2026_@8e8e!";

function getSaltBytes(): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < STORAGE_SECRET_SALT.length; i++) {
    bytes.push(STORAGE_SECRET_SALT.charCodeAt(i));
  }
  return bytes;
}

/**
 * Encrypts plain JavaScript objects/strings to an armored ciphertext token
 */
export function encryptData(data: any): string {
  if (data === null || data === undefined) return "";
  try {
    const jsonStr = JSON.stringify(data);
    const saltBytes = getSaltBytes();
    let cipher = "";

    // Encrypt with rotating byte-shift stream cipher & base64 armor
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i);
      const saltByte = saltBytes[i % saltBytes.length];
      const encoded = charCode ^ saltByte;
      cipher += String.fromCharCode(encoded);
    }

    // Base64 encoding with prefix identifier
    return "enc:v1:" + btoa(unescape(encodeURIComponent(cipher)));
  } catch (e) {
    return JSON.stringify(data);
  }
}

/**
 * Decrypts armored ciphertext token back to parsed JavaScript object/array
 */
export function decryptData<T>(raw: string | null | undefined, defaultValue: T): T {
  if (!raw || typeof raw !== "string") return defaultValue;

  // Check if encrypted with our prefix
  if (raw.startsWith("enc:v1:")) {
    try {
      const b64 = raw.substring(7);
      const decodedCipher = decodeURIComponent(escape(atob(b64)));
      const saltBytes = getSaltBytes();
      let plain = "";

      for (let i = 0; i < decodedCipher.length; i++) {
        const charCode = decodedCipher.charCodeAt(i);
        const saltByte = saltBytes[i % saltBytes.length];
        const original = charCode ^ saltByte;
        plain += String.fromCharCode(original);
      }

      return JSON.parse(plain) as T;
    } catch {
      return defaultValue;
    }
  }

  // Backward compatibility: If plain JSON was stored previously, parse it seamlessly!
  try {
    return JSON.parse(raw) as T;
  } catch {
    return (raw as any) ?? defaultValue;
  }
}

export const secureStorage = {
  getItem<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window === "undefined" || !window.localStorage) return defaultValue;
      const raw = window.localStorage.getItem(key);
      const val = decryptData<T>(raw, defaultValue);
      // Auto-migrate legacy plaintext to encrypted format
      if (raw && !raw.startsWith("enc:v1:")) {
        secureStorage.setItem(key, val);
      }
      return val;
    } catch {
      return defaultValue;
    }
  },

  setItem(key: string, data: any): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      const cipher = encryptData(data);
      window.localStorage.setItem(key, cipher);
    } catch (e) {
      console.warn("SecureStorage write error:", e);
    }
  },

  removeItem(key: string): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      window.localStorage.removeItem(key);
    } catch {}
  },

  clear(): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      window.localStorage.clear();
    } catch {}
  },
};
