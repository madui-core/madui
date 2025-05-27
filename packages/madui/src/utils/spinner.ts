import ora, { type Options } from "ora";

const COLORS: Options['color'][] = ['cyan', 'white'];

export const spinner = (
  text: Options['text'],
  options?: {
    color?: Options['color'];
    silent?: boolean;
  }
) => {
  const spinner = ora({
    text,
    color: options?.color || 'white',
    isSilent: options?.silent || false,
  });

  let xor = 1;

  const interval = setInterval(() => {
    xor = xor ^ 1;
    spinner.color = COLORS[xor] ?? 'white';
  }, 1000);

  // Clear interval when spinner stops
  const originalStop = spinner.stop.bind(spinner);
  spinner.stop = (...args: Parameters<typeof originalStop>) => {
    clearInterval(interval);
    return originalStop(...args);
  };

  return spinner;
};