import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <div className="shadow-xl">
        <SignIn />
      </div>
    </div>
  );
}
