# Milestone v1: Consumer SDK and portable resolution verification

Accepted baseline: GitHub commit `9ed0fb83996d809a038d121df559fafa8fe9a6af`.

This milestone adds a reusable developer integration and a new frontend workflow. It does not resubmit the original deployment, rename the project, claim new validator transactions, or modify accepted on-chain history.

## Documented delta

| Accepted version | New work in this milestone | Why it matters |
| --- | --- | --- |
| Read resolutions through the project UI or direct contract methods | Standalone account-free JavaScript consumer SDK and consumer example | Other dApps can consume explicit finalized decisions without copying application code |
| Inspect evidence in the page | Export/import versioned, bounded JSON resolution bundles | Reviewers and integrators can carry and independently recheck a complete record |
| UI displays finalized results | Caller-pinned source checks, chain identity checks, record/view consistency checks, receipt-to-event binding | Reject wrong deployments, changed code, provisional results and unrelated receipts |
| No portable record consistency verifier | Canonical hashes plus mandatory live re-read | Editing an export and recomputing its hashes cannot substitute invented chain data |
| Outcome string potentially misused by downstream code | Explicit YES/NO conversion with an UNRESOLVED guard | Consumers cannot silently turn uncertainty into a binary action |
| 30 local tests | 30 additional consumer SDK adversarial tests; 60 total | New import/consumer behavior has regression and misuse coverage |

The accepted contract remains `0xEa6703e6508D61a86ce904e87BAe448880Bb5E5C` on StudioNet 61999, with unchanged source SHA-256 `bb13b4c1278f211256473eeedbe5fca68818cf821637a17ce00a030b0d2a8ee9`. There is no new contract deployment or migration to claim for this milestone. The frontend gets a new published version.

## Implementation

- `sdk/index.js`: consumer reads, source/chain checks, bounded format, canonical hashing, finalization discovery/binding, export and online re-verification.
- `sdk/receipt.js`: shared receipt validator; `src/receipt.js` re-exports it to preserve existing imports.
- `sdk/package.json` and `sdk/README.md`: independently packable package and integration guide. Not published to npm.
- `examples/consumer.mjs`: actual account-free consumer integration.
- `src/main.js`, `index.html`, `src/style.css`: export, paste/file import, online recheck, explicit deployment source pin and stale-input guards.
- `tests/consumer-sdk.test.js`: 30 new tests including provisional results, source changes, wrong chain/contract/event, nonfinal/reverted receipts, tampering and recomputed malicious hashes.

## Reviewer path

1. Open the frontend at https://eventoracle-amzar.tinymule33.chatgpt.site.
2. In **Take the evidence with you**, click **Load live YES example**, then **Recheck on StudioNet**. Expect event 2 / YES with source, record and receipt matching.
3. Select a FINAL event and click **Export verified resolution (.json)**. Re-import the downloaded JSON file and recheck it.
4. Edit its criteria without changing the hashes: expect TAMPERED_BUNDLE. Import `docs/milestone-v1/intentionally-invalid-rehashed-forgery.json`, whose hashes have already been recomputed: expect CHAIN_MISMATCH after an independent live read.
5. Export event 1 to see a valid FINAL / UNRESOLVED record. The SDK's `asBoolean` rejects that outcome rather than returning false.
6. Inspect the package and run the commands below to reproduce verification without a wallet.

```sh
npm ci
npm test
npm run build
npm run verify:milestone
node examples/consumer.mjs 2
```

The live command rechecks existing accepted records. Their original finalization hashes are supporting anchors, **not new milestone transactions**.

## Evidence

- [New live verification report](milestone-v1/live-verification.json): two exports and independent RPC rechecks; rejection of a rehashed forgery and wrong-event receipt; unresolved guard; StudioNet receipt discovery.
- [Portable YES record](milestone-v1/event-2.json)
- [Portable UNRESOLVED record](milestone-v1/event-1.json)
- [Intentionally invalid rehashed record](milestone-v1/intentionally-invalid-rehashed-forgery.json)
- [New test results](milestone-v1/test-results.txt)
- [Build results](milestone-v1/build-results.txt)
- [Browser verification](milestone-v1/browser-verification.json): live example, online recheck and tamper rejection observed in preview. The native file chooser stalled; upload/download browser checks and screenshot capture remain incomplete.

## Scope and limitations

The added workflows are read-only and require no wallet, signing key, or new account. Existing MetaMask signing limitations from the accepted project are not represented as fixed by this milestone.

Portable bundles are RPC-rechecked consistency records, not wallet signatures, Merkle proofs, or an independent guarantee of real-world truth. A malicious RPC remains outside this verifier's protection. The SDK targets stable StudioNet / genlayer-js 1.1.8, and bounded automatic receipt discovery uses a Studio-specific method; callers can supply an explicit finalization hash. The SDK is included/packable but not published to npm. No adoption, external users or production readiness is claimed.
