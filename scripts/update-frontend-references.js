const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to recursively find all .jsx and .js files in the client directory
function findJsxAndJsFiles(clientDir) {
  return glob.sync(path.join(clientDir, '**/*.{jsx,js}'));
}

// Function to replace all occurrences of CertificateNFT with SoulboundCertificateNFT in a file
function updateFileReferences(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file contains any references to update
    if (content.includes('contractAddress.CertificateNFT') || 
        content.includes('contractABI.CertificateNFT')) {
      
      // Replace the references
      const updatedContent = content
        .replace(/contractAddress\.CertificateNFT/g, 'contractAddress.SoulboundCertificateNFT')
        .replace(/contractABI\.CertificateNFT/g, 'contractABI.SoulboundCertificateNFT');
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      
      return true; // File was updated
    }
    
    return false; // No updates needed
  } catch (error) {
    console.error(`Error updating file ${filePath}:`, error);
    return false;
  }
}

// Main function to update all files
function updateAllFiles() {
  const clientDir = path.join(__dirname, '../client');
  const files = findJsxAndJsFiles(clientDir);
  
  let updatedFiles = 0;
  
  // Update each file
  for (const file of files) {
    const wasUpdated = updateFileReferences(file);
    if (wasUpdated) {
      console.log(`Updated references in: ${path.relative(clientDir, file)}`);
      updatedFiles++;
    }
  }
  
  console.log(`\nUpdated ${updatedFiles} files`);
}

// Run the update function
updateAllFiles(); 