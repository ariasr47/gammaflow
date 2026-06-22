# UX BLUEPRINT — Dark-pool block trades + live-stream isolation

> Producer: UX/Tech-Writer (Session 3). Consumers: Backend & Frontend Executioners (via the
> Split Compressor → INTERFACE + BACKEND + FRONTEND contracts). No production code.

## ASCII wireframe
<!-- Show where the dark-pool/block cards sit relative to existing tiles + the GEX chart.
     Use the current dashboard layout (toolbar, stat-tile grid, GEX strike profile, setups). -->
```
+--------------------------------------------------------------+
| GammaFlow                                                    |
| [Ticker] [Expirations ▾] [All][Clear] [Dark pool ◐] [regime] [● live …] |
| TSLA · $___   (levels @ $___ · N expirations)               |
| [Call wall][Put wall][Gamma flip][Net flow][Spread][Net GEX]|
| [Max pain][IV/HV][VWAP][Off-exchange %][ ??? blocks ][Opp.] |
| ── GEX strike profile ─────────────────────────────────     |
| ...                                                         |
+--------------------------------------------------------------+
```

## Component states (visual spec)
Define each, for the live-derived components (price, net flow, spread, live flip) AND the new
dark-pool/blocks card:

| State | Trigger | Appearance / behavior |
|---|---|---|
| **Normal** | live tick recent / data present | <!-- ... --> |
| **Loading** | initial fetch / refetch in flight | <!-- ... --> |
| **Stream Offline** | SSE dropped / `live=false` mid-session | <!-- live tiles show offline badge & freeze last value; the GEX chart + static stats stay fully rendered from cache --> |

## Degradation rules
<!-- Restate: a stream error degrades ONLY live-derived tiles; the static chart/stats never blank. -->
- 

## Glossary addition (draft for market_state_glossary.md)
<!-- Short, AI-readable explanation of dark-pool block prints / concentration zones, with the
     "context only, not directional; includes internalized retail" caveat. -->
```md

```
