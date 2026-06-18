import asyncio
import sys
import logging
import json
import os
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from src.core.engine import QuantEngine
from src.core.massive_client import MassiveDataInterface
from src.core.signals import generate_signals
from src.models.market_data import MarketState

logger = logging.getLogger("GammaFlowAsync")
logger.setLevel(logging.INFO)
logger.propagate = False

# Configure the handler exactly once. This module can be imported more than once
# under uvicorn's reloader, and re-adding a handler each time is what causes every
# log line to be printed twice.
if not logger.handlers:
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

quant_engine = QuantEngine(risk_free_rate=0.045)
data_provider = MassiveDataInterface()

# Watchlist (comma-separated WATCHLIST env var, default TSLA). The first entry is the
# default ticker that endpoints return when no ?ticker= is supplied.
WATCHLIST = [t.strip().upper() for t in os.getenv("WATCHLIST", "TSLA").split(",") if t.strip()] or ["TSLA"]
DEFAULT_TICKER = WATCHLIST[0]
REFRESH_SECONDS = int(os.getenv("REFRESH_SECONDS", "900"))
DATA_DIR = "data"

# Per-ticker in-memory stores the API serves from.
market_states: dict = {}      # ticker -> market_state dict
strike_profiles: dict = {}    # ticker -> per-strike profile list
signals_store: dict = {}      # ticker -> signals dict
current_scan: list = []       # ranked opportunity rows across the watchlist


def _build_market_state(ticker: str, market_data: dict, underlying_history: list,
                        intraday_bars: list) -> tuple[dict, list]:
    """Compute the full market_state dict and per-strike profile for one ticker."""
    gex_metrics = quant_engine.process_gex_profile(market_data)

    historical_closes = [b["close"] for b in underlying_history if b.get("close") is not None]
    hv_30d = quant_engine.calculate_historical_volatility_30d(historical_closes)

    vwap_bands = quant_engine.calculate_vwap_bands(intraday_bars)
    if not vwap_bands:
        logger.warning(f"[{ticker}] VWAP bands unavailable (no/sparse intraday bars); VWAP fields null")

    # Massive returns IV as a decimal (0.486); express as a percentage to match hv_30d.
    atm_iv = market_data["atm_iv"] * 100.0
    iv_hv_ratio = round(atm_iv / hv_30d, 4) if hv_30d > 0.0 else 0.0

    snapshot_ns = int(market_data["timestamp"])
    timestamp_iso = (datetime.fromtimestamp(snapshot_ns / 1e9, tz=timezone.utc).isoformat()
                     if snapshot_ns > 0 else None)

    # price = current (live/delayed) spot for display; gex_spot = the spot the levels were
    # actually computed at (last completed session close after hours). They coincide in RTH.
    display_spot = market_data.get("current_spot") or market_data["synchronized_spot"]

    state = {
        "ticker": market_data["ticker"],
        "price": display_spot,
        "gex_spot": market_data["synchronized_spot"],
        "timestamp": snapshot_ns,
        "timestamp_iso": timestamp_iso,

        "call_wall": gex_metrics["call_wall"],
        "put_wall": gex_metrics["put_wall"],
        "peak_gex_strike": gex_metrics["peak_gex_strike"],
        "gamma_flip": gex_metrics["gamma_flip"],
        "max_pain": gex_metrics["max_pain"],
        "max_pain_expiration": gex_metrics["max_pain_expiration"],
        "net_gex": gex_metrics["net_gex"],
        "call_gex": gex_metrics["call_gex"],
        "put_gex": gex_metrics["put_gex"],
        "total_gex": gex_metrics["total_gex"],
        "net_vanna": gex_metrics["net_vanna"],
        "net_charm": gex_metrics["net_charm"],
        "net_volga": gex_metrics["net_volga"],
        "put_call_ratio": gex_metrics["put_call_ratio"],

        "vwap": vwap_bands.get("vwap"),
        "vwap_upper_2": vwap_bands.get("vwap_upper_2"),
        "vwap_upper_3": vwap_bands.get("vwap_upper_3"),
        "vwap_lower_2": vwap_bands.get("vwap_lower_2"),
        "vwap_lower_3": vwap_bands.get("vwap_lower_3"),

        "atm_iv": round(atm_iv, 4),
        "hv_30d": hv_30d,
        "iv_hv_ratio": iv_hv_ratio,
        "net_flow": None,  # null until computed from the trades tape
    }
    return state, gex_metrics["strike_profile"]


def _write_ticker_files(ticker: str, state: dict, profile: list, sig: dict):
    """Persist per-ticker JSON for inspection / piping to the downstream AI."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(os.path.join(DATA_DIR, f"{ticker}_market_state.json"), "w") as f:
        json.dump(state, f, indent=4)
    with open(os.path.join(DATA_DIR, f"{ticker}_signals.json"), "w") as f:
        json.dump(sig, f, indent=4)
    with open(os.path.join(DATA_DIR, f"{ticker}_strike_profile.json"), "w") as f:
        json.dump({"ticker": ticker, "spot": state["price"], "strikes": profile}, f, indent=4)

    # Backward-compatible top-level files for the default ticker.
    if ticker == DEFAULT_TICKER:
        with open("market_data.json", "w") as f:
            json.dump(state, f, indent=4)
        with open("strike_profile.json", "w") as f:
            json.dump({"ticker": ticker, "spot": state["price"], "strikes": profile}, f, indent=4)


def process_ticker(ticker: str) -> bool:
    """
    Fetch + compute everything for one ticker and update the in-memory stores.
    Synchronous (does blocking SDK I/O); the loop runs it in a worker thread.
    """
    logger.info(f"[{ticker}] Starting market data refresh")
    market_data = data_provider.fetch_synchronized_options_market_state(ticker)
    underlying_history = data_provider.fetch_historical_underlying_metrics(ticker)
    intraday_bars = data_provider.fetch_intraday_session_bars(ticker)

    if not market_data or market_data.get("synchronized_spot", 0) <= 0:
        logger.warning(f"[{ticker}] No option-chain data returned; skipping this cycle")
        return False

    contracts = market_data.get("contracts", [])
    expirations = sorted({c.get("expiration_date") for c in contracts if c.get("expiration_date")})
    logger.info(
        f"[{ticker}] Option chain: {len(contracts)} contracts across {len(expirations)} expirations "
        f"(nearest {expirations[0] if expirations else 'n/a'}, farthest {expirations[-1] if expirations else 'n/a'})"
    )

    state, profile = _build_market_state(ticker, market_data, underlying_history, intraday_bars)
    sig = generate_signals(state)

    market_states[ticker] = state
    strike_profiles[ticker] = profile
    signals_store[ticker] = sig

    top = sig["setups"][0]["name"] if sig["setups"] else "none"
    logger.info(
        f"[{ticker}] Refresh complete | spot ${state['price']:.2f} | "
        f"net GEX ${state['net_gex'] / 1e6:,.1f}M | flip ${state['gamma_flip']:.2f} | "
        f"call/put wall ${state['call_wall']:.0f}/${state['put_wall']:.0f} | "
        f"regime {sig['regime']} | score {sig['opportunity_score']} | top: {top}"
    )

    _write_ticker_files(ticker, state, profile, sig)
    return True


def build_scan() -> list:
    """Rank watchlist tickers by opportunity score for the scanner."""
    rows = []
    for t in WATCHLIST:
        sig = signals_store.get(t)
        st = market_states.get(t)
        if not sig or not st:
            continue
        top = sig["setups"][0] if sig["setups"] else None
        rows.append({
            "ticker": t,
            "opportunity_score": sig["opportunity_score"],
            "regime": sig["regime"],
            "vol_regime": sig["vol_regime"],
            "price": st.get("price"),
            "gamma_flip": st.get("gamma_flip"),
            "call_wall": st.get("call_wall"),
            "put_wall": st.get("put_wall"),
            "setup_count": len(sig["setups"]),
            "top_setup": top["name"] if top else None,
            "top_bias": top["bias"] if top else None,
        })
    rows.sort(key=lambda r: r["opportunity_score"], reverse=True)
    return rows


async def market_data_engine_loop():
    """Background loop: refresh every watchlist ticker, then rank them by opportunity."""
    logger.info(f"Engine loop started for watchlist: {', '.join(WATCHLIST)}")
    while True:
        try:
            for ticker in WATCHLIST:
                try:
                    await asyncio.to_thread(process_ticker, ticker)
                except Exception as e:
                    logger.error(f"[{ticker}] Refresh failed: {e}", exc_info=True)

            global current_scan
            current_scan = build_scan()
            os.makedirs(DATA_DIR, exist_ok=True)
            with open(os.path.join(DATA_DIR, "scan.json"), "w") as f:
                json.dump({"generated_iso": datetime.now(timezone.utc).isoformat(),
                           "tickers": current_scan}, f, indent=4)
            if current_scan:
                lead = current_scan[0]
                logger.info(
                    f"Scan complete: {len(current_scan)} tickers ranked | "
                    f"top {lead['ticker']} (score {lead['opportunity_score']}, {lead['regime']})")

        except asyncio.CancelledError:
            logger.info("Market data loop cancelled on shutdown")
            break
        except Exception as e:
            logger.error(f"Engine loop error: {e}", exc_info=True)

        await asyncio.sleep(REFRESH_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm-start the default ticker from its cached file if present.
    for cache in (os.path.join(DATA_DIR, f"{DEFAULT_TICKER}_market_state.json"), "market_data.json"):
        if os.path.exists(cache):
            try:
                with open(cache) as f:
                    market_states[DEFAULT_TICKER] = json.load(f)
                logger.info(f"Loaded cached market state for {DEFAULT_TICKER} from {cache} on startup")
                break
            except Exception as e:
                logger.warning(f"Could not load cached market state from {cache}: {e}")

    engine_task = asyncio.create_task(market_data_engine_loop())
    yield
    logger.info("Shutting down; stopping market data loop")
    engine_task.cancel()
    try:
        await engine_task
    except asyncio.CancelledError:
        logger.info("Market data loop stopped")


app = FastAPI(
    title="GammaFlow Volatility API",
    description="Serves net dealer gamma profiles, greeks, and ranked trade signals from Massive data.",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _resolve(ticker: str | None) -> str:
    return (ticker or DEFAULT_TICKER).upper()


@app.get("/api/watchlist")
async def get_watchlist():
    return {"watchlist": WATCHLIST, "default": DEFAULT_TICKER, "refresh_seconds": REFRESH_SECONDS}


@app.get("/api/market-data", response_model=MarketState)
async def get_market_data(ticker: str | None = None):
    state = market_states.get(_resolve(ticker))
    if not state:
        raise HTTPException(status_code=503, detail=f"No market data yet for {_resolve(ticker)}.")
    return state


@app.get("/api/strike-profile")
async def get_strike_profile(ticker: str | None = None):
    t = _resolve(ticker)
    profile = strike_profiles.get(t)
    if not profile:
        raise HTTPException(status_code=503, detail=f"No strike profile yet for {t}.")
    return {"ticker": t, "spot": (market_states.get(t) or {}).get("price"), "strikes": profile}


@app.get("/api/signals")
async def get_signals(ticker: str | None = None):
    sig = signals_store.get(_resolve(ticker))
    if not sig:
        raise HTTPException(status_code=503, detail=f"No signals yet for {_resolve(ticker)}.")
    return sig


@app.get("/api/scan")
async def get_scan():
    if not current_scan:
        raise HTTPException(status_code=503, detail="Scan not ready yet; engine is bootstrapping.")
    return {"tickers": current_scan}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
