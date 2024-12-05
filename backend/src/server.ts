import express from "express";
import admin, { ServiceAccount } from "firebase-admin";
import serviceAccount from './serviceAccountKey.json';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import router from "./routes";

// Initiate Firebase Admin
const typedServiceAccount = serviceAccount as ServiceAccount;
admin.initializeApp({
  credential: admin.credential.cert(typedServiceAccount),
  databaseURL: "tune-1ff2a",
});

const db = admin.firestore();
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

app.listen(3000, () => {
  console.log("Backend is running on http://localhost:3000");
});