fn main() -> Result<(), Box<dyn std::error::Error>> {
    let proto_root = if std::path::Path::new("../proto").exists() {
        "../proto"
    } else {
        "/proto"
    };

    tonic_build::configure()
        .build_server(true)
        .build_client(false)
        .compile_protos(
            &[
                &format!("{}/homeschool/v1/common.proto", proto_root),
                &format!("{}/homeschool/v1/auth.proto", proto_root),
                &format!("{}/homeschool/v1/lesson_plans.proto", proto_root),
                &format!("{}/homeschool/v1/moderation.proto", proto_root),
                &format!("{}/homeschool/v1/social.proto", proto_root),
            ],
            &[proto_root],
        )?;

    Ok(())
}
