import React, { useState } from 'react';
import { HeartPulse, Dumbbell, Flame, GlassWater, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MenuItem } from '../../types';
import { FoodCard } from './FoodCard';

interface NutritionTabProps {
  userName?: string;
  caloriesConsumed?: number;
  caloriesGoal?: number;
  proteinConsumed?: number;
  proteinGoal?: number;
  waterConsumed?: number;
  waterGoal?: number;
  healthScore?: number;
  menuItems?: MenuItem[];
  onAddCart?: (item: MenuItem) => void;
  onFavorite?: (item: MenuItem) => void;
  favoritedIds?: Set<string>;
  setIsLxAiOpen?: (v: boolean) => void;
}

export const NutritionTab: React.FC<NutritionTabProps> = ({
  caloriesConsumed = 1480,
  caloriesGoal = 2200,
  proteinConsumed = 88,
  proteinGoal = 120,
  waterConsumed = 6,
  waterGoal = 8,
  healthScore = 88,
  menuItems = [],
  onAddCart = () => {},
  onFavorite = () => {},
  favoritedIds = new Set(),
  setIsLxAiOpen = () => {}
}) => {
  const [waterGlasses, setWaterGlasses] = useState(waterConsumed);

  const caloriePct = Math.min(100, Math.round((caloriesConsumed / caloriesGoal) * 100));
  const proteinPct = Math.min(100, Math.round((proteinConsumed / proteinGoal) * 100));

  const displayItems = [...menuItems].slice(0, 10); // Today's campus menu

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="p-4 max-w-7xl mx-auto">
        {/* ── AiNutritionTracker ────────────────────────────────────────── */}
        <div className="w-full my-6 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center font-bold">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">AI Nutrition Tracker</h3>
                <p className="text-xs text-slate-300">Monitored by LX AI Student Wellness</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold">
                Health Score: {healthScore}/100
              </span>
            </div>
          </div>

          {/* Calories & Macro Rings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            
            {/* Calories Progress Card */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Calories Today
                </span>
                <span className="font-bold text-amber-300">{caloriesConsumed} / {caloriesGoal} kcal</span>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2.5 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${caloriePct}%` }}
                ></div>
              </div>
            </div>

            {/* Protein Target */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  Protein Target
                </span>
                <span className="font-bold text-emerald-300">{proteinConsumed} / {proteinGoal}g</span>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2.5 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${proteinPct}%` }}
                ></div>
              </div>
            </div>

            {/* Water Glasses Logger */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                  <GlassWater className="w-4 h-4 text-cyan-300" />
                  Water Intake
                </p>
                <p className="text-sm font-extrabold text-white mt-1">
                  {waterGlasses} / {waterGoal} Glasses
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                  className="w-7 h-7 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center font-bold text-xs"
                >
                  -
                </button>
                <button
                  onClick={() => setWaterGlasses(waterGlasses + 1)}
                  className="w-7 h-7 bg-cyan-500 text-slate-900 hover:bg-cyan-400 rounded-xl flex items-center justify-center font-bold text-xs shadow-md"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* LX AI Smart Insight Callout */}
          <div className="bg-gradient-to-r from-blue-600/30 to-cyan-500/30 border border-cyan-400/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-cyan-300 shrink-0" />
              <p className="text-xs text-slate-200">
                <strong className="text-white">LX AI Insight:</strong> You need 32g more protein to hit today's study energy goal. Consider ordering the Grilled Moroccan Chicken Bowl for dinner.
              </p>
            </div>

            <button
              onClick={() => setIsLxAiOpen(true)}
              className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:bg-cyan-400 transition-all shrink-0"
            >
              Ask LX AI
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── FoodMenuGrid (Today's Campus Menu) ────────────────────── */}
        <div className="w-full my-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Today's Campus Menu</h3>
              <p className="text-xs text-slate-500">
                Showing {displayItems.length} fresh items ready for express pickup
              </p>
            </div>
          </div>

          {displayItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayItems.map(item => (
                <FoodCard
                  key={item.id}
                  item={item}
                  onAdd={onAddCart}
                  onFavorite={onFavorite}
                  isFavorited={favoritedIds.has(item.id)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
