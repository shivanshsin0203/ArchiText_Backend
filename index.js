const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const mongoUrl = process.env.mongoUrl;
const connect = async () => {
  await mongoose.connect(mongoUrl);
};
const userSchema =new mongoose.Schema({
    name:String,
    email:String,
    credits:Number,
    profilePic:String 
})
const User = mongoose.model("user",userSchema);
app.post('/signin',async (req,res)=>{
    const profile= req.body;
    
    const exist= await User.findOne({email:profile.email.email});
    if(!exist){
        await User.create({name:profile.email.name,email:profile.email.email,credits:1,profilePic:profile.email.picture});
    }
   
    res.json({message:"Logged in successfully"});
})
app.get('/user/:email',async (req,res)=>{
    const user_email= req.params.email;
    const users= await User.find({email:user_email});
    res.json(users);
})
app.listen(3005, async () => {
    console.log("Server Started at " + 3005);
    await connect();
    console.log("Connected to database");
  });