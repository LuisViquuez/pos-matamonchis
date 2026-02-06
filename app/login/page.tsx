import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 2a10 10 0 0 1 10 10" />
              <circle cx="12" cy="12" r="6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground text-balance">
            LA MATAMONCHIS S.A.
          </h1>
          <p className="text-muted-foreground mt-2">
            Sistema de Punto de Venta
          </p>
        </div>
        
        <LoginForm />
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Credenciales de prueba:</p>
          <p className="font-mono text-xs mt-1">admin@matamonchis.com / admin123</p>
        </div>
      </div>
    </main>
  );
}
