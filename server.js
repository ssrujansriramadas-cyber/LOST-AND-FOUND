const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req,res)=>{
    res.send("Lost and Found server running");
});

app.listen(3000, ()=>{
    console.log("Server running on port 3000");
});