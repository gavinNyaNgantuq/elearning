const pool = require('../config/database');

const TOKEN_LENGTH = 6;
const TOKEN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate random token 6 karakter (A-Z, 0-9)
 * @returns {string} Token uppercase 6 karakter
 */
function generateRandomToken() {
  let token = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += TOKEN_CHARS.charAt(Math.floor(Math.random() * TOKEN_CHARS.length));
  }
  return token;
}

/**
 * Generate unique token yang belum ada di database
 * @returns {Promise<string>} Unique token
 */
async function generateUniqueToken() {
  let token;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    token = generateRandomToken();
    const [rows] = await pool.execute(
      'SELECT id FROM exams WHERE token = ?',
      [token]
    );
    if (rows.length === 0) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Gagal generate token unik setelah 100 percobaan');
  }

  return token;
}

/**
 * Validasi format token
 * @param {string} token
 * @returns {boolean}
 */
function isValidTokenFormat(token) {
  const tokenRegex = /^[A-Z0-9]{6}$/;
  return tokenRegex.test(token);
}

module.exports = {
  generateRandomToken,
  generateUniqueToken,
  isValidTokenFormat
};
