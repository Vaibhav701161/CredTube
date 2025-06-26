# 🎓 CredTube – Learn from YouTube, Prove with Tokens

**CredTube** is an innovative learning platform that transforms YouTube lectures into verifiable learning achievements. By integrating with the Linux Foundation's **Learning Tokens**, CredTube allows learners to gain globally recognized credentials by simply watching curated video lectures and passing assessments.

---

## ✨ Key Features

- 📺 **Watch to Learn**: Study directly from curated YouTube playlists.
- 🧠 **Auto-Generated Assignments**: AI-generated assessments based on video content.
- 📊 **Track Progress**: Smart progress tracking based on video completion.
- 🪪 **Verifiable Tokens**: Get Linux Foundation Learning Tokens on successful assessment completion.
- 🔐 **User Profiles**: Personalized dashboard to track your learning journey.
- 💬 **Quiz & Assignment System**: Integrated quiz modal and evaluation system.

---

## 🚀 How It Works

1. **Sign Up / Sign In**
   - Simple authentication system (future OAuth planned).

2. **Pick a Course**
   - Courses are YouTube playlists (e.g., DSA, Blockchain, Web Dev).

3. **Watch Videos**
   - Embedded YouTube Player tracks video completion.

4. **Take the Quiz**
   - AI-generated assessments appear post-video.

5. **Earn a Token**
   - Complete assessments to claim your Linux Foundation Learning Token.

---

## 🛠️ Tech Stack

| Layer         | Technology                       |
|--------------|----------------------------------|
| Frontend     | React + TypeScript + TailwindCSS |
| Backend      | Supabase (Postgres + Edge Functions) |
| AI Features  | AI-generated quiz/assignments    |
| Auth         | Supabase Auth                    |
| Tokenization | Linux Foundation Learning Tokens |
| Dev Tools    | Vite, ESlint, Prettier, GitHub   |

---

## 📁 Folder Structure

```bash
learn-tube-tokens/
├── public/               # Static assets
├── src/
│   ├── components/       # Reusable UI and domain components
│   ├── pages/            # Route pages (Landing, Dashboard, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and helpers
│   ├── integrations/     # Supabase integration
│   └── supabase/         # Supabase functions + config
```
