"use client";
import { useRouter } from "next/navigation";
import { useTelemetry } from "@/lib/context/TelemetryContext";
import WizardShell from "@/components/onboarding/WizardShell";
import StepAge from "@/components/onboarding/StepAge";
import StepSex from "@/components/onboarding/StepSex";
import StepMeasurements from "@/components/onboarding/StepMeasurements";
import StepSkinType from "@/components/onboarding/StepSkinType";

const STEPS = [
  { title: "How old are you?", subtitle: "Age calibrates structural volume norms and scoring baselines." },
  { title: "Biological profile", subtitle: "Facial geometry is highly sex-dimorphic — this sets your reference model." },
  { title: "Body measurements", subtitle: "Contextualizes facial proportions within physical build." },
  { title: "Skin phenotype", subtitle: "Enables clinical-grade dermatological recommendations." },
];

const STEP_COMPONENTS = [<StepAge key="age" />, <StepSex key="sex" />, <StepMeasurements key="meas" />, <StepSkinType key="skin" />];

function isStepValid(step: number, state: ReturnType<typeof useTelemetry>["state"]): boolean {
  if (step === 0) return state.age !== null && state.age >= 13 && state.age <= 99;
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
