import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Question Detail & Answer Validation Rules', () => {
  it('validates 16-character hex questionHash regex', () => {
    const hexRegex = /^[a-f0-9]{16}$/;
    assert.strictEqual(hexRegex.test('a1b2c3d4e5f67890'), true);
    assert.strictEqual(hexRegex.test('0123456789abcdef'), true);
    assert.strictEqual(hexRegex.test('invalid'), false);
    assert.strictEqual(hexRegex.test('A1B2C3D4E5F67890'), false); // lowercase only
    assert.strictEqual(hexRegex.test('12345'), false);
    assert.strictEqual(hexRegex.test('a1b2c3d4e5f67890extra'), false);
  });

  it('validates answer length requirement (min 20 characters)', () => {
    const isMin20 = (text) => typeof text === 'string' && text.trim().length >= 20;
    assert.strictEqual(isMin20('Too short'), false);
    assert.strictEqual(isMin20('   1234567890123456789   '), false);
    assert.strictEqual(isMin20('This is a valid answer with more than twenty characters.'), true);
  });

  it('validates questionId is a positive integer', () => {
    const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;
    assert.strictEqual(isValidId(1), true);
    assert.strictEqual(isValidId('5'), true);
    assert.strictEqual(isValidId(0), false);
    assert.strictEqual(isValidId(-1), false);
    assert.strictEqual(isValidId('abc'), false);
  });
});
