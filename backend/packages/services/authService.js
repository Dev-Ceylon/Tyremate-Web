const authRepo = require("../repositories/authRepository")
const bcrypt = require("bcryptjs")
const DEFAULT_USER_PASSWORD = "1234" // matches packages/database/seed.js

exports.login = async (username, password) => {

  const user = authRepo.findByUsername(username)

  if (!user) {
    throw new Error("User not found")
  }

  if (user.isActive === 0) {
    throw new Error("Account is disabled")
  }

  const isValid = await bcrypt.compare(password, user.password_hash)

  if (!isValid) {
    throw new Error("Invalid password")
  }

  const roles = authRepo.getRolesByUserId(user.id)
  const permissions = authRepo.getPermissionsByUserId(user.id)

  const { password_hash, ...safeUser } = user

  return {
    ...safeUser,
    roles,
    permissions,
    // Web edition: lets the UI nag users still on the seeded default password.
    usingDefaultPassword: password === DEFAULT_USER_PASSWORD,
  }
}
