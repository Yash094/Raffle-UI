export const  formatTime = (timeLeft) => {
  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};
