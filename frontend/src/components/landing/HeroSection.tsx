import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, MessageSquare, BookOpen, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const floatingCards = [
  { icon: MessageSquare, label: "50K+ Questions Answered", delay: 0 },
  { icon: BookOpen, label: "10K+ Documents Indexed", delay: 0.2 },
  { icon: BarChart3, label: "98% Accuracy Rate", delay: 0.4 },
];

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16 px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`
          [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
          [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]
          [--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)]
          [background-image:var(--white-gradient),var(--aurora)]
          dark:[background-image:var(--dark-gradient),var(--aurora)]
          [background-size:300%,_200%]
          [background-position:50%_50%,50%_50%]
          filter blur-[10px] invert dark:invert-0
          after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
          after:dark:[background-image:var(--dark-gradient),var(--aurora)]
          after:[background-size:200%,_100%] 
          after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
          pointer-events-none
          absolute -inset-[10px] opacity-50 will-change-transform
          [mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]
          `}
        ></div>

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23213448' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-6"
            >
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">AI-Powered Knowledge Platform</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              The{" "}
              <span className="text-gradient">Brain</span>
              {" "}of Anstric Games
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Transform scattered game design documents, HR policies, and engineering knowledge into an intelligent system that answers questions and trains new hires.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link to="/signup">
                <Button size="lg" className="text-lg px-8 shadow-xl shadow-primary/25 group w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8 group w-full sm:w-auto">
                  <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </a>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 flex items-center gap-4 justify-center lg:justify-start"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-secondary to-accent"
                    style={{ zIndex: 5 - i }}
                  />
                ))}
              </div>
              <div className="text-left">
                <p className="font-semibold">Anstric Games Team</p>
                <p className="text-sm text-muted-foreground">Trusted by our engineers and designers</p>
              </div>
            </motion.div>
          </div>

          {/* Right Content - AI Chat Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
          >
            {/* Main Chat Card */}
            <div className="glass rounded-3xl p-6 shadow-2xl">
              {/* Chat Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Anstric AI Assistant</h3>
                  <p className="text-sm text-muted-foreground">Always ready to help</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-muted-foreground">Online</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="py-6 space-y-4">
                {/* User Message */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex justify-end"
                >
                  <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-md max-w-[80%]">
                    How do I apply for leave?
                  </div>
                </motion.div>

                {/* AI Response */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-md max-w-[80%]">
                    <p className="mb-2">To apply for leave, follow these steps:</p>
                    <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                      <li>Log into the HR portal</li>
                      <li>Navigate to "Leave Management"</li>
                      <li>Click "New Request"</li>
                      <li>Select dates and leave type</li>
                    </ol>
                    <p className="mt-3 text-xs text-secondary flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Source: HR Policy Document v2.3
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <input
                  type="text"
                  placeholder="Ask anything about your company..."
                  className="flex-1 bg-muted/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-primary/20"
                />
                <Button size="icon" className="rounded-xl h-11 w-11">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Floating Stats Cards */}
            {floatingCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 + card.delay }}
                className={`absolute glass rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg ${index === 0 ? "-top-4 -left-4" :
                    index === 1 ? "-bottom-4 -right-4" :
                      "top-1/2 -right-8 translate-y-[-50%]"
                  } ${index === 2 ? "hidden lg:flex" : ""}`}
              >
                <div className="w-10 h-10 rounded-lg bg-accent/30 flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-secondary" />
                </div>
                <span className="font-medium text-sm whitespace-nowrap">{card.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
