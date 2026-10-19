export function assertSuccessful(receipt) {
  if (receipt.statusName !== 'FINALIZED' && receipt.status !== 'FINALIZED') throw new Error('Transaction is not finalized');
  if (receipt.txExecutionResultName !== 'FINISHED_WITH_RETURN') throw new Error('Transaction finalized without successful execution');
  return receipt;
}
