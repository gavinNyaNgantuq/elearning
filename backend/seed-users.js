// Script untuk membuat akun testing
// Jalankan: node seed-users.js

const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

async function seedUsers() {
  try {
    console.log('=== MEMBUAT AKUN TESTING ===\n');

    // Hash password
    const password = await bcrypt.hash('password123', 10);

    // Cek apakah roles sudah ada
    const [roles] = await pool.execute('SELECT * FROM roles');
    if (roles.length === 0) {
      console.log('Membuat roles...');
      await pool.execute('INSERT INTO roles (name) VALUES (?)', ['admin']);
      await pool.execute('INSERT INTO roles (name) VALUES (?)', ['guru']);
      await pool.execute('INSERT INTO roles (name) VALUES (?)', ['siswa']);
    } else {
      console.log('Roles sudah ada');
    }

    // Cek apakah majors sudah ada
    const [majors] = await pool.execute('SELECT * FROM majors');
    if (majors.length === 0) {
      console.log('Membuat majors...');
      await pool.execute('INSERT INTO majors (id, name) VALUES (1, ?)', ['MP']);
      await pool.execute('INSERT INTO majors (id, name) VALUES (2, ?)', ['TKJ']);
      await pool.execute('INSERT INTO majors (id, name) VALUES (3, ?)', ['AK']);
      await pool.execute('INSERT INTO majors (id, name) VALUES (4, ?)', ['DKV']);
    } else {
      console.log('Majors sudah ada');
    }

    // Cek apakah classes sudah ada
    const [classes] = await pool.execute('SELECT * FROM classes');
    if (classes.length === 0) {
      console.log('Membuat classes...');
      await pool.execute('INSERT INTO classes (name, major_id) VALUES (?, ?)', ['XII MP 1', 1]);
      await pool.execute('INSERT INTO classes (name, major_id) VALUES (?, ?)', ['XII TKJ 1', 2]);
      await pool.execute('INSERT INTO classes (name, major_id) VALUES (?, ?)', ['XII AK 1', 3]);
      await pool.execute('INSERT INTO classes (name, major_id) VALUES (?, ?)', ['XII DKV 1', 4]);
    } else {
      console.log('Classes sudah ada');
    }

    // Cek apakah subjects sudah ada
    const [subjects] = await pool.execute('SELECT * FROM subjects');
    if (subjects.length === 0) {
      console.log('Membuat subjects...');
      await pool.execute('INSERT INTO subjects (name, major_id) VALUES (?, ?)', ['Matematika', 1]);
      await pool.execute('INSERT INTO subjects (name, major_id) VALUES (?, ?)', ['Bahasa Indonesia', 1]);
      await pool.execute('INSERT INTO subjects (name, major_id) VALUES (?, ?)', ['Bahasa Inggris', 1]);
    } else {
      console.log('Subjects sudah ada');
    }

    // Buat akun Admin
    const [adminExists] = await pool.execute('SELECT * FROM users WHERE username = ?', ['admin']);
    if (adminExists.length === 0) {
      await pool.execute(
        'INSERT INTO users (role_id, username, email, password) VALUES (?, ?, ?, ?)',
        [1, 'admin', 'admin@school.com', password]
      );
      console.log('Akun Admin dibuat: admin / password123');
    } else {
      console.log('Akun Admin sudah ada');
    }

    // Buat akun Guru
    const [guruExists] = await pool.execute('SELECT * FROM users WHERE username = ?', ['guru']);
    if (guruExists.length === 0) {
      const [result] = await pool.execute(
        'INSERT INTO users (role_id, username, email, password) VALUES (?, ?, ?, ?)',
        [2, 'guru', 'guru@school.com', password]
      );
      await pool.execute(
        'INSERT INTO teachers (user_id, nip) VALUES (?, ?)',
        [result.insertId, '198501012010011001']
      );
      console.log('Akun Guru dibuat: guru / password123');
    } else {
      console.log('Akun Guru sudah ada');
    }

    // Buat akun Siswa
    const [siswaExists] = await pool.execute('SELECT * FROM users WHERE username = ?', ['siswa']);
    if (siswaExists.length === 0) {
      const [result] = await pool.execute(
        'INSERT INTO users (role_id, username, email, password) VALUES (?, ?, ?, ?)',
        [3, 'siswa', 'siswa@school.com', password]
      );
      await pool.execute(
        'INSERT INTO students (user_id, class_id, nis) VALUES (?, ?, ?)',
        [result.insertId, 1, '2024001']
      );
      console.log('Akun Siswa dibuat: siswa / password123');
    } else {
      console.log('Akun Siswa sudah ada');
    }

    console.log('\n=== SEED SELESAI ===');
    console.log('\nAkun Testing:');
    console.log('  Admin  : admin / password123');
    console.log('  Guru   : guru / password123');
    console.log('  Siswa  : siswa / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedUsers();
