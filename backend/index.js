 
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
 
import connectDB from './config/dbconnect.js';
import { clerkWebhooks } from './controller/webhooks.js';
import { setServers } from "node:dns/promises";
import mongoose from "mongoose";

// 1️⃣ Set DNS servers
setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
 
 await connectDB();

app.get('/', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});
app.post('/clerk',express.json(),clerkWebhooks)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
