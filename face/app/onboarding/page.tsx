"use client";
import { useRouter } from "next/navigation";
import { useTelemetry } from "@/lib/context/TelemetryContext";
import WizardShell from "@/components/onboarding/WizardShell";
import StepAge from "@/components/onboarding/StepAge";
import StepSex from "@/components/onboarding/StepSex";
import StepMeasurements from "@/components/onboarding/StepMeasurements";
import StepSkinType from "@/components/onboarding/StepSkinType";

const STEPS = [
  { title: "How old are you?", subtitle: "Scores are calibrated to your age — facial proportions change over time." },
  { title: "What's your sex?", subtitle: "Male and female faces have different ideal proportions. This sets the right reference." },
  { title: "Height & weight", subtitle: "Helps put your facial proportions in context with your overall build." },
  { title: "What's your skin like?", subtitle: "Unlocks a personalized skincare routine matched to your skin type and age." },
];

const STEP_COMPONENTS = [<StepAge key="age" />, <StepSex key="sex" />, <StepMeasurements key="meas" />, <StepSkinType key="skin" />];

function isStepValid(step: number, state: ReturnType<typeof useTelemetry>["state"]): boolean {
  if (step === 0) return state.age !== null && state.age >= 13 && state.age <= 120;
  if (step === 1) return state.sex !== null;
  if (step === 2) return state.heightCm !== null && state.weightKg !== null && state.heightCm > 0 && state.weightKg > 0;
  if (step === 3) return state.skinType !== null;
  return false;
}

export default function OnboardingPage() {
  const { state, dispatch } = useTelemetry();
  const router = useRouter();
  const step = state.step;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      dispatch({ type: "NEXT_STEP" });
    } else {
      router.push("/scan");
    }
  };

  const handleBack = step > 0 ? () => dispatch({ type: "PREV_STEP" }) : undefined;

  return (
    <WizardShell
      step={step}
      totalSteps={STEPS.length}
      title={STEPS[step].title}
      subtitle={STEPS[step].subtitle}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={step === STEPS.length - 1 ? "Begin Scan →" : "Continue"}
      nextDisabled={!isStepValid(step, state)}
    >
      {STEP_COMPONENTS[step]}
    </WizardShell>
  );
}
