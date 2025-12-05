import React, { useEffect, useRef } from 'react';

interface StarFieldProps {
  isFlying: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  angle: number;
}

const StarField: React.FC<StarFieldProps> = ({ isFlying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = 150;

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.5 + 0.1,
          angle: Math.random() * Math.PI * 2,
        });
      }
    };

    initParticles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = 'white';
        ctx.shadowBlur = particle.size * 2;
        ctx.fill();
        ctx.restore();

        if (isFlying) {
          // When flying, particles move toward bottom left with some variation
          const targetX = canvas.width * 0.2; // Bottom left area
          const targetY = canvas.height * 0.8;

          const dx = targetX - particle.x;
          const dy = targetY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 5) {
            // Move toward target with some randomness
            const moveSpeed = particle.speed * 2;
            particle.x += (dx / distance) * moveSpeed + (Math.random() - 0.5) * 0.5;
            particle.y += (dy / distance) * moveSpeed + (Math.random() - 0.5) * 0.5;

            // Increase opacity and speed as they move
            particle.opacity = Math.min(particle.opacity + 0.005, 1);
            particle.speed += 0.01;
          } else {
            // Reset particle when it reaches the target area
            particle.x = Math.random() * canvas.width;
            particle.y = Math.random() * canvas.height;
            particle.speed = Math.random() * 0.5 + 0.1;
            particle.opacity = Math.random() * 0.8 + 0.2;
          }
        } else {
          // Static movement when not flying - gentle floating
          particle.x += Math.cos(particle.angle) * particle.speed * 0.1;
          particle.y += Math.sin(particle.angle) * particle.speed * 0.1;

          // Wrap around screen edges
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;

          // Subtle opacity pulsing
          particle.opacity += Math.sin(Date.now() * 0.001 + index) * 0.005;
          particle.opacity = Math.max(0.1, Math.min(0.9, particle.opacity));
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isFlying]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};

export default StarField;