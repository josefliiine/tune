import express from "express";
import admin, { ServiceAccount } from "firebase-admin";
import serviceAccount from './serviceAccountKey.json';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import router from "./routes";
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// Initiate Firebase Admin
const typedServiceAccount = serviceAccount as ServiceAccount;
admin.initializeApp({
  credential: admin.credential.cert(typedServiceAccount),
  databaseURL: "https://tune-1ff2a.firebaseio.com",
});

const app = express();

// CORS middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use(morgan('dev'));

app.use('/', router);

const frontendDistPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDistPath));

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not defined.');
  process.exit(1);
}

mongoose.connect(DATABASE_URL)
  .then(async () => {
    console.log('Connected to MongoDB');
    console.log('Connected to database:', mongoose.connection.db!.databaseName);

    const collections = await mongoose.connection.db!.collections();
    console.log('Collections:');
    collections.forEach(col => console.log(col.collectionName));

    app.listen(PORT, () => {
      console.log(`Backend is on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Can not connect to MongoDB', err);
  });