# Studio built-in account: fresh milestone workflow

Verified on 2026-10-22 against the existing StudioNet 61999 deployment. No MetaMask, external wallet, private-key export or SDK-generated signing account was used. All five transactions were submitted through the Studio UI with Normal (Full Consensus) selected and Simulation Mode off.

Built-in account: `0xcb775F9517d53A3e6A16CEc670DB0313FCA5F444`.

Contract: `0xEa6703e6508D61a86ce904e87BAe448880Bb5E5C`. Event **3** is **FINAL / YES**, challenged once, with two successful review reports.

| Action | Finalized successful transaction |
| --- | --- |
| create_event | [0x60ef9fa774d9c0021accc7e2b0caa8d63d5ad37b314700b765f5482bf5d46d64](0x60ef9fa774d9c0021accc7e2b0caa8d63d5ad37b314700b765f5482bf5d46d64.json) |
| review | [0x62f40dd5aec1f73feff16444560e14ce475ce7ce01a5b4463aa20972306ce55c](0x62f40dd5aec1f73feff16444560e14ce475ce7ce01a5b4463aa20972306ce55c.json) |
| challenge | [0x44ede9c7895a21c71fe84a0260fb44cb5b6796a79cd9beb8c558bd52a1fb1780](0x44ede9c7895a21c71fe84a0260fb44cb5b6796a79cd9beb8c558bd52a1fb1780.json) |
| review | [0x369d369581f08f6fd795f76421a96ef2d63c79e593f7a4762045ca32088ee641](0x369d369581f08f6fd795f76421a96ef2d63c79e593f7a4762045ca32088ee641.json) |
| finalize | [0x11142dc24f0b90e1b307fd6212255b2ebd583290000ff77d7f09f90fdefe4f4e](0x11142dc24f0b90e1b307fd6212255b2ebd583290000ff77d7f09f90fdefe4f4e.json) |

## Consumer integration verification

- The SDK rejected event 3 while provisional with `NOT_FINAL`; see [the contemporaneous check](provisional-rejection.json).
- After finalization, a fresh SDK reader exported and independently rechecked its source pin, finalized state and correctly bound finalization receipt.
- Record SHA-256: `1bb20b9496db756bcc58a509ba280e29d0aeadf558172cc5d651c3ddcae5b952`.
- Recomputed hashes did not make an edited record pass: the live reread rejected it with `CHAIN_MISMATCH`.
- [Full receipts and resulting on-chain state](verification.json).
- [Portable event 3 bundle](event-3-bundle.json).

## Reproduce

1. Open the public app, find event 3, and inspect its FINAL / YES state, challenge and two reports.
2. Export its resolution; or import the event-3-bundle.json linked above, then press Recheck on StudioNet. Reads, import/export and verification need no wallet.
3. To submit another event, choose Open in Studio from the app. Use Studio’s built-in account; keep Normal (Full Consensus) selected and Simulation Mode off. Choose a future cutoff, submit create_event, then wait for cutoff and finalized successful creation before review.
4. During its first challenge window submit distinct evidence through challenge; wait until review_after and challenge finality before review again. Wait until challenge_until before finalize.
5. Collect another Studio run without signing anything through the CLI:

```sh
node scripts/verify-studio-workflow.mjs 3
```

The collection script is read-only. Exit 0 means the complete five-transaction workflow and the new consumer verification passed; a nonfinal workflow exits 2. These are new milestone verification transactions; the accepted original deployment and events 1/2 remain unchanged.

## Public frontend follow-up

Actual file-input imports of events 2 and 3 passed online verification in the public production app. A browser-managed export returned a download path, but that temporary path could not be recovered; the independently saved SDK bundle was used for import. [Screenshot](public-verified.jpg) and [browser check log](../browser-verification.json) record this distinction. The follow-up also fixes stale global error messages after a successful import/recheck and preserves readable primary-button hover contrast.

## Limits

Studio’s built-in account is a Studio signing flow, not an embedded MetaMask replacement in the public frontend. Frontend writes still require its wallet connection; the Open in Studio link provides the wallet-free-in-the-frontend alternative. Real MetaMask extension signing remains untested. StudioNet may reset. RPC rechecks are consistency checks, not inclusion proofs.
