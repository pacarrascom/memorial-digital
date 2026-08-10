import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
