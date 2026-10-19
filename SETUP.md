# Japanese Notebook: setup for syncing and profiles

Until step 3 is done, the notebook runs in **local-only mode** (data stays in one browser).
After setup, each person signs in and has their own dictionary, notes and character
progress, synced across Mac, iPhone and iPad.

## 1. Create a Firebase project (free)

1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. **Create a project**, name it e.g. `japanese-notebook`. Google Analytics: turn it **off** (not needed).

## 2. Create the database

1. Left menu: **Build → Firestore Database → Create database**.
2. Location: pick one near you (it can't be changed later). Choose **Start in production mode**.
3. Open the **Rules** tab, replace everything with the contents of [`firestore.rules`](firestore.rules), and click **Publish**.
   These rules make each person's notebook readable and writable only by them.

## 3. Connect the notebook to Firebase

1. Click the gear icon → **Project settings** → **General** → **Your apps** → the web icon **`</>`**.
2. Nickname: `notebook`. Leave "Firebase Hosting" **unchecked**. Click **Register app**.
3. Copy the `firebaseConfig = { ... }` object it shows and paste it into [`firebase-config.js`](firebase-config.js), so the file reads:

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "…",
     authDomain: "japanese-notebook-xxxx.firebaseapp.com",
     projectId: "japanese-notebook-xxxx",
     storageBucket: "…",
     messagingSenderId: "…",
     appId: "…"
   };
   ```

   These values are fine to publish on GitHub; the rules from step 2 are what protect the data.

## 4. Turn on sign-in

1. Left menu: **Build → Authentication → Get started**.
2. **Sign-in method** tab: enable **Google** (choose your email as the support email) and **Email/Password**.
3. **Settings** tab → **Authorized domains** → **Add domain** → `YOUR-GITHUB-USERNAME.github.io`.

## 5. Publish on GitHub Pages

1. Put this folder in a GitHub repository and push it.
2. On GitHub: repository **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, branch **main**, folder **/ (root)** → Save.
3. After a minute the notebook is live at `https://YOUR-GITHUB-USERNAME.github.io/REPOSITORY-NAME/`.

## 6. Move your existing words into your account

Your current words live in the browser you've been using locally, which the website can't see.

1. Open your **local** notebook (the `index.html` file) → Words tab → **Export backup**.
2. Open the **website**, sign in, Words tab → **Import backup** and pick that file.

## 7. On iPhone and iPad

Open the website in Safari, sign in, then **Share → Add to Home Screen** for an app-like icon.
The home-screen icon keeps its own sign-in, so sign in once more inside it. If "Continue with Google"
won't complete there, use email and password instead.

## Optional: only allow your household

Anyone who finds the URL could create an account (they would only ever see their own empty notebook).
To lock sign-in to specific people, change the rule in step 2 to:

```
allow read, write: if request.auth != null && request.auth.uid == uid
  && request.auth.token.email in ['you@example.com', 'your-wife@example.com'];
```

## Developer notes

- `cloud.js` holds all sync code; `index.html` works without it (local-only mode).
- `make-kana-audio.py` regenerates `audio/kana/` with the macOS Kyoko voice.
- To test sync locally without a real project, run the Firebase emulators (`npx firebase-tools emulators:start --only auth,firestore --project demo-notebook`)
  and set `FIREBASE_CONFIG = { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-notebook', emulator: true }`.
