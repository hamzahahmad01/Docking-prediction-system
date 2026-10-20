import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { formatCompactCurrency, formatCurrency } from '../utils/formatters.js';

const chartPalette = {
  blue: '#1b5f9e',
  green: '#257c5a',
  gold: '#b27a1c',
  red: '#b14b40',
  grid: '#dce5ec',
  text: '#526579',
  axis: '#7a8b9c',
};

function getProjectDurationDays(project) {
  const start = new Date(project.startDate);
  const end = new Date(project.completionDate);
  const difference = end.getTime() - start.getTime();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || difference < 0) {
    return 0;
  }

  return Math.max(1, Math.round(difference / (1000 * 60 * 60 * 24)));
}

function getChartStatus(project) {
  if (project.status === 'Completed') {
    return 'Completed';
  }

  const completionDate = new Date(project.completionDate);
  const today = new Date();

  if (!Number.isNaN(completionDate.getTime()) && completionDate < today) {
    return 'Delayed';
  }

  return 'Ongoing';
}

function ChartCard({ title, subtitle, children, height = 320 }) {
  return (
    <article className="analytics-card">
      <div className="analytics-card-header">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h4>{title}</h4>
        </div>
      </div>
      <div className="analytics-chart-frame" style={{ height }}>
        {children}
      </div>
    </article>
  );
}

function EmptyAnalytics({ message }) {
  return (
    <div className="chart-empty-state">
      <strong>No analytics available</strong>
      <span>{message}</span>
    </div>
  );
}

function TooltipCard({ active, payload, label, formatter }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="analytics-tooltip">
      {label ? <strong>{label}</strong> : null}
      {payload.map((entry) => (
        <div key={`${entry.name}-${entry.dataKey}`} className="analytics-tooltip-row">
          <span>{entry.name}</span>
          <strong>{formatter ? formatter(entry.value, entry.name, entry.payload) : entry.value}</strong>
        </div>
      ))}
    </div>
  );
}

function ProjectAnalytics({ projects }) {
  const totalRevenue = projects.reduce((sum, project) => sum + Number(project.projectCost || 0), 0);

  const divisionCostData = Object.values(
    projects.reduce((accumulator, project) => {
      const key = project.division || 'Unassigned';

      if (!accumulator[key]) {
        accumulator[key] = {
          division: key,
          totalCost: 0,
          projectCount: 0,
        };
      }

      accumulator[key].totalCost += Number(project.projectCost || 0);
      accumulator[key].projectCount += 1;
      return accumulator;
    }, {}),
  ).sort((left, right) => right.totalCost - left.totalCost);

  const growthData = Object.values(
    projects.reduce((accumulator, project) => {
      const startDate = new Date(project.startDate);

      if (Number.isNaN(startDate.getTime())) {
        return accumulator;
      }

      const key = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

      if (!accumulator[key]) {
        accumulator[key] = {
          key,
          period: startDate.toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
          revenue: 0,
          projects: 0,
          timestamp: startDate.getTime(),
        };
      }

      accumulator[key].revenue += Number(project.projectCost || 0);
      accumulator[key].projects += 1;
      return accumulator;
    }, {}),
  ).sort((left, right) => left.timestamp - right.timestamp);

  const statusCounts = projects.reduce(
    (accumulator, project) => {
      accumulator[getChartStatus(project)] += 1;
      return accumulator;
    },
    {
      Completed: 0,
      Ongoing: 0,
      Delayed: 0,
    },
  );

  const statusData = [
    { name: 'Completed', value: statusCounts.Completed, color: chartPalette.blue },
    { name: 'Ongoing', value: statusCounts.Ongoing, color: chartPalette.green },
    { name: 'Delayed', value: statusCounts.Delayed, color: chartPalette.red },
  ].filter((item) => item.value > 0);

  const scatterData = projects.map((project) => ({
    projectNumber: project.projectNumber,
    durationDays: getProjectDurationDays(project),
    cost: Number(project.projectCost || 0),
    status: getChartStatus(project),
  }));

  const nearestCompletionProject = projects
    .map((project) => ({
      projectNumber: project.projectNumber,
      completionDate: new Date(project.completionDate),
    }))
    .filter((project) => !Number.isNaN(project.completionDate.getTime()))
    .sort((left, right) => left.completionDate.getTime() - right.completionDate.getTime())[0] || null;
  const highestCostDivision = divisionCostData[0] || null;
  const latestGrowthPoint = growthData[growthData.length - 1] || null;

  return (
    <section className="surface-panel analytics-surface">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Analytics</p>
          <h3>Research project visual analysis</h3>
        </div>
      </div>

      <div className="analytics-summary-grid">
        <div className="analytics-summary-card">
          <span>Top division by cost</span>
          <strong>{highestCostDivision ? highestCostDivision.division : 'Not available'}</strong>
          <small>{highestCostDivision ? formatCurrency(highestCostDivision.totalCost) : 'No registered cost data yet.'}</small>
        </div>
        <div className="analytics-summary-card">
          <span>Latest growth period</span>
          <strong>{latestGrowthPoint ? latestGrowthPoint.period : 'Not available'}</strong>
          <small>{latestGrowthPoint ? `${latestGrowthPoint.projects} project(s) | ${formatCompactCurrency(latestGrowthPoint.revenue)}` : 'No timeline data yet.'}</small>
        </div>
        <div className="analytics-summary-card">
          <span>Shortest completion window</span>
          <strong>{nearestCompletionProject ? nearestCompletionProject.projectNumber : 'Not available'}</strong>
          <small>
            {nearestCompletionProject
              ? `Nearest completion on ${nearestCompletionProject.completionDate.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}`
              : 'No completion schedule available yet.'}
          </small>
        </div>
      </div>

      <div className="analytics-grid">
        <ChartCard title="Project cost by division" subtitle="Bar Chart">
          {divisionCostData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={divisionCostData} margin={{ top: 8, right: 14, left: 0, bottom: 12 }}>
                <CartesianGrid stroke={chartPalette.grid} vertical={false} />
                <XAxis
                  dataKey="division"
                  tick={{ fill: chartPalette.axis, fontSize: 12, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => formatCompactCurrency(value)}
                  tick={{ fill: chartPalette.axis, fontSize: 12 }}
                  width={78}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TooltipCard formatter={(value) => formatCurrency(value)} />} />
                <Bar dataKey="totalCost" name="Project Cost" radius={[6, 6, 0, 0]} fill={chartPalette.blue} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyAnalytics message="Division-wise cost analysis will appear when project records are available." />
          )}
        </ChartCard>

        <ChartCard title="Revenue and project growth over time" subtitle="Line Chart">
          {growthData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 8, right: 18, left: 0, bottom: 12 }}>
                <CartesianGrid stroke={chartPalette.grid} vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fill: chartPalette.axis, fontSize: 12, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="revenue"
                  tickFormatter={(value) => formatCompactCurrency(value)}
                  tick={{ fill: chartPalette.axis, fontSize: 12 }}
                  width={78}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="projects"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fill: chartPalette.axis, fontSize: 12 }}
                  width={28}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={
                    <TooltipCard
                      formatter={(value, name) =>
                        name === 'Revenue' ? formatCurrency(value) : `${value} project(s)`
                      }
                    />
                  }
                />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={chartPalette.blue}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="projects"
                  type="monotone"
                  dataKey="projects"
                  name="Projects"
                  stroke={chartPalette.green}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyAnalytics message="Monthly revenue and growth trends will appear when project dates are available." />
          )}
        </ChartCard>

        <ChartCard title="Project status distribution" subtitle="Pie Chart" height={300}>
          {statusData.length ? (
            <div className="analytics-pie-wrap">
              <div className="analytics-pie-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={
                        <TooltipCard formatter={(value, name) => `${value} ${name.toLowerCase()} project(s)`} />
                      }
                    />
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={2}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="analytics-pie-side">
                <div className="analytics-pie-total">
                  <strong>{projects.length}</strong>
                  <span>Total projects</span>
                </div>
                <div className="analytics-status-list">
                  {statusData.map((item) => (
                    <div key={item.name} className="analytics-status-item">
                      <div className="analytics-status-label">
                        <i className="analytics-status-dot" style={{ background: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyAnalytics message="Status distribution will appear when live project records are available." />
          )}
        </ChartCard>

        <ChartCard title="Cost vs completion time analysis" subtitle="Scatter Plot" height={300}>
          {scatterData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 20, left: 0, bottom: 12 }}>
                <CartesianGrid stroke={chartPalette.grid} />
                <XAxis
                  type="number"
                  dataKey="durationDays"
                  name="Completion duration"
                  unit=" days"
                  tick={{ fill: chartPalette.axis, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Completion duration (days)', position: 'insideBottom', offset: -4, fill: chartPalette.text }}
                />
                <YAxis
                  type="number"
                  dataKey="cost"
                  name="Project cost"
                  tickFormatter={(value) => formatCompactCurrency(value)}
                  tick={{ fill: chartPalette.axis, fontSize: 12 }}
                  width={78}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Project cost', angle: -90, position: 'insideLeft', fill: chartPalette.text }}
                />
                <ZAxis range={[80]} />
                <Tooltip
                  cursor={{ strokeDasharray: '4 4' }}
                  content={
                    <TooltipCard
                      formatter={(value, name, payload) => {
                        if (name === 'Project cost') {
                          return formatCurrency(value);
                        }
                        if (name === 'Completion duration') {
                          return `${value} days`;
                        }
                        return payload.projectNumber;
                      }}
                    />
                  }
                />
                <Scatter name="Projects" data={scatterData} fill={chartPalette.gold} />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <EmptyAnalytics message="Cost and completion time analysis will appear when project records are available." />
          )}
        </ChartCard>
      </div>

      <div className="analytics-footer-note">
        <span>Live interpretation</span>
        <strong>
          Total registered project value is {formatCurrency(totalRevenue)} across {projects.length} project record(s), using the current SQL-backed register.
        </strong>
      </div>
    </section>
  );
}

export default ProjectAnalytics;
