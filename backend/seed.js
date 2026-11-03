// backend/seed.js
// Seeds the database with fictional demo accounts and initial issues
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { pool, initDb } = require('./db');

dotenv.config();

const seed = async () => {
  console.log('[Seed] Initializing tables...');
  await initDb();

  console.log('[Seed] Clearing existing issues and users...');
  await pool.query('TRUNCATE issues, users RESTART IDENTITY CASCADE;');

  const passwordHash = await bcrypt.hash('DemoPass123!', 10);
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (!superAdminPassword) throw new Error('Set SUPER_ADMIN_PASSWORD before seeding.');
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superAdminEmail) throw new Error('Set SUPER_ADMIN_EMAIL before seeding.');

  // Fictional demo users (one per role + super_admin)
  const users = [
    { name: 'Amina Yusuf', email: 'amina@example.com', password_hash: passwordHash, role: 'student' },
    { name: 'David Mwangi', email: 'david@example.com', password_hash: passwordHash, role: 'staff' },
    { name: 'Tunde Bello', email: 'tunde@example.com', password_hash: passwordHash, role: 'maintenance' },
    { name: 'Grace Okoro', email: 'grace@example.com', password_hash: passwordHash, role: 'admin' },
    { name: 'Musa Ibrahim', email: superAdminEmail, password_hash: superAdminHash, role: 'super_admin' },
  ];

  console.log('[Seed] Inserting demo users...');
  const insertedUsers = {};
  for (const u of users) {
    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [u.name, u.email, u.password_hash, u.role]
    );
    insertedUsers[u.name] = res.rows[0].id;
  }

  // 8 fictional issues matching design mockups & requirements
  const issues = [
    {
      title: 'Broken light in corridor',
      description: 'The ceiling fluorescent light in the corridor flickers violently and is completely dark at night.',
      category: 'Electrical',
      location: 'Library, 2nd floor',
      status: 'Open',
      reporter_id: insertedUsers['Amina Yusuf'],
    },
    {
      title: 'Leaking tap in washroom',
      description: 'The second sink faucet from the door is continuously running water, flooding the washroom floor.',
      category: 'Plumbing',
      location: 'Science block',
      status: 'In Progress',
      reporter_id: insertedUsers['Tunde Bello'],
    },
    {
      title: 'Wi-Fi down in lecture hall',
      description: 'Access point AP-LH-04 is blinking orange. Students are unable to connect to Campus-Student Wi-Fi.',
      category: 'Network',
      location: 'Lecture Hall B',
      status: 'Resolved',
      reporter_id: insertedUsers['Grace Okoro'],
    },
    {
      title: 'Broken desk',
      description: 'One metal leg is detached from the wooden tabletop. Needs welding or bracket reattachment.',
      category: 'Furniture',
      location: 'Room 14',
      status: 'Open',
      reporter_id: insertedUsers['Amina Yusuf'],
    },
    {
      title: 'Projector will not turn on',
      description: 'HDMI indicator lamp flashes red and power button does not respond to remote or physical buttons.',
      category: 'Electrical',
      location: 'Room 9',
      status: 'Open',
      reporter_id: insertedUsers['Musa Ibrahim'],
    },
    {
      title: 'Blocked drain behind hostel A',
      description: 'Rainwater is backing up into the walkway due to leaves and debris clogging the drainage grate.',
      category: 'Plumbing',
      location: 'Hostel A',
      status: 'In Progress',
      reporter_id: insertedUsers['Amina Yusuf'],
    },
    {
      title: 'Ethernet wall jack loose',
      description: 'The wall socket port 3B in lab 2 is cracked and dislodged from the dry wall plate.',
      category: 'Network',
      location: 'Computer Lab 2',
      status: 'Open',
      reporter_id: insertedUsers['David Mwangi'],
    },
    {
      title: 'Broken door handle',
      description: 'Lounge door handle came off completely, preventing easy exit unless propped open.',
      category: 'Furniture',
      location: 'Faculty Lounge',
      status: 'Resolved',
      reporter_id: insertedUsers['David Mwangi'],
    },
  ];

  console.log('[Seed] Inserting demo issues...');
  for (const item of issues) {
    await pool.query(
      `INSERT INTO issues (title, description, category, location, status, reporter_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [item.title, item.description, item.category, item.location, item.status, item.reporter_id]
    );
  }

  console.log('[Seed] Seed completed successfully with 5 users and 8 issues.');
  await pool.end();
};

seed().catch((err) => {
  console.error('[Seed] Error seeding database:', err);
  process.exit(1);
});
