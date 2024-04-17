const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const OpenAI = require("openai");
const bodyParser = require("body-parser");
const template=require('./templates/templates')
const cors = require("cors");
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/generated", express.static(path.join(__dirname, "generated")));
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { url } = require("inspector");
const { title } = require("process");
dotenv.config();
const mongoUrl = process.env.mongoUrl;
const connect = async () => {
  await mongoose.connect(mongoUrl);
};
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  credits: Number,
  profilePic: String,
});
const webSchema = new mongoose.Schema({
    email: String,
    url: String,
    title: String,
});
const User = mongoose.model("user", userSchema);
const Web = mongoose.model("websites", webSchema);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/signin", async (req, res) => {
  const profile = req.body;

  const exist = await User.findOne({ email: profile.email.email });
  if (!exist) {
    await User.create({
      name: profile.email.name,
      email: profile.email.email,
      credits: 1,
      profilePic: profile.email.picture,
    });
  }

  res.json({ message: "Logged in successfully" });
});
app.get("/user/:email", async (req, res) => {
  const user_email = req.params.email;
  const users = await User.find({ email: user_email });
  
  res.json(users);
});
app.post("/prompt", async (req, res) => {
    const email=req.body.email;
    const checkCredits= await User.findOne({email:email});
    if(checkCredits.credits<=0){
        res.json({message:"You have insufficient credits"})
    }
  const prompt = req.body.prompt;
  const actual_prompt =
    "I want to " +
    prompt +
    ". I want you to give me a name of 2 words a title of 7 words and 5 lines of content. Specify title content .";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: actual_prompt }],
      temperature: 0.9,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    
    const content = response.choices[0].message.content;
    console.log(content);
    const lines = content.trim().split("\n");

    // Initialize variables to hold the extracted data.
    let name = "";
    let title = "";
    let contentArray = [];
    
    // Use loop to process each line.
    lines.forEach((line) => {
      // Check if the line contains the name.
      if (line.startsWith("Name: ")) {
        name = line.replace("Name: ", "").trim();
      }
      // Check if the line contains the title.
      else if (line.startsWith("Title: ")) {
        title = line.replace("Title: ", "").trim().replace(/"/g, ""); // Remove quotation marks
      }
      // Check if the line contains the content.
      else if (line.startsWith("Content:")) {
        // Nothing to do here, as the actual content starts in the following lines.
      }
      // Lines with numeric bullet points are considered as part of the content.
      else if (line.match(/^\d+\./)) {
        contentArray.push(line.replace(/^\d+\.\s*/, "").trim());
      }
    });
    
    // Remove extra spaces from name and title.
    name = name.replace(/\s+/g, " ");
    title = title.replace(/\s+/g, " ");
    
    // Output the results.
    console.log("Name:", name);
    console.log("Title:", title);
    console.log("Content:", contentArray);
    const image=await openai.images.generate({  model:"dall-e-2",
    prompt:`${title} `,
    size:"1024x1024",
    quality:"standard",
    n:1,})
       console.log(image)
      

    const htmlTemplate = template(name, title, contentArray,image.data[0].url);

    const filename = `${Date.now()}.html`;
    const filePath = path.join(__dirname, "generated", filename);

    const directoryPath = path.join(__dirname, "generated");
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath);
    }

    fs.writeFileSync(filePath, htmlTemplate);
    const create=await Web.create({email:email,url:`http://localhost:3005/generated/${filename}`,title:name});
      
    res.status(200).json({
      message: "HTML file created successfully",
      url: `http://localhost:3005/generated/${filename}`,
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});
app.post('/test',async(req,res)=>{
    const er=await openai.images.generate({  model:"dall-e-2",
     prompt:"a white siamese cat",
     size:"1024x1024",
     quality:"standard",
     n:1,})
        console.log(er)
        res.json({url:er.data[0].url})
})
app.listen(3005, async () => {
  console.log("Server Started at " + 3005);
  await connect();
  console.log("Connected to database");
});
