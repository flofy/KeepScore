fn main() {
    // Re-run the build when the Rust sources change.
    println!("cargo:rerun-if-changed=src/");
}
