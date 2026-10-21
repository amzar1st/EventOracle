// This test exercises the REAL SDK with controlled RPC/provider fixtures.
// It is not a claim of an installed MetaMask extension or live wallet signing.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {createClient} from 'genlayer-js';import {studionet} from 'genlayer-js/chains';
const address='0xEa6703e6508D61a86ce904e87BAe448880Bb5E5C';
const account='0x981F173A0d46C4Bb1BC72B01da22dF888ed35956';
test('real genlayer-js write sends encoded review to EIP-1193 provider for chain 61999',async()=>{
 const original=globalThis.fetch;const reads=[];const sends=[];const hash='0x'+'1'.repeat(64);
 globalThis.fetch=async(url,options)=>{const r=JSON.parse(options.body);reads.push(r);const fixtures={eth_getTransactionCount:'0x0',eth_estimateGas:'0x30d40',eth_gasPrice:'0x0'};assert.ok(r.method in fixtures,'Unexpected RPC call '+r.method);return {json:async()=>({jsonrpc:'2.0',id:r.id,result:fixtures[r.method]})};};
 const provider={request:async r=>{assert.equal(r.method,'eth_sendTransaction');sends.push(r.params[0]);return hash;}};
 try{
  const sdk=createClient({chain:studionet,account,provider});
  assert.equal(await sdk.writeContract({address,functionName:'review',args:['1'],value:0n,leaderOnly:false}),hash);
  assert.equal(sends.length,1);const tx=sends[0];assert.equal(tx.from.toLowerCase(),account.toLowerCase());assert.equal(tx.chainId,'0xf22f');assert.equal(tx.to.toLowerCase(),studionet.consensusMainContract.address.toLowerCase());
  assert.ok(tx.data.toLowerCase().includes(address.slice(2).toLowerCase()));assert.ok(tx.data.includes(Buffer.from('review').toString('hex')));assert.equal(tx.value,'0x0');assert.ok(reads.some(r=>r.method==='eth_getTransactionCount'));
 }finally{globalThis.fetch=original;}
});
