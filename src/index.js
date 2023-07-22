const express = require("express")
const mysql = require("mysql")
const path = require("path")
const app = express()
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "todolist"
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        throw err;
    }
    console.log("Connected to MySQL");
});



app.post('/user/register', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
  
    // Generate a salt and hash the password
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error hashing password' });
      }
  
      const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
      const values = [name, email, hashedPassword];
  
      db.query(sql, values, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: 'Error inserting data into MySQL' });
        }
        req.session.userId = result.insertId;
  
        // Generate JWT token
        const token = generateToken(result.insertId);
  
        // Set the token as a cookie
        res.cookie('token', token, { maxAge: 3600000, httpOnly: true });
  
        // Redirect to home page
        res.redirect('/login');
        
      });
    });
  });
  


app.post('/user/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const sql = 'SELECT * FROM users WHERE email = ?';
  
    db.query(sql, [email], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error executing MySQL query' });
      }
  
      if (result.length === 0) {
        // User not found
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
      const hashedPassword = result[0].password;
  
      // Compare the inputted password with the hashed password
      bcrypt.compare(password, hashedPassword, (err, passwordMatch) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: 'Error comparing passwords' });
        }
  
        if (!passwordMatch) {
          // Invalid password
          return res.status(401).json({ error: 'Invalid email or password' });
        }
  

        req.session.userId = result[0].id;

        // Authentication successful, generate JWT token
        const token = generateToken(result[0].userId);
  
        // Set the token as a cookie
        res.cookie('token', token, { maxAge: 3600000, httpOnly: true });
  
        // Redirect to home page
        res.redirect('/home');
      });
    });
  });
  

  
  
  app.post("/todo/create", authenticateUser, (req, res) => {
    const title = req.body.title;
    const userId = req.session.userId; // Access the userId from the authenticated user's session
  

    const sql = "INSERT INTO todolist (title, user_id) VALUES (?, ?)";
    const values = [title, userId];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Error inserting data into MySQL" });
      }
      res.redirect("/home");
    });
  });
  
  

app.post("/todo/update/:id", (req, res) => {
    const id = req.params.id;
    const title = req.body.title;
    const sql = "UPDATE todolist SET title = ? WHERE id = ?";
    db.query(sql, [title, id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error updating data into MySQL" });
        }
        res.redirect("/home");
    });
});


app.get("/todo/edit/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM todolist WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error executing MySQL query" });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "Todo not found" });
        }
        res.render("todo-edit", { todo: result[0] });
    });
});

app.get("/todo/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM todolist WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error deleting data from MySQL" });
        }
        res.redirect("/home");
    });
});



app.listen(port, () => {
  

    console.log('port connected');
})