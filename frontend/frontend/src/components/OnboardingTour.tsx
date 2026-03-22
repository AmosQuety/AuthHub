import { useState, useEffect } from "react";
import Joyride, { STATUS } from "react-joyride";
import type { CallBackProps, Step, TooltipRenderProps } from "react-joyride";
import { ShieldAlert, Sparkles, X } from "lucide-react";

const steps: Step[] = [
  {
    target: "body",
    content: "Welcome to AuthHub! Let's take a quick tour of your new centralized authentication dashboard.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: "#tour-mfa-setup",
    content: "Security is our top priority. You can set up TOTP or biometric Passkeys right here to secure your account.",
    placement: "right",
  },
  {
    target: "#tour-developer-portal",
    content: "Building something new? The Developer Portal lets you register OAuth2 clients to authenticate your own users.",
    placement: "right",
  },
  {
    target: "#tour-active-sessions",
    content: "Keep track of everywhere you're logged in. You can remotely revoke access to any unrecognized devices from here.",
    placement: "left",
  }
];

// Custom Tooltip for Aurora Design
function CustomTooltip({ index, step, size, primaryProps, skipProps, tooltipProps, isLastStep, closeProps }: TooltipRenderProps) {
  return (
    <div {...tooltipProps} className="glass-card-vivid p-5 w-80 max-w-[90vw] animate-fade-in z-50 shadow-2xl relative">
      <button {...closeProps} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-violet-300 font-bold m-0">
          Step {index + 1} of {size}
        </p>
      </div>
      
      <h3 className="text-white font-medium text-sm leading-relaxed mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        {step.content as React.ReactNode}
      </h3>

      <div className="flex items-center justify-between">
        {!isLastStep && index > 0 ? (
          <button {...skipProps} className="text-xs font-medium text-white/40 hover:text-white transition-colors">
            Skip tour
          </button>
        ) : (
          <div />
        )}
        <button {...primaryProps} className="btn-primary py-1.5 px-4 text-sm" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", borderRadius: "99px" }}>
          {isLastStep ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}

export function OnboardingTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the tour
    const hasSeenTour = localStorage.getItem("authhub_onboarding_completed");
    
    // We delay slightly to allow the dashboard to render fully and animations to settle
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("authhub_onboarding_completed", "true");
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      disableOverlayClose
      floaterProps={{
        disableAnimation: true,
      }}
      styles={{
        options: {
          zIndex: 10000,
        },
        overlay: {
          backgroundColor: "rgba(7, 7, 16, 0.75)",
          backdropFilter: "blur(4px)",
        }
      }}
    />
  );
}
