const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Attempting to create admin account...");
    const { data, error } = await supabase.auth.signUp({
        email: 'admin@gmail.com',
        password: 'Admin123',
        options: {
            data: {
                tier: 'premium'
            }
        }
    });

    if (error) {
        console.error("Error creating user:", error.message);
    } else {
        console.log("User created successfully!");
        console.log("User ID:", data.user?.id);
        console.log("Note: If email confirmations are enabled in your Supabase project, you must verify the email before logging in.");
    }
}

run();
