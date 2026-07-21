import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeNickname, validateRun } from './validators.js'

test('normalizes valid nicknames and rejects unsafe names', () => {
  assert.equal(normalizeNickname('  메트로  '), '메트로')
  assert.throws(() => normalizeNickname('a'), /2~12자/)
  assert.throws(() => normalizeNickname('메트로!'), /한글/)
})

test('rejects impossible or replayed runs', () => {
  assert.throws(() => validateRun({ status:'accepted', answers:3, elapsedMs:3000 }), /제출/)
  assert.throws(() => validateRun({ status:'issued', answers:3, elapsedMs:100 }), /비정상/)
  assert.deepEqual(validateRun({ status:'issued', answers:3, elapsedMs:3000 }), { answers:3, elapsedMs:3000 })
})
