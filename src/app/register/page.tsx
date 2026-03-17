import { redirect } from "next/navigation";
import { getCurrentPhase } from "@/app/actions";
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const phase = await getCurrentPhase();

  // If not in REGISTER phase, show closed message
  if (phase !== "REGISTER") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="minimal-card p-8 max-w-sm text-center mx-auto bg-white mt-12">
          <h1 className="text-xl font-semibold mb-2">Registration Closed</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The registration period is over.
          </p>
          <a
            href="/login"
            className="minimal-btn bg-primary text-primary-foreground px-6 py-2.5 inline-block text-sm"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return <RegisterForm />;
}
