// Test script untuk validasi token generator
// Jalankan: node test-token.js

const { generateRandomToken, isValidTokenFormat } = require('./src/utils/tokenGenerator');

console.log('=== TOKEN GENERATOR TEST ===\n');

// Test 1: Format token
console.log('Test 1: Format token (6 karakter A-Z, 0-9)');
for (let i = 0; i < 10; i++) {
  const token = generateRandomToken();
  const isValid = isValidTokenFormat(token);
  console.log(`  Token: ${token} - Valid: ${isValid}`);
}

// Test 2: Panjang token
console.log('\nTest 2: Panjang token harus 6 karakter');
for (let i = 0; i < 5; i++) {
  const token = generateRandomToken();
  console.log(`  Token: ${token} - Length: ${token.length}`);
}

// Test 3: Hanya A-Z dan 0-9
console.log('\nTest 3: Hanya karakter A-Z dan 0-9');
const validTokens = [];
for (let i = 0; i < 100; i++) {
  const token = generateRandomToken();
  if (isValidTokenFormat(token)) {
    validTokens.push(token);
  }
}
console.log(`  100 token di-generate, ${validTokens.length} valid`);

// Test 4: Uppercase
console.log('\nTest 4: Token harus uppercase');
for (let i = 0; i < 5; i++) {
  const token = generateRandomToken();
  const isUppercase = token === token.toUpperCase();
  console.log(`  Token: ${token} - Uppercase: ${isUppercase}`);
}

// Test 5: Invalid format
console.log('\nTest 5: Format tidak valid');
const invalidTokens = ['abc123', 'ABC12', 'ABC1234', 'ABC-12', 'ABC 12', ''];
invalidTokens.forEach(token => {
  const isValid = isValidTokenFormat(token);
  console.log(`  Token: "${token}" - Valid: ${isValid}`);
});

console.log('\n=== TEST SELESAI ===');
