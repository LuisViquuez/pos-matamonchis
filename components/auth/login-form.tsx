"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Mail, Lock } from "lucide-react";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pos_remember_email");
      if (saved) setSavedEmail(saved);
    } catch {}
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setValidationError(null);
    const form = e.currentTarget;
    const email =
      (form.elements.namedItem("email") as HTMLInputElement)?.value?.trim() ||
      "";
    const password =
      (form.elements.namedItem("password") as HTMLInputElement)?.value || "";
    const remember = (form.elements.namedItem("rememberMe") as HTMLInputElement)
      ?.checked;

    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!email) {
      e.preventDefault();
      setValidationError("El correo es requerido");
      return;
    }

    if (!emailRegex.test(email)) {
      e.preventDefault();
      setValidationError("Ingrese un correo electrónico válido");
      return;
    }

    if (!password) {
      e.preventDefault();
      setValidationError("La contraseña es requerida");
      return;
    }

    if (password.length < 8) {
      e.preventDefault();
      setValidationError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    try {
      if (remember) localStorage.setItem("pos_remember_email", email);
      else localStorage.removeItem("pos_remember_email");
    } catch {}
    // allow form to submit to server action
  }

  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-semibold text-center">
          Iniciar Sesión
        </CardTitle>
        <CardDescription className="text-center">
          Ingresa tus credenciales para acceder al sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} action={formAction} className="space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {state?.error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Correo Electrónico
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                required
                disabled={isPending}
                defaultValue={savedEmail}
                maxLength={150}
                className="pl-10 h-11 bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isPending}
                maxLength={16}
                className="pl-10 h-11 bg-background"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                defaultChecked={!!savedEmail}
                disabled={isPending}
                className="w-4 h-4"
              />
              <span>Recordarme</span>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-medium"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
