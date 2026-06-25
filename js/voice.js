// ── VOICE ─────────────────────────────────────────────────────────────────────
const Voice = (() => {
  let _recog = null;
  let _listening = false;
  let _synth = window.speechSynthesis;

  function init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    _recog = new SpeechRecognition();
    _recog.continuous = false;
    _recog.lang = 'en-IN';
    _recog.onresult = (e) => {
      const text = e.results[0][0].transcript;
      document.getElementById('userInput').value = text;
      Chat.send();
    };
    _recog.onend = () => {
      _listening = false;
      document.getElementById('micBtn').classList.remove('listening');
    };
  }

  return {
    init,
    toggle() {
      if (!_recog) { init(); }
      if (!_recog) { alert('Voice not supported in this browser.'); return; }
      if (_listening) { _recog.stop(); }
      else {
        _recog.start(); _listening = true;
        document.getElementById('micBtn').classList.add('listening');
      }
    },
    speak(text) {
      if (!_synth) return;
      _synth.cancel();
      const utt = new SpeechSynthesisUtterance(text.slice(0, 200));
      utt.rate = 1.05; utt.pitch = 1.1; utt.volume = 0.9;
      _synth.speak(utt);
    },
  };
})();
