import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AES config
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // 256-bit key
const iv = crypto.randomBytes(16);  // 128-bit IV

// Paths
const inputPath = path.join(__dirname, 'message.txt');
const encryptedPath = path.join(__dirname, 'encrypted.dat');
const decryptedPath = path.join(__dirname, 'decrypted.txt');

// 1. Encrypt Stream
function encryptFile() {
  const readStream = fs.createReadStream(inputPath);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const writeStream = fs.createWriteStream(encryptedPath);

  readStream.pipe(cipher).pipe(writeStream).on('finish', () => {
    console.log('🔐 File encrypted to encrypted.dat');
    decryptFile(); // call decrypt next
  });
}

// 2. Decrypt Stream
function decryptFile() {
  const readStream = fs.createReadStream(encryptedPath);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const writeStream = fs.createWriteStream(decryptedPath);

  readStream.pipe(decipher).pipe(writeStream).on('finish', () => {
    console.log('🔓 File decrypted to decrypted.txt');
  });
}

// Start
encryptFile();
