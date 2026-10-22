import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {abi} from 'genlayer-js';
import {createOracleReader,asBoolean,hashRecord,hashBundle,parseBundle,canonicalJson,sha256Text,MAX_BUNDLE_BYTES} from '../sdk/index.js';
const d=JSON.parse(await readFile(new URL('../docs/deployment.json',import.meta.url),'utf8'));
const evidence=JSON.parse(await readFile(new URL('../docs/live/verification.json',import.meta.url),'utf8'));
const code=await readFile(new URL('../contracts/event_oracle.py',import.meta.url),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const hash=evidence.transactions.find(t=>t.method==='finalize'&&t.args[0]==='2').hash;
const otherHash=evidence.transactions.find(t=>t.method==='finalize'&&t.args[0]==='1').hash;
function harness(eventId='2') {
 const record=clone(evidence.events.find(q=>q.id===eventId));delete record.resolutionRead;
 const transactions=evidence.transactions.filter(t=>t.method==='finalize').map(t=>({hash:t.hash,to_address:d.address,status:7,chainId:61999,data:{calldata:{base64:Buffer.from(abi.calldata.encode({method:t.method,args:t.args})).toString('base64')}},consensus_data:clone(t.receipt.consensus_data)}));
 const calls=[];let codeReads=0;
 const c={chain:{id:61999},record,transactions,calls,
  async request(r){calls.push(r);if(r.method==='eth_chainId')return '0xf22f';if(r.method==='sim_getTransactionsForAddress')return transactions;throw Error('Unexpected method');},
  async getContractCode(){codeReads++;return code;},
  async readContract(r){calls.push(r);return r.functionName==='get_event'?JSON.stringify(c.record):c.record.outcome;},
  async getTransaction({hash}){calls.push({method:'getTransaction',hash});return clone(transactions.find(t=>t.hash===hash));}
 };
 return {client:c,record,transactions,reader:createOracleReader({client:c,address:d.address,expectedSourceSha256:d.sourceSha256}),get codeReads(){return codeReads;}};
}
const rejectsCode=async(p,code)=>assert.rejects(p,e=>e.code===code);
async function bundleFor(h){return h.reader.exportBundle(h.record.id,{finalizationHash:h.record.id==='2'?hash:otherHash});}
function rehash(b){b.recordHash=hashRecord(b.record);b.bundleHash=hashBundle(b);return b;}

test('SDK finalized reads pin source before and after and explicitly use LATEST_FINAL',async()=>{const h=harness();const r=await h.reader.readFinalResolution('2');assert.equal(r.resolution,'YES');assert.ok(h.codeReads>=2);assert.equal(h.client.calls.filter(c=>c.functionName).every(c=>c.transactionHashVariant==='LATEST_FINAL'),true);});
test('YES and NO map to booleans; UNRESOLVED cannot silently become false or true',()=>{assert.equal(asBoolean('YES'),true);assert.equal(asBoolean('NO'),false);assert.throws(()=>asBoolean('UNRESOLVED'),e=>e.code==='UNRESOLVED');});
test('UNRESOLVED can be exported and independently rechecked without a binary decision',async()=>{const h=harness('1');const b=await bundleFor(h);assert.equal((await h.reader.verifyBundle(b)).resolution,'UNRESOLVED');});
test('provisional YES is not consumable',async()=>{const h=harness();h.record.state='PROPOSED';await rejectsCode(h.reader.readFinalResolution('2'),'NOT_FINAL');});
test('event namespace is checked',async()=>{const h=harness();h.record.id='9';await rejectsCode(h.reader.readFinalResolution('2'),'INVALID_RECORD');});
test('noncanonical event IDs rejected before RPC calls',async()=>{for(const id of ['0','01','-1','2.0',2,'1'.repeat(79)]){const h=harness();await rejectsCode(h.reader.readFinalResolution(id),'INVALID_EVENT_ID');assert.equal(h.client.calls.length,0);}});
test('source mismatch is rejected',async()=>{const h=harness();h.client.getContractCode=async()=>code+'\n';await rejectsCode(h.reader.readFinalResolution('2'),'SOURCE_MISMATCH');});
test('source changing between reads is rejected',async()=>{const h=harness();let n=0;h.client.getContractCode=async()=>++n===1?code:code+'\n';await rejectsCode(h.reader.readFinalResolution('2'),'SOURCE_MISMATCH');});
test('configured wrong network rejected',async()=>{const h=harness();h.client.chain.id=1;await rejectsCode(h.reader.readFinalResolution('2'),'WRONG_CHAIN');});
test('RPC chain identity is checked independently',async()=>{const h=harness();h.client.request=async()=> '0x1';await rejectsCode(h.reader.readFinalResolution('2'),'WRONG_CHAIN');});
test('get_resolution disagreement rejected',async()=>{const h=harness();const original=h.client.readContract;h.client.readContract=async r=>r.functionName==='get_resolution'?'NO':original(r);await rejectsCode(h.reader.readFinalResolution('2'),'INCONSISTENT_STATE');});
test('portable bundle round trip verifies record, source, receipt and chain identity',async()=>{const h=harness();const b=await bundleFor(h);const r=await h.reader.verifyBundle(JSON.stringify(b));assert.equal(r.verified,true);assert.equal(r.resolution,'YES');assert.equal(r.finalization.hash,hash);});
test('edited criteria fail local digest verification',async()=>{const h=harness();const b=await bundleFor(h);b.record.criteria+=' Edited';await rejectsCode(h.reader.verifyBundle(b),'TAMPERED_BUNDLE');});
test('attacker recomputing every digest still fails independent chain reread',async()=>{const h=harness();const b=await bundleFor(h);b.record.criteria+=' Rehashed forgery';rehash(b);await rejectsCode(h.reader.verifyBundle(b),'CHAIN_MISMATCH');});
test('edited evidence fingerprint with recomputed hashes still fails online',async()=>{const h=harness();const b=await bundleFor(h);b.record.history[0].result.sources[0].fingerprint='0'.repeat(64);rehash(b);await rejectsCode(h.reader.verifyBundle(b),'CHAIN_MISMATCH');});
test('bundle for another contract cannot be accepted under this deployment pin',async()=>{const h=harness();const b=await bundleFor(h);b.contract='0x'+'1'.repeat(40);b.bundleHash=hashBundle(b);await rejectsCode(h.reader.verifyBundle(b),'WRONG_CONTRACT');});
test('self-declared alternative source hash is rejected',async()=>{const h=harness();const b=await bundleFor(h);b.sourceSha256='0'.repeat(64);b.bundleHash=hashBundle(b);await rejectsCode(h.reader.verifyBundle(b),'WRONG_CONTRACT');});
test('receipt for another event rejected',async()=>{const h=harness();await rejectsCode(h.reader.exportBundle('2',{finalizationHash:otherHash}),'WRONG_EVENT');});
test('receipt for another contract rejected',async()=>{const h=harness();h.transactions.find(t=>t.hash===hash).to_address='0x'+'2'.repeat(40);await rejectsCode(bundleFor(h),'WRONG_CONTRACT');});
test('nonfinal receipt rejected',async()=>{const h=harness();h.transactions.find(t=>t.hash===hash).status=5;await rejectsCode(bundleFor(h),'INVALID_RECEIPT');});
test('finalized revert rejected',async()=>{const h=harness();h.transactions.find(t=>t.hash===hash).consensus_data.leader_receipt[0].execution_result='ERROR';await rejectsCode(bundleFor(h),'INVALID_RECEIPT');});
test('RPC substituting another transaction hash rejected',async()=>{const h=harness();h.client.getTransaction=async()=>({...h.transactions.find(t=>t.hash===hash),hash:otherHash});await rejectsCode(bundleFor(h),'INVALID_RECEIPT');});
test('review transaction cannot stand in for finalization',async()=>{const h=harness();h.transactions.find(t=>t.hash===hash).data.calldata.base64=Buffer.from(abi.calldata.encode({method:'review',args:['2']})).toString('base64');await rejectsCode(bundleFor(h),'WRONG_EVENT');});
test('timeout recovery receipt accepted only for a timeout record',async()=>{const h=harness('1');h.record.timeout=true;h.transactions.find(t=>t.hash===otherHash).data.calldata.base64=Buffer.from(abi.calldata.encode({method:'recover_timeout',args:['1']})).toString('base64');const b=await bundleFor(h);assert.equal(b.finalization.method,'recover_timeout');assert.equal((await h.reader.verifyBundle(b)).verified,true);});
test('garbled calldata fails closed',async()=>{const h=harness();h.transactions.find(t=>t.hash===hash).data={calldata:{base64:'!!!'}};await rejectsCode(bundleFor(h),'INVALID_RECEIPT');});
test('discovery skips unrelated and failed receipts and verifies chosen receipt independently',async()=>{const h=harness();const b=await h.reader.exportBundle('2');assert.equal(b.finalization.hash,hash);assert.ok(h.client.calls.some(c=>c.method==='getTransaction'&&c.hash===hash));});
test('RPC failure cannot degrade to locally trusting an imported file',async()=>{const h=harness();const b=await bundleFor(h);h.client.getTransaction=async()=>{throw Error('RPC unavailable');};await assert.rejects(h.reader.verifyBundle(b),/RPC unavailable/);});
test('oversized bundle refused',()=>assert.throws(()=>parseBundle(' '.repeat(MAX_BUNDLE_BYTES+1)),e=>e.code==='INVALID_BUNDLE'));
test('malformed JSON and unknown fields refused',async()=>{assert.throws(()=>parseBundle('{'));const h=harness();const b=await bundleFor(h);b.signature='claimed';assert.throws(()=>parseBundle(b),e=>e.code==='INVALID_BUNDLE');});
test('canonical record hash ignores key order and is a SHA-256 digest',()=>{assert.equal(hashRecord({a:1,b:2}),hashRecord({b:2,a:1}));assert.equal(sha256Text('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');assert.throws(()=>canonicalJson({a:NaN}));});
