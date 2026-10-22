// Example consumer integration; it prints a decision and does not submit a transaction.
import {readFile} from 'node:fs/promises';
import {createOracleReader,asBoolean} from '../sdk/index.js';
const deployment=JSON.parse(await readFile(new URL('../docs/deployment.json',import.meta.url),'utf8'));
const oracle=createOracleReader({address:deployment.address,expectedSourceSha256:deployment.sourceSha256});
const id=process.argv[2]||'2';
try{
 const final=await oracle.readFinalResolution(id);
 console.log(JSON.stringify({eventId:id,resolution:final.resolution,decision:asBoolean(final.resolution),recordHash:final.recordHash},null,2));
}catch(e){console.error(e.code||'RPC_ERROR',e.message);process.exitCode=1;}
