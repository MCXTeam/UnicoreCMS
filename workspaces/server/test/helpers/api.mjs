import { api } from './env.mjs';

const CSRF_COOKIE = 'unicore_csrf';
const CSRF_HEADER = 'x-csrf-token';

const octet = () => 1 + Math.floor(Math.random() * 250);

export const clientAddress = () => `10.${octet()}.${octet()}.${octet()}`;

export class Session {
  constructor(address = clientAddress()) {
    this.jar = {};
    this.address = address;
    this.accessToken = null;
    this.refreshToken = null;
  }

  get csrf() {
    return this.jar[CSRF_COOKIE] || '';
  }

  cookieHeader() {
    return Object.entries(this.jar)
      .filter(([, value]) => value)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  absorb(response) {
    for (const entry of response.headers.getSetCookie?.() ?? []) {
      const [pair] = entry.split(';');
      const index = pair.indexOf('=');
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();

      if (!value) delete this.jar[name];
      else this.jar[name] = value;
    }
  }

  async request(method, path, { body, headers = {}, auth = true, csrf = true, raw } = {}) {
    const merged = { 'X-Forwarded-For': this.address, ...headers };
    const cookies = this.cookieHeader();

    if (cookies) merged.Cookie = cookies;
    if (auth && this.accessToken) merged.Authorization = `Bearer ${this.accessToken}`;
    if (csrf && this.csrf) merged[CSRF_HEADER] = raw?.csrf ?? this.csrf;
    if (raw?.csrf !== undefined) merged[CSRF_HEADER] = raw.csrf;
    if (raw?.dropCsrf) delete merged[CSRF_HEADER];

    const init = { method, headers: merged };

    if (body !== undefined) {
      merged['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const response = await fetch(`${api}${path}`, init);

    this.absorb(response);

    const text = await response.text();
    let parsed = null;

    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    return { status: response.status, body: parsed };
  }

  get(path, options) {
    return this.request('GET', path, options);
  }

  post(path, body, options) {
    return this.request('POST', path, { ...options, body: body ?? {} });
  }

  patch(path, body, options) {
    return this.request('PATCH', path, { ...options, body: body ?? {} });
  }

  del(path, body, options) {
    return this.request('DELETE', path, { ...options, body });
  }

  adopt(payload) {
    if (payload?.accessToken) this.accessToken = payload.accessToken;
    if (payload?.refreshToken !== undefined) this.refreshToken = payload.refreshToken;

    return this;
  }
}

export function session() {
  return new Session();
}

export async function login(username, password) {
  const client = session();
  const { status, body } = await client.post('/auth/login', { username_or_email: username, password });

  if (status !== 200 && status !== 201) throw new Error(`вход ${username} не удался: ${status} ${JSON.stringify(body)}`);

  return client.adopt(body);
}

export async function register(username, password, email = `${username}@example.com`) {
  const client = session();
  const { status, body } = await client.post('/auth/register', { username, email, password });

  if (status !== 200 && status !== 201) throw new Error(`регистрация ${username} не удалась: ${status} ${JSON.stringify(body)}`);

  return client.adopt(body);
}
