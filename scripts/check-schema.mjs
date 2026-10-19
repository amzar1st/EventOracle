import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {readFile,writeFile} from 'node:fs/promises';
const client=createClient({chain:studionet});
try {const schema=await client.getContractSchemaForCode(await readFile('contracts/event_oracle.py','utf8'));await writeFile('docs/schema.json',JSON.stringify(schema,null,2));console.log('Studio schema accepted');} catch(e){console.error(e.message);process.exitCode=1;}
