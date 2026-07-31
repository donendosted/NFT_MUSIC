import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  MARKETPLACE_CONTRACT_ID,
  MUSIC_NFT_V2_CONTRACT_ID,
  MUSIC_PURCHASE_CONTRACT_ID,
  PAYMENT_ASSET_CONTRACT_ID,
} from '../src/config/contracts.js';

const isContractId = (value) => /^C[A-Z2-7]{55}$/.test(value);

test('uses valid Stellar contract identifiers for the atomic marketplace', () => {
  assert.ok(isContractId(MUSIC_NFT_V2_CONTRACT_ID));
  assert.ok(isContractId(MARKETPLACE_CONTRACT_ID));
  assert.ok(isContractId(MUSIC_PURCHASE_CONTRACT_ID));
  assert.ok(isContractId(PAYMENT_ASSET_CONTRACT_ID));
});

test('keeps settlement contracts distinct', () => {
  const ids = new Set([MUSIC_NFT_V2_CONTRACT_ID, MARKETPLACE_CONTRACT_ID, MUSIC_PURCHASE_CONTRACT_ID]);
  assert.equal(ids.size, 3);
});

test('mint service cannot fall back to the legacy NFT environment variables', async () => {
  const source = await readFile(new URL('../src/services/mintService.js', import.meta.url), 'utf8');
  assert.match(source, /MUSIC_NFT_V2_CONTRACT_ID/);
  assert.doesNotMatch(source, /process\.env\.NFT_CONTRACT_ID/);
  assert.doesNotMatch(source, /process\.env\.NFT_COLLECTION_ID/);
});
