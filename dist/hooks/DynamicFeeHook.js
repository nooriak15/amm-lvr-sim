// hooks/DynamicFeeHook.ts
export class DynamicFeeHook {
    constructor(amm) {
        this.amm = amm;
    }
    beforeSwap(context) {
        const deviation = Math.abs(context.ammPrice - context.externalPrice) / context.externalPrice;
        // Raise fee if price diverges from oracle
        if (deviation > 0.02) {
            this.amm.setFee(0.01); // 1%
        }
        else {
            this.amm.setFee(0.003); // 0.3%
        }
    }
    afterSwap(context, result) {
        // Could log LVR, slippage, etc.
        // console.log(`Post-swap: got ${result.amountOut}`);
    }
}
