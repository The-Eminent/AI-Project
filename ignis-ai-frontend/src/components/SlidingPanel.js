// src/components/SlidingPanel.js
import React, { useState, useRef } from 'react';

/**
 * SlidingPanel:
 * - Contains a hamburger button
 * - Renders children (FireControls) inside
 * - Slide in/out with transform
 * - Resizable bottom
 */
function SlidingPanel({ children }) {
  const [isOpen, setIsOpen] = useState(true);  // panel open by default
  const [panelHeight, setPanelHeight] = useState(550); // default height in px

  const panelRef = useRef(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Toggle open/closed
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  // Mouse down on resizer
  const handleResizerMouseDown = (e) => {
    e.preventDefault();
    startYRef.current = e.clientY;
    startHeightRef.current = panelHeight;

    // Listen for mouse move/up on window
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Mouse move => adjust height
  const handleMouseMove = (e) => {
    const dy = e.clientY - startYRef.current;
    const newHeight = startHeightRef.current + dy;
    if (newHeight > 200 && newHeight < 1000) { // limit min/max
      setPanelHeight(newHeight);
    }
  };

  // Mouse up => remove listeners
  const handleMouseUp = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: 300,
      transform: isOpen ? 'translateX(0)' : 'translateX(-310px)',
      transition: 'transform 0.3s ease',
      zIndex: 999
    }} ref={panelRef}>
      {/* Hamburger */}
      <div style={styles.hamburgerBar}>
        <button onClick={togglePanel} style={styles.hamburgerButton}>
          ☰
        </button>
      </div>

      {/* The main panel content, with a fixed height we can resize */}
      <div style={{
        background: '#ffffffcc',
        width: '100%',
        height: panelHeight,
        overflow: 'auto',
        borderRadius: '0 0 8px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        fontFamily: 'sans-serif'
      }}>
        {children}
      </div>

      {/* The bottom resizer bar */}
      <div
        style={styles.resizer}
        onMouseDown={handleResizerMouseDown}
      />
    </div>
  );
}

const styles = {
  hamburgerBar: {
    width: '100%',
    height: 40,
    background: '#eee',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '8px 0 0 0'
  },
  hamburgerButton: {
    marginLeft: 8,
    background: '#fff',
    border: '1px solid #ccc',
    fontSize: '20px',
    cursor: 'pointer',
    borderRadius: 4,
    width: '40px',
    height: '30px'
  },
  resizer: {
    width: '100%',
    height: '8px',
    background: '#ccc',
    cursor: 'ns-resize'
  }
};

export default SlidingPanel;
