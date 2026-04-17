// includeAssets: true for light build only — json/js outputs use resolved values
// and should not be generated twice (dark build would overwrite with dark-mode values)
export function makeConfig(tokensPath, selector, { includeAssets = false } = {}) {
  /* Strip $-prefixed W3C keys to plain keys for Style Dictionary v3 */
  const stripDollar = (obj) => {
    if (Array.isArray(obj)) return obj.map(stripDollar);
    if (typeof obj !== 'object' || obj === null) return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const newKey = k.startsWith('$') ? k.slice(1) : k;
      out[newKey] = stripDollar(v);
    }
    return out;
  };

  /* Collect all dot-separated paths that have a `value` leaf (i.e. actual tokens) */
  const collectPaths = (obj, prefix = '') => {
    const paths = new Set();
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && 'value' in v) {
        paths.add(path);
      } else if (v && typeof v === 'object') {
        for (const p of collectPaths(v, path)) paths.add(p);
      }
    }
    return paths;
  };

  /* Remove any token whose value is an alias reference to a path not in the token set.
   * Style Dictionary v3 throws a hard error on unresolved references, so we must drop them. */
  const dropBrokenAliases = (obj, validPaths, prefix = '', dropped = new Set()) => {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && 'value' in v) {
        const val = v.value;
        if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
          const refPath = val.slice(1, -1);
          if (!validPaths.has(refPath)) {
            dropped.add(path); // Track dropped paths for warning
            continue; // Drop unresolvable alias
          }
        }
        out[k] = v;
      } else if (v && typeof v === 'object') {
        const nested = dropBrokenAliases(v, validPaths, path, dropped);
        if (Object.keys(nested).length > 0) out[k] = nested;
      } else {
        out[k] = v;
      }
    }
    return out;
  };

  const platforms = {
    css: {
      transformGroup: 'css',
      prefix: '',
      buildPath: 'dist/',
      files: [
        {
          destination: `tokens-${selector.replace(/[^a-z]/g, '')}.css`,
          format: 'css/variables',
          filter: (token) => token.type !== 'boolean' && token.type !== 'string' && token.type !== 'fontfamily',
          options: {
            selector,
            outputReferences: false
          }
        }
      ]
    }
  };

  if (includeAssets) {
    platforms.json = {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [{ destination: 'tokens.json', format: 'json/nested' }]
    };
    platforms.js = {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [{ destination: 'tokens.js', format: 'javascript/es6' }]
    };
  }

  return {
    source: [tokensPath],
    parsers: [
      {
        pattern: /\.json$/,
        parse: ({ contents }) => {
          const stripped = stripDollar(JSON.parse(contents));
          // Iteratively drop broken aliases until stable — handles chained references
          // where token A → token B → (broken), so A must also be dropped after B is removed
          let current = stripped;
          const dropped = new Set();
          for (let i = 0; i < 10; i++) {
            const validPaths = collectPaths(current);
            const next = dropBrokenAliases(current, validPaths, '', dropped);
            if (JSON.stringify(next) === JSON.stringify(current)) break;
            current = next;
          }
          if (dropped.size > 0) {
            console.warn(`[build] ${dropped.size} token(s) dropped due to broken alias references: ${[...dropped].join(', ')}`);
          }
          return current;
        }
      }
    ],
    platforms
  };
}
