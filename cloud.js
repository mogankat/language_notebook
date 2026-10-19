// Cloud sync: Firebase sign-in + Firestore storage, loaded only when firebase-config.js has a config.
// Data layout (one private space per person):
//   users/{uid}/words/{wordId}   one document per dictionary entry
//   users/{uid}/meta/chars       { status: { "か": "known", ... } }
// Firestore's offline cache keeps everything usable without a connection and syncs when back online.
const cfg = window.FIREBASE_CONFIG;
if (cfg) boot().catch(err => { console.error(err); app.authMessage('Could not load sign-in: ' + err.message, true); });

async function boot() {
  const base = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const [{ initializeApp }, A, F] = await Promise.all([
    import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
  const fb = initializeApp(cfg);
  const auth = A.getAuth(fb);
  const db = F.initializeFirestore(fb, {
    ignoreUndefinedProperties: true,
    localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
  });
  // Developers: set `emulator: true` in the config to test against the local Firebase emulators
  if (cfg.emulator) {
    A.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    F.connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  let uid = null, unsubs = [];
  const wordRef = id => F.doc(db, 'users', uid, 'words', id);
  const charsRef = () => F.doc(db, 'users', uid, 'meta', 'chars');

  const MESSAGES = {
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No account with that email. Use “Create account”.',
    'auth/email-already-in-use': 'That email already has an account. Use “Sign in”.',
    'auth/weak-password': 'Password needs at least 6 characters.',
    'auth/invalid-email': 'That email address doesn’t look right.',
    'auth/missing-email': 'Type your email first.',
    'auth/unauthorized-domain': 'This website isn’t on Firebase’s authorized domains list yet (SETUP.md, step 4).',
    'auth/popup-blocked': 'The sign-in window was blocked. Allow pop-ups for this site and try again.',
    'auth/network-request-failed': 'No internet connection. Sign-in needs to be online the first time.',
    'permission-denied': 'The database refused access. Check that the rules from firestore.rules are published (SETUP.md, step 2).',
  };
  const showErr = e => {
    if (/popup-closed-by-user|cancelled-popup-request/.test(e?.code)) return;
    console.error(e);
    app.authMessage(MESSAGES[e?.code] || e?.message || String(e), true);
  };

  // Hooks used by the sign-in screen and account menu in index.html
  app.onGoogle = () => A.signInWithPopup(auth, new A.GoogleAuthProvider()).catch(showErr);
  app.onEmail = (mode, email, pw) =>
    (mode === 'up' ? A.createUserWithEmailAndPassword : A.signInWithEmailAndPassword)(auth, email, pw).catch(showErr);
  app.onForgot = email => A.sendPasswordResetEmail(auth, email)
    .then(() => app.authMessage('Password reset email sent. Check your inbox.')).catch(showErr);
  app.onSignOut = () => A.signOut(auth);

  // index.html calls this after every change (see persist() there)
  window.cloud = {
    push(change) {
      if (!uid) return;
      const ops = [];
      for (const id of change.words || []) {
        const w = app.getWord(id);
        if (!w) continue;
        const { id: _id, ...data } = w;
        ops.push(b => b.set(wordRef(id), data));
      }
      for (const id of change.deleted || []) ops.push(b => b.delete(wordRef(id)));
      if (change.chars?.length) {
        const status = {};
        for (const ch of change.chars) status[ch] = app.getChar(ch) || F.deleteField();
        ops.push(b => b.set(charsRef(), { status }, { merge: true }));
      }
      // Batches hold up to 500 writes. Don't await: the change shows instantly and syncs in the background.
      for (let i = 0; i < ops.length; i += 400) {
        const batch = F.writeBatch(db);
        ops.slice(i, i + 400).forEach(op => op(batch));
        batch.commit().catch(showErr);
      }
    },
  };

  A.onAuthStateChanged(auth, user => {
    unsubs.forEach(u => u()); unsubs = [];
    if (!user) { uid = null; app.signedOut(); return; }
    uid = user.uid;
    app.signedIn({ name: user.displayName || user.email, email: user.email });
    let checkedMigration = false;
    unsubs.push(F.onSnapshot(F.collection(db, 'users', uid, 'words'), { includeMetadataChanges: true }, snap => {
      app.setWords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      app.setSync(snap.metadata.hasPendingWrites ? 'saving' : snap.metadata.fromCache ? 'offline' : 'synced');
      // Wait for an answer from the server (not just the offline cache) before offering to copy local words
      if (!checkedMigration && !snap.metadata.fromCache) { checkedMigration = true; offerMigration(user.uid); }
    }, showErr));
    unsubs.push(F.onSnapshot(charsRef(), snap => app.setChars(snap.data()?.status || {}), showErr));
  });

  // First sign-in on a browser that already has words saved locally (from before sync existed)
  function offerMigration(forUid) {
    const key = 'jn.migrated.' + forUid;
    try { if (localStorage.getItem(key)) return; } catch { return; }
    const local = app.localData();
    const n = local.words.length;
    if (n && confirm(`This browser has ${n} word${n === 1 ? '' : 's'} saved from before sign-in. Copy ${n === 1 ? 'it' : 'them'} into this account?\n\n(Words already in the account are kept and duplicates are skipped. Choose Cancel if these belong to someone else.)`)) {
      app.importLocal(local);
    }
    try { localStorage.setItem(key, '1'); } catch {}
  }
}
