const { ethers } = require("hardhat");
const { parse } = require("csv-parse/sync");
const fs = require("fs");

async function findBalancesSlot(tokenAddress) {
  const encode = (types, values) =>
    ethers.AbiCoder.defaultAbiCoder().encode(types, values);

  const account = ethers.ZeroAddress;
  const probeA = encode(["uint"], [1]);
  const probeB = encode(["uint"], [2]);

  const token = await ethers.getContractAt("IERC20", tokenAddress);

  for (let i = 0; i < 20; i++) {
    let probedSlot = ethers.keccak256(
      encode(["address", "uint"], [account, i])
    );

    while (probedSlot.startsWith("0x0"))
      probedSlot = "0x" + probedSlot.slice(3);

    const prev = await network.provider.send("eth_getStorageAt", [
      tokenAddress,
      probedSlot,
      "latest",
    ]);

    const probe = prev === probeA ? probeB : probeA;

    await network.provider.send("hardhat_setStorageAt", [
      tokenAddress,
      probedSlot,
      probe,
    ]);
    try {
      const balance = await token.balanceOf(account);

      await network.provider.send("hardhat_setStorageAt", [
        tokenAddress,
        probedSlot,
        prev,
      ]);

      if (balance == BigInt(probe)) return i;
    } catch (e) {
      return -1;
    }
  }

  return -1;
}

async function main() {
  const tokenAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"; // WETH
  console.log("Finding balances slot of ", tokenAddress);
  const slot = await findBalancesSlot(tokenAddress);
  console.log("Slot: ", slot);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
