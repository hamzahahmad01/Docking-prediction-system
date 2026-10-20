function Card({ title, value, icon: Icon, tone = 'blue', meta, footer, badge }) {
  return (
    <article className={`metric-card metric-card-${tone}`}>
      <div className="metric-icon" aria-hidden="true">
        {Icon ? <Icon size={24} /> : null}
      </div>
      <div>
        <p>
          {title}
          {badge ? <span className="metric-badge">{badge}</span> : null}
        </p>
        <strong>{value}</strong>
        {meta ? <span>{meta}</span> : null}
        {footer ? <small>{footer}</small> : null}
      </div>
    </article>
  );
}

export default Card;
