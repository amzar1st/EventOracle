# EventOracle consumer SDK

New in milestone v1: reusable, account-free finalized resolution reads plus portable JSON export/recheck. Targets stable **StudioNet 61999** and **genlayer-js 1.1.8**.

This package is included in the repository and can be packed or installed from its `sdk/` directory. It has **not** been published to npm. Do not assume an unrelated package with the same name is this implementation.

## Consumer integration

From a checkout:

```sh
npm ci
node examples/consumer.mjs 2
node examples/consumer.mjs 1
```

Event 2 prints a verified YES/true decision. Event 1 intentionally exits with `UNRESOLVED`, demonstrating that a consumer cannot silently convert uncertainty into a binary decision.

In your application:

```js
import {createOracleReader, asBoolean} from './sdk/index.js';

const oracle = createOracleReader({
  address: '0xEa6703e6508D61a86ce904e87BAe448880Bb5E5C',
  expectedSourceSha256: 'bb13b4c1278f211256473eeedbe5fca68818cf821637a17ce00a030b0d2a8ee9',
});

const final = await oracle.readFinalResolution('2');
const decision = asBoolean(final.resolution);
console.log(decision, final.recordHash);

const bundle = await oracle.exportBundle('2', {
  finalizationHash: '0x8e3d76effc337da339ae8a60cd02ec6d968d8898f6e7608ed29dad280342f529',
});
const rechecked = await oracle.verifyBundle(JSON.stringify(bundle));
console.log(rechecked.verified, rechecked.resolution);
```

Import from the installed `eventoracle-client` package if you install the reviewed local package directory/archive. The relative path above is for this repository checkout. An optional `client` accepts a configured genlayer-js reader; both its chain configuration and the actual RPC chain ID are checked.

## APIs

| Function | Behavior |
| --- | --- |
| `createOracleReader({address, expectedSourceSha256, client?})` | Pin the deployment independently of any imported JSON |
| `reader.readFinalResolution(eventId)` | Read LATEST_FINAL record and resolution; reject provisional/mismatched results; verify source before and after |
| `reader.exportBundle(eventId, {finalizationHash?})` | Bind the record to its successful finalization receipt and export canonical hashes |
| `reader.verifyBundle(jsonOrObject)` | Parse bounded JSON, check hashes and deployment identity, re-read live source/record/resolution/receipt |
| `asBoolean(outcome)` | YES → true; NO → false; UNRESOLVED/unknown → throw |
| `parseBundle(input)` | Validate local structure and digests only; does **not** constitute online verification |
| `hashRecord(record)` / `hashBundle(bundle)` | Stable canonical JSON SHA-256 hashing; does **not** establish truth alone |

An omitted finalization hash uses StudioNet's bounded transaction-discovery convenience method. Explicit hashes are preferable for integrations and avoid dependence on `sim_getTransactionsForAddress`. Discovery independently fetches and checks the selected receipt; it does not trust the transaction list alone.

## What is checked

1. Configured client and RPC identify chain 61999.
2. Current deployed source matches the caller's expected SHA-256, before and after reads.
3. `get_event` and `get_resolution` both use LATEST_FINAL, match the requested event, and agree on a FINAL outcome.
4. A successful finalized receipt targets the configured contract, has the requested hash, and decodes to `finalize(eventId)` or `recover_timeout(eventId)` as appropriate.
5. Bundle identity, entire canonical record hash, and domain-separated bundle hash agree. Recomputed malicious hashes still fail if the record differs from live chain state.

## Format and trust boundary

Format identifier: `eventoracle-resolution/v1`. Imports are limited to **256 KiB**, plain JSON, bounded nesting, and safe integer numbers. Event IDs are positive uint256 decimal strings. Unknown top-level fields are refused.

The exported file contains the full finalized record, its resolution, deployment identity, expected source hash, finalization hash/method, canonical record hash, export timestamp, and bundle hash. It does not contain a signing key, wallet signature, Merkle inclusion proof, or independent validator attestation.

**The RPC remains a trust dependency.** Online rechecking establishes consistency with the selected RPC, not cryptographic protection against a malicious/colluding endpoint. Source pinning detects changed code as reported by that endpoint. Multiple RPC reads are not an atomic block snapshot; before/after pin checks reduce accidental mismatch but cannot defeat a malicious endpoint or precisely timed code changes. The export timestamp is local metadata, not a freshness certificate. Imported data remains untrusted until `verifyBundle` finishes successfully. RPC failures never fall back to trusting a local file.

This SDK validates recorded oracle decisions and finality; it does not independently prove the truth of the real-world event or re-run the validators' AI assessments. Applications must set their own trust, value, freshness, and risk policies. StudioNet may reset.

## Tests and reproducible live evidence

```sh
npm test
npm run verify:milestone
```

The live command submits no transactions, uses no signing account, rechecks both accepted events, tests an altered record with recomputed hashes, rejects another event's finalization receipt, and exercises finalization discovery. See `docs/milestone-v1/live-verification.json` and `tests/consumer-sdk.test.js`.
