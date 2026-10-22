import {createClient, abi} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {sha256} from '@noble/hashes/sha256';
import {assertSuccessful} from './receipt.js';

export const BUNDLE_FORMAT = 'eventoracle-resolution/v1';
export const MAX_BUNDLE_BYTES = 262144;
const encoder = new TextEncoder();
const HEX = /^[0-9a-f]{64}$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const TX = /^0x[0-9a-fA-F]{64}$/;
const OUTCOMES = ['YES', 'NO', 'UNRESOLVED'];
const BUNDLE_KEYS = ['format','chainId','contract','eventId','sourceSha256','resolution','record','recordHash','finalization','exportedAt','bundleHash'];

export class OracleError extends Error {
  constructor(code, message) { super(message); this.name='OracleError'; this.code=code; }
}
function requireThat(ok, code, message) { if (!ok) throw new OracleError(code,message); }
export function canonicalJson(value, depth=0) {
  requireThat(depth<=24, 'INVALID_DATA', 'JSON nesting limit exceeded');
  if(value===null || typeof value==='boolean' || typeof value==='string') return JSON.stringify(value);
  if(typeof value==='number') { requireThat(Number.isSafeInteger(value),'INVALID_DATA','Only safe integers are supported'); return JSON.stringify(value); }
  if(Array.isArray(value)) { requireThat(value.length<=2000,'INVALID_DATA','Array limit exceeded'); return '['+value.map(x=>canonicalJson(x,depth+1)).join(',')+']'; }
  requireThat(value && Object.getPrototypeOf(value)===Object.prototype,'INVALID_DATA','Expected plain JSON data');
  const keys=Object.keys(value).sort();
  requireThat(keys.length<=2000,'INVALID_DATA','Object limit exceeded');
  return '{'+keys.map(k=>JSON.stringify(k)+':'+canonicalJson(value[k],depth+1)).join(',')+'}';
}
export function sha256Text(text) { return Array.from(sha256(encoder.encode(text)),b=>b.toString(16).padStart(2,'0')).join(''); }
export function hashRecord(record) { return sha256Text(canonicalJson(record)); }
function bodyOf(bundle) { const {bundleHash,...body}=bundle; return body; }
export function hashBundle(bundle) { return sha256Text(BUNDLE_FORMAT+'\n'+canonicalJson(bodyOf(bundle))); }
function eventIdOf(id) {
  requireThat(typeof id==='string' && /^[1-9][0-9]{0,77}$/.test(id) && BigInt(id)<2n**256n,'INVALID_EVENT_ID','Use a positive uint256 event ID string');
  return id;
}
function recordOf(raw, eventId) {
  requireThat(typeof raw==='string' && encoder.encode(raw).length<=MAX_BUNDLE_BYTES,'INVALID_RECORD','Missing or oversized event record');
  let q; try { q=JSON.parse(raw); } catch { throw new OracleError('INVALID_RECORD','Event record is not JSON'); }
  requireThat(q && !Array.isArray(q) && q.id===eventId,'INVALID_RECORD','Event ID differs from requested record');
  requireThat(q.state==='FINAL','NOT_FINAL','Event is provisional; finalized data is required');
  requireThat(OUTCOMES.includes(q.outcome),'INVALID_RECORD','Unknown outcome');
  requireThat(typeof q.question==='string' && q.question.length>=10 && q.question.length<=300 && typeof q.criteria==='string' && q.criteria.length>=20 && q.criteria.length<=2000,'INVALID_RECORD','Missing or oversized criteria');
  requireThat(Number.isSafeInteger(q.finalized_at) && q.finalized_at>0 && Number.isSafeInteger(q.deadline),'INVALID_RECORD','Invalid event timestamps');
  requireThat(Array.isArray(q.history) && q.history.length<=2 && Array.isArray(q.sources) && q.sources.length<=6,'INVALID_RECORD','Invalid bounded event history');
  canonicalJson(q);
  return q;
}
export function asBoolean(resolution) {
  requireThat(resolution==='YES' || resolution==='NO','UNRESOLVED','UNRESOLVED must not trigger a binary decision');
  return resolution==='YES';
}
export function parseBundle(input) {
  let text;
  try { text=typeof input==='string'?input:JSON.stringify(input); } catch { throw new OracleError('INVALID_BUNDLE','Bundle is not serializable JSON'); }
  requireThat(typeof text==='string' && encoder.encode(text).length<=MAX_BUNDLE_BYTES,'INVALID_BUNDLE','Bundle exceeds 256 KiB');
  let b; try { b=JSON.parse(text); } catch { throw new OracleError('INVALID_BUNDLE','Bundle is not valid JSON'); }
  requireThat(b && !Array.isArray(b) && Object.keys(b).sort().join(',')===[...BUNDLE_KEYS].sort().join(','),'INVALID_BUNDLE','Unexpected bundle fields');
  requireThat(b.format===BUNDLE_FORMAT && b.chainId===61999 && ADDRESS.test(b.contract),'INVALID_BUNDLE','Unsupported format, chain, or address');
  eventIdOf(b.eventId);
  requireThat(HEX.test(b.sourceSha256) && HEX.test(b.recordHash) && HEX.test(b.bundleHash),'INVALID_BUNDLE','Invalid digest');
  requireThat(typeof b.exportedAt==='string' && b.exportedAt.length<=40 && Number.isFinite(Date.parse(b.exportedAt)),'INVALID_BUNDLE','Invalid export date');
  requireThat(b.finalization && Object.keys(b.finalization).sort().join(',')==='hash,method' && TX.test(b.finalization.hash) && ['finalize','recover_timeout'].includes(b.finalization.method),'INVALID_BUNDLE','Missing finalization reference');
  requireThat(OUTCOMES.includes(b.resolution) && b.record?.outcome===b.resolution,'INVALID_BUNDLE','Outcome fields disagree');
  recordOf(JSON.stringify(b.record),b.eventId);
  requireThat(hashRecord(b.record)===b.recordHash && hashBundle(b)===b.bundleHash,'TAMPERED_BUNDLE','Bundle content or digest changed');
  return b;
}
function calldataOf(tx) {
  let value=tx.data?.calldata;
  if(value && typeof value==='object') value=value.base64;
  requireThat(typeof value==='string' && value.length<=16000,'INVALID_RECEIPT','Missing bounded transaction calldata');
  let decoded;
  try { decoded=abi.calldata.decode(Uint8Array.from(atob(value),c=>c.charCodeAt(0))); }
  catch { throw new OracleError('INVALID_RECEIPT','Cannot decode transaction calldata'); }
  return decoded instanceof Map?Object.fromEntries(decoded):decoded;
}

/** Stable StudioNet v1 consumer. The RPC remains a trust dependency; this is not a Merkle proof. */
export function createOracleReader({address, expectedSourceSha256, client=createClient({chain:studionet})}) {
  requireThat(ADDRESS.test(address),'INVALID_CONFIG','Invalid contract address');
  requireThat(HEX.test(expectedSourceSha256),'INVALID_CONFIG','Pin the deployed source SHA-256');
  const contract=address.toLowerCase();
  async function checkIdentity() {
    requireThat(Number(client.chain?.id)===61999,'WRONG_CHAIN','Client must use StudioNet 61999');
    requireThat(Number(await client.request({method:'eth_chainId'}))===61999,'WRONG_CHAIN','RPC endpoint is not StudioNet 61999');
    const code=await client.getContractCode(address);
    requireThat(typeof code==='string' && encoder.encode(code).length<=2097152 && sha256Text(code)===expectedSourceSha256,'SOURCE_MISMATCH','Deployed code does not match the caller-pinned source');
  }
  async function readFinalResolution(eventId) {
    eventIdOf(eventId);
    await checkIdentity();
    const record=recordOf(await client.readContract({address,functionName:'get_event',args:[eventId],transactionHashVariant:'LATEST_FINAL'}),eventId);
    const resolution=await client.readContract({address,functionName:'get_resolution',args:[eventId],transactionHashVariant:'LATEST_FINAL'});
    requireThat(resolution===record.outcome,'INCONSISTENT_STATE','Final resolution view differs from the record');
    await checkIdentity();
    return {chainId:61999,contract,eventId,sourceSha256:expectedSourceSha256,resolution,record,recordHash:hashRecord(record)};
  }
  async function verifyFinalization(hash, eventId, record) {
    requireThat(TX.test(hash),'INVALID_RECEIPT','Invalid transaction hash');
    const receipt=await client.getTransaction({hash});
    requireThat(receipt && receipt.hash?.toLowerCase()===hash.toLowerCase(),'INVALID_RECEIPT','RPC returned another transaction');
    requireThat((receipt.to_address||receipt.recipient)?.toLowerCase()===contract,'WRONG_CONTRACT','Receipt targets a different contract');
    if(receipt.chainId!==undefined && receipt.chainId!==null) requireThat(Number(receipt.chainId)===61999,'WRONG_CHAIN','Receipt is on another chain');
    try { assertSuccessful(receipt); } catch { throw new OracleError('INVALID_RECEIPT','Finalization is not finalized with successful execution'); }
    const call=calldataOf(receipt);
    const method=record.timeout===true?'recover_timeout':'finalize';
    requireThat(call.method===method && Array.isArray(call.args) && call.args.length===1 && call.args[0]===eventId,'WRONG_EVENT','Receipt does not finalize this event through its required method');
    return {hash:hash.toLowerCase(),method};
  }
  async function findFinalization(eventId, record) {
    // StudioNet convenience. Other RPC deployments can supply finalizationHash explicitly.
    const rows=await client.request({method:'sim_getTransactionsForAddress',params:[address]});
    requireThat(Array.isArray(rows) && rows.length<=10000,'RECEIPT_REQUIRED','Supply a finalization transaction hash');
    let attempts=0;
    for(const row of [...rows].reverse()) {
      if(!TX.test(row.hash||'')) continue;
      let call; try { call=calldataOf(row); } catch { continue; }
      if(!['finalize','recover_timeout'].includes(call.method) || call.args?.[0]!==eventId) continue;
      if(++attempts>20) break;
      try { return await verifyFinalization(row.hash,eventId,record); } catch { /* independently reject failed/nonfinal/unrelated candidates */ }
    }
    throw new OracleError('RECEIPT_REQUIRED','No successful finalization found; supply its transaction hash');
  }
  async function exportBundle(eventId,{finalizationHash}={}) {
    const snapshot=await readFinalResolution(eventId);
    const finalization=finalizationHash?await verifyFinalization(finalizationHash,eventId,snapshot.record):await findFinalization(eventId,snapshot.record);
    await checkIdentity();
    const bundle={format:BUNDLE_FORMAT,...snapshot,finalization,exportedAt:new Date().toISOString()};
    bundle.bundleHash=hashBundle(bundle);
    return parseBundle(bundle);
  }
  async function verifyBundle(input) {
    const bundle=parseBundle(input);
    requireThat(bundle.contract.toLowerCase()===contract && bundle.sourceSha256===expectedSourceSha256,'WRONG_CONTRACT','Bundle does not match this caller-pinned deployment');
    const current=await readFinalResolution(bundle.eventId);
    requireThat(current.recordHash===bundle.recordHash && current.resolution===bundle.resolution,'CHAIN_MISMATCH','Exported record differs from finalized chain data');
    const finalization=await verifyFinalization(bundle.finalization.hash,bundle.eventId,current.record);
    requireThat(finalization.method===bundle.finalization.method,'INVALID_RECEIPT','Finalization method differs');
    await checkIdentity();
    return {verified:true,...current,finalization,bundleHash:bundle.bundleHash};
  }
  return {readFinalResolution,exportBundle,verifyBundle};
}
