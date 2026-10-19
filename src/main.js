import './style.css';
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionStatus,TransactionHashVariant} from 'genlayer-js/types';
import {assertSuccessful} from './receipt.js';
const $=id=>document.getElementById(id);
const read=createClient({chain:studionet});
let wallet,address=localStorage.getItem('eventoracle.address')||'',selected,busy=false;
$('address').value=address;
const status=s=>$('status').textContent=s;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=t=>new Date(t*1000).toLocaleString();
function validAddress(){if(!/^0x[0-9a-fA-F]{40}$/.test(address))throw Error('Enter the deployed StudioNet contract address.');}
function specs(text){return JSON.stringify(text.trim().split('\n').filter(x=>x.trim()).map(line=>{const [url,sha256='']=line.split('|').map(x=>x.trim());return {url,sha256};}));}
async function load(id){validAddress();return JSON.parse(await read.readContract({address,functionName:'get_event',args:[String(id)],transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));}
async function refresh(){validAddress();const n=Number(await read.readContract({address,functionName:'get_count',args:[],transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));$('count').textContent=n;$('feed').replaceChildren();$('feed').className='';if(!n){$('feed').textContent='No events yet. Create the first one.';return;}for(let i=n;i>Math.max(0,n-10);i--){const q=await load(i);const b=document.createElement('button');b.className='card';b.innerHTML=`<span class="badge">${escape(q.state)} · ${escape(q.outcome)}</span><br>${escape(q.question)}<br><small>#${q.id} · cutoff ${escape(date(q.deadline))}</small>`;b.onclick=()=>show(q);$('feed').append(b);}}
function show(q){selected=q;$('details').hidden=false;$('detail-title').textContent=q.question;$('detail').innerHTML=`<span class="badge">${escape(q.state)} · ${escape(q.outcome)}${q.state==='FINAL'?'':' · PROVISIONAL'}</span><p>${escape(q.criteria)}</p><p><small>Cutoff: ${escape(date(q.deadline))} · Creator: ${escape(q.creator)}<br>Review after: ${escape(date(q.review_after))} · Recovery after: ${escape(date(q.expires))}${q.challenge_until?'<br>Challenge / finalization boundary: '+escape(date(q.challenge_until)):''}</small></p>`;$('raw').textContent=JSON.stringify(q,null,2);$('challenge').hidden=q.state!=='PROPOSED'||q.challenged;const t=Date.now()/1000;for(const b of document.querySelectorAll('[data-action]')){const fn=b.dataset.action;b.disabled=fn==='review'?(!['OPEN','CHALLENGED'].includes(q.state)||t<q.review_after||t>=q.expires):fn==='finalize'?(q.state!=='PROPOSED'||t<q.challenge_until):(!['OPEN','CHALLENGED'].includes(q.state)||t<q.expires);}}
async function task(fn){try{await fn();}catch(e){status(e.shortMessage||e.message||String(e));}}
async function write(functionName,args){validAddress();if(!wallet)throw Error('Connect MetaMask before writing, or execute this method with the built-in account in GenLayer Studio.');if(busy)throw Error('A transaction is already pending.');busy=true;try{status('Awaiting wallet signature…');const hash=await wallet.writeContract({address,functionName,args,value:0n,leaderOnly:false});status(`Submitted ${hash}. Waiting for finalization…`);localStorage.setItem('eventoracle.pending',hash);const receipt=await read.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,interval:4000,retries:90});assertSuccessful(receipt);status(`Finalized successfully: ${hash}`);localStorage.removeItem('eventoracle.pending');await refresh();if(selected)show(await load(selected.id));}finally{busy=false;}}
$('connect').onclick=()=>task(async()=>{if(!window.ethereum)throw Error('MetaMask is unavailable in this browser. Open GenLayer Studio to use its built-in account.');const accounts=await window.ethereum.request({method:'eth_requestAccounts'});const candidate=createClient({chain:studionet,account:accounts[0],provider:window.ethereum});await candidate.connect('studionet');wallet=candidate;$('connect').textContent=accounts[0].slice(0,6)+'…'+accounts[0].slice(-4);status('Wallet connected to StudioNet.');});
window.ethereum?.on?.('accountsChanged',()=>{wallet=undefined;$('connect').textContent='Connect wallet';status('Account changed. Reconnect before writing.');});
window.ethereum?.on?.('chainChanged',()=>{wallet=undefined;$('connect').textContent='Connect wallet';status('Network changed. Reconnect before writing.');});
$('save').onclick=()=>task(async()=>{address=$('address').value.trim();validAddress();await read.getContractSchema(address);localStorage.setItem('eventoracle.address',address);$('deployment').textContent='StudioNet contract: '+address;await refresh();});
$('refresh').onclick=()=>task(refresh);
$('find').onclick=()=>task(async()=>{const id=$('lookup').value.trim();if(!/^\d+$/.test(id))throw Error('Enter a numeric event ID.');show(await load(id));});
$('create').onsubmit=e=>{e.preventDefault();task(async()=>{const f=new FormData(e.target);await write('create_event',[f.get('question'),f.get('criteria'),Math.floor(new Date(f.get('deadline')).getTime()/1000),specs(f.get('sources')),Number(f.get('period'))]);});};
for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>task(()=>write(b.dataset.action,[selected.id]));
$('challenge').onsubmit=e=>{e.preventDefault();task(async()=>{const f=new FormData(e.target);await write('challenge',[selected.id,f.get('reason'),specs(f.get('sources'))]);});};
const pending=localStorage.getItem('eventoracle.pending');if(pending)status('Previous transaction requires verification: '+pending);
if(address)task(refresh);
