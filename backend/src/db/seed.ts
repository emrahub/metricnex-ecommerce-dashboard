import Database from '../config/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seedDatabase() {
  const db = Database.getInstance();
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Check if the user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@example.com']
    );

    if (existingUser.rows.length > 0) {
      console.log('Demo user already exists.');
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('password', saltRounds);

    // Insert the demo user
    await client.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        uuidv4(),
        'admin@example.com',
        hashedPassword,
        'Admin',
        'User',
        'admin',
        true,
      ]
    );

    await client.query('COMMIT');
    console.log('Database seeded with demo user.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
  } finally {
    client.release();
    db.close();
  }
}

seedDatabase();
