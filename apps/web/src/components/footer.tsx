import Link from "next/link";

const footerLinks = {
  Platform: [
    { name: "Anonymous Chat", href: "/features" },
    { name: "Group Chat Rooms", href: "/features" },
    { name: "Random Chat Online", href: "/chat" },
    { name: "Gender Matching", href: "/features" },
    { name: "Country Matching", href: "/features" },
  ],
  Company: [
    { name: "About Chatty", href: "/" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
    { name: "Contact Us", href: "/contact" },
  ],
  Support: [
    { name: "Help Center", href: "/support" },
    { name: "Send Feedback", href: "/feedback" },
    { name: "Safety Tips", href: "/blog/online-chat-safety-tips" },
    { name: "Privacy Guide", href: "/blog/anonymous-messaging-future" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary via-secondary to-primary/55 text-sm font-bold shadow">
                C
              </div>
              <span className="text-lg font-bold">Chatty</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              The anonymous chat platform where you can meet new people, join group chats, and make friends online — all in real time.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href as any}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Chatty. Anonymous chat platform for meeting new people online.
          </p>
          <p className="text-xs text-muted-foreground">
            Chat with strangers safely. Make friends worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
