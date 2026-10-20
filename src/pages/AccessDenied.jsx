function AccessDenied({ role }) {
  return (
    <section className="page-section">
      <div className="surface-panel access-panel">
        <p className="eyebrow">Restricted Area</p>
        <h2>Access not available for {role}</h2>
        <p>
          This page is restricted for the current login. Admin can manage everything, DEO can work on milestones, and
          the assigned project leader can complete the final form.
        </p>
      </div>
    </section>
  );
}

export default AccessDenied;
