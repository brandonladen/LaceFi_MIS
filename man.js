const bcrypt = require('bcrypt');
const { db } = require('./common/initializer');

async function addUser(email, password, role) {
  const hashedPassword = await bcrypt.hash(password, 10);
  db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(email, hashedPassword, role);
  console.log('User added successfully');
}

// Example Usage
addUser('', '', '');
