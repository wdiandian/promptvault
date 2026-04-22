export function renderTemplate(template: any, context: any): any {
  const result = renderNode(template, context);
  return result === REMOVE ? {} : result;
}

const REMOVE = Symbol('REMOVE');

function resolvePath(path: string, context: any): any {
  const parts = path.split('.');
  const root = parts[0];
  const rest = parts.slice(1);

  const rootVal = context[root];

  if (rest.length === 0) return rootVal;

  if (rest[0] === 'first' || rest[0] === 'last') {
    if (!Array.isArray(rootVal) || rootVal.length === 0) return undefined;
    const item = rest[0] === 'first' ? rootVal[0] : rootVal[rootVal.length - 1];
    return rest.slice(1).reduce((o: any, k: string) => (o != null ? o[k] : undefined), item);
  }

  if (rest[0] === '__ALL__') {
    return { __ALL__: true, list: rootVal, fields: rest.slice(1) };
  }

  return rest.reduce((o: any, k: string) => (o != null ? o[k] : undefined), rootVal);
}

function interpolate(str: string, context: any): any {
  if (typeof str !== 'string') return str;

  const exactMatch = str.match(/^\$\{([^}]+)\}$/);
  if (exactMatch) {
    const val = resolvePath(exactMatch[1], context);
    return val !== undefined && val !== null ? val : '';
  }

  return str.replace(/\$\{([^}]+)\}/g, (_, path) => {
    const val = resolvePath(path, context);
    return val !== undefined && val !== null ? String(val) : '';
  });
}

function isOptionalMissing(obj: any, context: any): boolean {
  const varName = obj['__optional__'];
  if (!varName) return false;
  const val = context[varName];
  return val === undefined || val === null || (Array.isArray(val) && val.length === 0);
}

function renderNode(node: any, context: any): any {
  if (typeof node === 'string') return interpolate(node, context);
  if (typeof node !== 'object' || node === null) return node;

  if (Array.isArray(node)) {
    const result: any[] = [];
    for (const item of node) {
      const rendered = renderNode(item, context);
      if (rendered === REMOVE) continue;

      if (typeof rendered === 'object' && rendered !== null && !Array.isArray(rendered) && '__expand__' in rendered) {
        const varName = rendered['__expand__'];
        const list = context[varName];
        if (!Array.isArray(list) || list.length === 0) continue;
        for (const listItem of list) {
          const expandCtx = { ...context, [varName]: [listItem] };
          const expanded = renderNode(item, expandCtx);
          if (expanded !== REMOVE) {
            const clean = { ...expanded };
            delete clean['__expand__'];
            delete clean['__optional__'];
            result.push(clean);
          }
        }
        continue;
      }

      result.push(rendered);
    }
    return result;
  }

  if (isOptionalMissing(node, context)) return REMOVE;

  const result: any = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === '__optional__' || k === '__expand__') continue;

    const rendered = renderNode(v, context);
    if (rendered === REMOVE) continue;

    if (rendered && typeof rendered === 'object' && rendered.__ALL__) {
      const { list, fields } = rendered;
      if (!Array.isArray(list)) { result[k] = ''; continue; }
      result[k] = list.map((item: any) => fields.reduce((o: any, f: string) => (o != null ? o[f] : undefined), item));
      continue;
    }

    result[k] = rendered;
  }
  return result;
}
