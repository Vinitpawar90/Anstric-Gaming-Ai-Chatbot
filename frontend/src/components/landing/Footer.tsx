import { Brain, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const socialLinks = [
  { icon: Linkedin, href: "https://www.linkedin.com/company/anstric/", label: "LinkedIn" },
];

export const Footer = () => {
  return (
    <footer className="border-t border-border py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
          {/* Logo & Description */}
          <div className="max-w-md">
            <Link to="/" className="flex items-center gap-2 mb-4 inline-flex">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Anstric Games</span>
            </Link>
            <p className="text-muted-foreground mb-6">
              The AI-powered knowledge platform that transforms how the Anstric Games team builds and learns.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 Anstric Games Private Limited.
          </p>
          <p className="text-sm text-muted-foreground">
            Made with ❤️ for growing teams
          </p>
        </div>
      </div>
    </footer>
  );
};
