import React, { useEffect, useRef } from 'react';

export interface BlackholeParticlesProps {
  status: 'idle' | 'rolling' | 'success' | 'fail';
  intensity: number;
}

interface Particle {
  x: number;
  y: number;
  angle: number;
  dist: number;
  speed: number;
  size: number;
  color: string;
}

export const BlackholeParticles: React.FC<BlackholeParticlesProps> = ({ status, intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDist = Math.max(canvas.width, canvas.height) / 1.5;

    const createParticle = (): Particle => {
        const angle = Math.random() * Math.PI * 2;
        const dist = maxDist;
        const isSuccess = status === 'success';
        const isRolling = status === 'rolling';
        const isFail = status === 'fail';
        
        let color = '#ffffff';
        if (isSuccess) {
            // Vibrant green shades for success
            const greens = ['#4ade80', '#22c55e', '#10b981', '#34d399'];
            color = greens[Math.floor(Math.random() * greens.length)];
        } else if (isFail) {
            // Red/orange shades for failure
            const reds = ['#ef4444', '#f87171', '#f97316', '#fb923c'];
            color = reds[Math.floor(Math.random() * reds.length)];
        } else if (isRolling) {
            // Enhanced purple/blue/white for rolling
            const colors = ['#a78bfa', '#8b5cf6', '#6366f1', '#ffffff', '#c4b5fd'];
            color = colors[Math.floor(Math.random() * colors.length)];
        } else {
            // Subtle white/purple for idle
            color = Math.random() > 0.7 ? '#a78bfa' : '#ffffff';
        }

        return {
            x: centerX + Math.cos(angle) * dist,
            y: centerY + Math.sin(angle) * dist,
            angle,
            dist,
            speed: Math.random() * 2.5 + 1.5,
            size: Math.random() * 2 + 0.8,
            color
        };
    };

    // Fill initial pool
    for(let i=0; i<50; i++) particles.push(createParticle());

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const isRolling = status === 'rolling';
        const isSuccess = status === 'success';
        const isFail = status === 'fail';
        const isActive = isRolling || isSuccess || isFail;

        // Enhanced logic: When rolling, gravity (inward speed) increases significantly, spin increases.
        
        let gravityMult = 0.4;
        let spinMult = 1;
        let particleCount = 50;

        if (isRolling) {
            gravityMult = 5 + (intensity * 20); // Very strong gravity
            spinMult = 1.5 + (intensity * 1.5); // Increased spin
            particleCount = 100;
        } else if (isSuccess) {
            gravityMult = 2.5;
            spinMult = 4; // Fast spin on win
            particleCount = 250;
        } else if (isFail) {
            gravityMult = 1.5;
            spinMult = 2;
            particleCount = 150;
        }

        if (particles.length < particleCount) {
            if (Math.random() < (isActive ? 0.6 : 0.15)) particles.push(createParticle());
        }

        particles.forEach((p, i) => {
            // Update
            p.dist -= p.speed * gravityMult;
            
            // Enhanced spin logic - faster near center
            const distRatio = 1 - (p.dist / maxDist);
            const baseSpin = 0.015 + distRatio * 0.08;
            p.angle += baseSpin * spinMult; 
            
            p.x = centerX + Math.cos(p.angle) * p.dist;
            p.y = centerY + Math.sin(p.angle) * p.dist;

            // Enhanced drawing with glow effect
            const alpha = Math.min(1, (p.dist / maxDist));
            const glowSize = p.size * (isActive ? 1.5 : 1);
            
            // Outer glow
            if (isActive) {
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize * 2);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(0.5, p.color + '80');
                gradient.addColorStop(1, p.color + '00');
                
                ctx.beginPath();
                ctx.fillStyle = gradient;
                ctx.globalAlpha = alpha * 0.4;
                ctx.arc(p.x, p.y, glowSize * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Main particle
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha * (isActive ? 1 : 0.6);
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Enhanced trail with gradient
            if (isActive) {
                const tailLen = p.speed * gravityMult * (isRolling ? 4 : isSuccess ? 3 : 2);
                const tailAngle = p.angle - (0.08 * spinMult);
                const tailX = centerX + Math.cos(tailAngle) * (p.dist + tailLen);
                const tailY = centerY + Math.sin(tailAngle) * (p.dist + tailLen);
                
                // Create gradient trail
                const trailGradient = ctx.createLinearGradient(p.x, p.y, tailX, tailY);
                trailGradient.addColorStop(0, p.color + 'FF');
                trailGradient.addColorStop(0.5, p.color + '80');
                trailGradient.addColorStop(1, p.color + '00');
                
                ctx.beginPath();
                ctx.strokeStyle = trailGradient;
                ctx.globalAlpha = alpha * 0.5;
                ctx.lineWidth = p.size * 1.2;
                ctx.lineCap = 'round';
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();
            }

            // Reset if sucked in
            if (p.dist < 8) {
                particles[i] = createParticle();
            }
        });

        animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, [status, intensity]);

  return (
    <>
        <canvas ref={canvasRef} className="absolute inset-[-100px] w-[calc(100%+200px)] h-[calc(100%+200px)] pointer-events-none z-0 opacity-90" />
        {/* Enhanced Warp Distortion Effect Layers */}
        {status === 'rolling' && (
            <>
                {/* Outer glow */}
                <div className="absolute inset-[-60px] w-[calc(100%+120px)] h-[calc(100%+120px)] rounded-full pointer-events-none z-[-1]"
                     style={{
                         background: 'radial-gradient(circle, rgba(139,92,246,0) 0%, rgba(139,92,246,0.4) 35%, rgba(0,0,0,0) 65%)',
                         filter: 'blur(25px)',
                         animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                     }}
                />
                {/* Inner core glow */}
                <div className="absolute inset-[-30px] w-[calc(100%+60px)] h-[calc(100%+60px)] rounded-full pointer-events-none z-[-1]"
                     style={{
                         background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, rgba(139,92,246,0.2) 50%, rgba(0,0,0,0) 80%)',
                         filter: 'blur(15px)',
                         animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                     }}
                />
            </>
        )}
        {status === 'success' && (
            <div className="absolute inset-[-50px] w-[calc(100%+100px)] h-[calc(100%+100px)] rounded-full pointer-events-none z-[-1]"
                 style={{
                     background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(16,185,129,0.1) 50%, rgba(0,0,0,0) 70%)',
                     filter: 'blur(20px)',
                     animation: 'pulse 1s ease-in-out infinite'
                 }}
            />
        )}
        {status === 'fail' && (
            <div className="absolute inset-[-50px] w-[calc(100%+100px)] h-[calc(100%+100px)] rounded-full pointer-events-none z-[-1]"
                 style={{
                     background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.1) 50%, rgba(0,0,0,0) 70%)',
                     filter: 'blur(20px)',
                     animation: 'pulse 1.2s ease-in-out infinite'
                 }}
            />
        )}
    </>
  );
};
