/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(
    "INSERT INTO users(id, username, password, fullname, created_at, updated_at) VALUES ('old_notes', 'migrated_9f85ebf8f8f6487d', 'old_notes', 'old notes', NOW(), NOW()) ON CONFLICT (id) DO NOTHING"
  );

  pgm.sql("UPDATE notes SET owner = 'old_notes' WHERE owner IS NULL");

  pgm.sql(`
    INSERT INTO users(id, username, password, fullname, created_at, updated_at)
    SELECT n.owner,
           CONCAT('migrated_', SUBSTRING(MD5(n.owner) FROM 1 FOR 16)),
           'old_notes',
           'migrated user',
           NOW(),
           NOW()
    FROM (
      SELECT DISTINCT owner
      FROM notes
      WHERE owner IS NOT NULL
    ) n
    LEFT JOIN users u ON u.id = n.owner
    WHERE u.id IS NULL
  `);

  pgm.addConstraint(
    'notes',
    'fk_notes.owner_users.id',
    'FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE'
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropConstraint('notes', 'fk_notes.owner_users.id');

  pgm.sql("UPDATE notes SET owner = NULL WHERE owner = 'old_notes'");

  pgm.sql("DELETE FROM users WHERE id = 'old_notes'");
};
