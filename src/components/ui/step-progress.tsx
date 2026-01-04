import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export const StepProgress = ({ currentStep, totalSteps, stepLabels }: StepProgressProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
        
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          
          return (
            <div key={step} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step}
              </div>
              {stepLabels && stepLabels[i] && (
                <span 
                  className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[80px]",
                    (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {stepLabels[i]}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Percentage */}
      <div className="mt-6 text-center">
        <span className="text-sm text-muted-foreground">
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </span>
      </div>
    </div>
  );
};
