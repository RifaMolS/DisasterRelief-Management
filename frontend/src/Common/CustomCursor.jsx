import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CustomCursor = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const moveCursor = (e) => setPosition({ x: e.clientX, y: e.clientY });
        const handleMouseOver = (e) => {
            const target = e.target;
            if (
                target.tagName === 'BUTTON' || 
                target.tagName === 'A' || 
                target.onclick || 
                window.getComputedStyle(target).cursor === 'pointer'
            ) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);
        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, []);

    return (
        <div style={{ pointerEvents: 'none' }}>
            {/* LARGE OUTER RING */}
            <motion.div 
                className="custom-cursor-outer"
                animate={{ 
                    x: position.x - 40, 
                    y: position.y - 40,
                    scale: isHovering ? 1.5 : 1,
                    opacity: 0.7
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 250, mass: 0.5 }}
                style={{
                    position: 'fixed', top: 0, left: 0, width: '80px', height: '80px', 
                    borderRadius: '50%', background: 'transparent', 
                    border: '3px solid #22c55e',
                    zIndex: 9999,
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)'
                }}
            />
            {/* GLOWING CENTER DOT */}
             <motion.div 
                className="custom-cursor-inner"
                animate={{ 
                    x: position.x - 10, 
                    y: position.y - 10,
                    scale: isHovering ? 0.5 : 1,
                    backgroundColor: isHovering ? '#fff' : '#22c55e'
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 400, mass: 0.2 }}
                style={{
                    position: 'fixed', top: 0, left: 0, width: '20px', height: '20px', 
                    borderRadius: '50%',
                    zIndex: 10000,
                    boxShadow: '0 0 15px rgba(34, 197, 94, 0.8)',
                    border: '2px solid white'
                }}
            />
        </div>
    );
};

export default CustomCursor;
