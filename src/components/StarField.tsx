import React, { useEffect, useRef } from 'react';

interface StarFieldProps {
  isFlying: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  baseSpeed: number;
  angle: number;
  color: string;
  isGolden: boolean;
}

const StarField: React.FC<StarFieldProps> = ({ isFlying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const flyingStartTimeRef = useRef<number | null>(null);

  // Handle flying state changes
  useEffect(() => {
    if (isFlying && !flyingStartTimeRef.current) {
      // Start flying - record the timestamp
      flyingStartTimeRef.current = Date.now();
    } else if (!isFlying) {
      // Stop flying - reset timestamp
      flyingStartTimeRef.current = null;
    }
  }, [isFlying]);

  // Calculate rotation angle based on time elapsed since flying started
  const getRotationAngle = () => {
    if (!isFlying || !flyingStartTimeRef.current) return 135;

    const elapsed = Date.now() - flyingStartTimeRef.current;
    // Match the time it takes to reach 5x multiplier (approximately 42.5 seconds)
    const duration = 42500; // 42.5 seconds in milliseconds
    const progress = Math.min(elapsed / duration, 1);

    // Go from 135° (top-right to bottom-left) to 90° (straight down) over the duration
    // This matches the rocket rotation from 45° to 0°
    return 135 - (45 * progress);
  };

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
      const particleCount = 50;

      for (let i = 0; i < particleCount; i++) {
        // Create more small stars (75%) and fewer big stars (25%)
        const isBigStar = Math.random() < 0.25;
        const isGolden = Math.random() < 0.08;
        const size = isBigStar
          ? Math.random() * 1.2 + 1.8
          : Math.random() * 0.8 + 0.4 + (isGolden ? 0.4 : 0);
        // Small stars move much faster than big ones
        const baseSpeed = isBigStar ? Math.random() * 2.0 + 1.0 : Math.random() * 4.0 + 3.0;

        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: size,
          opacity: Math.random() * 0.8 + 0.2,
          baseSpeed: baseSpeed,
          angle: Math.random() * Math.PI * 2,
          color: isGolden ? '#ffde8a' : 'white',
          isGolden,
        });
      }
    };

    initParticles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawTrail = (particle: Particle, vx: number, vy: number, alpha: number) => {
        const mag = Math.sqrt(vx * vx + vy * vy) || 1;
        const nx = vx / mag;
        const ny = vy / mag;
        const length = particle.isGolden ? 38 : 16;
        const tailX = particle.x - nx * length;
        const tailY = particle.y - ny * length;
        const startOpacity = particle.isGolden ? 0.95 : 0.55;
        const endOpacity = 0;
        const grad = ctx.createLinearGradient(particle.x, particle.y, tailX, tailY);
        grad.addColorStop(
          0,
          particle.isGolden
            ? `rgba(255, 222, 138, ${Math.min(1, startOpacity * alpha)})`
            : `rgba(255, 255, 255, ${Math.min(1, startOpacity * alpha)})`
        );
        grad.addColorStop(
          1,
          particle.isGolden
            ? `rgba(255, 222, 138, ${endOpacity})`
            : `rgba(255, 255, 255, ${endOpacity})`
        );

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = grad;
        ctx.lineWidth = particle.size * (particle.isGolden ? 1.4 : 1);
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.restore();
      };

      particlesRef.current.forEach((particle, index) => {
        const twinkle = particle.isGolden
          ? (Math.sin(Date.now() * 0.0075 + index) + 1) * 0.25 + 0.85
          : 1;
        const hdrBoost = particle.isGolden ? 1.4 : 1;
        const alpha = Math.min(1, particle.opacity * twinkle * hdrBoost);
        let vx = 0;
        let vy = 0;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.isGolden ? particle.size * 8 : particle.size * 2.5;
        ctx.fill();
        ctx.restore();

        if (isFlying) {
          // Treadmill effect: stars move based on time-based rotation angle
          // Creating the illusion of forward movement through space
          
          // Calculate speed multiplier that increases over time
          const elapsed = flyingStartTimeRef.current ? Date.now() - flyingStartTimeRef.current : 0;
          const duration = 42500; // Match the rotation duration
          const progress = Math.min(elapsed / duration, 1);
          // Speed increases from 1x to 3x over the duration
          const speedMultiplier = 1 + (progress * 2);
          
          const moveSpeed = particle.baseSpeed * 2.5 * speedMultiplier;

          // Get current rotation angle based on time elapsed
          const currentAngle = getRotationAngle();

          // Convert rotation angle from degrees to radians
          // Angle goes from 135° (top-right to bottom-left) to 90° (straight down)
          const angleRad = currentAngle * Math.PI / 180;

          vx = Math.cos(angleRad) * moveSpeed;
          vy = Math.sin(angleRad) * moveSpeed;
          const speedMag = Math.hypot(vx, vy);
          if (speedMag > 0.5) {
            drawTrail(particle, vx, vy, alpha);
          }
          particle.x += vx;
          particle.y += vy;
          
          // Wrap around screen edges - create continuous treadmill effect
          // When stars exit one side, they reappear on the opposite side
          if (particle.x < -150) {
            particle.x = canvas.width + 150;
            particle.y = Math.random() * canvas.height;
            particle.opacity = Math.random() * 0.5 + 0.2;
          }
          if (particle.x > canvas.width + 150) {
            particle.x = -150;
            particle.y = Math.random() * canvas.height;
            particle.opacity = Math.random() * 0.5 + 0.2;
          }
          if (particle.y < -150) {
            particle.y = canvas.height + 150;
            particle.x = Math.random() * canvas.width;
            particle.opacity = Math.random() * 0.5 + 0.2;
          }
          if (particle.y > canvas.height + 150) {
            particle.y = -150;
            particle.x = Math.random() * canvas.width;
            particle.opacity = Math.random() * 0.5 + 0.2;
          }
        } else {
          // Static movement when not flying - gentle floating
          vx = Math.cos(particle.angle) * particle.baseSpeed * 0.1;
          vy = Math.sin(particle.angle) * particle.baseSpeed * 0.1;
          particle.x += vx;
          particle.y += vy;

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