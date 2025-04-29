const { ethers } = require("hardhat");
const fs = require("fs");

// Simulate external CEX price with small random shocks
function evolveExternalPrice(currentPrice) {
    const volatility = 0.02; // 2% max random move per trade
    const randomShock = (Math.random() - 0.5) * 2 * volatility;
    return currentPrice * (1 + randomShock);
}

// Calculate AMM price (reserve1 / reserve0)
function getAMMPrice(reserve0, reserve1) {
    return reserve1 / reserve0;
}

// Calculate how much needs to be traded to restore AMM price to match external price
function computeArbitrageSwap(reserve0, reserve1, externalPrice) {
    const ammPrice = reserve1 / reserve0;
    if (ammPrice > externalPrice) {
        // Need to buy token0 (increase reserve0) to lower price
        const k = reserve0 * reserve1;
        const targetReserve0 = Math.sqrt(k / externalPrice);
        const delta = targetReserve0 - reserve0;
        return { direction: "buyToken0", amount: delta };
    } else if (ammPrice < externalPrice) {
        // Need to buy token1 (increase reserve1) to raise price
        const k = reserve0 * reserve1;
        const targetReserve1 = Math.sqrt(k * externalPrice);
        const delta = targetReserve1 - reserve1;
        return { direction: "buyToken1", amount: delta };
    } else {
        return { direction: "none", amount: 0 };
    }
}

async function main() {
    const [deployer] = await ethers.getSigners();
    const AMM = await ethers.getContractFactory("SimpleAMM");
    const amm = await AMM.deploy(); // No .deployed() needed if constructor exists
    await amm.waitForDeployment();
    console.log(`✅ AMM deployed at: ${amm.target}`);

    // Add initial liquidity
    await amm.addLiquidity(1000, 1000);
    console.log("✅ Initial liquidity added: 1000/1000");

    // Off-chain simulation variables
    let reserve0 = 1000;
    let reserve1 = 1000;
    let externalPrice = 1.0;

    const feeMultiplier = 0.997; // 0.3% fee

    const data = [];

    for (let i = 1; i <= 500; i++) {  // simulate 500 trades
        // 1. Evolve external ("true") price
        externalPrice = evolveExternalPrice(externalPrice);

        // 2. Random noise trader (small random trade)
        const noiseTradeAmount = Math.floor(Math.random() * 10) + 1; // 1-10 tokens

        // Simulate noise trader swapping token0 for token1
        await amm.swap(noiseTradeAmount);

        // Update reserves based on noise trade
        const effectiveAmount = noiseTradeAmount * feeMultiplier;
        reserve0 += effectiveAmount;
        reserve1 = (reserve0 * reserve1) / (reserve0 - effectiveAmount);

        // 3. Arbitrage step: realign AMM price to external price
        const { direction, amount } = computeArbitrageSwap(reserve0, reserve1, externalPrice);

        if (direction === "buyToken0" && amount > 0) {
            reserve0 += amount * feeMultiplier;
            reserve1 = (reserve0 * reserve1) / (reserve0 - amount * feeMultiplier);
        } else if (direction === "buyToken1" && amount > 0) {
            reserve1 += amount * feeMultiplier;
            reserve0 = (reserve0 * reserve1) / (reserve1 - amount * feeMultiplier);
        }

        const ammPrice = getAMMPrice(reserve0, reserve1);
        const block = await ethers.provider.getBlock("latest");

        data.push({
            tradeNumber: i,
            timestamp: block.timestamp,
            amm_price: ammPrice,
            external_price: externalPrice,
            trade_size: noiseTradeAmount,
        });

        console.log(`Trade ${i}: noise=${noiseTradeAmount}, amm=${ammPrice.toFixed(6)}, external=${externalPrice.toFixed(6)}`);
    }

    // Save all simulated trades to file
    fs.writeFileSync("trade_data.json", JSON.stringify(data, null, 2));
    console.log("✅ trade_data.json saved with AMM + external prices");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
