import type { Metadata } from "next";
import { Mail, MessageCircle, Clock, Globe } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact Us - Get in Touch with the Chatty Team",
  description:
    "Have a question about our anonymous chat platform? Need help with your account? Contact the Chatty team. We're here to help with any questions about chatting, groups, or your account.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center mb-12">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Have a question about our anonymous chat platform? Want to report an
          issue, suggest a feature, or just say hello? We'd love to hear from
          you.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Info cards */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">How Can We Help?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Whether you're having trouble with your account, have questions about
            our chat features, or want to share feedback about your experience
            meeting new people on Chatty, our team is here to assist you.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold">General Questions</h3>
                <p className="text-sm text-muted-foreground">
                  Questions about anonymous chatting, group rooms, or how our
                  matching system works.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Globe className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold">Account & Billing</h3>
                <p className="text-sm text-muted-foreground">
                  Help with your Chatty account, premium subscription, or
                  billing questions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold">Response Time</h3>
                <p className="text-sm text-muted-foreground">
                  We typically respond within 24 hours. For urgent safety
                  concerns, please use the in-app support feature.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
