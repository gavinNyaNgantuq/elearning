export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'guru' | 'siswa';
}

export interface Exam {
  id: number;
  token: string;
  title: string;
  subject_id: number;
  class_id: number;
  teacher_id: number;
  start_at: string;
  duration: number;
  subject_name?: string;
  class_name?: string;
  teacher_nip?: string;
}

export interface Question {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export interface ExamAnswer {
  question_id: number;
  answer: 'A' | 'B' | 'C' | 'D';
}

export interface ExamResult {
  total_questions: number;
  correct_answers: number;
}
