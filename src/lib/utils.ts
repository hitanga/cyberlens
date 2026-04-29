export const formatLikes = (count: number | string) => {
  if (typeof count === 'string') return count;
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
  return count.toString();
};
