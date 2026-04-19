import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-secondary/30 to-accent/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-40 h-40 rounded-3xl bg-card/70 mb-5 shadow-xl overflow-hidden p-5">
            <img
              src="/logos/sinfondo.png"
              className="h-full w-full object-contain"
              alt="La Matamonchis"
            />
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
          <p className="font-mono text-xs mt-1">
            admin@matamonchis.com / admin123
          </p>
        </div>
      </div>
    </main>
  );
}
