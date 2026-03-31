function getBaseDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  return process.env.DATABASE_URL;
}

export function getDatabaseName(connectionString = getBaseDatabaseUrl()) {
  const url = new URL(connectionString);
  const databaseName = url.pathname.replace(/^\//, '');

  if (!databaseName) {
    throw new Error('Database name is missing in connection string');
  }

  return databaseName;
}

export function getDefaultTestDatabaseUrl() {
  const baseDatabaseUrl = getBaseDatabaseUrl();
  const databaseName = getDatabaseName(baseDatabaseUrl);

  if (databaseName.endsWith('_test')) {
    return baseDatabaseUrl;
  }

  const url = new URL(baseDatabaseUrl);

  url.pathname = `/${databaseName}_test`;
  return url.toString();
}

export function getDatabaseUrl() {
  if (process.env.NODE_ENV === 'test') {
    return process.env.DATABASE_TEST_URL || getDefaultTestDatabaseUrl();
  }

  return getBaseDatabaseUrl();
}

export function getAdminDatabaseUrl(connectionString = getDatabaseUrl()) {
  const url = new URL(connectionString);

  url.pathname = '/postgres';
  return url.toString();
}
