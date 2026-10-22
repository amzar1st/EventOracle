// Collect a Studio UI write run, then independently verify its portable resolution.
// This script only reads RPC state. Transactions must be submitted in Studio itself.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {abi} from 'genlayer-js';
import {client,address,publicReceipt,json} from './live-common.mjs';
import {assertSuccessful} from '../sdk/receipt.js';
import {createOracleReader,hashRecord,hashBundle} from '../sdk/index.js';
const eventId=process.argv[2];
if(!/^[1-9][0-9]*$/.test(eventId||''))throw Error('Usage: node scripts/verify-studio-workflow.mjs EVENT_ID');
const d=JSON.parse(await readFile('docs/deployment.json','utf8'));
const dir='docs/milestone-v1/studio';await mkdir(dir,{recursive:true});
const record=JSON.parse(await client.readContract({address,functionName:'get_event',args:[eventId],transactionHashVariant:'LATEST_FINAL'}));
const rows=await client.request({method:'sim_getTransactionsForAddress',params:[address]});
const transactions=[];
for(const row of rows){
 if(row.type===1)continue;
 let decoded;try{let value=row.data?.calldata;if(typeof value==='object')value=value.base64;decoded=abi.calldata.decode(Buffer.from(value,'base64'));if(decoded instanceof Map)decoded=Object.fromEntries(decoded);}catch{continue;}
 if(decoded.method==='create_event'?decoded.args?.[0]!==record.question:decoded.args?.[0]!==eventId)continue;
 const receipt=await client.getTransaction({hash:row.hash});let successful=false,error;
 try{assertSuccessful(receipt);successful=true;}catch(e){error=e.message;}
 const item={method:decoded.method,args:decoded.args,hash:row.hash,signer:row.from_address,createdAt:row.created_at,successful,error,receipt:publicReceipt(receipt)};
 transactions.push(item);await writeFile(`${dir}/${row.hash}.json`,json(item));
}
transactions.sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
const report={verifiedAt:new Date().toISOString(),chainId:61999,contract:address,eventId,submission:'Studio browser UI; built-in account; Normal (Full Consensus); Simulation Mode off',record,transactions,complete:false};
if(record.state==='FINAL'){
 const resolution=await client.readContract({address,functionName:'get_resolution',args:[eventId],transactionHashVariant:'LATEST_FINAL'});
 if(resolution!==record.outcome)throw Error('Final resolution mismatch');
 report.resolutionRead=resolution;
 const finalization=transactions.find(t=>t.method==='finalize'&&t.successful);
 if(!finalization)throw Error('Missing successful finalization');
 const reader=()=>createOracleReader({address,expectedSourceSha256:d.sourceSha256});
 const bundle=await reader().exportBundle(eventId,{finalizationHash:finalization.hash});
 const verified=await reader().verifyBundle(bundle);
 const forged=structuredClone(bundle);forged.record.criteria+=' Fabricated criterion.';forged.recordHash=hashRecord(forged.record);forged.bundleHash=hashBundle(forged);
 let rejected;try{await reader().verifyBundle(forged);}catch(e){rejected=e.code;}
 if(rejected!=='CHAIN_MISMATCH')throw Error('Rehashed forgery was not rejected');
 await writeFile(`${dir}/event-${eventId}-bundle.json`,json(bundle));
 report.consumerVerification={verified:verified.verified,resolution:verified.resolution,recordHash:verified.recordHash,finalization:verified.finalization,rehashedForgeryRejected:rejected};
 report.complete=record.challenged===true&&record.history.length===2&&['create_event','review','challenge','finalize'].every(m=>transactions.some(t=>t.method===m&&t.successful))&&transactions.filter(t=>t.method==='review'&&t.successful).length===2;
}
await writeFile(`${dir}/verification.json`,json(report));
console.log(json({eventId,state:record.state,outcome:record.outcome,reviewAfter:record.review_after,challengeUntil:record.challenge_until,now:Math.floor(Date.now()/1000),transactions:transactions.map(t=>({method:t.method,hash:t.hash,successful:t.successful})),consumerVerification:report.consumerVerification,complete:report.complete}));
if(!report.complete)process.exitCode=2;
