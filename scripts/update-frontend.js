const fs = require('fs');
const path = require('path');

// Update the frontend contract address file with the new contract address
async function updateFrontendConfig(network, contractAddress) {
  console.log(`Updating frontend config for ${network} with address ${contractAddress}`);
  
  const configPath = path.join(__dirname, '../client/src/config/contractAddress.json');
  
  // Read the current config
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error('Error reading config file:', error);
    return;
  }
  
  // Remove any old CertificateNFT references
  if (config.CertificateNFT) {
    delete config.CertificateNFT;
  }
  
  // Update the network-specific address
  if (config[network]) {
    // Remove old reference if exists
    if (config[network].CertificateNFT) {
      delete config[network].CertificateNFT;
    }
    config[network].SoulboundCertificateNFT = contractAddress;
  } else {
    config[network] = { SoulboundCertificateNFT: contractAddress };
  }
  
  // If the network is sepolia, also update the default
  if (network === 'sepolia') {
    config.defaultNetwork = 'sepolia';
    config.SoulboundCertificateNFT = contractAddress;
  }
  
  // Write the updated config back to the file
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Frontend config updated successfully!');
  } catch (error) {
    console.error('Error writing config file:', error);
  }
}

// Export the function for use in other scripts
module.exports = { updateFrontendConfig };

// If this script is run directly, process command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error('Usage: node update-frontend.js <network> <contractAddress>');
    process.exit(1);
  }
  
  const [network, contractAddress] = args;
  updateFrontendConfig(network, contractAddress);
} 