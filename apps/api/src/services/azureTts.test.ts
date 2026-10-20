import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSsml } from './azureTts.js';

test('SSML usa estilo cheerful, voz por acento y escapa el texto', () => {
  const ssml = buildSsml('Tom & "Jerry" <3', { locale: 'en-GB' });
  assert.match(ssml, /en-GB-SoniaNeural/);
  assert.match(ssml, /style="cheerful"/);
  assert.match(ssml, /Tom &amp; &quot;Jerry&quot; &lt;3/);
  assert.doesNotMatch(ssml, /<3/);
});

test('SSML aplica el tono y la velocidad de la mascota con límites', () => {
  const ssml = buildSsml('Hi!', { pitch: 1.2, rate: 3, style: 'excited' });
  assert.match(ssml, /en-US-JennyNeural/);
  assert.match(ssml, /style="excited"/);
  assert.match(ssml, /pitch="\+20%"/);
  assert.match(ssml, /rate="\+50%"/);
});

test('Un estilo desconocido vuelve a cheerful', () => {
  assert.match(buildSsml('Hi', { style: 'evil' }), /style="cheerful"/);
});
