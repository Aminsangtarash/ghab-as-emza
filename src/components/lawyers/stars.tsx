function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-gold" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => {
        const filled = rating >= index + 1;
        const half = !filled && rating >= index + 0.5;
        return (
          <svg key={index} viewBox="0 0 20 20" className="size-3.5">
            <path
              d="M10 1.8 12.5 7l5.8.8-4.2 4.1 1 5.8L10 15.4 4.9 18.7l1-5.8L1.7 7.8 7.5 7 10 1.8Z"
              fill={filled || half ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.2"
              opacity={filled ? 1 : half ? 0.55 : 0.28}
            />
          </svg>
        );
      })}
    </span>
  );
}

export { Stars };
