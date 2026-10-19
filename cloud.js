// Cloud sync: Firebase sign-in + Firestore storage, loaded only when firebase-config.js has a config.
// Data layout (one private space per person):
//   users/{uid}/meta/projects                  { list: [{ id, type, name, created }] } — the person's projects
//   users/{uid}/projects/{projectId}/words/{id}    a project's notebook entries
//   users/{uid}/projects/{projectId}/meta/chars    its letter progress { status: { "か": "known", ... } }
// Notebooks from before projects existed keep their original paths and become projects in place:
//   users/{uid}/words, users/{uid}/meta/chars                 project "ja"
//   users/{uid}/langs/{zh|ko|fr|es|de}/words, …/meta/chars    projects "zh" … "de"
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
  const projPath = pid => pid === 'ja' ? ['users', uid] : LANGS[pid] ? ['users', uid, 'langs', pid] : ['users', uid, 'projects', pid];
  const wordsCol = (pid = app.project) => F.collection(db, ...projPath(pid), 'words'); // app.project = the project on screen
  const wordRef = id => F.doc(db, ...projPath(app.project), 'words', id);
  const charsRef = (pid = app.project) => F.doc(db, ...projPath(pid), 'meta', 'chars');
  const projectsRef = () => F.doc(db, 'users', uid, 'meta', 'projects');
  let projects = null;

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
    // Word counts for the project list in the profile sidebar (from the server, or the offline cache)
    async counts(ids = (projects || []).map(p => p.id)) {
      if (!uid) return null;
      const out = {};
      await Promise.all(ids.map(async pid => {
        try { out[pid] = (await F.getCountFromServer(wordsCol(pid))).data().count; }
        catch { try { out[pid] = (await F.getDocsFromCache(wordsCol(pid))).size; } catch {} }
      }));
      return out;
    },
    saveProjects(list) { if (uid) return F.setDoc(projectsRef(), { list }).catch(showErr); },
    // Delete every entry of a project (batches of 400), then its letter progress
    async deleteProjectData(pid) {
      if (!uid) return;
      const snap = await F.getDocs(wordsCol(pid));
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = F.writeBatch(db);
        snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      await F.deleteDoc(charsRef(pid)).catch(() => {});
    },
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
    let checkedMigration = false, creatingList = false;
    // The project list. The first time (no list yet), notebooks from before projects become projects.
    unsubs.push(F.onSnapshot(projectsRef(), async snap => {
      if (snap.exists()) { projects = snap.data().list || []; app.setProjects(projects); return; }
      if (snap.metadata.fromCache || creatingList) return; // wait for the server before deciding there's no list
      creatingList = true;
      const counts = await window.cloud.counts(LANG_ORDER);
      const list = LANG_ORDER.filter(c => counts?.[c] > 0).map(c => ({ id: c, type: c, name: LANGS[c].name, created: Date.now() }));
      await F.setDoc(projectsRef(), { list }).catch(showErr);
    }, showErr));
    unsubs.push(F.onSnapshot(wordsCol(), { includeMetadataChanges: true }, snap => {
      app.setWords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      app.setSync(snap.metadata.hasPendingWrites ? 'saving' : snap.metadata.fromCache ? 'offline' : 'synced');
      // Wait for an answer from the server (not just the offline cache) before offering to copy local words
      if (!checkedMigration && !snap.metadata.fromCache) { checkedMigration = true; if (app.project === 'ja') offerMigration(user.uid); }
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
