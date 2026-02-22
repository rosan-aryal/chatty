"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CountrySelector } from "@/components/country-selector";
import { env } from "@chat-application/env/web";

const onboardingSchema = z.object({
  gender: z.enum(["male", "female", "other"]),
  country: z.string().min(2, "Country is required"),
});

export default function OnboardingPage() {
  const router = useRouter();

  const form = useForm({
    defaultValues: { gender: "" as string, country: "" },
    onSubmit: async ({ value }) => {
      const parsed = onboardingSchema.safeParse(value);
      if (!parsed.success) {
        toast.error("Please fill in all fields");
        return;
      }
      const res = await fetch(
        `${env.NEXT_PUBLIC_SERVER_URL}/api/user/onboard`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(parsed.data),
        },
      );
      if (res.ok) {
        toast.success("Welcome aboard!");
        router.push("/chat");
      } else {
        toast.error("Something went wrong");
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Complete Your Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Tell us a bit about yourself to get started
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <form.Field name="gender">
            {(field) => (
              <div className="space-y-3">
                <label className="text-sm font-medium">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => field.handleChange(g)}
                      className={`rounded-lg border-2 p-3 text-sm font-medium capitalize transition-all ${
                        field.state.value === g
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form.Field>

          <form.Field name="country">
            {(field) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <CountrySelector
                  value={field.state.value}
                  onChange={(code) => field.handleChange(code)}
                />
              </div>
            )}
          </form.Field>

          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
