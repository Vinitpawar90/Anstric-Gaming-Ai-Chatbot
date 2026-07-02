import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { FileSearch, Clock, Users, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

const problems = [
  {
    icon: FileSearch,
    title: "Scattered Information",
    description: "Game designs and docs spread across Notion, Drive, Slack, and wikis",
  },
  {
    icon: Clock,
    title: "Time Wasted",
    description: "Hours spent searching for answers that should be instant",
  },
  {
    icon: Users,
    title: "Slow Onboarding",
    description: "New hires take months to become fully productive",
  },
  {
    icon: AlertTriangle,
    title: "Outdated Docs",
    description: "Critical documentation becomes stale and unreliable",
  },
];

const solutions = [
  "Centralized knowledge hub",
  "Instant AI-powered answers",
  "Personalized onboarding paths",
  "Auto-updating documentation",
];

export const ProblemSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-secondary font-semibold mb-4 block">THE PROBLEM</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Your Knowledge is{" "}
            <span className="text-secondary">Everywhere</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Modern game studios struggle with fragmented information. Sound familiar?
          </p>
        </motion.div>

        {/* Problem Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass rounded-2xl p-6 text-center hover-lift"
            >
              <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <problem.icon className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="font-semibold mb-2">{problem.title}</h3>
              <p className="text-sm text-muted-foreground">{problem.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Transformation Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center mb-16"
        >
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
            <ArrowRight className="w-8 h-8 text-primary-foreground rotate-90" />
          </div>
        </motion.div>

        {/* Solution Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass rounded-3xl p-8 lg:p-12"
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-accent font-semibold mb-4 block">THE SOLUTION</span>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                One Brain. All Knowledge.{" "}
                <span className="text-secondary">Instant Answers.</span>
              </h3>
              <p className="text-muted-foreground mb-6">
                Anstric AI transforms our scattered documentation into a living, intelligent
                knowledge system that grows with Anstric Games.
              </p>
              <ul className="space-y-3">
                {solutions.map((solution, index) => (
                  <motion.li
                    key={solution}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="font-medium">{solution}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Visual Representation */}
            <div className="relative">
              <div className="aspect-square max-w-sm mx-auto relative">
                {/* Central Brain */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.7, type: "spring" }}
                  className="absolute inset-1/4 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30"
                >
                  <span className="text-xl sm:text-2xl font-bold text-primary-foreground text-center leading-tight px-2">Anstric<br/>AI</span>
                </motion.div>

                {/* Orbiting Elements */}
                {["Notion", "Slack", "Drive", "Wiki"].map((tool, index) => (
                  <motion.div
                    key={tool}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                    className="absolute w-16 h-16 glass rounded-xl flex items-center justify-center font-medium text-sm"
                    style={{
                      top: `${50 + 40 * Math.sin((index * Math.PI) / 2)}%`,
                      left: `${50 + 40 * Math.cos((index * Math.PI) / 2)}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {tool}
                  </motion.div>
                ))}

                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <motion.line
                      key={i}
                      x1="50%"
                      y1="50%"
                      x2={`${50 + 40 * Math.cos((i * Math.PI) / 2)}%`}
                      y2={`${50 + 40 * Math.sin((i * Math.PI) / 2)}%`}
                      stroke="hsl(var(--accent))"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      initial={{ pathLength: 0 }}
                      animate={isInView ? { pathLength: 1 } : {}}
                      transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
