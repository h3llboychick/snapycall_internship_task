export class PostgresMigrationStorage {
  constructor(pool) {
    this.pool = pool;
  }

  async ensureTable() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS umzug_migrations (
        name TEXT PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  async executed() {
    await this.ensureTable();

    const result = await this.pool.query(`
      SELECT name
      FROM umzug_migrations
      ORDER BY executed_at, name
    `);

    return result.rows.map((row) => row.name);
  }

  async logMigration({ name }) {
    await this.ensureTable();

    await this.pool.query(
      "INSERT INTO umzug_migrations (name) VALUES ($1)",
      [name]
    );
  }

  async unlogMigration({ name }) {
    await this.ensureTable();

    await this.pool.query(
      "DELETE FROM umzug_migrations WHERE name = $1",
      [name]
    );
  }
}
