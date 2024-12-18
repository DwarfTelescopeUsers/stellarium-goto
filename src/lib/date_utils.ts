// https://stackoverflow.com/a/11888430
export const isDstObserved = function (date: Date): boolean {
  var jan = new Date(date.getFullYear(), 0, 1);
  var jul = new Date(date.getFullYear(), 6, 1);
  let stdTimezoneOffset = Math.max(
    jan.getTimezoneOffset(),
    jul.getTimezoneOffset()
  );
  return date.getTimezoneOffset() < stdTimezoneOffset;
};

function convertSecondsToHMS(totalSeconds: number) {
  let seconds = Math.floor(totalSeconds % 60);

  let minutes = Math.floor(totalSeconds / 60);
  let hours = 0;
  if (minutes > 59) {
    hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
  }

  return { hours, minutes, seconds };
}

export function calculateImagingTime(
  count: number | undefined,
  exposure: number | undefined
) {
  if (count === undefined || exposure === undefined) {
    return;
  }

  let total = count * exposure;
  return convertSecondsToHMS(total);
}

export function calculateElapsedTime(
  startTime: number | undefined,
  now = Date.now()
) {
  if (startTime === undefined) {
    return;
  }

  let total = (now - startTime) / 1000;
  return convertSecondsToHMS(total);
}

export function toIsoStringInLocalTime(date: Date) {
  return new Date(
    date.getTime() + -date.getTimezoneOffset() * 60000
  ).toISOString();
}
