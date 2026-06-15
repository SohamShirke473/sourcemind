"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PillButton } from "@/components/ui/pill-button";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { error: err } = await authClient.signIn.email({ email, password });
    if (err) {
      setError(err.message ?? "Something went wrong");
    } else {
      router.push("/");
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center"
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--border) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <Card className="w-full max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-bold uppercase tracking-[0.05em]">
              SIGN IN
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <p className="text-sm font-normal text-destructive">{error}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <PillButton
              type="submit"
              variant="primary"
              size="default"
              className="w-full"
            >
              SIGN IN
            </PillButton>
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
