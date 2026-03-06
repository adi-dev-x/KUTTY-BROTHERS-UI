import React, { useState, useEffect } from 'react';

const TimerDisplay = ({ record }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!record || typeof record === 'string') {
            setElapsed(0);
            return;
        }

        const totalMs = record.totalAccumulatedMs || 0;

        if (record.status === "Checked In") {
            const startTs = record.lastCheckInTs;
            if (!startTs) {
                setElapsed(totalMs);
                return;
            }

            const updateTimer = () => {
                const now = Date.now();
                setElapsed(totalMs + (now - startTs));
            };

            updateTimer(); // Initial call
            const interval = setInterval(updateTimer, 1000);

            return () => clearInterval(interval);
        } else {
            // Checked out, just show accumulated time
            setElapsed(totalMs);
        }
    }, [record]);

    if (!record || typeof record === 'string') {
        return <span className="font-mono text-gray-400">00:00:00</span>;
    }

    const totalSeconds = Math.floor(elapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const formatted = [
        hours.toString().padStart(2, '0'),
        m.toString().padStart(2, '0'),
        s.toString().padStart(2, '0')
    ].join(':');

    return (
        <span className="font-mono tracking-wider">{formatted}</span>
    );
};

export default TimerDisplay;
