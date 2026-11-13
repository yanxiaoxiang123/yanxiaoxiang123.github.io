import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const src = join(root, 'src');
const files = ts.sys.readDirectory(src, ['.ts', '.tsx'], [], ['**/*']);
const sources = new Map(files.map(file => [resolve(file), ts.createSourceFile(file,
  readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)]));
const localModule = (from, name) => {
  const target = name.startsWith('@/') ? resolve(src, name.slice(2))
    : name.startsWith('.') ? resolve(dirname(from), name) : null;
  return target && [target + '.ts', target + '.tsx', join(target, 'index.ts'), join(target, 'index.tsx')].find(existsSync);
};
function imports(file) {
  const edges = new Set();
  const add = name => { const target = localModule(file, name); if (target) edges.add(resolve(target)); };
  const visit = node => {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      if (clause?.isTypeOnly) return;
      if (!clause?.name && clause?.namedBindings && ts.isNamedImports(clause.namedBindings)
        && clause.namedBindings.elements.every(item => item.isTypeOnly)) return;
      if (ts.isStringLiteral(node.moduleSpecifier)) add(node.moduleSpecifier.text);
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && !node.isTypeOnly) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)
        && node.exportClause.elements.every(item => item.isTypeOnly)) return;
      add(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) add(node.arguments[0].text);
    ts.forEachChild(node, visit);
  };
  visit(sources.get(file));
  return [...edges];
}
const isClient = source => source.statements.some(node => ts.isExpressionStatement(node)
  && ts.isStringLiteral(node.expression) && node.expression.text === 'use client');
const reachable = new Set();
const visit = file => {
  if (reachable.has(file)) return;
  reachable.add(file);
  imports(file).forEach(visit);
};
for (const [file, source] of sources) if (isClient(source)) visit(file);

test('static body renderers and long-form data stay outside every client import graph', () => {
  const serverFiles = ['components/Works.tsx', 'components/About.tsx', 'components/DesktopContent.tsx',
    'components/ExitContent.tsx', 'data/content.ts'];
  for (const file of serverFiles) {
    assert(!reachable.has(resolve(src, file)), `${file} is pulled into a client graph`);
  }
});
test('the server page composes the static content and passes it into client containers', () => {
  const page = resolve(src, 'app/page.tsx');
  assert(!isClient(sources.get(page)));
  const edges = imports(page).map(file => relative(src, file).replaceAll('\\', '/'));
  for (const file of ['components/Works.tsx', 'components/About.tsx', 'components/DesktopContent.tsx', 'components/ExitContent.tsx']) {
    assert(edges.includes(file), `page.tsx must own ${file}`);
  }
});
test('interactive code keeps the three existing runtime dependencies', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['next', 'react', 'react-dom']);
});
