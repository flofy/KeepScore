use std::path::Path;
use std::env;

fn main() {
    // Configuration pour la compilation Android
    let out_dir = Path::new(&env::var_os("OUT_DIR").unwrap());
    println!("cargo:rustc-link-arg=-Wl,--build-id=sha1");
    println!("cargo:rerun-if-changed=src/");
}