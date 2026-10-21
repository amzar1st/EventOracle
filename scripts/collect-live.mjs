import {client,address,owner,save,publicReceipt} from './live-common.mjs';import {abi} from 'genlayer-js';import {assertSuccessful} from '../src/receipt.js';
const rows=await client.request({method:'sim_getTransactionsForAddress',params:[address]});const txs=[];
for(const row of rows.sort((a,b)=>a.created_at.localeCompare(b.created_at))){
 let method='deploy',args=[];if(row.type!==1){const decoded=abi.calldata.decode(Buffer.from(row.data.calldata,'base64'));const d=decoded instanceof Map?Object.fromEntries(decoded):decoded;method=d.method;args=d.args;}
 const r=await client.getTransaction({hash:row.hash});let success=false,error;try{assertSuccessful(r);success=true;}catch(e){error=e.message;}
 const evidence={method,args,hash:row.hash,signer:row.from_address,createdAt:row.created_at,success,error,receipt:publicReceipt(r)};txs.push(evidence);
 await save('docs/live/'+row.hash+'.json',evidence);
}
const count=Number(await client.readContract({address,functionName:'get_count',args:[],transactionHashVariant:'LATEST_FINAL'}));const events=[];
for(let i=1;i<=count;i++){const q=JSON.parse(await client.readContract({address,functionName:'get_event',args:[String(i)],transactionHashVariant:'LATEST_FINAL'}));if(q.state==='FINAL')q.resolutionRead=await client.readContract({address,functionName:'get_resolution',args:[String(i)],transactionHashVariant:'LATEST_FINAL'});events.push(q);}
await save('docs/live/verification.json',{address,chainId:61999,verifiedAt:new Date().toISOString(),transactions:txs,events});console.log(JSON.stringify({now:Math.floor(Date.now()/1000),transactions:txs.map(t=>({method:t.method,hash:t.hash,success:t.success,status:t.receipt.status,error:t.error})),events}));
