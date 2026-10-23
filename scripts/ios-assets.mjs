import { mkdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const output = path.resolve(process.argv[2] || 'ios/App/App/Assets.xcassets/RevisionIcon.appiconset');
if (process.platform === 'win32') {
  const physical = await realpath(output).catch(() => output);
  if (!/^s:[\\/]/i.test(physical)) {
    throw new Error('Generated iOS assets must be on S:. Create the output junction described in docs/IOS.md.');
  }
}
await mkdir(output, { recursive: true });
await sharp('public/revision-mark.svg', { density: 1152 })
  .resize(1024, 1024).flatten({ background: '#eff5ff' }).removeAlpha()
  .png().toFile(path.join(output, 'Revision.png'));
await writeFile(path.join(output, 'Contents.json'), JSON.stringify({
  images: [{ filename: 'Revision.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }],
  info: { author: 'xcode', version: 1 },
}, null, 2) + '\n');
console.log('iOS app icon prepared.');
