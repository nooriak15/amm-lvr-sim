import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load mitigated trade data
with open("trade_data_mitigated.json", "r") as f:
    trades = json.load(f)

# Convert to DataFrame
df = pd.DataFrame(trades)

# Compute log returns of the external ("true") price
df['log_return_external'] = np.log(df['external_price'] / df['external_price'].shift(1))

# Rolling volatility based on external price (window of 5 trades)
df['rolling_volatility_external'] = df['log_return_external'].rolling(window=5).std()

# Estimate marginal liquidity |x''(P)| = 2 * P^(3/2) based on AMM price
df['marginal_liquidity'] = 2 * df['amm_price'] ** 1.5

# Time difference between trades
df['delta_t'] = df['timestamp'].diff()

# Calculate LVR_i using external volatility, AMM price, and marginal liquidity
df['LVR_i'] = (
    0.5
    * df['rolling_volatility_external'] ** 2
    * df['amm_price'] ** 2
    * df['marginal_liquidity']
    * df['delta_t']
)

# Clean up NaNs from rolling window
df_clean = df.dropna()

# Sum total LVR
total_lvr = df_clean['LVR_i'].sum()

# Output
print(f"✅ Mitigated Total LVR using external price: {total_lvr:.6f}")

# Optional: plot LVR_i over time
plt.plot(df_clean['timestamp'], df_clean['LVR_i'])
plt.title("Per-Trade LVR Over Time (Mitigated)")
plt.xlabel("Timestamp")
plt.ylabel("LVR_i")
plt.grid(True)
plt.tight_layout()
plt.show()
