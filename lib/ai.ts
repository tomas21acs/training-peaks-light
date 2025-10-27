import type { ParsedWorkout } from "@/types/workout";

// Placeholder for future OpenAI integration. For now we return a lightweight
// summary so the UI can display an "AI" insight without calling an external API.
export async function generateAiSummary(workout: ParsedWorkout): Promise<string> {
  const minutes = Math.round(workout.metrics.totalTimeSeconds / 60);
  const avgPower = workout.metrics.avgPowerWatts
    ? `${Math.round(workout.metrics.avgPowerWatts)} W`
    : "unknown power";
  const avgHeartRate = workout.metrics.avgHeartRateBpm
    ? `${Math.round(workout.metrics.avgHeartRateBpm)} bpm`
    : "unknown heart rate";

  // Simulate a network round-trip so the UI demonstrates loading states.
  await new Promise(resolve => setTimeout(resolve, 350));

  return `Solid effort! You rode for ${minutes} minutes with ${avgPower} and ${avgHeartRate}. Focus on a steady cadence next time and finish with a light cooldown.`;
}
