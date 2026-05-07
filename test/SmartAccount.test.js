const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SmartAccount", function () {
    let smartAccount;
    let entryPoint;
    let owner;
    let nonOwner;
    let dest;

    beforeEach(async function () {
        [owner, nonOwner, dest] = await ethers.getSigners();

        // Deploy a mock EntryPoint — just a simple contract that can call execute
        const MockEntryPoint = await ethers.getContractFactory("MockEntryPoint");
        entryPoint = await MockEntryPoint.deploy();
        await entryPoint.deployed();

        // Deploy SmartAccount with owner and entryPoint
        const SmartAccount = await ethers.getContractFactory("SmartAccount");
        smartAccount = await SmartAccount.deploy(owner.address, entryPoint.address);
        await smartAccount.deployed();
    });

    // ─── Deployment ───────────────────────────────────────────────────────────

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await smartAccount.owner()).to.equal(owner.address);
        });

        it("Should set the correct entryPoint", async function () {
            expect(await smartAccount.entryPoint()).to.equal(entryPoint.address);
        });

        it("Should emit SmartAccountInitialized event", async function () {
            const SmartAccount = await ethers.getContractFactory("SmartAccount");
            const newAccount = await SmartAccount.deploy(owner.address, entryPoint.address);
            await expect(newAccount.deployTransaction)
                .to.emit(newAccount, "SmartAccountInitialized")
                .withArgs(entryPoint.address, owner.address);
        });
    });

    // ─── Receive ETH ──────────────────────────────────────────────────────────

    describe("Receive ETH", function () {
        it("Should accept ETH deposits", async function () {
            await owner.sendTransaction({
                to: smartAccount.address,
                value: ethers.utils.parseEther("1.0")
            });
            const balance = await ethers.provider.getBalance(smartAccount.address);
            expect(balance).to.equal(ethers.utils.parseEther("1.0"));
        });
    });

    // ─── Execute ──────────────────────────────────────────────────────────────

    describe("Execute", function () {
        beforeEach(async function () {
            await owner.sendTransaction({
                to: smartAccount.address,
                value: ethers.utils.parseEther("1.0")
            });
        });

        it("Should allow owner to execute a transaction", async function () {
            const balanceBefore = await ethers.provider.getBalance(dest.address);
            await smartAccount.connect(owner).execute(dest.address, ethers.utils.parseEther("0.5"), "0x");
            const balanceAfter = await ethers.provider.getBalance(dest.address);
            expect(balanceAfter.sub(balanceBefore)).to.equal(ethers.utils.parseEther("0.5"));
        });

        it("Should allow entryPoint to execute a transaction", async function () {
            const balanceBefore = await ethers.provider.getBalance(dest.address);
            await entryPoint.executeFromEntryPoint(
                smartAccount.address,
                dest.address,
                ethers.utils.parseEther("0.5"),
                "0x"
            );
            const balanceAfter = await ethers.provider.getBalance(dest.address);
            expect(balanceAfter.sub(balanceBefore)).to.equal(ethers.utils.parseEther("0.5"));
        });

        it("Should reject execute from non owner", async function () {
            await expect(
                smartAccount.connect(nonOwner).execute(dest.address, ethers.utils.parseEther("0.5"), "0x")
            ).to.be.revertedWith("Not authorized");
        });

        it("Should emit TransactionExecuted event", async function () {
            await expect(
                smartAccount.connect(owner).execute(dest.address, ethers.utils.parseEther("0.5"), "0x")
            ).to.emit(smartAccount, "TransactionExecuted");
        });
    });

    // ─── Validate Signature ───────────────────────────────────────────────────

    describe("ValidateSignature", function () {
        it("Should return 0 for valid owner signature", async function () {
            const userOpHash = ethers.utils.keccak256("0x1234");
            const signature = await owner.signMessage(ethers.utils.arrayify(userOpHash));

            const userOp = {
                sender: smartAccount.address,
                nonce: 0,
                initCode: "0x",
                callData: "0x",
                accountGasLimits: ethers.utils.hexZeroPad("0x", 32),
                preVerificationGas: 0,
                gasFees: ethers.utils.hexZeroPad("0x", 32),
                paymasterAndData: "0x",
                signature: signature
            };

            const result = await entryPoint.callStatic.validateSignature(
                smartAccount.address,
                userOp,
                userOpHash
            );
            expect(result).to.equal(0);
        });

        it("Should return 1 for invalid signature", async function () {
            const userOpHash = ethers.utils.keccak256("0x1234");
            const signature = await nonOwner.signMessage(ethers.utils.arrayify(userOpHash));

            const userOp = {
                sender: smartAccount.address,
                nonce: 0,
                initCode: "0x",
                callData: "0x",
                accountGasLimits: ethers.utils.hexZeroPad("0x", 32),
                preVerificationGas: 0,
                gasFees: ethers.utils.hexZeroPad("0x", 32),
                paymasterAndData: "0x",
                signature: signature
            };

            const result = await entryPoint.callStatic.validateSignature(
                smartAccount.address,
                userOp,
                userOpHash
            );
            expect(result).to.equal(1);
        });
    });
});

describe("SmartAccountFactory", function () {
    let factory;
    let owner;
    let nonOwner;

    beforeEach(async function () {
        [owner, nonOwner] = await ethers.getSigners();

        const MockEntryPoint = await ethers.getContractFactory("MockEntryPoint");
        entryPoint = await MockEntryPoint.deploy();
        await entryPoint.deployed();

        const SmartAccountFactory = await ethers.getContractFactory("SmartAccountFactory");
        factory = await SmartAccountFactory.deploy(entryPoint.address);
        await factory.deployed();
    });

    it("Should deploy a SmartAccount for a new owner", async function () {
        const tx = await factory.createAccount(owner.address, 0);
        await tx.wait();
        const accountAddress = await factory.getAddress(owner.address, 0);
        const code = await ethers.provider.getCode(accountAddress);
        expect(code).to.not.equal("0x");
    });

    it("Should return the same address for the same owner and salt", async function () {
        const addr1 = await factory.getAddress(owner.address, 0);
        const addr2 = await factory.getAddress(owner.address, 0);
        expect(addr1).to.equal(addr2);
    });

    it("Should return different addresses for different salts", async function () {
        const addr1 = await factory.getAddress(owner.address, 0);
        const addr2 = await factory.getAddress(owner.address, 1);
        expect(addr1).to.not.equal(addr2);
    });

    it("Should return different addresses for different owners", async function () {
        const addr1 = await factory.getAddress(owner.address, 0);
        const addr2 = await factory.getAddress(nonOwner.address, 0);
        expect(addr1).to.not.equal(addr2);
    });

    it("Should not redeploy if account already exists", async function () {
        await factory.createAccount(owner.address, 0);
        const addr1 = await factory.getAddress(owner.address, 0);
        await factory.createAccount(owner.address, 0);
        const addr2 = await factory.getAddress(owner.address, 0);
        expect(addr1).to.equal(addr2);
    });

    it("Should set correct owner on deployed SmartAccount", async function () {
        await factory.createAccount(owner.address, 0);
        const accountAddress = await factory.getAddress(owner.address, 0);
        const SmartAccount = await ethers.getContractAt("SmartAccount", accountAddress);
        expect(await SmartAccount.owner()).to.equal(owner.address);
    });

    it("Should set correct entryPoint on deployed SmartAccount", async function () {
        await factory.createAccount(owner.address, 0);
        const accountAddress = await factory.getAddress(owner.address, 0);
        const SmartAccount = await ethers.getContractAt("SmartAccount", accountAddress);
        expect(await SmartAccount.entryPoint()).to.equal(entryPoint.address);
    });
});

describe("Paymaster", function () {
    let paymaster;
    let entryPoint;
    let owner;
    let user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        const MockEntryPoint = await ethers.getContractFactory("MockEntryPoint");
        entryPoint = await MockEntryPoint.deploy();
        await entryPoint.deployed();

        const Paymaster = await ethers.getContractFactory("Paymaster");
        paymaster = await Paymaster.deploy(entryPoint.address);
        await paymaster.deployed();
    });

    describe("Deployment", function () {
        it("Should set the correct entryPoint", async function () {
            expect(await paymaster.entryPoint()).to.equal(entryPoint.address);
        });

        it("Should set the deployer as owner", async function () {
            expect(await paymaster.owner()).to.equal(owner.address);
        });
    });

    describe("ValidatePaymasterUserOp", function () {
        it("Should approve any user operation", async function () {
            const userOpHash = ethers.utils.keccak256("0x1234");
            const userOp = {
                sender: user.address,
                nonce: 0,
                initCode: "0x",
                callData: "0x",
                accountGasLimits: ethers.utils.hexZeroPad("0x", 32),
                preVerificationGas: 0,
                gasFees: ethers.utils.hexZeroPad("0x", 32),
                paymasterAndData: "0x",
                signature: "0x"
            };

            const result = await entryPoint.callStatic.validatePaymaster(
                paymaster.address,
                userOp,
                userOpHash
            );
            expect(result.validationData).to.equal(0);
        });

        it("Should emit OperationSponsored event", async function () {
            const userOpHash = ethers.utils.keccak256("0x1234");
            const userOp = {
                sender: user.address,
                nonce: 0,
                initCode: "0x",
                callData: "0x",
                accountGasLimits: ethers.utils.hexZeroPad("0x", 32),
                preVerificationGas: 0,
                gasFees: ethers.utils.hexZeroPad("0x", 32),
                paymasterAndData: "0x",
                signature: "0x"
            };

            await expect(
                entryPoint.validatePaymaster(paymaster.address, userOp, userOpHash)
            ).to.emit(paymaster, "OperationSponsored")
             .withArgs(user.address, userOpHash);
        });
    });
});