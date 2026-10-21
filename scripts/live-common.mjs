import {createClient} from 'genlayer-js';import {studionet} from 'genlayer-js/chains';import {writeFile} from 'node:fs/promises';
export const client=createClient({chain:studionet});
export const address='0xEa6703e6508D61a86ce904e87BAe448880Bb5E5C';
export const owner='0x981F173A0d46C4Bb1BC72B01da22dF888ed35956';
export const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v,null,2)+'\n';
export async function save(p,x){await writeFile(p,json(x));}
export function publicReceipt(r){
 const raw=r.consensus_data?.leader_receipt;
 const rows=Array.isArray(raw)?raw:raw?[raw]:[];
 return {hash:r.hash,status:r.status,statusName:r.statusName,from_address:r.from_address,to_address:r.to_address,resultName:r.resultName,txExecutionResultName:r.txExecutionResultName,consensus_data:{votes:r.consensus_data?.votes,leader_receipt:rows.map(x=>({mode:x.mode,vote:x.vote,execution_result:x.execution_result,result:x.result,genvm_result:{error_code:x.genvm_result?.error_code,error_description:x.genvm_result?.error_description,stderr:x.genvm_result?.stderr},contract_state_hash:x.contract_state_hash}))}};
}
