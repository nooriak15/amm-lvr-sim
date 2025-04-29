const { ethers } = require("hardhat");
const fs = require("fs");
const { plot } = require("nodeplotlib");

// Simulate external CEX price with small random shocks
function evolveExternalPrice(currentPrice) {
    const volatility = 0.02;
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
    const k = reserve0 * reserve1;

    if (ammPrice > externalPrice) {
        const targetReserve0 = Math.sqrt(k / externalPrice);
        const delta = targetReserve0 - reserve0;
        return { direction: "buyToken0", amount: delta };
    } else if (ammPrice < externalPrice) {
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
    const amm = await AMM.deploy();
    await amm.waitForDeployment();
    console.log(`✅ AMM deployed at: ${amm.target}`);

    await amm.addLiquidity(100000, 100000);
    console.log("✅ Initial liquidity added: 100000/100000");

    let reserve0 = 100000;
    let reserve1 = 100000;
    let externalPrice = 1.0;

    const feeMultiplier = 0.997;
    const data = [];

    for (let i = 1; i <= 500; i++) {
        externalPrice = evolveExternalPrice(externalPrice);

        const noiseTradeAmount = Math.floor(Math.random() * 5000) + 1;
        const isBuy = Math.random() < 0.5; // 50% chance buy or sell

        if (isBuy) {
            // Trader swaps token0 for token1 (buy token1)
            await amm.swap(noiseTradeAmount);
            const dxEff = noiseTradeAmount * feeMultiplier;
            const dy = reserve1 * dxEff / (reserve0 + dxEff);
            reserve0 += dxEff;
            reserve1 -= dy;
        } else {
            // Trader swaps token1 for token0 (buy token0) — simulated manually
            const dyEff = noiseTradeAmount * feeMultiplier;
            const dx = reserve0 * dyEff / (reserve1 + dyEff);
            reserve1 += dyEff;
            reserve0 -= dx;
        }

        // Arbitrage step
        const { direction, amount } = computeArbitrageSwap(reserve0, reserve1, externalPrice);
        if (direction === "buyToken0" && amount > 0) {
            const amountEff = amount * feeMultiplier;
            const dyArb = reserve1 * amountEff / (reserve0 + amountEff);
            reserve0 += amountEff;
            reserve1 -= dyArb;
        } else if (direction === "buyToken1" && amount > 0) {
            const amountEff = amount * feeMultiplier;
            const dxArb = reserve0 * amountEff / (reserve1 + amountEff);
            reserve1 += amountEff;
            reserve0 -= dxArb;
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

    fs.writeFileSync("trade_data.json", JSON.stringify(data, null, 2));
    console.log("✅ trade_data.json saved");

    // Plot prices
    const tradeNumbers = data.map(d => d.tradeNumber);
    const ammPrices = data.map(d => d.amm_price);
    const externalPrices = data.map(d => d.external_price);

    const traceAMM = {
        x: tradeNumbers,
        y: ammPrices,
        type: 'scatter',
        name: 'AMM Price'
    };

    const traceExternal = {
        x: tradeNumbers,
        y: externalPrices,
        type: 'scatter',
        name: 'External Price'
    };

    plot([traceAMM, traceExternal], {
        title: 'AMM vs External Price (Baseline)',
        xaxis: { title: 'Trade Number' },
        yaxis: { title: 'Price' }
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
