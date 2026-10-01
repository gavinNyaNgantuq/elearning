// Script untuk melihat struktur tabel
// Jalankan: node check-schema.js

const pool = require('./src/config/database');

async function checkSchema() {
  try {
    console.log('=== STRUKTUR TABEL ===\n');

    // Cek tabel users
    console.log('Tabel: users');
    const [users] = await pool.execute('DESCRIBE users');
    users.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });

    // Cek tabel roles
    console.log('\nTabel: roles');
    const [roles] = await pool.execute('DESCRIBE roles');
    roles.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });

    // Cek tabel students
    console.log('\nTabel: students');
    const [students] = await pool.execute('DESCRIBE students');
    students.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });

    // Cek tabel teachers
    console.log('\nTabel: teachers');
    const [teachers] = await pool.execute('DESCRIBE teachers');
    teachers.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });

    // Cek tabel classes
    console.log('\nTabel: classes');
    const [classes] = await pool.execute('DESCRIBE classes');
    classes.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });

    // Cek tabel subjects
    console.log('\nTabel: subjects');
    const [subjects] = await pool.execute('DESCRIBE subjects');
    subjects.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });

    // Cek tabel exams
    console.log('\nTabel: exams');
    const [exams] = await pool.execute('DESCRIBE exams');
    exams.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });

    // Cek tabel questions
    console.log('\nTabel: questions');
    const [questions] = await pool.execute('DESCRIBE questions');
    questions.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });

    // Cek tabel exam_answers
    console.log('\nTabel: exam_answers');
    const [examAnswers] = await pool.execute('DESCRIBE exam_answers');
    examAnswers.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });

    // Cek data roles
    console.log('\n=== DATA ROLES ===');
    const [roleData] = await pool.execute('SELECT * FROM roles');
    console.log(roleData);

    // Cek data users
    console.log('\n=== DATA USERS ===');
    const [userData] = await pool.execute('SELECT * FROM users LIMIT 5');
    console.log(userData);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
