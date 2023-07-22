const express = require("express")
const mysql = require("mysql")
const path = require("path")
const app = express()


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
