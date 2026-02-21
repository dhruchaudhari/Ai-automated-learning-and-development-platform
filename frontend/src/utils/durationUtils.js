import { startOfDay, endOfDay } from 'date-fns';

export const calculateActivationDuration = (activationHistory) => {
    if (!activationHistory || activationHistory.length === 0) {
        return { active: false, totalDuration: 0, sessions: 0, lastActivation: null, todayDuration: 0 };
    }

    const sortedHistory = [...activationHistory].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );

    let totalDuration = 0;
    let sessions = 0;
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    let todayDuration = 0;

    for (let i = 0; i < sortedHistory.length; i += 2) {
        const start = sortedHistory[i];
        const end = sortedHistory[i + 1] || { timestamp: now.toISOString() };

        if (start.status === 'active') {
            const startTime = new Date(start.timestamp);
            const endTime = new Date(end.timestamp);

            totalDuration += endTime - startTime;
            sessions++;

            if (startTime <= todayEnd && endTime >= todayStart) {
                const sessionStart = startTime < todayStart ? todayStart : startTime;
                const sessionEnd = endTime > todayEnd ? todayEnd : endTime;

                if (sessionStart < sessionEnd) {
                    todayDuration += sessionEnd - sessionStart;
                }
            }
        }
    }

    const lastEntry = sortedHistory[sortedHistory.length - 1];
    const isActiveNow = lastEntry && lastEntry.status === 'active';

    if (isActiveNow && lastEntry) {
        const liveStart = new Date(lastEntry.timestamp);
        const liveDuration = now - liveStart;
        totalDuration += liveDuration;
        todayDuration += liveDuration;
    }

    return {
        active: isActiveNow,
        totalDuration,
        sessions,
        lastActivation: sortedHistory.length > 0 ? new Date(sortedHistory[sortedHistory.length - 1].timestamp) : null,
        todayDuration
    };
};

export const formatDuration = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return "0s";

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
};
