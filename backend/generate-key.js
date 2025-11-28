#!/usr/bin/env node

/**
 * Encryption Key Generator
 * Generates secure encryption keys for production use
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('\n🔐 Encryption Key Generator\n');
console.log('═'.repeat(60));

// Generate a new encryption key
const key = crypto.randomBytes(32).toString('hex');

console.log('\n✅ New Encryption Key Generated:\n');
console.log(`   ${key}`);
console.log('\n' + '═'.repeat(60));

console.log('\n📋 Instructions:\n');
console.log('1. Copy the key above');
console.log('2. For Render deployment:');
console.log('   - Go to Render Dashboard → Your Service → Environment');
console.log('   - Add: ENCRYPTION_KEY = <paste-key-here>');
console.log('\n3. For local development:');
console.log('   - Update backend/.env file');
console.log('   - Set: ENCRYPTION_KEY=' + key);
console.log('\n4. For frontend (if using client-side encryption):');
console.log('   - Update frontend/.env file');
console.log('   - Set: REACT_APP_ENCRYPTION_KEY=' + key);

console.log('\n⚠️  IMPORTANT SECURITY NOTES:\n');
console.log('   • Never commit this key to version control');
console.log('   • Use different keys for dev/staging/production');
console.log('   • Store production keys only in secure environment variables');
console.log('   • Rotate keys periodically for enhanced security');
console.log('   • Keep a secure backup of your production key');

console.log('\n' + '═'.repeat(60));

// Ask if user wants to save to .env file
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('\n💾 Save this key to backend/.env file? (y/N): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    const envPath = path.join(__dirname, '.env');
    
    try {
      let envContent = '';
      
      // Read existing .env if it exists
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        
        // Update existing ENCRYPTION_KEY or add new one
        if (envContent.includes('ENCRYPTION_KEY=')) {
          envContent = envContent.replace(
            /ENCRYPTION_KEY=.*/,
            `ENCRYPTION_KEY=${key}`
          );
        } else {
          envContent += `\n# Encryption Configuration\nENCRYPTION_KEY=${key}\n`;
        }
      } else {
        // Create new .env file
        envContent = `# Local Development Environment Variables
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Server Configuration
PORT=5000

# File Upload Configuration
MAX_FILE_SIZE=10485760

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Encryption Configuration
ENCRYPTION_KEY=${key}

# Environment
NODE_ENV=development
`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ Key saved to backend/.env');
      console.log('   You can now start the server with encryption enabled.');
      
    } catch (error) {
      console.error('\n❌ Error saving to .env:', error.message);
    }
  } else {
    console.log('\n📝 Key not saved. Remember to add it manually to your environment variables.');
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n🎉 Done! Your encryption key is ready to use.\n');
  
  readline.close();
});
