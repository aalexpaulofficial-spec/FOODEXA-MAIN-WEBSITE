import React, { useMemo } from 'react';
import { Activity, Brain, Droplets, Flame } from 'lucide-react';

interface NutritionTabProps {
  // Future: accept real data from DB
  caloriesConsumed?: number;
  caloriesGoal?: number;
  proteinConsumed?: number;
  proteinGoal?: number;
  carbsConsumed?: number;
  carbsGoal?: number;
  waterConsumed?: number;
  waterGoal?: number;
  healthScore?: number;
  userName?: string;
}

interface ProgressBarProps {
  label: string;
  icon: React.ReactNode;
  current: number;
  goal: number;
  unit: string;
  color: string;
  glowColor: string;
}

const NutritionBar: React.FC<ProgressBarProps> = ({
  label,
  icon,
  current,
  goal,
  unit,
  color,
  glowColor,
}) => {
  const pct = Math.min(100, Math.round((current / goal) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${color} bg-opacity-20 flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-white">{current}</span>
          <span className="text-[10px] text-slate-400 ml-1">/ {goal} {unit}</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{
            width: `${pct}%`,
            boxShadow: pct > 0 ? `0 0 8px ${glowColor}` : 'none',
          }}
        />
      </div>
      <p className="text-[10px] text-slate-500 text-right">{pct}% of daily goal</p>
    </div>
  );
};

export const NutritionTab: React.FC<NutritionTabProps> = ({
  caloriesConsumed = 1240,
  caloriesGoal = 2200,
  proteinConsumed = 45,
  proteinGoal = 80,
  carbsConsumed = 160,
  carbsGoal = 280,
  waterConsumed = 1.4,
  waterGoal = 2.5,
  healthScore = 72,
  userName,
}) => {
  const healthLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Fair';
  const healthColor = healthScore >= 80 ? 'text-emerald-400' : healthScore >= 60 ? 'text-blue-400' : 'text-amber-400';

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="p-4 space-y-5 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Nutrition Tracker</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Powered by LX AI · {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          {/* Health Score badge */}
          <div className="flex flex-col items-center bg-gradient-to-br from-[#1a1b3a] to-slate-800 rounded-2xl px-4 py-2.5 border border-blue-500/20 shadow-lg">
            <span className={`text-2xl font-black ${healthColor}`}>{healthScore}</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">{healthLabel}</span>
            <span className="text-[8px] text-slate-500">Health Score</span>
          </div>
        </div>

        {/* AI Nutrition Tracker Card — dark navy */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1b3a] via-[#1e2050] to-slate-900" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

          <div className="relative z-10 p-5 space-y-6">
            {/* Tracker Header */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-blue-400 w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">AI Nutrition Tracker</h3>
                <p className="text-[10px] text-slate-400">Daily intake based on your orders</p>
              </div>
            </div>

            {/* Nutrition bars */}
            <div className="space-y-5">
              <NutritionBar
                label="Calories"
                icon={<Flame className="w-4 h-4 text-orange-400" />}
                current={caloriesConsumed}
                goal={caloriesGoal}
                unit="kcal"
                color="bg-gradient-to-r from-orange-500 to-red-500"
                glowColor="rgba(249, 115, 22, 0.5)"
              />
              <NutritionBar
                label="Protein"
                icon={<Activity className="w-4 h-4 text-blue-400" />}
                current={proteinConsumed}
                goal={proteinGoal}
                unit="g"
                color="bg-gradient-to-r from-blue-500 to-cyan-500"
                glowColor="rgba(59, 130, 246, 0.5)"
              />
              <NutritionBar
                label="Carbohydrates"
                icon={<span className="text-xs">🌾</span>}
                current={carbsConsumed}
                goal={carbsGoal}
                unit="g"
                color="bg-gradient-to-r from-amber-500 to-yellow-400"
                glowColor="rgba(245, 158, 11, 0.5)"
              />
              <NutritionBar
                label="Water"
                icon={<Droplets className="w-4 h-4 text-cyan-400" />}
                current={waterConsumed}
                goal={waterGoal}
                unit="L"
                color="bg-gradient-to-r from-cyan-500 to-teal-400"
                glowColor="rgba(6, 182, 212, 0.5)"
              />
            </div>
          </div>
        </div>

        {/* Quick tips */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-500" /> LX AI Tips for Today
          </h3>
          <div className="space-y-2">
            {[
              { tip: 'Add a protein-rich item to reach your daily goal', icon: '💪' },
              { tip: 'You\'re 1.1L short of your water intake goal', icon: '💧' },
              { tip: 'Try a Breakfast item — you haven\'t had one yet today', icon: '🌅' },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100/80 px-3 py-2.5">
                <span className="text-sm shrink-0">{t.icon}</span>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{t.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder notice */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            🔬 Detailed nutrition data will appear here once menu items have calorie/macro data in the database.
          </p>
        </div>
      </div>
    </div>
  );
};
