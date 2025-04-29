// hooks/DynamicFeeHook.ts

import { Hook, SwapContext } from "../core/Hook";
import { AMM } from "../core/AMM";

export class DynamicFeeHook implements Hook {
  private amm: AMM;

  constructor(amm: AMM) {
    this.amm = amm;
  }

  beforeSwap(context: SwapContext): void {
    const deviation = Math.abs(context.ammPrice - context.externalPrice) / context.externalPrice;

    // Raise fee if price diverges from oracle
    if (deviation > 0.02) {
      this.amm.setFee(0.01); // 1%
    } else {
      this.amm.setFee(0.003); // 0.3%
    }
  }

  afterSwap(context: SwapContext, result: { amountOut: number }): void {
    // Could log LVR, slippage, etc.
    // console.log(`Post-swap: got ${result.amountOut}`);
  }
}
