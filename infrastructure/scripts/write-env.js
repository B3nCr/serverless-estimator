const fs = require('fs');
const path = require('path');

const outputsPath = path.join(__dirname, '..', 'cdk-outputs.json');
if (!fs.existsSync(outputsPath)) {
  console.error('cdk-outputs.json not found. Run: npx cdk deploy BackendStack --outputs-file cdk-outputs.json');
  process.exit(1);
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
const apiUrl = outputs?.BackendStack?.ApiUrl;
if (!apiUrl) {
  console.error('BackendStack.ApiUrl missing from cdk-outputs.json');
  process.exit(1);
}

// API_URL ends with /prod/ — append 'api' so the frontend hits /prod/api/estimate
const viteApiUrl = `${apiUrl}api`;
const envContent = `VITE_API_URL=${viteApiUrl}\n`;

const envPath = path.join(__dirname, '..', '..', 'frontend', '.env.production');
fs.writeFileSync(envPath, envContent);
console.log(`Wrote ${envPath}`);
console.log(`VITE_API_URL=${viteApiUrl}`);
