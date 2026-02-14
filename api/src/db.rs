use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

const POOL_SIZE_MAX: u32 = 10;
const POOL_CONNECT_TIMEOUT_SECONDS: u64 = 30;

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(POOL_SIZE_MAX)
        .acquire_timeout(std::time::Duration::from_secs(POOL_CONNECT_TIMEOUT_SECONDS))
        .connect(database_url)
        .await?;

    tracing::info!("[db] connected to PostgreSQL");
    Ok(pool)
}

pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Read and execute migration file
    let migration_sql = include_str!("../migrations/001_initial.up.sql");

    sqlx::raw_sql(migration_sql).execute(pool).await?;

    tracing::info!("[db] migrations applied");
    Ok(())
}
