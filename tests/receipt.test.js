import {test} from 'node:test';import assert from 'node:assert/strict';import {assertSuccessful} from '../src/receipt.js';
test('finalized revert is not success',()=>assert.throws(()=>assertSuccessful({statusName:'FINALIZED',txExecutionResultName:'FINISHED_WITH_ERROR'})));
test('pending return is not success',()=>assert.throws(()=>assertSuccessful({statusName:'ACCEPTED',txExecutionResultName:'FINISHED_WITH_RETURN'})));
test('missing execution proof fails closed',()=>assert.throws(()=>assertSuccessful({statusName:'FINALIZED'})));
test('finalized successful execution',()=>assert.doesNotThrow(()=>assertSuccessful({statusName:'FINALIZED',txExecutionResultName:'FINISHED_WITH_RETURN'})));
