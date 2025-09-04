import { useState } from "react";
import { auth } from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    await createUserWithEmailAndPassword(auth, email, password);
    // כאן אפשר להפנות לדשבורד / להציג הודעת הצלחה
  }

  return (
    <form onSubmit={handleRegister}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="אימייל" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="סיסמה" />
      <button type="submit">הרשם</button>
    </form>
  );
}
