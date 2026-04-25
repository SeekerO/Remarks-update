// src/lib/util/crypto.ts
// AES-GCM symmetric encryption for chat messages using Web Crypto API.
// The key is derived from a shared secret stored in NEXT_PUBLIC_MSG_SECRET.
// All operations are async and browser-safe.

const SECRET = process.env.NEXT_PUBLIC_MSG_SECRET ?? "avexi-default-secret-change-me";

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("avexi-salt"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string.
 * Returns a base64 string: <12-byte IV (base64)>:<ciphertext (base64)>
 */
export async function encryptMessage(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  return `${ivB64}:${ctB64}`;
}

/**
 * Decrypts a string produced by encryptMessage.
 * Returns the original plaintext, or the raw value if it cannot be decrypted
 * (so legacy / non-encrypted messages still render).
 */
export async function decryptMessage(encrypted: string): Promise<string> {
  if (!encrypted.includes(":")) return encrypted; // legacy plain-text
  try {
    const [ivB64, ctB64] = encrypted.split(":");
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(ctB64), (c) => c.charCodeAt(0));
    const key = await getKey();
    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ct
    );
    return new TextDecoder().decode(plainBuffer);
  } catch {
    // Return raw on any decryption failure (wrong key, tampered data, etc.)
    return encrypted;
  }
}