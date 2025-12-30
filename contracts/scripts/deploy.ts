import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Deploying GrievanceRegistry contract...");

  const GrievanceRegistry = await ethers.getContractFactory("GrievanceRegistry");
  const registry = await GrievanceRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("GrievanceRegistry deployed to:", address);

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
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

