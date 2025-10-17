use bcrypt;

fn main() {
    let hash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    let passwords_to_try = vec![
        "password123",
        "password",
        "admin",
        "admin123",
        "testpassword",
        "test123",
    ];

    println!("Testing hash: {}", hash);
    println!("---");

    for password in passwords_to_try {
        match bcrypt::verify(password, hash) {
            Ok(true) => println!("✅ MATCH: {}", password),
            Ok(false) => println!("❌ NO MATCH: {}", password),
            Err(e) => println!("ERROR verifying {}: {}", password, e),
        }
    }
}
