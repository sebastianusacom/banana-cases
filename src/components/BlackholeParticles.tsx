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

        // Varied particle sizes - some much bigger than others
        const sizeVariation = Math.random();
        let particleSize;
        if (sizeVariation < 0.6) {
            // 60% small particles
            particleSize = Math.random() * 1.5 + 0.5;
        } else if (sizeVariation < 0.9) {
            // 30% medium particles
            particleSize = Math.random() * 1 + 1.5;
        } else {
            // 10% large particles
            particleSize = Math.random() * 2 + 2;
        }

        return {
            x: centerX + Math.cos(angle) * dist,
            y: centerY + Math.sin(angle) * dist,
            angle,
            dist,
            speed: Math.random() * 1.8 + 1.2, // Slightly slower for realism
            size: particleSize,
            color
        };
    };

    // Fill initial pool - reduced for more realistic look
    for(let i=0; i<25; i++) particles.push(createParticle());

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const isRolling = status === 'rolling';
        const isSuccess = status === 'success';
        const isFail = status === 'fail';
        const isActive = isRolling || isSuccess || isFail;

        // Enhanced logic: When rolling, gravity (inward speed) increases significantly, spin increases.
        
        let gravityMult = 0.3;
        let spinMult = 1;
        let particleCount = 25;

        if (isRolling) {
            gravityMult = 3 + (intensity * 8); // Strong but realistic gravity
            spinMult = 1.2 + (intensity * 0.8); // Moderate spin increase
            particleCount = 40; // Reduced for cleaner look
        } else if (isSuccess) {
            gravityMult = 2;
            spinMult = 2.5; // Moderate spin on win
            particleCount = 60; // Reduced significantly
        } else if (isFail) {
            gravityMult = 1.2;
            spinMult = 1.5;
            particleCount = 35; // Reduced
        }

        if (particles.length < particleCount) {
            if (Math.random() < (isActive ? 0.3 : 0.08)) particles.push(createParticle());
        }

        // Draw black hole accretion disk (realistic effect)
        if (isActive) {
            const diskGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
            diskGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)'); // Black center
            diskGradient.addColorStop(0.3, 'rgba(20, 20, 30, 0.8)');
            diskGradient.addColorStop(0.6, 'rgba(40, 30, 60, 0.4)');
            diskGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.beginPath();
            ctx.fillStyle = diskGradient;
            ctx.globalAlpha = 0.6;
            ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
            ctx.fill();
        }

        particles.forEach((p, i) => {
            // Update - more realistic physics
            const distRatio = Math.max(0, p.dist / maxDist);
            const gravityStrength = gravityMult * (1 - distRatio * 0.7); // Stronger near center
            p.dist -= p.speed * gravityStrength;
            
            // Realistic spin - faster near center (like real black hole)
            const spinSpeed = 0.02 + (1 - distRatio) * 0.12;
            p.angle += spinSpeed * spinMult; 
            
            p.x = centerX + Math.cos(p.angle) * p.dist;
            p.y = centerY + Math.sin(p.angle) * p.dist;

            // Realistic particle rendering
            const alpha = Math.min(1, distRatio * 1.2);
            const particleSize = p.size * (1 + (1 - distRatio) * 0.5); // Slightly larger near center
            
            // Improved trail - smoother and more realistic
            if (isActive && p.dist < maxDist * 0.8) {
                const trailLength = Math.min(30, p.speed * gravityStrength * 3);
                const trailSteps = 8;
                const trailOpacity = alpha * 0.6;
                
                for (let step = 1; step <= trailSteps; step++) {
                    const trailRatio = step / trailSteps;
                    const trailDist = p.dist + trailLength * trailRatio;
                    const trailAngle = p.angle - (spinSpeed * spinMult * trailRatio * 2);
                    const trailX = centerX + Math.cos(trailAngle) * trailDist;
                    const trailY = centerY + Math.sin(trailAngle) * trailDist;
                    
                    ctx.beginPath();
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = trailOpacity * (1 - trailRatio) * 0.4;
                    ctx.arc(trailX, trailY, particleSize * (1 - trailRatio * 0.5), 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Main particle with subtle glow
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha * 0.9;
            ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Subtle outer glow for active particles
            if (isActive && distRatio < 0.5) {
                const glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, particleSize * 2.5);
                glowGradient.addColorStop(0, p.color + '80');
                glowGradient.addColorStop(0.5, p.color + '40');
                glowGradient.addColorStop(1, p.color + '00');
                
                ctx.beginPath();
                ctx.fillStyle = glowGradient;
                ctx.globalAlpha = alpha * 0.3;
                ctx.arc(p.x, p.y, particleSize * 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Reset if sucked into black hole
            if (p.dist < 12) {
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
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{
            maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)'
        }}>
            <canvas ref={canvasRef} className="w-full h-full opacity-90" />
        </div>
        {/* Enhanced Warp Distortion Effect Layers */}
        {status === 'rolling' && (
            <>
                {/* Outer glow */}
                <div className="absolute inset-0 rounded-full pointer-events-none z-[-1]"
                     style={{
                         background: 'radial-gradient(circle, rgba(139,92,246,0) 0%, rgba(139,92,246,0.2) 30%, rgba(0,0,0,0) 45%)',
                         filter: 'blur(1px)',
                         animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                     }}
                />
                {/* Inner core glow */}
                <div className="absolute inset-0 rounded-full pointer-events-none z-[-1]"
                     style={{
                         background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0.1) 40%, rgba(0,0,0,0) 55%)',
                         filter: 'blur(1px)',
                         animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                     }}
                />
            </>
        )}
        {status === 'success' && (
            <div className="absolute inset-0 rounded-full pointer-events-none z-[-1]"
                 style={{
                     background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 40%, rgba(0,0,0,0) 50%)',
                     filter: 'blur(1px)',
                     animation: 'pulse 1s ease-in-out infinite'
                 }}
            />
        )}
        {status === 'fail' && (
            <div className="absolute inset-0 rounded-full pointer-events-none z-[-1]"
                 style={{
                     background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 40%, rgba(0,0,0,0) 50%)',
                     filter: 'blur(1px)',
                     animation: 'pulse 1.2s ease-in-out infinite'
                 }}
            />
        )}
    </>
  );
};
