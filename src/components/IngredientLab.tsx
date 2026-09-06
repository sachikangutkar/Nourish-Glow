import React, { useState } from "react";
import { 
  FlaskConical, 
  Check, 
  AlertOctagon, 
  HelpCircle, 
  Award, 
  BookOpen, 
  Shuffle, 
  HeartCrack,
  Info
} from "lucide-react";
import { INGREDIENTS_DATABASE, getIngredientCompatibility } from "../data/skincareData";

export default function IngredientLab() {
  const [ing1, setIng1] = useState<string>("Retinol / Retinoids");
  const [ing2, setIng2] = useState<string>("Vitamin C (L-Ascorbic Acid)");

  const compResult = getIngredientCompatibility(ing1, ing2);

  // Get active selected ingredient objects for detailed cards
  const active1 = INGREDIENTS_DATABASE.find(i => i.name === ing1);
  const active2 = INGREDIENTS_DATABASE.find(i => i.name === ing2);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div>
        <h2 className="text-2xl font-serif font-medium tracking-tight text-natural-text-primary">
          Molecular Skincare Lab & Science
        </h2>
        <p className="text-sm text-natural-text-secondary mt-1">
          Demystify complex active molecules, understand skin biochemistry, and check layered ingredient compatibility.
        </p>
      </div>

      {/* COMPATIBILITY CHECKER SECTION */}
      <div className="border border-natural-border bg-natural-white p-6 md:p-8 rounded-3xl shadow-3xs">
        <div className="flex items-center gap-2 text-natural-sage mb-6">
          <FlaskConical className="h-5 w-5" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">Interactive Layering Compatibility Matrix</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Pickers (Column 1) */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-bold text-natural-text-secondary/60 uppercase mb-2">First Molecular Agent</label>
              <select
                value={ing1}
                onChange={(e) => setIng1(e.target.value)}
                className="w-full text-xs p-3.5 bg-natural-card border border-natural-border rounded-xl font-semibold text-natural-text-secondary focus:outline-none focus:border-natural-sage cursor-pointer"
              >
                {INGREDIENTS_DATABASE.map(i => (
                  <option key={i.name} value={i.name}>{i.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-full bg-natural-card flex items-center justify-center border border-natural-border text-natural-text-secondary">
                <Shuffle className="h-4 w-4" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-natural-text-secondary/60 uppercase mb-2">Second Molecular Agent</label>
              <select
                value={ing2}
                onChange={(e) => setIng2(e.target.value)}
                className="w-full text-xs p-3.5 bg-natural-card border border-natural-border rounded-xl font-semibold text-natural-text-secondary focus:outline-none focus:border-natural-sage cursor-pointer"
              >
                {INGREDIENTS_DATABASE.map(i => (
                  <option key={i.name} value={i.name}>{i.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Visual Display (Column 2 & 3) */}
          <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-natural-border pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-center h-full">
            <div className={`p-6 rounded-2xl border ${
              compResult.compatible 
                ? compResult.severity === "none" 
                  ? "bg-emerald-50/40 border-emerald-150 text-emerald-950" 
                  : "bg-amber-50/40 border-amber-150 text-amber-950"
                : "bg-natural-terracotta/5 border-natural-terracotta/15 text-natural-terracotta"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 shadow-3xs ${
                  compResult.compatible 
                    ? compResult.severity === "none" 
                      ? "bg-emerald-100/80 text-emerald-600" 
                      : "bg-amber-100/80 text-amber-600"
                    : "bg-natural-terracotta/10 text-natural-terracotta"
                }`}>
                  {compResult.compatible ? (
                    compResult.severity === "none" ? <Check className="h-6 w-6" /> : <Info className="h-5 w-5" />
                  ) : (
                    <AlertOctagon className="h-6 w-6" />
                  )}
                </div>

                <div className="space-y-2">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                    compResult.compatible 
                      ? compResult.severity === "none" 
                        ? "bg-emerald-100 text-emerald-850" 
                        : "bg-amber-100 text-amber-850"
                      : "bg-natural-terracotta/10 text-natural-terracotta"
                  }`}>
                    {compResult.compatible ? (compResult.severity === "none" ? "SAFE SYNERGY" : "USE CAUTION") : "HIGH RISK COMBINATION"}
                  </span>
                  
                  <h4 className="text-base font-serif font-medium tracking-tight">{compResult.title}</h4>
                  <p className="text-xs leading-relaxed font-normal opacity-90">{compResult.verdict}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOLECULES DIRECTORY / GLOSSARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ingredient Card 1 */}
        {active1 && (
          <div className="border border-natural-border bg-natural-white p-6 rounded-3xl shadow-3xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono bg-natural-sage-light text-natural-sage border border-natural-sage/15 font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {active1.tier}
                </span>
                <span className="text-xs text-natural-text-secondary/60 font-mono">{active1.category}</span>
              </div>
              <h3 className="text-lg font-serif font-medium text-natural-text-primary mt-3">{active1.name}</h3>
              <p className="text-xs text-natural-text-secondary mt-2 font-normal leading-relaxed">
                {active1.description}
              </p>

              {/* Benefits */}
              <div className="mt-5">
                <p className="text-[10px] font-mono font-bold text-natural-text-secondary/50 uppercase tracking-wider mb-2.5">Biological Skin Benefits</p>
                <ul className="space-y-2 text-xs text-natural-text-secondary">
                  {active1.benefits.map((b, idx) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="text-natural-sage font-bold">•</span>
                      <p className="font-normal leading-relaxed">{b}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Target skin types */}
            <div className="mt-6 pt-4 border-t border-natural-border">
              <span className="text-[9px] font-mono text-natural-text-secondary/50 uppercase">Target skin types</span>
              <div className="flex gap-1.5 mt-1.5">
                {active1.skinTypes.map(st => (
                  <span key={st} className="bg-natural-card text-natural-text-secondary border border-natural-border font-mono text-[9px] px-2.5 py-0.5 rounded-full font-bold">
                    {st}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ingredient Card 2 */}
        {active2 && (
          <div className="border border-natural-border bg-natural-white p-6 rounded-3xl shadow-3xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono bg-natural-sage-light text-natural-sage border border-natural-sage/15 font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {active2.tier}
                </span>
                <span className="text-xs text-natural-text-secondary/60 font-mono">{active2.category}</span>
              </div>
              <h3 className="text-lg font-serif font-medium text-natural-text-primary mt-3">{active2.name}</h3>
              <p className="text-xs text-natural-text-secondary mt-2 font-normal leading-relaxed">
                {active2.description}
              </p>

              {/* Benefits */}
              <div className="mt-5">
                <p className="text-[10px] font-mono font-bold text-natural-text-secondary/50 uppercase tracking-wider mb-2.5">Biological Skin Benefits</p>
                <ul className="space-y-2 text-xs text-natural-text-secondary">
                  {active2.benefits.map((b, idx) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="text-natural-sage font-bold">•</span>
                      <p className="font-normal leading-relaxed">{b}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Target skin types */}
            <div className="mt-6 pt-4 border-t border-natural-border">
              <span className="text-[9px] font-mono text-natural-text-secondary/50 uppercase">Target skin types</span>
              <div className="flex gap-1.5 mt-1.5">
                {active2.skinTypes.map(st => (
                  <span key={st} className="bg-natural-card text-natural-text-secondary border border-natural-border font-mono text-[9px] px-2.5 py-0.5 rounded-full font-bold">
                    {st}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
