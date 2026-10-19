# EventOracle

AI-assisted, evidence-grounded YES/NO event resolution on GenLayer. This development implementation starts with GitHub release and public repository evidence. No prediction market, funds custody, betting, or payout logic is included.

## Verification status

- StudioNet accepted the contract schema (`docs/schema.json`).
- 10 Python behavioral tests and 4 JavaScript receipt tests pass.
- Vite production build passes.
- **Contract deployment, live consensus, real wallet signing, and browser end-to-end testing are not completed.** Browser access to Studio timed out. The public RPC does not expose `eth_accounts`; no Studio account was guessed, impersonated, or substituted.
- The website opens in a clearly labeled deployment-pending state. It accepts a verified deployed StudioNet address and reads finalized records. No demo records are presented as chain data.

## Run

Node 22+ and Python 3.11+:

```sh
npm ci
npm test
npm run build
npm exec vite
```

## Deploy using the Studio built-in account

1. Open https://studio.genlayer.com and select StudioNet (61999, matching genlayer-js 1.1.8).
2. Load `contracts/event_oracle.py`. Deploy with no constructor arguments using the selected built-in account. Do not enable leader-only execution.
3. Wait for finalized successful execution. Record the address and transaction hash in `docs/LIVE_VERIFICATION.md`.
4. Enter the address in EventOracle and click Load contract. Studio's built-in account exists within Studio; it is not an injected MetaMask provider for other websites. You can execute all contract methods within Studio with that account. To write from EventOracle, connect MetaMask using the SDK's StudioNet flow.
5. Use a future cutoff for creation; use a 60-second challenge window only for development demonstrations. Review after the cutoff, finalize after the challenge boundary, and confirm `get_resolution`.

## Contract interface

| Method | Purpose |
| --- | --- |
| `create_event(question, criteria, deadline, sources_json, challenge_seconds)` | Immutable question and criteria; cutoff must be future and within a year |
| `review(event_id)` | Independent source retrieval and AI assessment, provisional outcome |
| `challenge(event_id, reason, sources_json)` | One challenge with up to six new sources before the first window ends |
| `finalize(event_id)` | Freeze proposed result after its challenge window |
| `recover_timeout(event_id)` | Final UNRESOLVED when initial review expires after 14 days or challenged review expires after 7 days |
| `get_event(event_id)` | Full JSON including evidence, fingerprints, challenge, and review history |
| `get_count()` | Number of events |
| `get_resolution(event_id)` | Returns YES/NO/UNRESOLVED only for FINAL records; otherwise reverts |

`sources_json` is a JSON string, for example:

```json
[{"url":"https://api.github.com/repos/genlayerlabs/genlayer-js/releases/tags/v1.1.8","sha256":""}]
```

Validate the real tag and URL before using this example. Each source must be exactly under `https://api.github.com/repos/` or `https://raw.githubusercontent.com/`. Query strings, credentials, ports, fragments, escapes, and duplicate URLs are rejected. Pin raw URLs to commit SHAs where possible. Optional SHA-256 pins the exact fetched bytes, not rendered content. Oversized sources (>60KB), unavailable sources, invalid hashes and malformed AI responses are individually recorded INVALID.

## Consensus and evidence

Each validator independently fetches all sources and runs its own assessment. The custom equivalence function compares the outcome, conflict indicator, source identities, statuses, content fingerprints, and per-source votes. It then independently retrieves and audits decisive leader quotations against full source content and criteria. Validator intermediate assessments are not stored as separate votes; the accepted leader report is stored after network consensus.

YES needs direct proof satisfying the criteria and event cutoff. NO needs direct disproof or authoritative exhaustive evidence. Silence or missing evidence is UNRESOLVED. Opposing decisive source votes produce UNRESOLVED. Invalid sources do not automatically veto other sufficient sources. Semantic assessment is fallible; quoted substrings alone do not guarantee correctness.

Initial review is allowed from cutoff until cutoff +14 days. A proposal opens a challenge window. One challenge clears the usable outcome and delays review by 60 seconds to bound re-evaluation timing. No further evidence can be appended after challenge submission. The second proposal opens a final waiting window but cannot be challenged again. Recovery is permissionless and never manufactures a YES or NO. Failed consensus rolls back without setting a review lock, allowing retry until expiry. Every action requires an explicit transaction; deadlines do not execute actions automatically.

## Limitations and remaining acceptance work

This is not production-ready or audited. Domain restrictions limit scope but do not make repository content authoritative. Ask precise questions that bind the owner/repository, tag, draft/prerelease policy, relevant metadata fields, timestamp semantics, and what evidence establishes NO. GitHub APIs and raw content are mutable or can become unavailable. Fingerprint disagreement causes failed consensus; expiry is the conservative fallback. Redirect behavior is delegated to GenLayer's web transport; arbitrary source hosts are not supported, but target redirect behavior needs live validation before expanding use. A public first challenger can consume the single challenge round; no bond or identity-based Sybil resistance is implemented. There is no appeal beyond that round. Fixed content limits may make large API responses unusable. Prompt injection defenses and independent comparison reduce risk but are not a guarantee.

Frontend transaction success requires FINALIZED plus FINISHED_WITH_RETURN. Pending transaction IDs are retained for manual follow-up. The SDK is pinned to StudioNet's v1 interface; this release does not claim v0.6 preview compatibility.

See `docs/LIVE_VERIFICATION.md` for the remaining live acceptance matrix.
