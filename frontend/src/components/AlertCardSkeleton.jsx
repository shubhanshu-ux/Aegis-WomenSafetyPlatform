/** Placeholder while volunteer alerts load */
function AlertCardSkeleton() {
  return (
    <article className="glass-card p-6 animate-slide-up">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-20 rounded-full bg-white/10 shimmer"></div>
        <div className="h-6 w-16 rounded-full bg-white/10 shimmer"></div>
      </div>
      <div className="mb-4 space-y-2">
        <div className="h-6 w-3/4 rounded-lg bg-white/10 shimmer"></div>
        <div className="h-4 w-1/2 rounded-lg bg-white/10 shimmer"></div>
      </div>
      <div className="mb-6 h-4 w-full rounded-lg bg-white/10 shimmer"></div>
      <div className="flex gap-3">
        <div className="h-10 flex-1 rounded-full bg-white/10 shimmer"></div>
        <div className="h-10 w-10 rounded-full bg-white/10 shimmer"></div>
      </div>
    </article>
  );
}

export default AlertCardSkeleton;
