use bcrypt;

fn main() {
    let password = "testpassword";
    let hash = bcrypt::hash(password, bcrypt::DEFAULT_COST).unwrap();
    println!("Password: {}", password);
    println!("Hash: {}", hash);

    // Verify it works
    let verified = bcrypt::verify(password, &hash).unwrap();
    println!("Verification: {}", verified);
}
