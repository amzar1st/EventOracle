# EventOracle

An evidence-grounded GenLayer oracle for real-world YES/NO questions. Users lock resolution criteria, an event cutoff, and public source URLs. GenLayer validators independently fetch evidence, assess dated facts, compare fingerprints and source-level decisions, and audit decisive quotations. Results remain provisional until the challenge window closes.

## Live application

- Frontend: https://eventoracle-amzar.tinymule33.chatgpt.site
- StudioNet chain: **61999**
- Contract: **0xEa6703e6508D61a86ce904e87BAe448880Bb5E5C**
- Explorer: https://explorer-studio.genlayer.com/address/0xEa6703e6508D61a86ce904e87BAe448880Bb5E5C
- Deployment transaction: `0x99248aad12b4867e07338cc6f1479a40808329deb3488e33a08a909c53fcf926`
- Source-matched commit: `f56fd685d98c080121b37cf5883b0a5df9a78657`
- Source SHA-256: `bb13b4c1278f211256473eeedbe5fca68818cf821637a17ce00a030b0d2a8ee9`

The deployment was submitted through GenLayer Studio's built-in account with Normal (Full Consensus) selected, and finalized successfully. Both the deployment source bytes and current deployed code were checked against `contracts/event_oracle.py`. The frontend loads this address by default and reads finalized state without a wallet.

**Read [docs/LIVE_VERIFICATION.md](docs/LIVE_VERIFICATION.md) for exact transaction results and limitations.** Actual MetaMask extension signing must be distinguished from the tested Studio built-in account workflow and controlled EIP-1193 integration tests.

## Review the application

1. Open the frontend. The default address and live event feed load automatically; no manual setup or wallet connection is needed for reads.
2. Click an event card or search by its numeric ID. Inspect criteria, cutoff, outcome, evidence fingerprints, reasoning, and challenge/review history. For final records, the frontend separately calls `get_resolution` and checks it against the event's stored outcome.
3. Use the contract explorer or Open in Studio link to inspect the same deployment. In Studio select finalized state for comparable reads.
4. To write through the frontend, connect an injected MetaMask wallet to StudioNet (61999). Network/account changes require reconnecting. The app requests the selected account and chain directly; it does not request a Snap. Writes submit through genlayer-js 1.1.8, wait for finality, and verify successful execution. No private keys are requested by EventOracle.
5. Alternatively, use Studio's built-in account to call the listed methods in Normal (Full Consensus) mode. That account belongs to Studio and does not become an injected wallet on EventOracle's domain.

## Run and verify

Requires Node 22+ and Python 3.11+.

```sh
npm ci
npm test
npm run build
```

The suite contains 12 Python behavior/regression tests and 18 JavaScript receipt, wallet, and real-SDK/provider integration tests. The Python harness does not replace live GenVM execution. The SDK/provider test uses controlled fixtures and is not an installed MetaMask test.

Re-fetch current deployment and transaction evidence without submitting transactions:

```sh
node scripts/collect-deployment.mjs
node scripts/collect-live.mjs
```

These scripts write public receipts and finalized records under `docs/`. No signing key is used. A future StudioNet reset or API change can invalidate historical availability; saved evidence records the actual verification time.

## Contract interface

| Method | Purpose |
| --- | --- |
| `create_event(question, criteria, deadline, sources_json, challenge_seconds)` | Immutable question and criteria; future cutoff within one year; 60-second to 7-day challenge period |
| `review(event_id)` | Independently retrieve sources and assess the event after cutoff; store a provisional result |
| `challenge(event_id, reason, sources_json)` | One challenge with new counter-evidence before the first window closes |
| `finalize(event_id)` | Freeze the proposed outcome after its waiting period |
| `recover_timeout(event_id)` | Final UNRESOLVED when initial review expires after 14 days or challenged review expires after 7 days |
| `get_event(event_id)` | Full JSON record including evidence and historical assessments |
| `get_count()` | Number of events |
| `get_resolution(event_id)` | Return YES, NO, or UNRESOLVED only after FINAL; otherwise revert |

`sources_json` is a JSON string containing 1–6 objects with exact keys `url` and `sha256`. An empty hash permits an uncommitted source. A non-empty lowercase SHA-256 requires the fetched bytes to match. Up to six additional distinct sources can be included in the single challenge.

Permitted prefixes are exactly `https://api.github.com/repos/` and `https://raw.githubusercontent.com/`. Query strings, credentials, fragments, ports, escapes, duplicate URLs, and noncanonical paths are rejected. Use full commit SHAs for raw source URLs. Each fetched source is bounded to 60KB. Invalid sources are recorded individually and do not automatically veto sufficient valid evidence.

## Consensus and lifecycle

YES needs direct dated evidence satisfying every criterion. NO needs direct disproof or authoritative exhaustive evidence. Silence, insufficient evidence, and unavailable sources do not prove NO. Opposing decisive votes yield UNRESOLVED.

Each validator reruns the retrieval and assessment independently. The custom equivalence function compares the outcome, conflict flag, source identities, content fingerprints, validity, and per-source votes. Decisive leader quotations are independently re-fetched and semantically audited. Validators' intermediate assessments are not presented as separately persisted votes; the accepted leader report is stored after consensus.

A proposal opens a challenge window. A challenge immediately clears the usable outcome and delays re-review by 60 seconds. The second proposal opens another waiting period, but cannot be challenged again. Every transition requires a transaction. Failed consensus or a revert does not set a persistent review lock. Recovery never fabricates YES or NO.

## Limitations

Development software, not audited or production-ready. Public repository control and source allowlists do not prove truth or authorship. Evidence may be misleading, mutable, unavailable, or rate-limited. Fingerprint disagreement may prevent consensus. Model assessments and injection defenses can fail. GitHub API responses can differ across validators; raw commit-pinned documents are more reproducible. Redirect handling is delegated to the GenVM web transport. A first public challenger can consume the sole challenge round; there is no bond or Sybil resistance. Fixed source size limits exclude large responses. No wagering, custody, or payout mechanism is included.

The original deployment at `0x343aCE1DF53b6E7E86a6934Ce9c4511F2416cC6D` is superseded. Live testing exposed double-parsing of the SDK's native JSON dictionary; the current deployment fixes it and adds regression coverage. Preliminary evidence is retained under `docs/initial-live/`, separate from current-deployment evidence.
