// Usage: npm run seed
// Wipes users/authors/books and reloads them from bookleaf_sample_data.json.
// Passwords are hashed with bcrypt; only hashes are stored.
require('../config/env');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const { connectDB, disconnectDB } = require('../config/db');
const logger = require('../utils/logger');
const { ROLES } = require('../config/constants');
const Author = require('../models/Author');
const Book = require('../models/Book');
const User = require('../models/User');

const AUTHOR_PASSWORD = process.env.SEED_AUTHOR_PASSWORD || 'Author@123';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
const ADMINS = [
  { email: 'admin@bookleaf.com', name: 'BookLeaf Admin' },
  { email: 'ops@bookleaf.com', name: 'BookLeaf Ops' },
];

// new Date(null) would give 1970, so map empty values to null explicitly.
const toDate = (value) => (value ? new Date(value) : null);

async function seed() {
  await connectDB();

  const raw = fs.readFileSync(path.join(__dirname, 'bookleaf_sample_data.json'), 'utf8');
  const { authors } = JSON.parse(raw);

  await Promise.all([User.deleteMany({}), Book.deleteMany({}), Author.deleteMany({})]);

  // Hash once and reuse: all seed accounts share a dev password per role.
  const authorHash = await bcrypt.hash(AUTHOR_PASSWORD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  let bookCount = 0;
  for (const a of authors) {
    const author = await Author.create({
      authorCode: a.author_id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      city: a.city,
      joinedDate: toDate(a.joined_date),
    });

    await User.create({
      email: a.email,
      passwordHash: authorHash,
      role: ROLES.AUTHOR,
      name: a.name,
      authorId: author._id,
    });

    const books = a.books.map((b) => ({
      bookCode: b.book_id,
      authorId: author._id,
      title: b.title,
      isbn: b.isbn,
      genre: b.genre,
      publicationDate: toDate(b.publication_date),
      status: b.status,
      mrp: b.mrp,
      authorRoyaltyPerCopy: b.author_royalty_per_copy,
      totalCopiesSold: b.total_copies_sold,
      totalRoyaltyEarned: b.total_royalty_earned,
      royaltyPaid: b.royalty_paid,
      royaltyPending: b.royalty_pending,
      lastRoyaltyPayoutDate: toDate(b.last_royalty_payout_date),
      printPartner: b.print_partner,
      availableOn: b.available_on,
    }));
    await Book.insertMany(books);
    bookCount += books.length;
  }

  for (const admin of ADMINS) {
    await User.create({ ...admin, passwordHash: adminHash, role: ROLES.ADMIN });
  }

  logger.info(`Seeded ${authors.length} authors, ${bookCount} books, ${ADMINS.length} admins`);
  logger.info(`Author login: <author email> / ${AUTHOR_PASSWORD}   (e.g. priya.sharma@email.com)`);
  logger.info(`Admin login:  ${ADMINS[0].email} / ${ADMIN_PASSWORD}`);
}

seed()
  .catch((err) => {
    logger.error('Seeding failed', err);
    process.exitCode = 1;
  })
  .finally(disconnectDB);