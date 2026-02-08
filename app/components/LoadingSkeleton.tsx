export function MarketCardSkeleton() {
  return (
    <div className="vapor-card p-6">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
      
      <div className="grid grid-cols-2 gap-4 my-4">
        <div className="skeleton" style={{ height: '60px' }}></div>
        <div className="skeleton" style={{ height: '60px' }}></div>
      </div>
      
      <div className="skeleton skeleton-button"></div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <MarketCardSkeleton key={i} />
      ))}
    </div>
  );
}
