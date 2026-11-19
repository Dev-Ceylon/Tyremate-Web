-- Web edition: shared application settings (Cloudinary configuration, receipt
-- encryption key, ...). Stored in the database so every browser connected to
-- the same database shares them.
CREATE TABLE IF NOT EXISTS AppSettings (
  SettingKey TEXT PRIMARY KEY,
  SettingValue TEXT,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedBy TEXT
);
