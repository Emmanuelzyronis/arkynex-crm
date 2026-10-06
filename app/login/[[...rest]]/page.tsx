import { SignIn } from "@clerk/nextjs";

import { Logo } from "@/components/landing/logo";
import { AuthVisual } from "@/components/auth/auth-visual";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <Logo />
          <div className="mt-8">
            <SignIn
              path="/login"
              routing="path"
              signUpUrl="/signup"
              forceRedirectUrl="/dashboard"
            />
          </div>
        </div>
      </div>
      <AuthVisual />
    </div>
  );
}
