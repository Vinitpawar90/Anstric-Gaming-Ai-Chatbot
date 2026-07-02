import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, MessageSquare, Lightbulb, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Knowledge",
    description: "Connect your existing tools—Notion, Google Drive, GitHub, or simply upload documents. Anstric AI ingests and indexes everything.",
    color: "from-primary to-secondary",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Ask Anything",
    description: "Employees ask questions in natural language. Anstric AI searches through all your documentation and provides accurate, sourced answers.",
    color: "from-secondary to-accent",
  },
  {
    number: "03",
    icon: Lightbulb,
    title: "Learn & Improve",
    description: "The system learns from usage patterns, identifies knowledge gaps, and helps you continuously improve your documentation.",
    color: "from-accent to-primary",
  },
];

export const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="how-it-works" className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/10 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-secondary font-semibold mb-4 block">HOW IT WORKS</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Three Steps to{" "}
            <span className="text-gradient">Smarter Knowledge</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes, not months. Anstric AI makes knowledge management effortless.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent" />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative"
            >
              {/* Step Card */}
              <div className="glass rounded-3xl p-8 text-center hover-lift h-full">
                {/* Number Badge */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 text-lg font-bold text-white shadow-lg`}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>

              {/* Arrow (except last) */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute top-24 -right-4 w-8 h-8 bg-background rounded-full items-center justify-center z-10">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-6">
            Ready to transform the way we manage knowledge?
          </p>
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:-translate-y-0.5 transition-all">
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
