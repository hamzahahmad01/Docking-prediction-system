import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import Table from '../components/Table.jsx';
import { apiRequest } from '../utils/api.js';
import { formatDate } from '../utils/formatters.js';

function Reports({ projects, setProjects, currentEmployee }) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [form, setForm] = useState({
    probableCompletionDate: '',
    actualCompletionDate: '',
    remarks: '',
  });
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isProjectLead = currentEmployee.role === 'Project Lead';
  const visibleProjects = useMemo(
    () =>
      isProjectLead
        ? projects.filter((project) => project.employeeId === currentEmployee.employeeId)
        : projects,
    [currentEmployee.employeeId, isProjectLead, projects],
  );

  useEffect(() => {
    if (!visibleProjects.length) {
      setSelectedProjectId('');
      return;
    }

    const currentExists = visibleProjects.some((project) => project.id === selectedProjectId);

    if (!currentExists) {
      setSelectedProjectId(visibleProjects[0].id);
    }
  }, [visibleProjects, selectedProjectId]);

  const selectedProject = visibleProjects.find((project) => project.id === selectedProjectId) || null;
  const canEditProject =
    currentEmployee.role === 'Admin' ||
    (isProjectLead && selectedProject?.employeeId === currentEmployee.employeeId);

  useEffect(() => {
    if (!selectedProject) {
      setForm({
        probableCompletionDate: '',
        actualCompletionDate: '',
        remarks: '',
      });
      return;
    }

    setForm({
      probableCompletionDate: selectedProject.probableCompletionDate || '',
      actualCompletionDate: selectedProject.actualCompletionDate || '',
      remarks: selectedProject.remarks || '',
    });
  }, [selectedProject]);

  function handleChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    if (!selectedProject || !canEditProject) {
      return;
    }

    try {
      setIsSaving(true);
      setMessage('');

      const response = await apiRequest(`/project-closure/${selectedProject.projectNumber}`, {
        method: 'PUT',
        body: JSON.stringify({
          probableCompletionDate: isProjectLead ? form.probableCompletionDate : undefined,
          actualCompletionDate: !isProjectLead ? form.actualCompletionDate : undefined,
          remarks: form.remarks,
        }),
      });

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.projectNumber === selectedProject.projectNumber
            ? {
                ...project,
                previousProbableCompletionDate: response.closure.previousProbableCompletionDate,
                probableCompletionDate: response.closure.probableCompletionDate,
                actualCompletionDate: response.closure.actualCompletionDate,
                remarks: response.closure.remarks,
                status: response.projectStatus,
              }
            : project,
        ),
      );

      setMessage(response.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  const leaderTableColumns = isProjectLead
    ? [
        { key: 'projectNumber', label: 'Project Number' },
        { key: 'employeeName', label: 'Project Leader' },
        {
          key: 'previousProbableCompletionDate',
          label: 'Previous Probable Date',
          render: (row) =>
            row.previousProbableCompletionDate ? formatDate(row.previousProbableCompletionDate) : '-',
        },
        {
          key: 'probableCompletionDate',
          label: 'Current Probable Date',
          render: (row) => (row.probableCompletionDate ? formatDate(row.probableCompletionDate) : '-'),
        },
        { key: 'remarks', label: 'Remarks' },
        {
          key: 'status',
          label: 'Status',
          render: (row) => (
            <span className={`status-pill status-${row.status.toLowerCase().replace(/\s+/g, '-')}`}>{row.status}</span>
          ),
        },
      ]
    : [
        { key: 'projectNumber', label: 'Project Number' },
        { key: 'employeeName', label: 'Project Leader' },
        {
          key: 'previousProbableCompletionDate',
          label: 'Previous Probable Date',
          render: (row) =>
            row.previousProbableCompletionDate ? formatDate(row.previousProbableCompletionDate) : '-',
        },
        {
          key: 'probableCompletionDate',
          label: 'Current Probable Date',
          render: (row) => (row.probableCompletionDate ? formatDate(row.probableCompletionDate) : '-'),
        },
        {
          key: 'actualCompletionDate',
          label: 'Actual Date of Completion',
          render: (row) => (row.actualCompletionDate ? formatDate(row.actualCompletionDate) : '-'),
        },
        { key: 'remarks', label: 'Remarks' },
        {
          key: 'status',
          label: 'Status',
          render: (row) => (
            <span className={`status-pill status-${row.status.toLowerCase().replace(/\s+/g, '-')}`}>{row.status}</span>
          ),
        },
      ];

  return (
    <section className="page-section">
      <div className="section-toolbar">
        <div className="section-heading">
          <h2>Project leader form</h2>
        </div>
      </div>

      <div className="content-grid two-column">
        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isProjectLead ? 'Probable Completion Entry' : 'Completion Entry'}</p>
              <h3>{isProjectLead ? 'Probable completion and remarks' : 'Actual completion and remarks'}</h3>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Select Project
              <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                {visibleProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {`${project.projectNumber} | ${project.title}`}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Project Leader
              <input type="text" value={selectedProject?.employeeName || ''} readOnly />
            </label>

            <label>
              Employee ID
              <input type="text" value={selectedProject?.employeeId || ''} readOnly />
            </label>

            <label>
              Division
              <input type="text" value={selectedProject?.division || ''} readOnly />
            </label>

            {isProjectLead ? (
              <>
                <label>
                  Previous Probable Date of Completion
                  <input
                    type="text"
                    value={
                      selectedProject?.previousProbableCompletionDate
                        ? formatDate(selectedProject.previousProbableCompletionDate)
                        : 'No previous date'
                    }
                    readOnly
                  />
                </label>

                <label>
                  Current Probable Date of Completion
                  <input
                    type="date"
                    value={form.probableCompletionDate}
                    onChange={(event) => handleChange('probableCompletionDate', event.target.value)}
                    disabled={!canEditProject}
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Previous Probable Date of Completion
                  <input
                    type="text"
                    value={
                      selectedProject?.previousProbableCompletionDate
                        ? formatDate(selectedProject.previousProbableCompletionDate)
                        : 'No previous date'
                    }
                    readOnly
                  />
                </label>

                <label>
                  Current Probable Date of Completion
                  <input
                    type="text"
                    value={selectedProject?.probableCompletionDate ? formatDate(selectedProject.probableCompletionDate) : 'Not updated'}
                    readOnly
                  />
                </label>

                <label>
                  Actual Date of Completion
                  <input
                    type="date"
                    value={form.actualCompletionDate}
                    onChange={(event) => handleChange('actualCompletionDate', event.target.value)}
                    disabled={!canEditProject}
                  />
                </label>
              </>
            )}

            <label className="full-span">
              Remarks
              <textarea
                value={form.remarks}
                onChange={(event) => handleChange('remarks', event.target.value)}
                placeholder="Enter remarks"
                disabled={!canEditProject}
                rows="5"
              />
            </label>

            <div className="form-actions">
              <Button onClick={handleSave} disabled={!canEditProject || isSaving}>
                {isSaving ? 'Saving...' : 'Save Leader Form'}
              </Button>
              <div className="inline-note">
                {canEditProject
                  ? isProjectLead
                    ? 'You can update the probable completion date for your assigned project.'
                    : 'You can update this form.'
                  : 'Only the assigned project leader or admin can update this form.'}
              </div>
            </div>
          </div>

          {message ? <div className="notice">{message}</div> : null}
        </section>

        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Completion Snapshot</p>
              <h3>Selected record details</h3>
            </div>
          </div>

          <div className="detail-grid">
            <div>
              <span>Project Number</span>
              <strong>{selectedProject?.projectNumber || 'Not selected'}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{selectedProject?.status || 'Not selected'}</strong>
            </div>
            <div>
              <span>Planned Completion</span>
              <strong>{selectedProject?.completionDate ? formatDate(selectedProject.completionDate) : 'Not selected'}</strong>
            </div>
            {!isProjectLead ? (
              <div>
                <span>Leader Probable Completion</span>
                <strong>
                  {selectedProject?.probableCompletionDate
                    ? formatDate(selectedProject.probableCompletionDate)
                    : 'Not updated'}
                </strong>
              </div>
            ) : null}
            <div>
              <span>{isProjectLead ? 'Current Probable Completion' : 'Actual Completion'}</span>
              <strong>
                {isProjectLead
                  ? selectedProject?.probableCompletionDate
                    ? formatDate(selectedProject.probableCompletionDate)
                    : 'Not updated'
                  : selectedProject?.actualCompletionDate
                    ? formatDate(selectedProject.actualCompletionDate)
                    : 'Not updated'}
              </strong>
            </div>
          </div>
        </section>
      </div>

      <section className="surface-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Leader Form Records</p>
            <h3>{isProjectLead ? 'Probable completion table' : 'Completion table'}</h3>
          </div>
        </div>

        <Table
          columns={leaderTableColumns}
          rows={visibleProjects}
          emptyTitle="No leader form entries"
          emptyDescription="Completion details will appear here when page 3 is filled."
        />
      </section>
    </section>
  );
}

export default Reports;
