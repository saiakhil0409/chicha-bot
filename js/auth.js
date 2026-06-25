// ── AUTH ──────────────────────────────────────────────────────────────────────
const Auth = (() => {
  const STORE_KEY = 'chicha_auth'

  function getStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch { return {}; }
  }

  function err(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  // Decrypt key using password
  function decryptKey(encrypted, pw) {
    try {
      const key = CryptoJS.AES.decrypt(encrypted, pw).toString(CryptoJS.enc.Utf8);
      return (key.startsWith('gsk_') || key.startsWith('sk-')) ? key : null;
    } catch { return null; }
  }

  return {
    isLoggedIn() {
      // Auto-launch only if password is still in sessionStorage (same tab session)
      return !!sessionStorage.getItem('chicha_pw') && !!getStore().apiKey;
    },

    getKey() {
      const s  = getStore();
      const pw = sessionStorage.getItem('chicha_pw');
      if (!s.apiKey || !pw) return null;
      return decryptKey(s.apiKey, pw);
    },

    doLogin() {
      const pw = document.getElementById('pwInput').value.trim();
      if (!pw) { err('loginError', 'Enter your password.'); return; }
      const s  = getStore();
      if (!s.apiKey) { err('loginError', 'No API key found. Click "First time? Set up →"'); return; }
      const key = decryptKey(s.apiKey, pw);
      if (!key) { err('loginError', 'Wrong password. Try again.'); return; }
      // Save pw to sessionStorage for API calls this session
      sessionStorage.setItem('chicha_pw', pw);
      // Mark session active in localStorage so it survives reload
      localStorage.setItem('chicha_session_active', '1');
      // App is already in memory — launch directly, no reload needed
      App.launch();
    },

    doSetup() {
      const key = document.getElementById('setupKey').value.trim();
      const pw  = document.getElementById('setupPw').value.trim();
      if (!key) { err('setupError', 'Paste your Groq API key first.'); return; }
      if (!key.startsWith('gsk_') && !key.startsWith('sk-')) {
        err('setupError', 'Key must start with gsk_ — check you copied the full key.'); return;
      }
      if (pw.length < 4) { err('setupError', 'Password must be at least 4 characters.'); return; }
      try {
        const encrypted = CryptoJS.AES.encrypt(key, pw).toString();
        localStorage.setItem(STORE_KEY, JSON.stringify({ apiKey: encrypted }));
        sessionStorage.setItem('chicha_pw', pw);
        localStorage.setItem('chicha_session_active', '1');
        App.launch();
      } catch(e) {
        err('setupError', 'Something went wrong: ' + e.message);
      }
    },

    doReset() {
      const key = document.getElementById('resetNewKey').value.trim();
      const pw  = document.getElementById('resetNewPw').value.trim();
      if (!key.startsWith('gsk_') && !key.startsWith('sk-')) {
        document.getElementById('resetError').textContent = 'Key must start with gsk_'; return;
      }
      if (pw.length < 4) {
        document.getElementById('resetError').textContent = 'Password must be at least 4 characters.'; return;
      }
      try {
        const encrypted = CryptoJS.AES.encrypt(key, pw).toString();
        localStorage.setItem(STORE_KEY, JSON.stringify({ apiKey: encrypted }));
        sessionStorage.setItem('chicha_pw', pw);
        localStorage.setItem('chicha_session_active', '1');
        App.launch();
      } catch(e) {
        document.getElementById('resetError').textContent = 'Something went wrong: ' + e.message;
      }
    },

    toggleForgot() {
      const lf = document.getElementById('loginForm');
      const ff = document.getElementById('forgotForm');
      const sf = document.getElementById('setupForm');
      const showForgot = ff.style.display === 'none';
      lf.style.display = showForgot ? 'none' : '';
      ff.style.display = showForgot ? ''     : 'none';
      sf.style.display = 'none';
      err('resetError', '');
    },

    toggleSetup() {
      const lf = document.getElementById('loginForm');
      const sf = document.getElementById('setupForm');
      const ff = document.getElementById('forgotForm');
      const goingToSetup = sf.style.display === 'none';
      lf.style.display = goingToSetup ? 'none' : '';
      sf.style.display = goingToSetup ? ''     : 'none';
      if (ff) ff.style.display = 'none';
      err('setupError', '');
    },

    togglePw(inputId, btn) {
      const inp = document.getElementById(inputId);
      if (inp.type === 'password') { inp.type = 'text';     btn.textContent = '🙈'; }
      else                         { inp.type = 'password'; btn.textContent = '👁'; }
    },

    logout() {
      sessionStorage.clear();
      localStorage.removeItem('chicha_session_active');
      document.body.classList.remove('app-open');
      document.getElementById('mainApp').classList.add('hidden');
      document.getElementById('loginScreen').classList.remove('hidden');
      document.getElementById('pwInput').value = '';
      err('loginError', '');
    }
  };
})();
