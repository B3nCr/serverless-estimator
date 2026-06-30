const fs = require('fs');
const path = require('path');

const outputsPath = path.join(__dirname, '..', 'cdk-outputs.json');
if (!fs.existsSync(outputsPath)) {
  console.error('cdk-outputs.json not found. Run: npx cdk deploy BackendStack --outputs-file cdk-outputs.json');
  process.exit(1);
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
const customDomainUrl = outputs?.BackendStack?.CustomDomainUrl;
if (!customDomainUrl) {
  console.error('BackendStack.CustomDomainUrl missing from cdk-outputs.json');
  process.exit(1);
}

const envContent = `VITE_API_URL=${customDomainUrl}/api\n`;
const envPath = path.join(__dirname, '..', '..', 'frontend', '.env.production');
fs.writeFileSync(envPath, envContent);
console.log(`Wrote ${envPath}`);
console.log(`VITE_API_URL=${customDomainUrl}/api`);
