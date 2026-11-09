import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="signin-shell">
      <div className="signin-brand"><span className="brand-mark">P</span><div><strong>PHE PHIM AI</strong><small>CONTROL ROOM · PRIVATE ACCESS</small></div></div>
      <SignIn routing="path" path="/sign-in" />
    </main>
  );
}
