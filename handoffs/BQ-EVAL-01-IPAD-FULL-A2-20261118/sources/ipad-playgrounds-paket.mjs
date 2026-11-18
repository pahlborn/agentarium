#!/usr/bin/env node
// Swift Playgrounds app export: copies the product's native source
// from ios/BigQuestMVP without duplicating or changing source behavior.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const pkg = JSON.parse(read('package.json'));
const options = { '--test-number': '12', '--output': path.join(root, 'dist-playgrounds') };
for (let i = 2; i < process.argv.length; i += 2) {
  const option = process.argv[i], value = process.argv[i + 1];
  if (!(option in options) || !value || value.startsWith('--')) {
    throw new Error('Usage: node werkzeug/ipad-playgrounds-paket.mjs [--test-number N] [--output directory]');
  }
  options[option] = value;
}
if (!/^[1-9]\d{0,3}$/.test(options['--test-number'])) throw new Error('Test number must be 1–9999');
const version = /^(\d+\.\d+\.\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(pkg.version)?.[1];
if (!version) throw new Error('package.json must contain a numeric app version, optionally with a prerelease suffix');
const testNumber = options['--test-number'];
const title = 'Big Quest iPad Test ' + testNumber;
// Origin of the selectively integrated native baseline; exported source hashes below
// identify the actual (possibly modified) files, rather than claiming a Test-11 review.
const nativeSourceOrigin = 'f88e82ab013daf6f8a095224af6cd4d7ef0dc880';
const sourceFiles = ['BigQuestApp.swift', 'ClaudeClient.swift', 'ToddleField.swift'];
const stem = 'Big-Quest-iPad-Test-' + testNumber;
const packageName = stem + '.swiftpm';
const dest = path.resolve(options['--output']);
const directory = path.join(dest, packageName);
const app = path.join(directory, 'App');
// Replace only this generated package, never the entire caller-selected directory.
fs.rmSync(directory, {recursive:true,force:true});
fs.mkdirSync(app, {recursive:true});
const manifest = `// swift-tools-version: 5.9
// Generated from pahlborn/bis-school-app_src. Do not hand-edit the package.
import PackageDescription
import AppleProductTypes

let package = Package(
    name: "${title}",
    platforms: [.iOS("16.0")],
    products: [
        .iOSApplication(
            name: "${title}",
            targets: ["AppModule"],
            bundleIdentifier: "de.bigquest.ipad",
            displayVersion: "${version}",
            bundleVersion: "${testNumber}",
            appIcon: .placeholder(icon: .pencil),
            accentColor: .presetColor(.blue),
            supportedDeviceFamilies: [.pad],
            supportedInterfaceOrientations: [.portrait, .landscapeLeft, .landscapeRight]
        )
    ],
    targets: [.executableTarget(name: "AppModule", path: "App")]
)
`;
fs.writeFileSync(path.join(directory, 'Package.swift'),manifest);
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const checks = [];
for (const name of sourceFiles) {
  const src=fs.readFileSync(path.join(root,'ios/BigQuestMVP',name));
  fs.writeFileSync(path.join(app,name),src);
  const copy=fs.readFileSync(path.join(app,name));
  if (!copy.equals(src)) throw new Error('Source copy mismatch for '+name);
  checks.push(name+'\t'+hash(src));
}
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sourceState = execFileSync('git', ['status', '--porcelain', '--', 'ios/BigQuestMVP', 'package.json', 'werkzeug/ipad-playgrounds-paket.mjs'], {cwd:root,encoding:'utf8'}).trim() ? 'modified' : 'clean';
const info = [
  title + ' — ' + pkg.version,
  'Quell-Commit: '+commit,
  'Quellstand: '+sourceState,
  'Native Ausgangsbasis (selektiv integriert): '+nativeSourceOrigin,
  'App-Kennung: de.bigquest.ipad',
  'Reader-Quelle: ios/BigQuestMVP/ToddleField.swift',
  'Reader: auf eindeutig sichtbare Rubrikzeilen begrenzt',
  'Automatische Tests beweisen NICHT das Verhalten in der echten Toddle-WebView.',
  'Bestehende Formular- und Toddle-Ansicht. Der Provider-Schlüssel bleibt im iPad-Schlüsselbund.',
  'Keine echten personenbezogenen Schuldaten an Claude senden.',
  '',
  'Quellintegritaet (SHA-256):',
  ...checks,''
].join('\n');
const infoName = 'TEST-' + testNumber + '-INFO.txt';
fs.writeFileSync(path.join(dest,infoName),info);
fs.writeFileSync(path.join(directory,'README.txt'),info);
const zip=path.join(dest,stem+'.zip');
fs.rmSync(zip, {force:true});
execFileSync('zip',['-q','-r',path.basename(zip),packageName],{cwd:dest});
const list=execFileSync('unzip',['-Z','-1',zip],{encoding:'utf8'}).split('\n').filter(Boolean);
for(const p of [packageName+'/Package.swift',packageName+'/README.txt',...sourceFiles.map(n=>packageName+'/App/'+n)]){
  if(!list.includes(p)) throw new Error('Missing package member: '+p);
}
console.log(JSON.stringify({name:path.basename(zip),packageName,infoName,commit,sourceState,nativeSourceOrigin,version:pkg.version,testNumber,bundleIdentifier:'de.bigquest.ipad',files:list,sha256:hash(fs.readFileSync(zip))},null,2));
