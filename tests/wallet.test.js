import {test} from 'node:test';import assert from 'node:assert/strict';import {connectWallet,guardWallet} from '../src/wallet.js';
const address='0x981F173A0d46C4Bb1BC72B01da22dF888ed35956';
function provider({chain='0xf22f',unknown=false,reject=false,account=address}={}){const calls=[];return {calls,async request(r){calls.push(r);if(r.method==='eth_requestAccounts'||r.method==='eth_accounts')return [account];if(r.method==='eth_chainId')return chain;if(r.method==='wallet_switchEthereumChain'){if(reject)throw Object.assign(Error('User rejected'),{code:4001});if(unknown){unknown=false;throw Object.assign(Error('Unknown chain'),{code:4902});}chain=r.params[0].chainId;}if(r.method==='wallet_addEthereumChain')return null;}};}
test('absent provider clearly rejected',async()=>assert.rejects(connectWallet(undefined),/unavailable/));
test('correct StudioNet provider connects without installing Snap',async()=>{const p=provider();const c=await connectWallet(p);assert.equal(c.address,address);assert.equal(p.calls.some(x=>x.method.startsWith('wallet_')),false);});
test('wrong chain switches to 61999',async()=>{const p=provider({chain:'0x1'});await connectWallet(p);assert.equal(p.calls.find(x=>x.method==='wallet_switchEthereumChain').params[0].chainId,'0xf22f');});
test('unknown chain adds exact StudioNet then switches',async()=>{const p=provider({chain:'0x1',unknown:true});await connectWallet(p);assert.equal(p.calls.find(x=>x.method==='wallet_addEthereumChain').params[0].rpcUrls[0],'https://studio.genlayer.com/api');});
test('rejected switch is not swallowed',async()=>assert.rejects(connectWallet(provider({chain:'0x1',reject:true})),/rejected/));
test('account change is blocked',async()=>assert.rejects(guardWallet(provider({account:'0x0000000000000000000000000000000000000001'}),address),/account changed/));
test('network change is blocked',async()=>assert.rejects(guardWallet(provider({chain:'0x1'}),address),/network changed/));
