// AMM.ts


export type SwapResult = {
    amountOut: number;
    newReserve0: number;
    newReserve1: number;
    effectivePrice: number;
    fee: number;
  };

export class AMM {
    private reserve0: number;
    private reserve1: number;
    private fee: number; // This is a fraction (0.003 = 0.3%)
  
    constructor(initialReserve0: number, initialReserve1: number, fee: number = 0.003) {
      this.reserve0 = initialReserve0;
      this.reserve1 = initialReserve1;
      this.fee = fee;
    }
  
    // Add liquidity to the pool
    public addLiquidity(amount0: number, amount1: number): void {
      this.reserve0 += amount0;
      this.reserve1 += amount1;
    }
  
    // Swap token0 for token1
    public swapToken0ForToken1(amountIn: number): SwapResult {
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
    public swapToken1ForToken0(amountIn: number): SwapResult {
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
    public getPrice(): number {
      return this.reserve1 / this.reserve0;
    }
  
    // Access internal reserves
    public getReserves(): { reserve0: number; reserve1: number } {
      return {
        reserve0: this.reserve0,
        reserve1: this.reserve1,
      };
    }
  
    // Dynamically adjust fee (used by hooks)
    public setFee(newFee: number): void {
      this.fee = newFee;
    }
  
    public getFee(): number {
      return this.fee;
    }
  }
  