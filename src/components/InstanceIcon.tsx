import React from 'react';
import { Zap, Sparkles, Cpu, Flame, Layers, Box, Shield, Terminal, HardDrive, Gamepad2, Settings } from 'lucide-react';

interface InstanceIconProps {
  iconName: string;
  className?: string;
}

export const InstanceIcon: React.FC<InstanceIconProps> = ({ iconName, className = 'w-5 h-5 text-emerald-400' }) => {
  switch (iconName?.toLowerCase()) {
    case 'zap':
    case 'lite':
    case 'bolt':
      return <Zap className={className} />;
    case 'sparkles':
    case 'high':
    case 'stars':
      return <Sparkles className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'flame':
    case 'fire':
      return <Flame className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'box':
    case 'vanilla':
      return <Box className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'terminal':
      return <Terminal className={className} />;
    case 'harddrive':
      return <HardDrive className={className} />;
    case 'gamepad':
    case 'gamepad2':
      return <Gamepad2 className={className} />;
    default:
      if (iconName === 'high' || iconName?.includes('HIGH')) {
        return <Sparkles className={className} />;
      }
      return <Zap className={className} />;
  }
};
