import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
export const CHAIN_ID = 61999;
export async function connectWallet(provider) {
  if (!provider?.request) throw Error('MetaMask is unavailable in this browser. Use the Studio built-in account through the Open in Studio link.');
  const accounts = await provider.request({method:'eth_requestAccounts'});
  if (!/^0x[0-9a-f]{40}$/i.test(accounts?.[0] || '')) throw Error('Wallet did not return an account.');
  if (Number(await provider.request({method:'eth_chainId'})) !== CHAIN_ID) {
    try { await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xf22f'}]}); }
    catch (e) {
      if (e.code !== 4902) throw e;
      await provider.request({method:'wallet_addEthereumChain',params:[{chainId:'0xf22f',chainName:'GenLayer StudioNet',nativeCurrency:studionet.nativeCurrency,rpcUrls:['https://studio.genlayer.com/api'],blockExplorerUrls:['https://explorer-studio.genlayer.com']}]});
      await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xf22f'}]});
    }
  }
  await guardWallet(provider,accounts[0]);
  return {address:accounts[0],client:createClient({chain:studionet,account:accounts[0],provider})};
}
export async function guardWallet(provider,address) {
  const accounts = await provider.request({method:'eth_accounts'});
  if (accounts?.[0]?.toLowerCase() !== address.toLowerCase()) throw Error('Wallet account changed. Reconnect before signing.');
  if (Number(await provider.request({method:'eth_chainId'})) !== CHAIN_ID) throw Error('Wallet network changed. Reconnect to StudioNet before signing.');
}
