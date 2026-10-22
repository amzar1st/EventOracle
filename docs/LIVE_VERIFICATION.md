# EventOracle live verification

Verified snapshot: 2026-10-21T04:30:25.572Z. StudioNet chain **61999**.

## Deployment

- Contract: `0xEa6703e6508D61a86ce904e87BAe448880Bb5E5C`
- Explorer: https://explorer-studio.genlayer.com/address/0xEa6703e6508D61a86ce904e87BAe448880Bb5E5C
- Deployment transaction: `0x99248aad12b4867e07338cc6f1479a40808329deb3488e33a08a909c53fcf926`
- Source-matched GitHub commit: `f56fd685d98c080121b37cf5883b0a5df9a78657`
- SHA-256 of local, deployment payload, and current deployed source: `bb13b4c1278f211256473eeedbe5fca68818cf821637a17ce00a030b0d2a8ee9`
- Signing account: `0x981F173A0d46C4Bb1BC72B01da22dF888ed35956` (Studio built-in account).
- Deployment submitted through the actual Studio browser UI with Normal (Full Consensus), not leader-only or simulation mode.
- Finalized successful receipt: [live/deployment-receipt.json](live/deployment-receipt.json).

## Live transactions

| Method | Arguments | Hash | Finalized successful execution |
| --- | --- | --- | --- |
| deploy | [] | [0x99248aad12b4867e07338cc6f1479a40808329deb3488e33a08a909c53fcf926](live/0x99248aad12b4867e07338cc6f1479a40808329deb3488e33a08a909c53fcf926.json) | YES |
| create_event | ["Was GenLayerJS v1.1.8 publicly released before the event cutoff?","Resolve YES only if official genlayerlabs/genlayer-js GitHub metadata identifies tag_name v1.1.8, draft false, prerelease false, and a published_at timestamp before the event cutoff. NO requires direct dated disproof. Missing, invalid, or unavailable evidence is UNRESOLVED.","1792554693","[{\"url\":\"https://api.github.com/repos/genlayerlabs/genlayer-js/releases/tags/v1.1.8\",\"sha256\":\"\"}]","300"] | [0x11947a1b0f52c343ee8e9a51cddb91a4d6d826a6a682bd14c5eae32e9372d38b](live/0x11947a1b0f52c343ee8e9a51cddb91a4d6d826a6a682bd14c5eae32e9372d38b.json) | YES |
| review | ["1"] | [0xd2f90c1137fe8300db9dc0144425a7643a713d12ae3ee9253facd82d60a91b4f](live/0xd2f90c1137fe8300db9dc0144425a7643a713d12ae3ee9253facd82d60a91b4f.json) | YES |
| challenge | ["1","The initial source was unavailable to validators. Re-evaluate using the official numeric release endpoint, which independently identifies the same release and its dated publication metadata.","[{\"url\":\"https://api.github.com/repos/genlayerlabs/genlayer-js/releases/318683025\",\"sha256\":\"\"}]"] | [0xaa72e4db5a7239c8cecf846d7e61bff6d93101c3032e77833c8d346b756a4c16](live/0xaa72e4db5a7239c8cecf846d7e61bff6d93101c3032e77833c8d346b756a4c16.json) | YES |
| create_event | ["Does the official GenLayerJS v1.1.8 changelog date its release to May 6, 2026?","Use the official genlayerlabs/genlayer-js changelog pinned to commit 4303db00c428d57c6d8e5b04a75043ea42d4b0e7. YES requires an explicit version 1.1.8 heading dated 2026-05-06, which is before the event cutoff. NO requires an explicit different date for that exact version. Missing or invalid evidence is UNRESOLVED. This assesses the published changelog date, not independent proof of package distribution.","1792554927","[{\"url\":\"https://raw.githubusercontent.com/genlayerlabs/genlayer-js/4303db00c428d57c6d8e5b04a75043ea42d4b0e7/CHANGELOG.md\",\"sha256\":\"\"}]","60"] | [0xf9bca2d9c336d424a4ee6b4a442d8469acd674bd490ababbbc88d4fae703e7b6](live/0xf9bca2d9c336d424a4ee6b4a442d8469acd674bd490ababbbc88d4fae703e7b6.json) | YES |
| review | ["1"] | [0x30ee75af813145c74c65aa6131e984c1769a8c8ccadf4f799577a98f9fc33e1f](live/0x30ee75af813145c74c65aa6131e984c1769a8c8ccadf4f799577a98f9fc33e1f.json) | YES |
| review | ["2"] | [0xae2f53d49ca47980df2e2981e33b2130153f65200ea4495c39388943e1fa67b7](live/0xae2f53d49ca47980df2e2981e33b2130153f65200ea4495c39388943e1fa67b7.json) | YES |
| finalize | ["2"] | [0x8e3d76effc337da339ae8a60cd02ec6d968d8898f6e7608ed29dad280342f529](live/0x8e3d76effc337da339ae8a60cd02ec6d968d8898f6e7608ed29dad280342f529.json) | YES |
| finalize | ["1"] | [0x46b49af1c98208dd713f3ddc7a03bec89f8b419e7c3ac0f06e5d5825479054cb](live/0x46b49af1c98208dd713f3ddc7a03bec89f8b419e7c3ac0f06e5d5825479054cb.json) | YES |

## Finalized-state reads

### Event 1: Was GenLayerJS v1.1.8 publicly released before the event cutoff?

- State: **FINAL**; stored outcome: **UNRESOLVED**.
- get_resolution read: **UNRESOLVED**.
- Review reports: 2; challenged: true.
- Creator: `0x981F173A0d46C4Bb1BC72B01da22dF888ed35956`.
- Cutoff: 1792554693; review-after: 1792554886; challenge boundary: 1792555213.

- Report at 1792554720: UNRESOLVED; sources: INVALID/UNRESOLVED (https://api.github.com/repos/genlayerlabs/genlayer-js/releases/tags/v1.1.8; SHA-256 not obtained).
- Report at 1792554913: UNRESOLVED; sources: INVALID/UNRESOLVED (https://api.github.com/repos/genlayerlabs/genlayer-js/releases/tags/v1.1.8; SHA-256 not obtained); INVALID/UNRESOLVED (https://api.github.com/repos/genlayerlabs/genlayer-js/releases/318683025; SHA-256 not obtained).

### Event 2: Does the official GenLayerJS v1.1.8 changelog date its release to May 6, 2026?

- State: **FINAL**; stored outcome: **YES**.
- get_resolution read: **YES**.
- Review reports: 1; challenged: false.
- Creator: `0x981F173A0d46C4Bb1BC72B01da22dF888ed35956`.
- Cutoff: 1792554927; review-after: 1792554927; challenge boundary: 1792555016.

- Report at 1792554956: YES; sources: VALID/YES (https://raw.githubusercontent.com/genlayerlabs/genlayer-js/4303db00c428d57c6d8e5b04a75043ea42d4b0e7/CHANGELOG.md; SHA-256 c4786d51a77b9d65262642a80e51098a5b840e89be123f4811ee0b352dbca531).

Full finalized-state records and receipt summaries: [live/verification.json](live/verification.json). `resolutionRead` in that file is the separately queried view result, not a contract storage field. Provider/node configuration is intentionally omitted from public receipt summaries; hashes permit re-fetching from StudioNet.

## Integration and tests

- genlayer-js 1.1.8 is pinned to the stable StudioNet preset (61999), not the 61997 development preview.
- The frontend uses the verified deployment by default; reads need no wallet and use LATEST_FINAL. FINAL records are cross-checked with get_resolution.
- Receipt verification supports actual StudioNet numeric FINALIZED status 7 and checks leader/validator execution results. A finalized revert is rejected.
- The MetaMask path requests an account, adds/switches to 61999 only when needed, confirms the final chain and selected account, and rechecks them before a write. It does not request Snap installation.
- 12 Python behavior/regression tests and 18 JavaScript tests pass (30 total); Vite production build passes. Native SDK dictionary responses, reverted receipts, provider absence, user rejection, wrong chain, account changes, and real-SDK encoded provider writes are covered.
- SDK write/provider tests use controlled fixtures. They are not represented as a real MetaMask signature.

## Reproduction

```sh
npm ci
npm test
npm run build
node scripts/collect-deployment.mjs
node scripts/collect-live.mjs
```

The collection scripts are read-only on-chain and write refreshed evidence locally. To replay the workflow, open the deployed contract in Studio, use the built-in account, keep Normal (Full Consensus) selected and Simulation Mode off. Create a future-cutoff event, wait until the cutoff, review it, submit a challenge during its first waiting window, wait until review_after, review again, then finalize after challenge_until. Read get_event and get_resolution from finalized state. Do not resubmit a pending transaction; inspect its existing hash.

## Remaining limitations

- Actual MetaMask extension approval/signing and a completed frontend browser session are not confirmed. The cloud browser timed out opening the deployed frontend and its session was subsequently lost. Studio built-in account execution and controlled EIP-1193 tests are distinct evidence. No external wallet account or private key is substituted.
- Native Sites publication succeeded with public access confirmed. A direct HTTP check from the execution environment returned 403; external browser accessibility could not be independently verified from this environment. See live/frontend-publication.json.
- GitHub API retrieval failed for some validator requests. Such evidence is recorded INVALID and the result stays conservative; no unsupported YES is reported.
- Long timeout recovery and every adversarial path are covered locally, but this verification does not claim a 7/14-day live timeout demonstration.
- StudioNet is a development environment and may reset; model output, public-source availability, and strict fingerprint matching remain reliability limits.

## Superseded first deployment

The first instance at `0x343aCE1DF53b6E7E86a6934Ce9c4511F2416cC6D` is not the frontend default. An early review reverted before cutoff. Subsequent live testing exposed double-parsing of native JSON-mode SDK output, which could make valid evidence INVALID. The current source commit fixes that bug and regression-tests the dictionary return type. Preliminary receipts remain under `initial-live/` and are not counted as current successful workflow evidence.


## Milestone v1: consumer integration (2026-10-22)

The accepted deployment is unchanged. New read-only SDK verification exports/rechecks finalized YES and UNRESOLVED records, rejects a rehashed forged record and wrong-event receipt, checks the unresolved guard, and discovers the successful finalization transaction. All six live checks passed. See [the documented delta](MILESTONE_V1.md), [live report](milestone-v1/live-verification.json), [60-test results](milestone-v1/test-results.txt), and [browser results and limitations](milestone-v1/browser-verification.json). The original finalization transactions are anchors for the new consumer workflow, not new milestone transactions.


## Fresh built-in-account workflow (2026-10-22)

Completed a new create → review → challenge → re-review → finalize workflow for event 3 through the Studio UI with its built-in account, Normal (Full Consensus), and Simulation Mode off. All five transactions finalized with successful execution. Event 3 is FINAL / YES with two review reports. The new SDK rejected the provisional state, then exported/rechecked its final record and receipt and rejected a rehashed forgery. See [reproducible evidence and receipt links](milestone-v1/studio/README.md).

The public production frontend was accessible in the browser during this run and read event 3; file imports of events 2/3 were exercised. This supersedes the earlier production-access limitation for this run. A browser-managed downloaded file could not be recovered from its returned path; a confirmed shared JSON fixture imported successfully instead. MetaMask extension signing remains untested; Studio built-in signing is independently verified.
