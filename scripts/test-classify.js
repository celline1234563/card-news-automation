#!/usr/bin/env node
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { GoogleGenAI } from '@google/genai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || join(__dirname, '..', 'config', 'google-service-account.json');
const key = JSON.parse(await readFile(keyPath, 'utf-8'));
const auth = new google.auth.GoogleAuth({ credentials: key, scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
const drive = google.drive({ version: 'v3', auth });
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

const folderId = '1CupDxpMMYrvK6ZhbpYhznyI1b2oW5wgM'; // 2관교실
const res = await drive.files.list({
  q: `'${folderId}' in parents and mimeType contains 'image/'`,
  fields: 'files(id, name, mimeType)',
  pageSize: 3,
});

for (const f of res.data.files) {
  console.log('\n---', f.name);
  const meta = await drive.files.get({ fileId: f.id, fields: 'thumbnailLink' });
  const thumbUrl = meta.data.thumbnailLink;
  if (!thumbUrl) { console.log('no thumb'); continue; }

  const hiResUrl = thumbUrl.replace(/=s\d+/, '=s800');
  const thumbRes = await fetch(hiResUrl);
  const b64 = Buffer.from(await thumbRes.arrayBuffer()).toString('base64');
  console.log('thumb size:', (b64.length / 1024).toFixed(0), 'KB');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { inlineData: { data: b64, mimeType: 'image/jpeg' } },
      { text: '이 이미지를 분류: 수업사진/학생사진/학원외관/상담사진/스킵. JSON만: {"category":"...","reason":"...","confidence":0.0~1.0,"tags":[]}' },
    ],
  });
  console.log('결과:', response.text.trim());
}
