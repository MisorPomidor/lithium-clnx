import React, { useMemo } from 'react';

interface Particle {
  id: number;
  left: string;
  initialTop: string;
  delay: string;
  duration: string;
}

const ParticleBackground: React.FC = () => {
  // Generate stable particle positions on mount
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      // Start particles at random positions across the full viewport height
      initialTop: `${Math.random() * 100}%`,
      // Stagger animation delays so particles don't all start at same position
      delay: `${-Math.random() * 20}s`, // Negative delay to start mid-animation
      duration: `${15 + Math.random() * 10}s`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/50 to-background" />
      
      {/* Animated particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-primary/30 rounded-full animate-particle"
          style={{
            left: particle.left,
            top: particle.initialTop,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
};

export default ParticleBackground;
