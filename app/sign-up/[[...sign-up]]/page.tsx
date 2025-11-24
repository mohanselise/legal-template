import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--gradient-light-to))]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[hsl(var(--fg))]">Create Account</h1>
          <p className="mt-2 text-[hsl(var(--globe-grey))]">
            Sign up to access the admin dashboard
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg',
            },
          }}
        />
      </div>
    </div>
  );
}
