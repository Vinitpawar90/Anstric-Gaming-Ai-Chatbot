import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { MessageSquare, FolderOpen, GraduationCap, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "ai-assistant",
    icon: MessageSquare,
    title: "AI Knowledge Assistant",
    subtitle: "Instant answers from your docs",
    description: "Employees ask questions in natural language and get accurate, contextual answers with source references. No more digging through folders.",
    mockup: {
      type: "chat",
      messages: [
        { role: "user", text: "How do I deploy Border Game updates?" },
        { role: "ai", text: "Updates for Border Game require pushing to the `main` branch, getting 2 approvals, and passing Unity CI tests before merging to staging.", source: "Border Game Engineering Handbook v3.1" },
      ],
    },
  },
  {
    id: "knowledge-base",
    icon: FolderOpen,
    title: "Smart Knowledge Base",
    subtitle: "All docs in one place",
    description: "Upload PDFs, sync with Notion, connect GitHub repos. Auto-versioning, smart tagging, and always up-to-date documentation.",
    mockup: {
      type: "files",
      items: [
        { name: "Game Design Documents", count: 24, synced: true },
        { name: "Anstric IDE Specs", count: 156, synced: true },
        { name: "HR Policies", count: 18, synced: true },
        { name: "API Documentation", count: 12, synced: false },
      ],
    },
  },
  {
    id: "onboarding",
    icon: GraduationCap,
    title: "AI Onboarding Coach",
    subtitle: "Personalized learning paths",
    description: "New hires get a customized onboarding journey with day-wise plans, micro-lessons, interactive Q&A, and progress tracking.",
    mockup: {
      type: "progress",
      weeks: [
        { week: 1, title: "Anstric Games Culture", progress: 100 },
        { week: 2, title: "Unity & React Stack", progress: 75 },
        { week: 3, title: "Role Training", progress: 30 },
        { week: 4, title: "Team Integration", progress: 0 },
      ],
    },
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Knowledge Analytics",
    subtitle: "Insights that matter",
    description: "See what questions are asked most, identify knowledge gaps, track outdated docs, and monitor team learning progress.",
    mockup: {
      type: "chart",
      data: [
        { label: "Border Game Architecture", value: 85 },
        { label: "Anstric IDE Setup", value: 72 },
        { label: "Leave Policy", value: 68 },
        { label: "Multiplayer Server", value: 54 },
      ],
    },
  },
];

export const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeFeature, setActiveFeature] = useState(features[0].id);

  const currentFeature = features.find((f) => f.id === activeFeature)!;

  return (
    <section ref={ref} id="features" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-secondary font-semibold mb-4 block">FEATURES</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Everything Your Team Needs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to transform how your organization learns and shares knowledge.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Feature Tabs */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => setActiveFeature(feature.id)}
                className={cn(
                  "w-full text-left p-6 rounded-2xl transition-all duration-300",
                  activeFeature === feature.id
                    ? "glass shadow-xl border-l-4 border-l-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                      activeFeature === feature.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.subtitle}</p>
                    {activeFeature === feature.id && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 text-muted-foreground"
                      >
                        {feature.description}
                      </motion.p>
                    )}
                  </div>
                  <ArrowRight
                    className={cn(
                      "w-5 h-5 transition-transform",
                      activeFeature === feature.id ? "rotate-0 text-primary" : "-rotate-45 text-muted-foreground"
                    )}
                  />
                </div>
              </motion.button>
            ))}
          </div>

          {/* Feature Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass rounded-3xl p-6 sticky top-24"
          >
            <FeatureMockup feature={currentFeature} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const FeatureMockup = ({ feature }: { feature: (typeof features)[0] }) => {
  const { mockup } = feature;

  if (mockup.type === "chat") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h4 className="font-semibold">AI Assistant</h4>
            <p className="text-xs text-muted-foreground">Powered by Anstric Games</p>
          </div>
        </div>
        <div className="space-y-3 min-h-[200px]">
          {mockup.messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "px-4 py-3 rounded-2xl max-w-[85%]",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-md"
                    : "bg-muted rounded-tl-md"
                )}
              >
                <p className="text-sm">{msg.text}</p>
                {"source" in msg && (
                  <p className="text-xs mt-2 opacity-70">📄 {msg.source}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (mockup.type === "files") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h4 className="font-semibold">Knowledge Base</h4>
          <span className="text-sm text-muted-foreground">210 documents</span>
        </div>
        <div className="space-y-3 min-h-[200px]">
          {mockup.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-secondary" />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{item.count} docs</span>
                {item.synced ? (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Synced</span>
                ) : (
                  <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Pending</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (mockup.type === "progress") {
    return (
      <div className="space-y-4">
        <div className="pb-4 border-b border-border">
          <h4 className="font-semibold">Sarah's Onboarding</h4>
          <p className="text-sm text-muted-foreground">Week 2 of 4 • 51% Complete</p>
        </div>
        <div className="space-y-4 min-h-[200px]">
          {mockup.weeks.map((week, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium">Week {week.week}: {week.title}</span>
                <span className="text-muted-foreground">{week.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${week.progress}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={cn(
                    "h-full rounded-full",
                    week.progress === 100 ? "bg-green-500" : "bg-primary"
                  )}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (mockup.type === "chart") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h4 className="font-semibold">Top Questions This Week</h4>
          <span className="text-sm text-muted-foreground">342 total</span>
        </div>
        <div className="space-y-4 min-h-[200px]">
          {mockup.data.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">{item.value} asks</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
