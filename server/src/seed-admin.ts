import { pool } from "./db.js";
import bcrypt from "bcryptjs";

async function seedAdmin() {
    const email = 'admin@voodoo808.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        console.log('Checking for admin user...');
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        
        if (existing.rows.length === 0) {
            console.log('Creating admin user...');
            await pool.query(
                'INSERT INTO users (email, password, is_admin) VALUES ($1, $2, true)',
                [email, hashedPassword]
            );
            console.log('Admin user created successfully!');
        } else {
            console.log('Admin user already exists, updating status...');
            await pool.query(
                'UPDATE users SET is_admin = true WHERE email = $1',
                [email]
            );
            console.log('Admin status updated!');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        process.exit(0);
    }
}

seedAdmin();
