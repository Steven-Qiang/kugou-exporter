const fs = require('fs');
const path = require('path');

const moduleDir = path.join(__dirname, '../node_modules/kugoumusicapi/module');
const files = fs
  .readdirSync(moduleDir)
  .filter((f) => f.endsWith('.js'))
  .reverse();

// Patch main.js
const imports = files
  .map((file) => {
    const name = file.replace('.js', '');
    return `const ${name}_module = require('./module/${file}');`;
  })
  .join('\n');

const objEntries = files
  .map((file) => {
    const name = file.replace('.js', '');
    return `  ${name}: (data = {}) => {
    if (typeof data.cookie === 'string') data.cookie = cookieToJson(data.cookie);
    return ${name}_module({ ...data, cookie: data.cookie ? data.cookie : {} }, (...args) => {
      const { createRequest } = require('./util/request');
      return createRequest(...args);
    });
  }`;
  })
  .join(',\n');

const mainOutput = `const { cookieToJson } = require('./util');

${imports}

const obj = {
${objEntries}
};

module.exports = { ...require('./server'), ...require('./util/request'), ...obj };
`;

const mainFile = path.join(__dirname, '../node_modules/kugoumusicapi/main.js');
fs.writeFileSync(mainFile, mainOutput, 'utf8');
console.log('Patched:', mainFile);

// Patch server.js
const moduleImports = files
  .map((file) => {
    const name = file.replace('.js', '');
    return `const module_${name} = require('./module/${file}');`;
  })
  .join('\n');

const moduleDefs = files
  .map((file) => {
    const name = file.replace('.js', '');
    const route = `/${name.replace(/_/g, '/')}`;
    return `  { identifier: '${name}', route: '${route}', module: module_${name} }`;
  })
  .join(',\n');

const serverOutput = `const path = require('node:path');
const express = require('express');
const decode = require('safe-decode-uri-component');
const { cookieToJson, randomString, getGuid, calculateMid } = require('./util/util');
const { cryptoMd5 } = require('./util/crypto');
const { createRequest } = require('./util/request');

${moduleImports}

const staticModuleDefs = [
${moduleDefs}
];

const guid = cryptoMd5(getGuid());
const serverDev = randomString(10).toUpperCase();

async function consturctServer(moduleDefs) {
  const app = express();
  const { CORS_ALLOW_ORIGIN } = process.env;
  app.set('trust proxy', true);

  app.use((req, res, next) => {
    if (req.path !== '/' && !req.path.includes('.')) {
      res.set({
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': CORS_ALLOW_ORIGIN || req.headers.origin || '*',
        'Access-Control-Allow-Headers': 'Authorization,X-Requested-With,Content-Type,Cache-Control',
        'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
        'Content-Type': 'application/json; charset=utf-8',
      });
    }
    req.method === 'OPTIONS' ? res.status(204).end() : next();
  });

  app.use((req, _, next) => {
    req.cookies = {};
    (req.headers.cookie || '').split(/;\\s+|(?<!\\s)\\s+$/g).forEach((pair) => {
      const crack = pair.indexOf('=');
      if (crack < 1 || crack === pair.length - 1) return;
      req.cookies[decode(pair.slice(0, crack)).trim()] = decode(pair.slice(crack + 1)).trim();
    });
    next();
  });

  app.use((req, res, next) => {
    const cookies = req.cookies || {};
    const isHttps = req.protocol === 'https';
    const cookieSuffix = isHttps ? '; PATH=/; SameSite=None; Secure' : '; PATH=/';
    const ensureCookie = (key, value) => {
      if (Object.prototype.hasOwnProperty.call(cookies, key)) return;
      cookies[key] = String(value);
      res.append('Set-Cookie', \`\${key}=\${cookies[key]}\${cookieSuffix}\`);
    };
    const mid = calculateMid(process.env.KUGOU_API_GUID ?? guid);
    ensureCookie('KUGOU_API_PLATFORM', process.env.platform);
    ensureCookie('KUGOU_API_MID', mid);
    ensureCookie('KUGOU_API_GUID', process.env.KUGOU_API_GUID ?? guid);
    ensureCookie('KUGOU_API_DEV', (process.env.KUGOU_API_DEV ?? serverDev).toUpperCase());
    ensureCookie('KUGOU_API_MAC', (process.env.KUGOU_API_MAC ?? '02:00:00:00:00:00').toUpperCase());
    req.cookies = cookies;
    next();
  });

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: false, limit: '20mb' }));
  app.use('/docs', express.static(path.join(__dirname, 'docs')));

  const moduleDefinitions = moduleDefs || staticModuleDefs;

  for (const moduleDef of moduleDefinitions) {
    app.use(moduleDef.route, async (req, res) => {
      [req.query, req.body].forEach((item) => {
        if (typeof item.cookie === 'string') item.cookie = cookieToJson(decode(item.cookie));
      });
      const { cookie, ...params } = req.query;
      const query = Object.assign({}, { cookie: Object.assign({}, req.cookies, cookie) }, params, { body: req.body });
      const authHeader = req.headers['authorization'];
      if (authHeader) query.cookie = { ...query.cookie, ...cookieToJson(authHeader) };
      try {
        const moduleResponse = await moduleDef.module(query, (config) => {
          let ip = req.ip;
          if (ip.substring(0, 7) === '::ffff:') ip = ip.substring(7);
          config.ip = ip;
          return createRequest(config);
        });
        console.log('[OK]', decode(req.originalUrl));
        const cookies = moduleResponse.cookie;
        if (!query.noCookie && Array.isArray(cookies) && cookies.length > 0) {
          res.append('Set-Cookie', cookies.map(cookie => \`\${cookie}; PATH=/\${req.protocol === 'https' ? '; SameSite=None; Secure' : ''}\`));
        }
        res.header(moduleResponse.headers).status(moduleResponse.status).send(moduleResponse.body);
      } catch (e) {
        const moduleResponse = e;
        console.log('[ERR]', decode(req.originalUrl), { status: moduleResponse.status, body: moduleResponse.body });
        if (!moduleResponse.body) {
          res.status(404).send({ code: 404, data: null, msg: 'Not Found' });
          return;
        }
        res.header(moduleResponse.headers).status(moduleResponse.status).send(moduleResponse.body);
      }
    });
  }
  return app;
}

async function startService() {
  const port = Number(process.env.PORT || '3000');
  const host = process.env.HOST || '';
  const app = await consturctServer();
  const appExt = app;
  appExt.service = app.listen(port, host, () => {
    console.log(\`server running @ http://\${host || 'localhost'}:\${port}\`);
  });
  return appExt;
}

function setupStatic(app, p) {
  app.use(express.static(p));
}

module.exports = { startService, consturctServer, setupStatic };
`;

const serverFile = path.join(__dirname, '../node_modules/kugoumusicapi/server.js');
fs.writeFileSync(serverFile, serverOutput, 'utf8');
console.log('Patched:', serverFile);

// Patch interface.d.ts
const interfaceFile = path.join(__dirname, '../node_modules/kugoumusicapi/interface.d.ts');
const interfaceContent = fs.readFileSync(interfaceFile, 'utf8');
if (!interfaceContent.includes('consturctServer')) {
  const interfacePatch = `

export function consturctServer(moduleDefs?: ModuleDefinition[]): Promise<import('express').Express>;

export function setupStatic(app: import('express').Application, dir: string);`;
  fs.writeFileSync(interfaceFile, interfaceContent + interfacePatch, 'utf8');
  console.log('Patched:', interfaceFile);
}
