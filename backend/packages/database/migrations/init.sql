
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  password_hash TEXT,
  displayName TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roles (
  roleId INTEGER PRIMARY KEY,
  roleName TEXT,
  description TEXT,
  isSystem INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS userRoles (
  userId INTEGER NOT NULL,
  roleId INTEGER NOT NULL,
  PRIMARY KEY (userId, roleId),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (roleId) REFERENCES roles(roleId)
);

CREATE TABLE IF NOT EXISTS permissions (
  permissionId INTEGER PRIMARY KEY AUTOINCREMENT,
  permissionKey TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS rolePermissions (
  roleId INTEGER NOT NULL,
  permissionId INTEGER NOT NULL,
  PRIMARY KEY (roleId, permissionId),
  FOREIGN KEY (roleId) REFERENCES roles(roleId),
  FOREIGN KEY (permissionId) REFERENCES permissions(permissionId)
);
