import { type ReactNode } from "react";

interface FeatureSectionProps {
  heading: string;
  description: string;
  demo: ReactNode;
  reverse?: boolean;
}

export function FeatureSection({
  heading,
  description,
  demo,
  reverse = false,
}: FeatureSectionProps) {
  return (
    <section className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:grid-flow-dense" : ""}`}>
          <div className={reverse ? "lg:col-start-2" : ""}>
            <h2 className="font-calsans text-4xl lg:text-5xl tracking-tight">
              {heading}
            </h2>
            <p className="mt-6 text-lg text-zinc-400 leading-relaxed">
              {description}
            </p>
          </div>

          <div className={reverse ? "lg:col-start-1" : ""}>
            {demo}
          </div>
        </div>
      </div>
    </section>
  );
}
