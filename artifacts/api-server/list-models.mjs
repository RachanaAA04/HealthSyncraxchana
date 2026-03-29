import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/rachana/healthsync/HealthSyncraxchana/artifacts/api-server/.env' });

async function run() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("No API key found in .env");
    return;
  }
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    console.log(JSON.stringify(data.models?.map(m => m.name), null, 2));
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}

run();
