import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Users, Briefcase, UserCheck, Code, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  {
    id: "employees",
    icon: Users,
    title: "Game Developers",
    benefits: [
      "Get instant answers to company questions",
      "Access knowledge anytime, anywhere",
      "Learn faster with personalized content",
      "Reduce dependency on colleagues",
    ],
    stat: "3 hours",
    statLabel: "saved per week",
  },
  {
    id: "managers",
    icon: Briefcase,
    title: "Product Managers",
    benefits: [
      "Monitor team knowledge gaps",
      "Track onboarding progress",
      "Identify training opportunities",
      "Make data-driven decisions",
    ],
    stat: "40%",
    statLabel: "faster onboarding",
  },
  {
    id: "hr",
    icon: UserCheck,
    title: "HR & Ops",
    benefits: [
      "Automate repetitive questions",
      "Streamline onboarding process",
      "Keep policies always updated",
      "Improve employee satisfaction",
    ],
    stat: "80%",
    statLabel: "fewer HR tickets",
  },
  {
    id: "engineering",
    icon: Code,
    title: "Software Engineers",
    benefits: [
      "Self-serve technical documentation",
      "Faster debugging with context",
      "Reduce interruptions from questions",
      "Keep docs in sync with code",
    ],
    stat: "2x",
    statLabel: "faster debugging",
  },
];

export const RolesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeRole, setActiveRole] = useState(roles[0].id);

  const currentRole = roles.find((r) => r.id === activeRole)!;

  return (
    <section ref={ref} className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-secondary font-semibold mb-4 block">FOR EVERYONE</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Built for Your Entire Team
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every role in your organization benefits from Anstric AI's intelligent knowledge system.
          </p>
        </motion.div>

        {/* Role Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                activeRole === role.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              <role.icon className="w-5 h-5" />
              {role.title}
            </button>
          ))}
        </motion.div>

        {/* Active Role Content */}
        <motion.div
          key={activeRole}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass rounded-3xl p-8 lg:p-12"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Benefits List */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                  <currentRole.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{currentRole.title}</h3>
                  <p className="text-muted-foreground">How Anstric AI helps</p>
                </div>
              </div>

              <ul className="space-y-4">
                {currentRole.benefits.map((benefit, index) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Stat Highlight */}
            <div className="text-center lg:text-left">
              <div className="glass rounded-2xl p-8 inline-block">
                <div className="text-6xl lg:text-7xl font-bold text-gradient mb-2">
                  {currentRole.stat}
                </div>
                <div className="text-xl text-muted-foreground">
                  {currentRole.statLabel}
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-accent/30 animate-float" />
                <div className="w-12 h-12 rounded-xl bg-secondary/30 animate-float-delayed" />
                <div className="w-8 h-8 rounded-lg bg-primary/30 animate-float" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
