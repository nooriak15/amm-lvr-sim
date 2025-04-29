// AMM.ts
export class AMM {
    constructor(initialReserve0, initialReserve1, fee = 0.003) {
        this.reserve0 = initialReserve0;
        this.reserve1 = initialReserve1;
        this.fee = fee;
    }
    // Add liquidity to the pool
    addLiquidity(amount0, amount1) {
        this.reserve0 += amount0;
        this.reserve1 += amount1;
    }
    // Swap token0 for token1
    swapToken0ForToken1(amountIn) {
        const amountInWithFee = amountIn * (1 - this.fee);
        const amountOut = (amountInWithFee * this.reserve1) / (this.reserve0 + amountInWithFee);
        this.reserve0 += amountInWithFee;
        this.reserve1 -= amountOut;
        return {
            amountOut,
            newReserve0: this.reserve0,
            newReserve1: this.reserve1,
            effectivePrice: amountOut / amountIn,
            fee: this.fee
        };
    }
    // Swap token1 for token0
    swapToken1ForToken0(amountIn) {
        const amountInWithFee = amountIn * (1 - this.fee);
        const amountOut = (amountInWithFee * this.reserve0) / (this.reserve1 + amountInWithFee);
        this.reserve1 += amountInWithFee;
        this.reserve0 -= amountOut;
        return {
            amountOut,
            newReserve0: this.reserve0,
            newReserve1: this.reserve1,
            effectivePrice: amountOut / amountIn,
            fee: this.fee
        };
    }
    // Get current AMM price (token1 per token0)
    getPrice() {
        return this.reserve1 / this.reserve0;
    }
    // Access internal reserves
    getReserves() {
        return {
            reserve0: this.reserve0,
            reserve1: this.reserve1,
        };
    }
    // Dynamically adjust fee (used by hooks)
    setFee(newFee) {
        this.fee = newFee;
    }
    getFee() {
        return this.fee;
    }
}
