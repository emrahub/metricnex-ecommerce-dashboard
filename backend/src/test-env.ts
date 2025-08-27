import dotenv from 'dotenv';
dotenv.config();

console.log('Environment test:');
const base64 = process.env.GOOGLE_CREDENTIALS_BASE64;
console.log('Base64 exists:', !!base64);
console.log('Base64 length:', base64?.length);
console.log('First 50 chars:', base64?.substring(0, 50));

if (base64) {
  try {
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    console.log('Decoded successfully');
    console.log('Decoded length:', decoded.length);
    const parsed = JSON.parse(decoded);
    console.log('JSON parsed successfully');
    console.log('Project ID:', parsed.project_id);
    console.log('Client Email:', parsed.client_email);
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}