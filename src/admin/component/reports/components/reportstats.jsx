
export default function ReportStats({ title, stats = [] }) {
  return (
    <section className="reports-stats-section">
      {title && (
        <h3 className="reports-stats-heading">
          {title}
        </h3>
      )}

      <div className="reports-stats-grid">
        {stats.map((stat, index) => (
          <div
            className="reports-stats-card"
            key={stat.label || index}
          >
            <span className="reports-stats-label">
              {stat.label}
            </span>

            <strong className="reports-stats-value">
              {typeof stat.value === "number"
                ? stat.value.toLocaleString()
                : stat.value ?? 0}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}
