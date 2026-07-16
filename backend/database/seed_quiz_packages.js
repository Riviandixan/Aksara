require('dotenv').config()
const { pool } = require('../config/db')

// Pastikan sudah ada minimal 1 user di DB sebelum menjalankan seeder ini.
const SEED_USER_ID = 1

const questions = [
  // ── ENGLISH (language_id: 1) ─────────────────────────────
  {
    language_id: 1,
    type: 'multiple_choice',
    question_data: {
      question: 'Which sentence uses the Present Perfect tense correctly?',
      options: [
        'She has visited Paris last year.',
        'She have visited Paris.',
        'She has visited Paris three times.',
        'She visited Paris since 2020.',
      ],
      correct_answer: 'She has visited Paris three times.',
    },
  },
  {
    language_id: 1,
    type: 'translate',
    question_data: {
      sentence: 'Saya sudah makan malam sebelum kamu datang.',
      correct_answer: 'I had already eaten dinner before you came.',
    },
  },
  {
    language_id: 1,
    type: 'word_arrange',
    question_data: {
      words: ['been', 'have', 'you', 'waiting', 'long', '?'],
      correct_answer: 'Have you been waiting long?',
    },
  },
  {
    language_id: 1,
    type: 'multiple_choice',
    question_data: {
      question: 'What is the correct meaning of the idiom "break the ice"?',
      options: [
        'To literally break frozen water',
        'To start a conversation in an awkward situation',
        'To end a relationship',
        'To solve a difficult problem',
      ],
      correct_answer: 'To start a conversation in an awkward situation',
    },
  },
  {
    language_id: 1,
    type: 'translate',
    question_data: {
      sentence: 'Dia berbicara terlalu cepat sehingga saya tidak mengerti.',
      correct_answer: 'She spoke too fast for me to understand.',
    },
  },

  // ── JAPANESE (language_id: 2) ────────────────────────────
  {
    language_id: 2,
    type: 'multiple_choice',
    question_data: {
      question: '「ありがとうございます」の意味は何ですか？',
      options: ['Good morning', 'Thank you very much', 'Excuse me', 'Good night'],
      correct_answer: 'Thank you very much',
    },
  },
  {
    language_id: 2,
    type: 'translate',
    question_data: {
      sentence: 'Saya pergi ke sekolah setiap hari.',
      correct_answer: '毎日学校に行きます。',
    },
  },
  {
    language_id: 2,
    type: 'word_arrange',
    question_data: {
      words: ['は', 'わたし', 'です', 'がくせい'],
      correct_answer: 'わたしはがくせいです',
    },
  },
  {
    language_id: 2,
    type: 'multiple_choice',
    question_data: {
      question: 'Which particle is used to mark the subject of a sentence in Japanese?',
      options: ['を', 'に', 'は / が', 'で'],
      correct_answer: 'は / が',
    },
  },
  {
    language_id: 2,
    type: 'translate',
    question_data: {
      sentence: 'Nama saya adalah Budi.',
      correct_answer: 'わたしのなまえはブディです。',
    },
  },

  // ── KOREAN (language_id: 3) ──────────────────────────────
  {
    language_id: 3,
    type: 'multiple_choice',
    question_data: {
      question: '"안녕하세요" artinya apa dalam bahasa Indonesia?',
      options: ['Selamat tinggal', 'Terima kasih', 'Halo / Selamat datang', 'Maaf'],
      correct_answer: 'Halo / Selamat datang',
    },
  },
  {
    language_id: 3,
    type: 'translate',
    question_data: {
      sentence: 'Saya suka makan nasi.',
      correct_answer: '저는 밥 먹는 것을 좋아해요.',
    },
  },
  {
    language_id: 3,
    type: 'word_arrange',
    question_data: {
      words: ['이에요', '제', '이름은', '지민'],
      correct_answer: '제 이름은 지민이에요',
    },
  },
  {
    language_id: 3,
    type: 'multiple_choice',
    question_data: {
      question: 'What does "감사합니다" mean?',
      options: ['I am sorry', 'Thank you', 'Please help me', 'Good morning'],
      correct_answer: 'Thank you',
    },
  },
  {
    language_id: 3,
    type: 'translate',
    question_data: {
      sentence: 'Di mana stasiun kereta terdekat?',
      correct_answer: '가장 가까운 기차역이 어디에 있어요?',
    },
  },

  // ── FRENCH (language_id: 4) ──────────────────────────────
  {
    language_id: 4,
    type: 'multiple_choice',
    question_data: {
      question: 'Quelle est la traduction de "Je m\'appelle Marie" ?',
      options: ['I call Marie', 'My name is Marie', 'She is called Marie', 'Call me Marie'],
      correct_answer: 'My name is Marie',
    },
  },
  {
    language_id: 4,
    type: 'translate',
    question_data: {
      sentence: 'Saya ingin memesan secangkir kopi.',
      correct_answer: 'Je voudrais commander une tasse de café.',
    },
  },
  {
    language_id: 4,
    type: 'word_arrange',
    question_data: {
      words: ['parle', 'je', 'français', 'un peu'],
      correct_answer: 'je parle un peu français',
    },
  },
  {
    language_id: 4,
    type: 'multiple_choice',
    question_data: {
      question: 'Which is the correct plural form of "le cheval" (the horse)?',
      options: ['les chevals', 'les chevaux', 'les chevales', 'les cheval'],
      correct_answer: 'les chevaux',
    },
  },
  {
    language_id: 4,
    type: 'translate',
    question_data: {
      sentence: 'Berapa harga tiket ini?',
      correct_answer: 'Quel est le prix de ce billet ?',
    },
  },

  // ── GERMAN (language_id: 5) ──────────────────────────────
  {
    language_id: 5,
    type: 'multiple_choice',
    question_data: {
      question: 'Was bedeutet "Guten Morgen"?',
      options: ['Good night', 'Good afternoon', 'Good morning', 'Good evening'],
      correct_answer: 'Good morning',
    },
  },
  {
    language_id: 5,
    type: 'translate',
    question_data: {
      sentence: 'Saya tinggal di Berlin.',
      correct_answer: 'Ich wohne in Berlin.',
    },
  },
  {
    language_id: 5,
    type: 'word_arrange',
    question_data: {
      words: ['heiße', 'ich', 'Thomas'],
      correct_answer: 'ich heiße Thomas',
    },
  },
  {
    language_id: 5,
    type: 'multiple_choice',
    question_data: {
      question: 'Which article is used for feminine nouns in German?',
      options: ['der', 'das', 'die', 'den'],
      correct_answer: 'die',
    },
  },
  {
    language_id: 5,
    type: 'translate',
    question_data: {
      sentence: 'Bisakah kamu berbicara lebih pelan?',
      correct_answer: 'Können Sie bitte langsamer sprechen?',
    },
  },
]

const packages = [
  {
    language_id: 1,
    title: 'English Grammar Essentials',
    description: 'Latihan dasar tata bahasa Inggris: tenses, idiom, dan terjemahan.',
    question_range: [0, 4],
  },
  {
    language_id: 2,
    title: 'Japanese for Beginners — JLPT N5',
    description: 'Soal latihan bahasa Jepang level dasar: kosakata, partikel, dan kalimat sederhana.',
    question_range: [5, 9],
  },
  {
    language_id: 3,
    title: 'Korean Starter Pack — TOPIK I',
    description: 'Latihan bahasa Korea untuk pemula: salam, kosakata, dan kalimat dasar.',
    question_range: [10, 14],
  },
  {
    language_id: 4,
    title: 'Français Débutant',
    description: 'Paket latihan bahasa Prancis untuk pemula: perkenalan, kosakata, dan tata bahasa.',
    question_range: [15, 19],
  },
  {
    language_id: 5,
    title: 'Deutsch A1 — Grundlagen',
    description: 'Latihan bahasa Jerman level A1: salam, artikel, dan kalimat dasar.',
    question_range: [20, 24],
  },
]

async function seed() {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // Insert semua soal ke question_banks
    const insertedIds = []
    for (const q of questions) {
      const [res] = await conn.query(
        'INSERT INTO question_banks (user_id, language_id, type, question_data) VALUES (?, ?, ?, ?)',
        [SEED_USER_ID, q.language_id, q.type, JSON.stringify(q.question_data)]
      )
      insertedIds.push(res.insertId)
    }
    console.log(`✅ Inserted ${insertedIds.length} questions into question_banks`)

    // Insert paket dan relasi soal
    for (const pkg of packages) {
      const [pkgRes] = await conn.query(
        'INSERT INTO quiz_packages (user_id, language_id, title, description, is_public) VALUES (?, ?, ?, ?, 1)',
        [SEED_USER_ID, pkg.language_id, pkg.title, pkg.description]
      )
      const packageId = pkgRes.insertId

      const [start, end] = pkg.question_range
      const pkgQuestionIds = insertedIds.slice(start, end + 1)
      const values = pkgQuestionIds.map((qid, i) => [packageId, qid, i + 1])
      await conn.query(
        'INSERT INTO package_questions (quiz_package_id, question_bank_id, order_index) VALUES ?',
        [values]
      )
      console.log(`✅ Package "${pkg.title}" — ${pkgQuestionIds.length} soal`)
    }

    await conn.commit()
    console.log('\n🎉 Seeding completed!')
  } catch (err) {
    await conn.rollback()
    console.error('❌ Seeding failed:', err.message)
  } finally {
    conn.release()
    process.exit(0)
  }
}

seed()
