// The header greeting, by the phone's own clock and timezone (greetingFor in the prototype):
// morning from 05:00, afternoon from 12:00, evening from 17:00 until 05:00.
import { useEffect, useState } from 'react';

export function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** The greeting for now, re-read every minute so it turns over at noon and five without a restart. */
export function useGreeting() {
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const t = setInterval(() => setHour(new Date().getHours()), 60 * 1000);
    return () => clearInterval(t);
  }, []);
  return greetingFor(hour);
}
