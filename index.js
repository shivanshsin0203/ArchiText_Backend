const express = require("express");
const fs = require('fs');
const path = require('path');
const app = express();
const OpenAI= require('openai');
const bodyParser = require("body-parser");
const cors = require("cors");
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/generated', express.static(path.join(__dirname, 'generated')));
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


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


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
app.post('/prompt', async (req, res) => {
    const prompt = req.body.prompt;
    const actual_prompt = "I want to " + prompt + ". I want you to give me a title of 3 words and 5 lines of content. Specify title and content.";

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: actual_prompt }],
            temperature: 0.9,
            max_tokens: 150,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });

        const content = response.choices[0].message.content;

        
        const lines = content.split("\n");
        const title = lines[0].replace("Title: ", "").trim();
        const contentArray = lines.slice(1)
            .filter(line => line.trim() !== "" && !line.startsWith("Content:"))
            .map(line => line.replace(/^\d+\.\s*/, '').trim());
        console.log("Title:", title);
        console.log("Content:", contentArray);

        res.json({ title, content: contentArray });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "An error occurred while processing your request." });
    }
});



app.listen(3005, async () => {
    console.log("Server Started at " + 3005);
    await connect();
    console.log("Connected to database");
  });