
import React from 'react';

interface StatsBoardProps {
  blockedCount: number;
}

const StatsBoard: React.FC<StatsBoardProps> = ({ blockedCount }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard label="ЗАБЛОКИРОВАНО" value={blockedCount.toString()} color="text-red-500" />
      <StatCard label="В ОЧЕРЕДИ" value="4,206" color="text-yellow-500" />
      <StatCard label="УРОВЕНЬ СВОБОДЫ" value="0.04%" color="text-green-500" />
      <StatCard label="ГОС. БЮДЖЕТ" value="∞" color="text-blue-500" />
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="bg-gray-900 border border-gray-800 p-4 rounded shadow-inner flex flex-col items-center justify-center">
    <span className="text-[10px] text-gray-500 font-bold mb-1">{label}</span>
    <span className={`text-xl md:text-2xl font-black ${color}`}>{value}</span>
  </div>
);

export default StatsBoard;
