import React from 'react';
import { EngineScores } from '../../types';
import { Activity, Brain, Moon, Zap, AlertTriangle, ShieldCheck, Apple } from 'lucide-react';

interface EngineScoreCardProps {
  scores: EngineScores;
}

export function EngineScoreCard({ scores }: EngineScoreCardProps) {
  
  const renderScoreBar = (score: number, status: string, type: 'readiness' | 'recovery' | 'sleep' | 'psych' | 'nutrition') => {
    let color = 'bg-gray-200';
    
    if (type === 'readiness' || type === 'recovery' || type === 'sleep' || type === 'nutrition') {
      if (score >= 75) color = 'bg-green-500';
      else if (score >= 40) color = 'bg-yellow-500';
      else color = 'bg-red-500';
    } else if (type === 'psych') {
      // Inverted for psychological load (higher is worse)
      if (score <= 30) color = 'bg-green-500';
      else if (score <= 60) color = 'bg-yellow-500';
      else color = 'bg-red-500';
    }

    return (
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-2">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
    );
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Confiance Haute</span>;
    if (confidence >= 40) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Confiance Moyenne</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Confiance Faible</span>;
  };

  return (
    <div className="space-y-6">
      {/* Global Action Priority */}
      <div className={`p-4 rounded-xl border ${scores.riskBoundary.level !== 'none' ? 'bg-red-50 border-red-200' : 'bg-[#F2F2F7] border-transparent'}`}>
        <div className="flex items-start gap-3">
          {scores.riskBoundary.level !== 'none' ? (
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          ) : (
            <ShieldCheck className="text-[#5856D6] shrink-0 mt-0.5" size={20} />
          )}
          <div>
            <h3 className="font-semibold text-sm mb-1">Priorité d'Action Globale</h3>
            <p className={`text-sm ${scores.riskBoundary.level !== 'none' ? 'text-red-700 font-medium' : 'text-[#1D1D1F]'}`}>
              {scores.globalActionPriority}
            </p>
          </div>
        </div>
      </div>

      {/* Red Flags */}
      {scores.riskBoundary.flags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider">Signaux de Vigilance</h4>
          <ul className="space-y-1">
            {scores.riskBoundary.flags.map((flag, idx) => (
              <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* The 5 Core Domains */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance Readiness */}
        <div className="bento-card p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#FF9500]" />
              <span className="font-semibold text-sm">Performance Readiness</span>
            </div>
            {getConfidenceBadge(scores.performanceReadiness.confidence)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{scores.performanceReadiness.score}</span>
            <span className="text-xs text-muted-foreground uppercase">{scores.performanceReadiness.status.replace('_', ' ')}</span>
          </div>
          {renderScoreBar(scores.performanceReadiness.score, scores.performanceReadiness.status, 'readiness')}
        </div>

        {/* Recovery Status */}
        <div className="bento-card p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#34C759]" />
              <span className="font-semibold text-sm">Recovery Status</span>
            </div>
            {getConfidenceBadge(scores.recoveryStatus.confidence)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{scores.recoveryStatus.score}</span>
            <span className="text-xs text-muted-foreground uppercase">{scores.recoveryStatus.status.replace('_', ' ')}</span>
          </div>
          {renderScoreBar(scores.recoveryStatus.score, scores.recoveryStatus.status, 'recovery')}
        </div>

        {/* Sleep Health */}
        <div className="bento-card p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <Moon size={16} className="text-[#5856D6]" />
              <span className="font-semibold text-sm">Sleep Health</span>
            </div>
            {getConfidenceBadge(scores.sleepHealth.confidence)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{scores.sleepHealth.score}</span>
            <span className="text-xs text-muted-foreground uppercase">{scores.sleepHealth.status.replace('_', ' ')}</span>
          </div>
          {renderScoreBar(scores.sleepHealth.score, scores.sleepHealth.status, 'sleep')}
        </div>

        {/* Psychological Load */}
        <div className="bento-card p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-[#AF52DE]" />
              <span className="font-semibold text-sm">Psychological Load</span>
            </div>
            {getConfidenceBadge(scores.psychologicalLoad.confidence)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{scores.psychologicalLoad.score}</span>
            <span className="text-xs text-muted-foreground uppercase">{scores.psychologicalLoad.status.replace('_', ' ')}</span>
          </div>
          {renderScoreBar(scores.psychologicalLoad.score, scores.psychologicalLoad.status, 'psych')}
        </div>
      </div>
    </div>
  );
}
