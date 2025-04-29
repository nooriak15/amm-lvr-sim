// Hook.ts

 export type SwapContext = {
    amountIn: number;
    tokenIn: "token0" | "token1";
    reserve0: number;
    reserve1: number;
    ammPrice: number;
    externalPrice: number;
    blockNumber: number;
    timestamp: number;
  };
  
export interface Hook {
    beforeSwap(context: SwapContext): void;
    afterSwap(context: SwapContext, result: { amountOut: number }): void;
  }
  

  