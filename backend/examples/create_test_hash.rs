use bcrypt;

fn main() {
    // Create hash for E2E testing
    let password = "test1234";
    let hash = bcrypt::hash(password, bcrypt::DEFAULT_COST).unwrap();

    println!("Password: {}", password);
    println!("Hash: {}", hash);
    println!();
    println!("SQL to update users:");
    println!(
        "UPDATE users SET password_hash = '{}' WHERE username IN ('admin', 'testuser');",
        hash
    );

    // Verify
    let verified = bcrypt::verify(password, &hash).unwrap();
    println!();
    println!("Verification test: {}", verified);
}
