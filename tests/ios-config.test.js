import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const config = JSON.parse(read('capacitor.config.json'));
const workflows = parse(read('codemagic.yaml')).workflows;

test('installed iOS app loads bundled assets, never a development server', () => {
  assert.equal(config.webDir, 'dist-ios');
  assert.equal(config.server?.url, undefined);
  assert.equal(config.server?.cleartext, undefined);
  assert.equal(config.ios.preferredContentMode, 'mobile');
  assert.ok(read('ios/App/App.xcodeproj/project.pbxproj').includes(`PRODUCT_BUNDLE_IDENTIFIER = ${config.appId};`));
  assert.equal(workflows['ios-testflight'].environment.ios_signing.bundle_identifier, config.appId);
});

test('only the unsigned personal build runs on push; releases stay manual and bounded', () => {
  for (const [name, workflow] of Object.entries(workflows)) {
    assert.ok(workflow.max_build_duration <= 45);
    if (name !== 'ios-sideload') assert.equal(workflow.triggering, undefined);
  }
  const auto = workflows['ios-sideload'].triggering;
  assert.deepEqual(auto.events, ['push']);
  assert.deepEqual(auto.branch_patterns, [{ pattern: 'main', include: true }]);
  const workflow = workflows['ios-testflight'];
  assert.equal(workflow.publishing.app_store_connect.submit_to_app_store, false);
  assert.equal(workflow.publishing.app_store_connect.submit_to_testflight, false);
  assert.ok(workflow.scripts.some(({ script }) => script.includes('"testFlightInternalTestingOnly": true')));
  assert.ok(workflow.scripts.some(({ script }) => script.includes('"$BUILD_NUMBER"')));
  assert.equal(workflows['ios-check'].integrations, undefined);
});

test('required native privacy reasons are included as app resources', () => {
  const privacy = read('ios/App/App/PrivacyInfo.xcprivacy');
  assert.match(privacy, /CA92\.1/);
  assert.match(privacy, /C617\.1/);
  assert.match(read('ios/App/App.xcodeproj/project.pbxproj'), /PrivacyInfo\.xcprivacy in Resources/);
  assert.match(read('index.html'), /viewport-fit=cover/);
});

test('personal iPhone build uses no Apple credentials or store publishing', () => {
  const workflow = workflows['ios-sideload'];
  assert.equal(workflow.integrations, undefined);
  assert.equal(workflow.environment.ios_signing, undefined);
  assert.equal(workflow.publishing, undefined);
  assert.equal(workflow.instance_type, 'mac_mini_m2');
  const scripts = workflow.scripts.map(({ script }) => script).join('\n');
  assert.match(scripts, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(scripts, /generic\/platform=iOS/);
  assert.match(scripts, /package-ios-sideload\.py/);
  assert.match(scripts, /python3 -B -m unittest/);
  assert.ok(workflow.artifacts.includes('build/ios/ipa/revision-unsigned.ipa'));
});
