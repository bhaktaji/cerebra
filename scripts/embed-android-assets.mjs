import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const assetsDir = path.join(distDir, 'assets');
const androidAssetsDir = path.resolve('android/app/src/main/assets');

fs.mkdirSync(androidAssetsDir, { recursive: true });

const files = fs.readdirSync(assetsDir);
const cssFile = files.find((f) => f.endsWith('.css'));
const jsFile = files.find((f) => f.endsWith('.js'));

if (!cssFile || !jsFile) {
  throw new Error('Missing compiled CSS or JS in dist/assets. Run npm run build first.');
}

const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
const safeJsContent = jsContent.replace(/<\/script>/gi, '<\\/script>');

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#4f46e5" />
    <title>Cerebra</title>
    <style>${cssContent}</style>
  </head>
  <body class="bg-stone-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
    <div id="root"></div>
    <script type="module">${safeJsContent}</script>
  </body>
</html>`;

fs.writeFileSync(path.join(androidAssetsDir, 'index.html'), html, 'utf8');
console.log('Embedded compiled application into android/app/src/main/assets/index.html');
