// Read-only live verification of NEW consumer/export features against the accepted deployment.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createOracleReader,asBoolean,hashRecord,hashBundle} from '../sdk/index.js';
const d=JSON.parse(await readFile('docs/deployment.json','utf8'));
const prior=JSON.parse(await readFile('docs/live/verification.json','utf8'));
await mkdir('docs/milestone-v1',{recursive:true});
const reader=()=>createOracleReader({address:d.address,expectedSourceSha256:d.sourceSha256});
const report={milestone:'Consumer SDK and portable resolution verification',acceptedBaseCommit:'9ed0fb83996d809a038d121df559fafa8fe9a6af',chainId:61999,contract:d.address,sourceSha256:d.sourceSha256,readOnly:true,startedAt:new Date().toISOString(),checks:[]};
for(const id of ['2','1']) {
 const hash=prior.transactions.find(t=>t.method==='finalize'&&t.args[0]===id).hash;
 const bundle=await reader().exportBundle(id,{finalizationHash:hash});
 const verified=await reader().verifyBundle(JSON.stringify(bundle));
 if(!verified.verified||verified.resolution!==(id==='2'?'YES':'UNRESOLVED'))throw Error('Unexpected live resolution');
 await writeFile(`docs/milestone-v1/event-${id}.json`,JSON.stringify(bundle,null,2)+'\n');
 report.checks.push({check:'export-and-independent-RPC-recheck',eventId:id,resolution:verified.resolution,recordHash:verified.recordHash,bundleHash:verified.bundleHash,finalization:verified.finalization,passed:true});
 console.log('Live export/recheck',id,verified.resolution);
 if(id==='2') {
  const forgery=JSON.parse(JSON.stringify(bundle));forgery.record.criteria+=' Forged milestone policy.';forgery.recordHash=hashRecord(forgery.record);forgery.bundleHash=hashBundle(forgery);
  let rejected;try{await reader().verifyBundle(forgery);}catch(e){rejected=e.code;}if(rejected!=='CHAIN_MISMATCH')throw Error('Rehashed forgery was not rejected');
  report.checks.push({check:'rehashed-forgery-rejected-by-live-chain',eventId:id,errorCode:rejected,passed:true});
  await writeFile('docs/milestone-v1/intentionally-invalid-rehashed-forgery.json',JSON.stringify(forgery,null,2)+'\n');
  const wrong=JSON.parse(JSON.stringify(bundle));wrong.finalization.hash=prior.transactions.find(t=>t.method==='finalize'&&t.args[0]==='1').hash;wrong.bundleHash=hashBundle(wrong);
  let code;try{await reader().verifyBundle(wrong);}catch(e){code=e.code;}if(code!=='WRONG_EVENT')throw Error('Unrelated receipt was not rejected');
  report.checks.push({check:'wrong-event-finalization-rejected-live',errorCode:code,passed:true});
 }else{
  let rejected;try{asBoolean(verified.resolution);}catch(e){rejected=e.code;}if(rejected!=='UNRESOLVED')throw Error('Unsafe binary mapping');report.checks.push({check:'unresolved-decision-guard',errorCode:rejected,passed:true});
 }
}
const discovered=await reader().exportBundle('2');
report.checks.push({check:'StudioNet-finalization-discovery',eventId:'2',hash:discovered.finalization.hash,passed:true});
report.finishedAt=new Date().toISOString();report.passed=report.checks.every(c=>c.passed);
await writeFile('docs/milestone-v1/live-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
