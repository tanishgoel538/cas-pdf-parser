/**
 * User Information Extractor
 * Extracts user details (name, email, phone) from CAS PDF header
 */

/**
 * Extracts user information from PDF text
 * @param {string} textContent - Extracted PDF text
 * @returns {Object} - User information object
 */
function extractUserInfo(textContent) {
  const userInfo = {
    name: null,
    email: null,
    phone: null,
    address: null
  };
  
  try {
    const lines = textContent.split('\n');
    
    // Extract email (usually appears as "Email Id: email@example.com")
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      const line = lines[i].trim();
      
      // Extract email
      if (line.includes('Email Id:') || line.includes('Email:')) {
        const emailMatch = line.match(/Email\s*(?:Id)?:\s*([^\s]+@[^\s]+)/i);
        if (emailMatch) {
          userInfo.email = emailMatch[1].trim();
        }
      }
      
      // Extract mobile/phone (usually appears as "Mobile: +91...")
      if (line.includes('Mobile:') || line.includes('Phone:')) {
        const phoneMatch = line.match(/(?:Mobile|Phone):\s*([\+\d\s\-\(\)]+)/i);
        if (phoneMatch) {
          userInfo.phone = phoneMatch[1].trim();
        }
      }
    }
    
    // Extract name (usually appears after Email Id and before address)
    // Name is typically on the line after "Email Id:"
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      const line = lines[i].trim();
      
      if (line.includes('Email Id:') && i + 1 < lines.length) {
        // Next non-empty line is usually the name
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nameLine = lines[j].trim();
          if (nameLine && 
              !nameLine.includes('Email') && 
              !nameLine.includes('Mobile') &&
              !nameLine.includes('Page') &&
              !nameLine.includes('Statement') &&
              !nameLine.match(/^\d/) && // Not starting with number
              nameLine.length > 3 &&
              nameLine.length < 100) {
            userInfo.name = nameLine;
            
            // Extract address (next few lines after name)
            const addressLines = [];
            for (let k = j + 1; k < Math.min(j + 10, lines.length); k++) {
              const addrLine = lines[k].trim();
              if (addrLine && 
                  !addrLine.includes('Mobile:') && 
                  !addrLine.includes('This Consolidated') &&
                  !addrLine.includes('Page ') &&
                  addrLine.length > 2) {
                addressLines.push(addrLine);
              } else if (addrLine.includes('Mobile:')) {
                break;
              }
            }
            if (addressLines.length > 0) {
              userInfo.address = addressLines.join(', ');
            }
            break;
          }
        }
        break;
      }
    }
    
    console.log('📋 User Information Extracted:');
    console.log(`   Name: ${userInfo.name || 'Not found'}`);
    console.log(`   Email: ${userInfo.email || 'Not found'}`);
    console.log(`   Phone: ${userInfo.phone || 'Not found'}`);
    if (userInfo.address) {
      console.log(`   Address: ${userInfo.address.substring(0, 50)}...`);
    }
    
  } catch (error) {
    console.error('Error extracting user info:', error.message);
  }
  
  return userInfo;
}

module.exports = {
  extractUserInfo
};
