const { Client } = require('pg');

const connString = process.env.DATABASE_URL;

async function run() {
    const client = new Client({ connectionString: connString });

    try {
        await client.connect();
        console.log("Connected to Database!");

        // First, delete the old admin user if exists (it had a bad password hash)
        await client.query(`DELETE FROM auth.users WHERE email = 'admin@gmail.com'`);
        console.log("Cleaned up old admin user (if any).");

        // Re-insert with correct bcrypt hash using pgcrypto
        // Make sure pgcrypto is enabled
        await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

        const insertQuery = `
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@gmail.com',
            crypt('Admin123', gen_salt('bf')),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"tier":"premium"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        )
        RETURNING id, email;
    `;

        const insertRes = await client.query(insertQuery);
        console.log("Admin user created successfully!");
        console.log("User ID:", insertRes.rows[0].id);
        console.log("Email:", insertRes.rows[0].email);
        console.log("Password: Admin123");

        // Also insert into auth.identities (required by Supabase Auth)
        const userId = insertRes.rows[0].id;
        const identityQuery = `
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            '${userId}',
            jsonb_build_object('sub', '${userId}', 'email', 'admin@gmail.com', 'email_verified', true, 'phone_verified', false),
            'email',
            '${userId}',
            now(),
            now(),
            now()
        );
    `;
        await client.query(identityQuery);
        console.log("Identity record created!");
        console.log("\n✅ You can now login with admin@gmail.com / Admin123");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
