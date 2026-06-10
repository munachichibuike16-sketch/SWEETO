import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * SwipeGestures — Global touch gesture handler
 * 
 * 1. Swipe from LEFT EDGE → triggers browser back (like Android gesture nav)
 * 2. Pull DOWN from TOP → triggers page refresh (like Chrome pull-to-refresh)
 * 
 * Both gestures include premium animated visual indicators.
 */
const SwipeGestures = () => {
  // ─── Swipe Back State ───
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwipingBack, setIsSwipingBack] = useState(false);
  const swipeRef = useRef({ startX: 0, startY: 0, isEdge: false, active: false });

  // ─── Pull to Refresh State ───
  const [pullProgress, setPullProgress] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullRef = useRef({ startY: 0, active: false });

  const SWIPE_THRESHOLD = 100;    // px to trigger back
  const EDGE_ZONE = 30;           // px from left edge to start swipe
  const PULL_THRESHOLD = 120;     // px to trigger refresh
  const MAX_PULL = 160;           // max visual pull distance

  // ─── Touch Handlers ───
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    // Check if touch started from left edge (swipe back)
    if (x <= EDGE_ZONE) {
      swipeRef.current = { startX: x, startY: y, isEdge: true, active: true };
      setIsSwipingBack(true);
    }

    // Check if at top of page (pull to refresh)
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop <= 5 && y <= 150) {
      pullRef.current = { startY: y, active: true };
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];

    // ─── Swipe Back Logic ───
    if (swipeRef.current.active && swipeRef.current.isEdge) {
      const deltaX = touch.clientX - swipeRef.current.startX;
      const deltaY = Math.abs(touch.clientY - swipeRef.current.startY);

      // Only horizontal swipe (not vertical scroll)
      if (deltaX > 10 && deltaY < deltaX * 0.7) {
        const progress = Math.min(deltaX / SWIPE_THRESHOLD, 1);
        setSwipeProgress(progress);
        
        // Prevent page scroll during swipe
        if (deltaX > 20) {
          e.preventDefault();
        }
      } else if (deltaY > 30) {
        // Cancel if scrolling vertically
        swipeRef.current.active = false;
        setIsSwipingBack(false);
        setSwipeProgress(0);
      }
    }

    // ─── Pull to Refresh Logic ───
    if (pullRef.current.active && !isRefreshing) {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 5) {
        pullRef.current.active = false;
        setIsPulling(false);
        setPullProgress(0);
        return;
      }

      const deltaY = touch.clientY - pullRef.current.startY;
      if (deltaY > 10) {
        const progress = Math.min(deltaY / PULL_THRESHOLD, 1);
        const visualPull = Math.min(deltaY, MAX_PULL);
        setPullProgress(progress);
        setIsPulling(true);

        if (deltaY > 20) {
          e.preventDefault();
        }
      } else if (deltaY < -10) {
        pullRef.current.active = false;
        setIsPulling(false);
        setPullProgress(0);
      }
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    // ─── Trigger Back ───
    if (swipeRef.current.active && swipeProgress >= 1) {
      // Vibrate feedback if available
      if (navigator.vibrate) navigator.vibrate(15);
      window.history.back();
    }
    swipeRef.current = { startX: 0, startY: 0, isEdge: false, active: false };
    setIsSwipingBack(false);
    setSwipeProgress(0);

    // ─── Trigger Refresh ───
    if (pullRef.current.active && pullProgress >= 1 && !isRefreshing) {
      if (navigator.vibrate) navigator.vibrate(15);
      setIsRefreshing(true);
      setPullProgress(1);
      
      // Reload after animation
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } else {
      pullRef.current = { startY: 0, active: false };
      setIsPulling(false);
      setPullProgress(0);
    }
  }, [swipeProgress, pullProgress, isRefreshing]);

  // ─── Attach Global Touch Listeners ───
  useEffect(() => {
    const options = { passive: false };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove, options);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const showBackIndicator = isSwipingBack && swipeProgress > 0.05;
  const showPullIndicator = isPulling || isRefreshing;
  const isBackTriggered = swipeProgress >= 1;
  const isPullTriggered = pullProgress >= 1;

  return (
    <>
      {/* ─── Swipe Back Indicator ─── */}
      {showBackIndicator && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: '50%',
            transform: `translateY(-50%) translateX(${Math.min(swipeProgress * 60, 60) - 48}px)`,
            zIndex: 99999,
            pointerEvents: 'none',
            transition: swipeProgress >= 1 ? 'transform 0.15s ease' : 'none',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: isBackTriggered
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                : 'rgba(255,255,255,0.95)',
              boxShadow: isBackTriggered
                ? '0 0 30px rgba(59,130,246,0.5), 0 4px 20px rgba(0,0,0,0.2)'
                : '0 4px 20px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
              transform: isBackTriggered ? 'scale(1.15)' : `scale(${0.7 + swipeProgress * 0.3})`,
            }}
          >
            {/* Back Arrow SVG */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isBackTriggered ? '#fff' : '#1e293b'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: `rotate(${isBackTriggered ? -360 : -swipeProgress * 180}deg)`,
                transition: isBackTriggered ? 'transform 0.3s ease' : 'none',
              }}
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* ─── Left Edge Glow ─── */}
      {showBackIndicator && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${Math.min(swipeProgress * 80, 80)}px`,
            background: `linear-gradient(to right, ${
              isBackTriggered ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'
            }, transparent)`,
            zIndex: 99998,
            pointerEvents: 'none',
            transition: isBackTriggered ? 'width 0.15s ease' : 'none',
          }}
        />
      )}

      {/* ─── Pull to Refresh Indicator ─── */}
      {showPullIndicator && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '50%',
            transform: `translateX(-50%) translateY(${
              isRefreshing ? 20 : Math.min(pullProgress * 60, 60) - 40
            }px)`,
            zIndex: 99999,
            pointerEvents: 'none',
            transition: isRefreshing ? 'transform 0.3s ease' : 'none',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: isPullTriggered || isRefreshing
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                : 'rgba(255,255,255,0.95)',
              boxShadow: isPullTriggered || isRefreshing
                ? '0 0 30px rgba(59,130,246,0.5), 0 4px 20px rgba(0,0,0,0.2)'
                : '0 4px 20px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
              transform: isPullTriggered || isRefreshing ? 'scale(1.1)' : `scale(${0.6 + pullProgress * 0.4})`,
              animation: isRefreshing ? 'swipeGesturesSpin 0.7s linear infinite' : 'none',
            }}
          >
            {/* Refresh Arrow SVG */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isPullTriggered || isRefreshing ? '#fff' : '#1e293b'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: `rotate(${pullProgress * 360}deg)`,
                transition: isRefreshing ? 'none' : 'transform 0.05s linear',
              }}
            >
              <path d="M21.5 2v6h-6" />
              <path d="M2.5 22v-6h6" />
              <path d="M2.5 11.5a10 10 0 0 1 18.3-4.3L21.5 8" />
              <path d="M21.5 12.5a10 10 0 0 1-18.3 4.3L2.5 16" />
            </svg>
          </div>
        </div>
      )}

      {/* ─── Top Glow on Pull ─── */}
      {showPullIndicator && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: `${Math.min(pullProgress * 40, 40)}px`,
            background: `linear-gradient(to bottom, ${
              isPullTriggered || isRefreshing ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.06)'
            }, transparent)`,
            zIndex: 99998,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ─── Keyframe Animations ─── */}
      <style>{`
        @keyframes swipeGesturesSpin {
          from { transform: scale(1.1) rotate(0deg); }
          to { transform: scale(1.1) rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default SwipeGestures;
