from pydantic import BaseModel
from typing import Optional

class MarketState(BaseModel):
    # Core Data
    ticker: str
    price: float
    timestamp: int  # nanoseconds since epoch (int avoids float64 precision loss at 19 digits)
    timestamp_iso: Optional[str] = None  # human-readable UTC ISO-8601 for the consuming AI

    # Dealer Liquidity Levels (Structural Constraints)
    call_wall: float
    put_wall: float
    gamma_flip: float
    net_gex: float

    # Dealer Hedging Dynamics (The "Dealer Traps")
    net_vanna: Optional[float] = None
    net_charm: Optional[float] = None
    net_volga: Optional[float] = None

    # Statistical Mean-Reversion Anchors (session-anchored VWAP ± volume-weighted std)
    # Null when intraday bars are unavailable / too sparse to form stable bands.
    vwap: Optional[float] = None
    vwap_upper_2: Optional[float] = None
    vwap_upper_3: Optional[float] = None
    vwap_lower_2: Optional[float] = None
    vwap_lower_3: Optional[float] = None

    # Volatility & Sentiment
    atm_iv: float
    hv_30d: float
    iv_hv_ratio: float
    net_flow: Optional[float] = None  # Order flow aggression; null until computed from the trades tape
    put_call_ratio: float

    # Macro Regime (Flag for Tier 1 Catalyst Override)
    macro_priority: str = "General"  # e.g., 'Tier1' or 'General'
    news_summary: Optional[str] = None