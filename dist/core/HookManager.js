export class HookManager {
    constructor() {
        this.hooks = [];
    }
    register(hook) {
        this.hooks.push(hook);
    }
    runBeforeSwap(context) {
        for (const hook of this.hooks) {
            hook.beforeSwap(context);
        }
    }
    runAfterSwap(context, result) {
        for (const hook of this.hooks) {
            hook.afterSwap(context, result);
        }
    }
}
