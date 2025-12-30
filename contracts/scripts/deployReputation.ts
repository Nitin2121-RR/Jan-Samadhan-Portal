import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Deploying ReputationRegistry contract...");

  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const registry = await ReputationRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("ReputationRegistry deployed to:", address);

  // If on a real network, verify the contract
  if (process.env.ETHERSCAN_API_KEY && process.env.SEPOLIA_RPC_URL) {
    console.log("Waiting for block confirmations...");
    await registry.deploymentTransaction()?.wait(5);

    console.log("Verifying contract on Etherscan...");
    try {
      await ethers.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }

  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", address);
  console.log("Network:", process.env.SEPOLIA_RPC_URL ? "Sepolia" : "Local");
  console.log("\nAdd this to your .env file:");
  console.log(`REPUTATION_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
