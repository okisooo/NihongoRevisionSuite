import { exec } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';

const desktopPath = path.join(os.homedir(), 'Desktop');
const shortcutPath = path.join(desktopPath, 'Japanese Revision.lnk');
const targetPath = path.resolve('dist_electron', 'Japanese Revision 1.0.0.exe');

console.log('Checking if target executable exists at:', targetPath);
if (!fs.existsSync(targetPath)) {
  console.warn(`WARNING: Target executable not found at ${targetPath}. The shortcut may be broken until you run a dist build.`);
}

console.log('Creating desktop shortcut...');
console.log('Desktop path:', desktopPath);
console.log('Shortcut destination:', shortcutPath);

// PowerShell command to create the WScript shell shortcut
const psCommand = `$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('${shortcutPath.replace(/'/g, "''")}'); $Shortcut.TargetPath = '${targetPath.replace(/'/g, "''")}'; $Shortcut.WorkingDirectory = '${path.dirname(targetPath).replace(/'/g, "''")}'; $Shortcut.Save();`;

exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('Failed to create desktop shortcut:', error);
    console.error('Error Details:', stderr);
  } else {
    console.log('Desktop shortcut "Japanese Revision.lnk" created successfully!');
  }
});
