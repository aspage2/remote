
/**
 * Convert seconds to a formatted song duration
 * @param t
 * @returns string
 */
export const timeStr = (t) => {
  t = parseInt(t);
  const mins = `${parseInt(t / 60)}`;
  const secs = `${t % 60}`.padStart(2, "0");
  return `${mins}:${secs}`;
};

export const englishTimeStr = (totalTime) => {
  const totalHours = Math.floor(totalTime / 3600);
  const totalMins = Math.floor((totalTime % 3600) / 60);
  const totalSecs = Math.floor(totalTime % 60);

  let times = [];
  if (totalHours > 0) {
    times = times.concat(`${totalHours} Hours`);
  }
  if (totalMins > 0) {
    times = times.concat(`${totalMins} Minutes`);
  }
  if (totalSecs > 0) {
    times = times.concat(`${totalSecs} Seconds`);
  }
  return times.join(", ");
};
