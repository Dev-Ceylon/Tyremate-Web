const db = require("../database/connection")

exports.getAllProducts = () => {
  return db.prepare("SELECT * FROM products").all()
}

exports.createProduct = (name, price) => {
  return db.prepare(
    "INSERT INTO products(name, price) VALUES (?, ?)"
  ).run(name, price)
}