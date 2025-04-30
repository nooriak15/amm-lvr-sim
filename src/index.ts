// index.ts

import { AMM } from "./core/AMM.js";
import { HookManager } from "./core/HookManager.js";
import { SwapContext } from "./core/Hook.js";
import { DynamicFeeHook } from "./hooks/DynamicFeeHook.js";
import { SwapResult } from "./core/AMM.js";
import fs from "fs";

const amm = new AMM(100000, 100000);
const hooks = new HookManager();
const tradeLog: any[] = [];
hooks.register(new DynamicFeeHook(amm));

let externalPrice = 1.0;

// How are we going to incorporate blocks????


for (let i = 0; i < 50; i++) {
  // Read data file......

  // get distribution for each of the transactions in a block (i.e what does the "first block look like 
  // (mean, median , std)" second block?, third? )
  const amountIn = Math.floor(Math.random() * 1000) + 100;
  const tokenIn = Math.random() > 0.5 ? "token0" : "token1";
  const { reserve0, reserve1 } = amm.getReserves();
  const ammPrice = reserve1 / reserve0;

  // Fake external price with slight drift
  externalPrice *= 1 + (Math.random() - 0.5) * 0.02;

  const swapContext: SwapContext = {
    amountIn,
    tokenIn,
    reserve0,
    reserve1,
    ammPrice,
    externalPrice,
    blockNumber: i,
    timestamp: Date.now(),
  };

  hooks.runBeforeSwap(swapContext);

  const result: SwapResult  =
    tokenIn === "token0"
      ? amm.swapToken0ForToken1(amountIn)
      : amm.swapToken1ForToken0(amountIn);

  hooks.runAfterSwap(swapContext, { amountOut: result.amountOut });

  // Data output for LVR analysis
  tradeLog.push({
    timestamp: swapContext.timestamp,
    amm_price: swapContext.ammPrice,
    external_price: swapContext.externalPrice,
    trade_size: swapContext.amountIn,
    direction: swapContext.tokenIn === "token0" ? "token0_to_token1" : "token1_to_token0",
    fee: amm.getFee()
  });

  // Collect Stats
  // Need a collector of sorts to manage our data.
  console.log(
    `Trade ${i + 1} | ${tokenIn} → ${tokenIn === "token0" ? "token1" : "token0"} | AMM: ${amm.getPrice().toFixed(4)} | Oracle: ${externalPrice.toFixed(4)} | Fee: ${amm.getFee()}`
  );
}

// Write to output file
fs.writeFileSync("trade_sim.json", JSON.stringify(tradeLog, null, 2));
console.log("output written to trade_sim.json");

