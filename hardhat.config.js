require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("hardhat-contract-sizer"); // ✅ Add this line

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100
      },
      viaIR: true,
      evmVersion: "london",
      debug: {
        revertStrings: "debug"
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 0
      }
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/kepUw7sPrkvIrU8AH0CJBX3jqBI4sgq_",
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY
    }
  },
  contractSizer: { // ✅ Add this block
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true, // runs automatically when you compile
    strict: true
  }
};
