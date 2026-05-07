const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Network:", hre.network.name);
    console.log("Deploying with account:", deployer.address);

    // ── EntryPoint ─────────────────────────────────────────────────────────
    let entryPointAddress;

    if (hre.network.name === "sepolia") {
        entryPointAddress = ENTRY_POINT_ADDRESS;
        console.log("EntryPoint:", entryPointAddress);
    } else {
        console.log("\nDeploying MockEntryPoint for localhost...");
        const MockEntryPoint = await hre.ethers.getContractFactory("MockEntryPoint");
        const mockEntryPoint = await MockEntryPoint.deploy();
        await mockEntryPoint.deployed();
        entryPointAddress = mockEntryPoint.address;
        console.log("MockEntryPoint deployed to:", entryPointAddress);
    }

    // ── Deploy SmartAccountFactory ─────────────────────────────────────────
    console.log("\nDeploying SmartAccountFactory...");
    const SmartAccountFactory = await hre.ethers.getContractFactory("SmartAccountFactory");
    const factory = await SmartAccountFactory.deploy(entryPointAddress);
    await factory.deployed();
    console.log("SmartAccountFactory deployed to:", factory.address);

    // ── Deploy Paymaster ───────────────────────────────────────────────────
    console.log("\nDeploying Paymaster...");
    const Paymaster = await hre.ethers.getContractFactory("Paymaster");
    const paymaster = await Paymaster.deploy(entryPointAddress);
    await paymaster.deployed();
    console.log("Paymaster deployed to:", paymaster.address);

    // ── Create a SmartAccount via Factory ──────────────────────────────────
    console.log("\nCreating SmartAccount via factory...");
    const salt = 0;
    const predictedAddress = await factory.getAddress(deployer.address, salt);
    console.log("Predicted SmartAccount address:", predictedAddress);

    const tx = await factory.createAccount(deployer.address, salt);
    await tx.wait();
    console.log("SmartAccount deployed to:", predictedAddress);

    // ── Save deployment info ───────────────────────────────────────────────
    const deploymentInfo = {
        EntryPoint: entryPointAddress,
        SmartAccountFactory: factory.address,
        Paymaster: paymaster.address,
        SmartAccount: predictedAddress,
        owner: deployer.address,
        salt: salt,
    };

    const networkName = hre.network.name === "hardhat" ? "localhost" : hre.network.name;
    const deploymentPath = path.join(__dirname, `../deployments/${networkName}.json`);

    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment info saved to deployments/${networkName}.json`);

    // ── Verify on Etherscan ────────────────────────────────────────────────
    if (hre.network.name === "sepolia") {
        console.log("\nWaiting for block confirmations...");
        await factory.deployTransaction.wait(6);
        await paymaster.deployTransaction.wait(6);

        console.log("Verifying SmartAccountFactory...");
        await hre.run("verify:verify", {
            address: factory.address,
            constructorArguments: [entryPointAddress],
        });

        console.log("Verifying Paymaster...");
        await hre.run("verify:verify", {
            address: paymaster.address,
            constructorArguments: [entryPointAddress],
        });

        console.log("All contracts verified on Etherscan");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});