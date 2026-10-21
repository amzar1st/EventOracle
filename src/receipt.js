export function assertSuccessful(receipt) {
  const finalized = receipt.statusName === 'FINALIZED' || ['FINALIZED', 7, '7'].includes(receipt.status);
  if (!finalized) throw new Error('Transaction is not finalized');
  const legacy = receipt.consensus_data?.leader_receipt;
  if (legacy !== undefined) {
    const rows = Array.isArray(legacy) ? legacy : [legacy];
    const leader = rows.find(r => r?.mode === 'leader');
    if (!leader || leader.execution_result !== 'SUCCESS' || leader.result?.status !== 'return') throw new Error('Finalized transaction did not execute successfully');
    for (const row of rows) {
      const quorumStopped = row?.mode === 'validator' && row.vote === 'idle' && row.genvm_result?.error_code === 'CONSENSUS_VALIDATOR_QUORUM_REACHED';
      if (!quorumStopped && (row?.execution_result !== 'SUCCESS' || row.result?.status !== 'return')) throw new Error('Validator execution was not successful');
    }
  } else if (receipt.txExecutionResultName !== 'FINISHED_WITH_RETURN') throw new Error('Transaction finalized without successful execution');
  return receipt;
}
