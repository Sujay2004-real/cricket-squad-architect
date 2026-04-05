import React, { useEffect, useState, useCallback } from 'react';

export interface TutorialStepDef {
  title: string;
  message: string;
  tip?: string;
  hasNext: boolean; // true = show "Next" button; false = waiting for user game action
}

export const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    title: 'Welcome to the Draft! 🏏',
    message:
      "You're in a live cricket auction against 9 AI teams. Each round you pick a slab and a secret number to compete for players. Let's walk through it — live!",
    tip: 'The server resolves all picks simultaneously, so strategy is everything.',
    hasNext: true,
  },
  {
    title: 'Your Draft Pool 📋',
    message:
      'The left panel shows every available player split into Gold 🥇, Silver 🥈, and Bronze 🥉 slabs. Crossed-out names have already been sold.',
    tip: 'Gold = world-class stars. Bronze = hidden gems. Balance your squad!',
    hasNext: true,
  },
  {
    title: 'Choose a Slab 🎯',
    message:
      'Select which slab you want to target this round. You can only win one player per round — from whichever slab you choose.',
    tip: 'Everyone competes for Gold. Sometimes Bronze is the smarter play.',
    hasNext: true,
  },
  {
    title: 'Your Secret Number 🔢',
    message:
      'Enter a number from 1 to 20. The server rolls a random number — the team closest to it gets first priority. Match it exactly and you get the player for FREE!',
    tip: "No one can see your number. It's pure mind-game strategy.",
    hasNext: true,
  },
  {
    title: 'Transmit Your Pick! 📡',
    message:
      "When you're happy with your slab and number, hit Transmit. All teams submit simultaneously, then the server instantly resolves the auction.",
    tip: "You can't change your pick after transmitting — commit with confidence.",
    hasNext: false, // must actually click Transmit
  },
  {
    title: 'Auction Phase ⚖️',
    message:
      "The server resolved picks! You're on the priority list. Accept the player for free, or Reject them. Warning: Reject twice in a row and you'll trigger a Forced Pick!",
    tip: 'Check the Terminal on the right to see the full priority order.',
    hasNext: false, // must act in auction
  },
  {
    title: 'Challenge Phase 🔥',
    message:
      "An opponent accepted a player before you. Place a challenge bid to steal them! If they match your bid they keep the player — if they reject it, the player is yours.",
    tip: 'Only challenge if that player truly fits your squad. Protect your purse!',
    hasNext: false, // must bid or pass
  },
  {
    title: "You're a Pro Now! 🎉",
    message:
      "Tutorial complete! You know the slab system, priority numbers, auction resolution, the challenge mechanic, and the forced pick rule. Go build a champion squad!",
    tip: undefined,
    hasNext: false, // finish button shown instead
  },
];

const TOTAL = TUTORIAL_STEPS.length;

interface TutorialOverlayProps {
  step: number;
  isActive: boolean;
  targetRef?: React.RefObject<HTMLElement | null>;
  onNext: () => void;
  onSkip: () => void;
  onFinish: () => void;
  neverShowAgain: boolean;
  onNeverShowAgainChange: (val: boolean) => void;
}

const PADDING = 14;

export default function TutorialOverlay({
  step,
  isActive,
  targetRef,
  onNext,
  onSkip,
  onFinish,
  neverShowAgain,
  onNeverShowAgainChange,
}: TutorialOverlayProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const current = TUTORIAL_STEPS[step];
  const isLastStep = step === TOTAL - 1;

  const updateRect = useCallback(() => {
    if (targetRef?.current) {
      setRect(targetRef.current.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [targetRef]);

  useEffect(() => {
    if (!isActive) return;
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isActive, updateRect, step]);

  if (!isActive || !current) return null;

  return (
    <>
      {/* ── Dark Backdrop ── */}
      <div className="fixed inset-0 z-[9990] pointer-events-none bg-slate-950/80 backdrop-blur-sm" />

      {/* ── Spotlight cutout (only when a target exists) ── */}
      {rect && (
        <div
          className="fixed z-[9991] rounded-xl pointer-events-none"
          style={{
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
            boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.85)',
            border: '2px solid rgba(251, 191, 36, 0.9)',
            animation: 'tutorialSpotlight 2s ease-in-out infinite',
          }}
        />
      )}

      {/* ── Coach Card ── */}
      <div
        className="fixed bottom-6 right-6 z-[9999] w-[380px] coach-card-enter"
        style={{ maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto' }}
      >
        <div className="bg-slate-900/98 backdrop-blur-2xl border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600/20 to-orange-500/10 px-5 py-4 border-b border-amber-500/20 flex items-start gap-3">
            <div className="text-3xl leading-none mt-0.5">🏏</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-0.5">
                Coach&apos;s Playbook
              </p>
              <h3 className="font-extrabold text-white text-base leading-snug">
                {current.title}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap mt-1">
              {step + 1}/{TOTAL}
            </span>
          </div>

          {/* Body */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-slate-200 text-sm leading-relaxed">
              {current.message}
            </p>
            {current.tip && (
              <div className="mt-3 bg-blue-900/30 border border-blue-500/30 rounded-lg px-3 py-2.5 flex gap-2 items-start">
                <span className="text-blue-400 text-sm flex-shrink-0">💡</span>
                <p className="text-blue-200 text-xs leading-relaxed">
                  {current.tip}
                </p>
              </div>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 py-3">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-6 bg-amber-400'
                    : i < step
                    ? 'w-2 bg-amber-600/50'
                    : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5">
            {/* Waiting indicator when no Next button */}
            {!current.hasNext && !isLastStep && (
              <div className="flex items-center gap-2 mb-3 text-xs text-slate-400 italic">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                Waiting for your move in the game above…
              </div>
            )}

            {isLastStep ? (
              <>
                <label className="flex items-center gap-2 mb-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={neverShowAgain}
                    onChange={(e) => onNeverShowAgainChange(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                    Don&apos;t show this tutorial again
                  </span>
                </label>
                <button
                  onClick={onFinish}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-extrabold py-3 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all uppercase tracking-wider text-sm hover:-translate-y-0.5"
                >
                  🚀 Let&apos;s Play!
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={onSkip}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all font-bold uppercase tracking-wider flex-shrink-0"
                >
                  Skip
                </button>
                {current.hasNext && (
                  <button
                    onClick={onNext}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  >
                    Next <span className="text-base leading-none">→</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
