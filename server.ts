import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Path to persistent server-side JSON database
const DB_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'server_db.json');

// Ensure parent directories exist
const dir = path.dirname(DB_FILE_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Endpoint to fetch public/shared data
app.get('/api/db', (req: Request, res: Response) => {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return res.json(JSON.parse(data));
    }
    return res.json({});
  } catch (error) {
    console.error('Error reading server database:', error);
    res.status(500).json({ error: 'Failed to read server database' });
  }
});

// Endpoint to update shared data (catalog, orders, branding, etc.)
app.post('/api/db', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error writing server database:', error);
    res.status(500).json({ error: 'Failed to write server database' });
  }
});

import { initializeApp, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin
if (getApps().length === 0) {
  try {
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'tactical-codex-mxjsq'
    });
    console.log('Firebase Admin initialized');
  } catch (err) {
    console.error('Firebase Admin initialization error:', err);
  }
}

app.post('/api/push-notification', async (req: Request, res: Response) => {
  try {
    const { token, title, body, url } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const message = {
      notification: {
        title: title || 'StreamSync Pro',
        body: body || 'Nueva notificación',
      },
      data: {
        url: url || '/',
      },
      token: token,
    };

    const response = await getMessaging().send(message);
    console.log('Successfully sent message:', response);
    res.json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ error: 'Failed to send push notification' });
  }
});

app.post('/api/gemini', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Gemini API error' });
  }
});

export default app;
