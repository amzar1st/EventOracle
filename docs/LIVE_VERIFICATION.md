# Live verification

## Confirmed

StudioNet `gen_getContractSchemaForCode` via genlayer-js accepted the contract schema. Saved output: `schema.json`. Local behavioral harness: 10 passed. Frontend receipt assertions: 4 passed. Production build: passed.

## Pending — do not mark complete without evidence

| Check | Evidence required | Status |
| --- | --- | --- |
| Deploy latest contract using Studio built-in account | Contract address, deploy transaction hash, finalized successful receipt, code match | PENDING |
| YES event | Creation, review, finalization hashes plus saved record | PENDING |
| NO event with direct dated disproof | Hashes and evidence record | PENDING |
| Unsupported or unavailable evidence | Final UNRESOLVED with source diagnostics | PENDING |
| Conflicting evidence | UNRESOLVED plus conflict flag | PENDING |
| Challenge and second review | Challenge hash, two historical reports, final read | PENDING |
| Timeout recovery | Expired OPEN/CHALLENGED record and recovery hash | PENDING |
| Failed review retry | Failed receipt then successful retry, no stuck lock | PENDING |
| Immutable final result | Rejected write after finalization | PENDING |
| MetaMask frontend | Actual connect, signature, finalized successful receipt, state refresh | PENDING |
| Studio built-in wallet workflow | Actual selected built-in address and signed Studio transactions | PENDING |
| Browser UI and mobile layout | Actual screenshots and functional interaction | PENDING |

No deployment address or chain transaction hashes have been produced. Browser automation timed out before obtaining a Studio session. RPC `eth_accounts` returned Method not found. This report deliberately distinguishes local harness checks and schema validation from live GenVM execution.
