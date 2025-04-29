// HookManager.ts
import { Hook, SwapContext } from "./Hook";

export class HookManager {
  private hooks: Hook[] = [];

  register(hook: Hook): void {
    this.hooks.push(hook);
  }

  runBeforeSwap(context: SwapContext): void {
    for (const hook of this.hooks) {
      hook.beforeSwap(context);
    }
  }

  runAfterSwap(context: SwapContext, result: { amountOut: number }): void {
    for (const hook of this.hooks) {
      hook.afterSwap(context, result);
    }
  }
}
