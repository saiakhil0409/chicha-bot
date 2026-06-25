// ── AUTH ──────────────────────────────────────────────────────────────────────
const Auth = (() => {
  const STORE_KEY = 'chicha_auth';

  function getStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch { return {}; }
  }

  function err(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  return {
    isLoggedIn() {
      const s = getStore();
      return !!s.apiKey && !!s.sessionToken && s.sessionToken === sessionStorage.getItem('chicha_token');
    },

    getKey() {
      const s = getStore();
      if (!s.apiKey) return null;
      try {
        const pw = sessionStorage.getItem('chicha_pw');
        return CryptoJS.AES.decrypt(s.apiKey, pw).toString(CryptoJS.enc.Utf8);
      } catch { return null; }
    },

    doLogin() {
      const pw = document.getElementById('pwInput').value.trim();
      if (!pw) { err('loginError', 'Enter your password.'); return; }
      const s = getStore();
      if (!s.apiKey) { err('loginError', 'No API key stored. Set it up first.'); return; }
      try {
        const key = CryptoJS.AES.decrypt(s.apiKey, pw).toString(CryptoJS.enc.Utf8);
        if (!key.startsWith('gsk_') && !key.startsWith('sk-')) {
          err('loginError', 'Wrong password.'); return;
        }
        const token = Math.random().toString(36).slice(2);
        sessionStorage.setItem('chicha_token', token);
        sessionStorage.setItem('chicha_pw', pw);
        getStore(); // ensure fresh
        const store = getStore();
        store.sessionToken = token;
        localStorage.setItem(STORE_KEY, JSON.stringify(store));
        App.launch();
      } catch { err('loginError', 'Wrong password.'); }
    },

    doSetup() {
      const key = document.getElementById('setupKey').value.trim();
      const pw  = document.getElementById('setupPw').value.trim();
      if (!key.startsWith('gsk_') && !key.startsWith('sk-')) {
        err('setupError', 'Key should start with gsk_ (Groq) or sk- (OpenAI)'); return;
      }
      if (pw.length < 4) { err('setupError', 'Password must be at least 4 characters.'); return; }
      const encrypted = CryptoJS.AES.encrypt(key, pw).toString();
      const token = Math.random().toString(36).slice(2);
      sessionStorage.setItem('chicha_token', token);
      sessionStorage.setItem('chicha_pw', pw);
      localStorage.setItem(STORE_KEY, JSON.stringify({ apiKey: encrypted, sessionToken: token }));
      App.launch();
    },

    toggleForgot() {
      const lf = document.getElementById('loginForm');
      const ff = document.getElementById('forgotForm');
      const sf = document.getElementById('setupForm');
      // Hide all, show forgot
      const showForgot = ff.style.display === 'none';
      lf.style.display = showForgot ? 'none' : '';
      ff.style.display = showForgot ? '' : 'none';
      sf.style.display = 'none';
      document.getElementById('resetError').textContent = '';
    },

    doReset() {
      const key = document.getElementById('resetNewKey').value.trim();
      const pw  = document.getElementById('resetNewPw').value.trim();
      if (!key.startsWith('gsk_') && !key.startsWith('sk-')) {
        document.getElementById('resetError').textContent = 'Key should start with gsk_ (Groq)'; return;
      }
      if (pw.length < 4) {
        document.getElementById('resetError').textContent = 'Password must be at least 4 characters.'; return;
      }
      // Remove old auth, keep learning progress
      localStorage.removeItem('chicha_auth');
      // Set up fresh with new key + password
      const encrypted = CryptoJS.AES.encrypt(key, pw).toString();
      const token = Math.random().toString(36).slice(2);
      sessionStorage.setItem('chicha_token', token);
      sessionStorage.setItem('chicha_pw', pw);
      localStorage.setItem('chicha_auth', JSON.stringify({ apiKey: encrypted, sessionToken: token }));
      App.launch();
    },

    toggleSetup() {
      const lf = document.getElementById('loginForm');
      const sf = document.getElementById('setupForm');
      lf.style.display = lf.style.display === 'none' ? '' : 'none';
      sf.style.display = sf.style.display === 'none' ? '' : 'none';
    },

    togglePw(inputId, btn) {
      const inp = document.getElementById(inputId);
      if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
      else { inp.type = 'password'; btn.textContent = '👁'; }
    },

    logout() {
      sessionStorage.clear();
      document.getElementById('mainApp').classList.add('hidden');
      document.getElementById('loginScreen').classList.remove('hidden');
      document.getElementById('pwInput').value = '';
    }
  };
})();
