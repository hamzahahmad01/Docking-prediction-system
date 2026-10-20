import Card from '../components/Card.jsx';
import ProjectAnalytics from '../components/ProjectAnalytics.jsx';
import Table from '../components/Table.jsx';
import { BriefcaseIcon, CheckFileIcon, DatabaseIcon, RupeeIcon } from '../components/Icons.jsx';
import { formatCompactCurrency, formatCurrency, formatDate } from '../utils/formatters.js';

function Dashboard({ projects, currentEmployee }) {
  const ongoingProjects = projects.filter((project) => project.status !== 'Completed');
  const completedProjects = projects.filter((project) => project.status === 'Completed');
  const totalProjectCost = projects.reduce((sum, project) => sum + project.projectCost, 0);
  const pendingMilestones = projects.filter((project) => project.milestoneStatus !== 'Achieved');

  return (
    <section className="page-section dashboard-page">
      <div className="hero-band">
        <div>
          <p className="eyebrow">Project Title</p>
          <h2>Project Control Center</h2>
          <p className="hero-copy">
            Everything you need to manage project workflows.
          </p>
        </div>
        <div className="hero-stat">
          <span>{currentEmployee.employeeId}</span>
          <small>{`${currentEmployee.name} | ${currentEmployee.division}`}</small>
        </div>
      </div>

      <div className="metric-grid metric-grid-wide">
        <Card
          title="Total Projects"
          value={projects.length}
          icon={DatabaseIcon}
          tone="blue"
          meta="Registered project records"
          footer={`${ongoingProjects.length} currently active`}
        />
        <Card
          title="Total Project Cost"
          value={formatCompactCurrency(totalProjectCost)}
          icon={RupeeIcon}
          tone="green"
          meta="Combined approved value"
          footer={formatCurrency(totalProjectCost)}
        />
        <Card
          title="Pending Milestones"
          value={pendingMilestones.length}
          icon={BriefcaseIcon}
          tone="gold"
          meta="Records needing milestone attention"
         // footer="Tracked on page 2"
        />
        <Card
          title="Completed Projects"
          value={completedProjects.length}
          icon={CheckFileIcon}
          tone="slate"
          meta="Projects with closure details"
          footer="Updated from page 3"
        />
      </div>

      <ProjectAnalytics projects={projects} />

      <div className="content-grid two-column">
        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Employee Session</p>
              <h3>Authenticated user details</h3>
            </div>
          </div>

          <div className="detail-grid">
            <div>
              <span>Employee ID</span>
              <strong>{currentEmployee.employeeId}</strong>
            </div>
            <div>
              <span>Name</span>
              <strong>{currentEmployee.name}</strong>
            </div>
            <div>
              <span>Division</span>
              <strong>{currentEmployee.division}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>{currentEmployee.role}</strong>
            </div>
          </div>
        </section>

        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Workflow</p>
              <h3>Working page sequence</h3>
            </div>
          </div>

          <div className="workflow-list">
            <article className="workflow-card">
              <span>1</span>
              <div>
                <h4>Authentication</h4>
                <p>Employees sign in with the assigned employee ID and password.</p>
              </div>
            </article>
            <article className="workflow-card">
              <span>2</span>
              <div>
                <h4>Project Registration</h4>
                <p>Admin assigns the employee, division, sponsor, dates, cost, and project status.</p>
              </div>
            </article>
            <article className="workflow-card">
              <span>3</span>
              <div>
                <h4>Milestone Tracking and Closure</h4>
                <p>Teams update milestone dates, probable milestone dates, actual completion dates, and remarks.</p>
              </div>
            </article>
          </div>
        </section>
      </div>

      <section className="surface-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Current Records</p>
            <h3>Project summary</h3>
          </div>
        </div>

        <Table
          columns={[
            { key: 'projectNumber', label: 'Project No.' },
            { key: 'title', label: 'Project Title' },
            { key: 'employeeName', label: 'Employee' },
            { key: 'division', label: 'Division' },
            { key: 'startDate', label: 'Start Date', render: (row) => formatDate(row.startDate) },
            { key: 'completionDate', label: 'Completion Date', render: (row) => formatDate(row.completionDate) },
            { key: 'projectCost', label: 'Project Cost', render: (row) => formatCurrency(row.projectCost) },
            {
              key: 'status',
              label: 'Status',
              render: (row) => (
                <span className={`status-pill status-${row.status.toLowerCase().replace(/\s+/g, '-')}`}>{row.status}</span>
              ),
            },
          ]}
          rows={projects}
          emptyTitle="No projects available"
          emptyDescription="Project records created on page 1 will be listed here."
        />
      </section>
    </section>
  );
}

export default Dashboard;
