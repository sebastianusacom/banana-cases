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
  pulseSpeed: number;
}

interface ShootingStar {
  id: number;
  x: number;
  y: number;
  len: number;
  speed: number;
  angle: number; // in radians
  opacity: number;
  active: boolean;
}

const StarField: React.FC<StarFieldProps> = ({ isFlying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const animationRef = useRef<number | null>(null);
  const flyingStartTimeRef = useRef<number | null>(null);
  const FLIGHT_DURATION_MS = 16000;

  // Handle flying state changes
  useEffect(() => {
    if (isFlying && !flyingStartTimeRef.current) {
      flyingStartTimeRef.current = Date.now();
    } else if (!isFlying) {
      flyingStartTimeRef.current = null;
    }
  }, [isFlying]);

  const getRotationAngle = () => {
    if (!isFlying || !flyingStartTimeRef.current) return 135;
    const elapsed = Date.now() - flyingStartTimeRef.current;
    
    // Once we pass the "duration", lock it to max progress (1)
    // which results in exactly 90 degrees.
    const progress = Math.min(elapsed / FLIGHT_DURATION_MS, 1);
    
    // 135 - (45 * 1) = 90
    return 135 - (45 * progress);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = 70; // Slightly increased standard star count since dust is gone

      const colors = ['#ffffff', '#ffe9c4', '#d4fbff']; // White, Warm, Cool

      // Create Stars
      for (let i = 0; i < particleCount; i++) {
        const isBigStar = Math.random() < 0.2;
        const isGolden = Math.random() < 0.05;
        const size = isBigStar
          ? Math.random() * 1.5 + 2.0
          : Math.random() * 0.8 + 0.5 + (isGolden ? 0.4 : 0);
        const baseSpeed = isBigStar ? Math.random() * 1.5 + 0.8 : Math.random() * 3.5 + 2.5;
        
        const baseColor = isGolden ? '#ffde8a' : colors[Math.floor(Math.random() * colors.length)];

        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: size,
          opacity: Math.random() * 0.8 + 0.2,
          baseSpeed: baseSpeed,
          angle: Math.random() * Math.PI * 2,
          color: baseColor,
          isGolden,
          pulseSpeed: Math.random() * 0.02 + 0.005,
        });
      }
    };

    initParticles();

    // Shooting star helper
    const createShootingStar = (): ShootingStar => {
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * (canvas.height / 2); 
      const angle = 135 * (Math.PI / 180); 
      return {
        id: Date.now() + Math.random(),
        x: startX,
        y: startY,
        len: Math.random() * 80 + 100,
        speed: Math.random() * 10 + 15,
        angle: angle,
        opacity: 1,
        active: true
      };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // -- Calculate Flight Metrics --
      const elapsed = isFlying && flyingStartTimeRef.current ? Date.now() - flyingStartTimeRef.current : 0;
      
      const speedElapsed = Math.min(elapsed, FLIGHT_DURATION_MS * 1.5);
      const speedProgress = speedElapsed / FLIGHT_DURATION_MS;
      
      const speedMultiplier = 1 + (speedProgress * 2.5);
      
      // -- Handle Shooting Stars --
      // Only spawn if NOT flying
      if (!isFlying && Math.random() < 0.005 && shootingStarsRef.current.length < 3) {
         shootingStarsRef.current.push(createShootingStar());
      }

      shootingStarsRef.current.forEach(star => {
        if (!star.active) return;
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.opacity -= 0.015;

        if (star.opacity <= 0 || star.x > canvas.width + 100 || star.y > canvas.height + 100) {
          star.active = false;
        }

        const tailX = star.x - Math.cos(star.angle) * star.len;
        const tailY = star.y - Math.sin(star.angle) * star.len;

        const grad = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.arc(star.x, star.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      shootingStarsRef.current = shootingStarsRef.current.filter(s => s.active);

      // -- Draw Constellations -- (Removed)



      // -- Particles (Stars) --
      const drawTrail = (particle: Particle, vx: number, vy: number, alpha: number) => {
        // Longer trails when flying
        const length = particle.isGolden ? 45 : 25; 
        const mag = Math.sqrt(vx * vx + vy * vy) || 1;
        const nx = vx / mag;
        const ny = vy / mag;
        
        const tailX = particle.x - nx * length;
        const tailY = particle.y - ny * length;
        
        const grad = ctx.createLinearGradient(particle.x, particle.y, tailX, tailY);
        
        grad.addColorStop(0, particle.color); 
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = grad;
        ctx.lineWidth = particle.size * (particle.isGolden ? 1.5 : 0.8);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(tailX, tailY);
        ctx.globalAlpha = alpha;
        ctx.stroke();
        
        // Optional: Secondary chromatic aberration line for "warp"
        if (isFlying && speedMultiplier > 2.5) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'; // Cyan ghost
            ctx.beginPath();
            ctx.moveTo(particle.x - 2, particle.y);
            ctx.lineTo(tailX - 2, tailY);
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)'; // Red ghost
            ctx.beginPath();
            ctx.moveTo(particle.x + 2, particle.y);
            ctx.lineTo(tailX + 2, tailY);
            ctx.stroke();
        }
        
        ctx.restore();
      };

      particlesRef.current.forEach((particle, index) => {
        const twinkle = particle.isGolden
          ? (Math.sin(Date.now() * 0.0075 + index) + 1) * 0.25 + 0.85
          : (Math.sin(Date.now() * particle.pulseSpeed + index) + 1) * 0.15 + 0.7;
        
        const hdrBoost = particle.isGolden ? 1.4 : 1;
        const alpha = Math.min(1, particle.opacity * twinkle * hdrBoost);
        let vx = 0;
        let vy = 0;

        // Draw particle body
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        
        // Glow
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.isGolden ? particle.size * 10 : particle.size * 4;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (isFlying) {
          const moveSpeed = particle.baseSpeed * 2.5 * speedMultiplier; // Stars move fast
            
          const currentAngle = getRotationAngle();
          const angleRad = currentAngle * Math.PI / 180;

          // Standard movement logic
          vx = Math.cos(angleRad) * moveSpeed;
          vy = Math.sin(angleRad) * moveSpeed;
          
          const speedMag = Math.hypot(vx, vy);
          if (speedMag > 0.5) {
            drawTrail(particle, vx, vy, alpha);
          }
          
          particle.x += vx;
          particle.y += vy;
          
          // Wrap logic
          const PADDING = 150;
          if (particle.x < -PADDING) {
            particle.x = canvas.width + PADDING;
            particle.y = Math.random() * canvas.height;
          }
          if (particle.x > canvas.width + PADDING) {
            particle.x = -PADDING;
            particle.y = Math.random() * canvas.height;
          }
          if (particle.y < -PADDING) {
            particle.y = canvas.height + PADDING;
            particle.x = Math.random() * canvas.width;
          }
          if (particle.y > canvas.height + PADDING) {
            particle.y = -PADDING;
            particle.x = Math.random() * canvas.width;
          }
        } else {
          // Static floating
          vx = Math.cos(particle.angle) * particle.baseSpeed * 0.15;
          vy = Math.sin(particle.angle) * particle.baseSpeed * 0.15;
          particle.x += vx;
          particle.y += vy;

          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;
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
    />
  );
};

export default StarField;