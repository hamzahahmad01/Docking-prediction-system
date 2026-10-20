import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Table from '../components/Table.jsx';
import { BriefcaseIcon, CheckFileIcon, DatabaseIcon } from '../components/Icons.jsx';
import { apiRequest } from '../utils/api.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

const emptyForm = {
  projectNumber: '',
  milestoneCompletionDateAgreement: '',
  projectLeader: '',
  description: '',
};

function Prediction({ projects, currentEmployee }) {
  const [milestones, setMilestones] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    loadMilestones();
  }, []);

  const projectOptions = useMemo(
    () =>
      projects
        .slice()
        .sort((left, right) => left.projectNumber.localeCompare(right.projectNumber)),
    [projects],
  );

  const selectedProject =
    projectOptions.find((project) => project.projectNumber === form.projectNumber || project.id === form.projectNumber) || null;

  useEffect(() => {
    setForm((current) => ({
      ...current,
      projectLeader: selectedProject?.employeeName || '',
    }));
  }, [selectedProject]);

  async function loadMilestones() {
    try {
      setIsLoading(true);
      const data = await apiRequest('/milestone');
      setMilestones(data);
      setFeedback({ type: '', message: '' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function validateForm() {
    if (!form.projectNumber) {
      return 'Project number is required.';
    }

    if (!form.milestoneCompletionDateAgreement) {
      return 'Milestone completion date is required.';
    }

    if (!form.projectLeader.trim()) {
      return 'Project leader is required.';
    }

    if (!form.description.trim()) {
      return 'Milestone description is required.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationMessage = validateForm();

    if (validationMessage) {
      setFeedback({ type: 'error', message: validationMessage });
      return;
    }

    try {
      setIsSaving(true);
      setFeedback({ type: '', message: '' });

      const payload = {
        projectNumber: form.projectNumber,
        milestoneCompletionDateAgreement: form.milestoneCompletionDateAgreement,
        pi: form.projectLeader.trim(),
        description: form.description.trim(),
      };

      if (editingId) {
        const response = await apiRequest(`/milestone/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        setMilestones((current) =>
          current.map((milestone) => (milestone.serialNo === editingId ? response.milestone : milestone)),
        );
        setFeedback({ type: 'success', message: response.message });
      } else {
        const response = await apiRequest('/milestone', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setMilestones((current) =>
          [...current, response.milestone].sort((left, right) => left.serialNo - right.serialNo),
        );
        setFeedback({ type: 'success', message: response.message });
      }

      resetForm();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(milestone) {
    setEditingId(milestone.serialNo);
    setForm({
      projectNumber: milestone.projectNumber,
      milestoneCompletionDateAgreement: milestone.milestoneCompletionDateAgreement,
      projectLeader: milestone.pi,
      description: milestone.description,
    });
    setFeedback({ type: '', message: '' });
  }

  async function handleDelete(milestone) {
    const confirmed = window.confirm(`Delete milestone record ${milestone.serialNo}?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiRequest(`/milestone/${milestone.serialNo}`, {
        method: 'DELETE',
      });

      setMilestones((current) => current.filter((item) => item.serialNo !== milestone.serialNo));
      setFeedback({ type: 'success', message: response.message });

      if (editingId === milestone.serialNo) {
        resetForm();
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  }

  const linkedProjects = new Set(milestones.map((milestone) => milestone.projectNumber)).size;
  const uniqueProjectLeaderCount = new Set(milestones.map((milestone) => milestone.pi)).size;

  return (
    <section className="page-section">
      <div className="section-toolbar">
        <div className="section-heading">
          <h2>Milestone Monitoring</h2>
        </div>
      </div>

      <div className="metric-grid">
        <Card
          title="Milestone Records"
          value={milestones.length}
          icon={DatabaseIcon}
          tone="blue"
          meta="Stored rows available in the milestone register"
        />
        <Card
          title="Linked Projects"
          value={linkedProjects}
          icon={BriefcaseIcon}
          tone="green"
          meta="Projects already mapped with milestone entries"
        />
        <Card
          title="Project Leaders"
          value={uniqueProjectLeaderCount}
          icon={CheckFileIcon}
          tone="slate"
          meta="Distinct project leader records currently stored"
        />
      </div>

      <div className="content-grid two-column">
        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Milestone Register</p>
              <h3>{editingId ? 'Edit milestone record' : 'Add milestone record'}</h3>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Project Number
              <select
                value={form.projectNumber}
                onChange={(event) => handleChange('projectNumber', event.target.value)}
              >
                <option value="">Select project</option>
                {projectOptions.map((project) => (
                  <option key={project.projectNumber} value={project.projectNumber}>
                    {`${project.projectNumber} | ${project.title}`}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Milestone Completion Date (Agreement)
              <input
                type="date"
                value={form.milestoneCompletionDateAgreement}
                onChange={(event) => handleChange('milestoneCompletionDateAgreement', event.target.value)}
              />
            </label>

            <label>
              Project Leader
              <select
                value={form.projectLeader}
                onChange={(event) => handleChange('projectLeader', event.target.value)}
              >
                <option value="">{selectedProject ? 'Select project leader' : 'Select project first'}</option>
                {selectedProject ? (
                  <option value={selectedProject.employeeName}>
                    {`${selectedProject.employeeId} - ${selectedProject.employeeName}`}
                  </option>
                ) : null}
              </select>
            </label>

            <label>
              Project Status
              <input type="text" value={selectedProject?.status || ''} readOnly placeholder="Auto filled from project" />
            </label>

            <label className="full-span">
              Description
              <textarea
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                placeholder="Enter milestone description"
              />
            </label>

            <div className="form-actions">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingId ? 'Update Milestone' : 'Add Milestone'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={isSaving}>
                Clear
              </Button>
              <div className="inline-note">{`${currentEmployee.name} can maintain this module.`}</div>
            </div>
          </form>

          {feedback.message ? (
            <div className={feedback.type === 'error' ? 'form-error notice-error' : 'notice'}>
              {feedback.message}
            </div>
          ) : null}
        </section>

        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Selected Project</p>
              <h3>Project reference snapshot</h3>
            </div>
          </div>

          <div className="detail-grid">
            <div>
              <span>Project Title</span>
              <strong>{selectedProject?.title || 'Not selected'}</strong>
            </div>
            <div>
              <span>Project Cost</span>
              <strong>{selectedProject ? formatCurrency(selectedProject.projectCost) : 'Not selected'}</strong>
            </div>
            <div>
              <span>Date of Start</span>
              <strong>{selectedProject?.startDate ? formatDate(selectedProject.startDate) : 'Not selected'}</strong>
            </div>
            <div>
              <span>Project Completion</span>
              <strong>{selectedProject?.completionDate ? formatDate(selectedProject.completionDate) : 'Not selected'}</strong>
            </div>
            <div>
              <span>Division</span>
              <strong>{selectedProject?.division || 'Not selected'}</strong>
            </div>
            <div>
              <span>Employee ID</span>
              <strong>{selectedProject?.employeeId || 'Not selected'}</strong>
            </div>
            <div>
              <span>Project Leader</span>
              <strong>{selectedProject?.employeeName || 'Not selected'}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="surface-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Milestone Records</p>
            <h3>Database milestone register</h3>
          </div>
          <Button type="button" variant="secondary" onClick={loadMilestones} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {isLoading ? (
          <div className="loading-panel">Loading milestone records...</div>
        ) : (
          <Table
            columns={[
              { key: 'serialNo', label: 'Serial No.' },
              { key: 'projectNumber', label: 'Project Number' },
              { key: 'title', label: 'Project Title' },
              {
                key: 'projectCost',
                label: 'Project Cost',
                render: (row) => formatCurrency(row.projectCost),
              },
              {
                key: 'milestoneCompletionDateAgreement',
                label: 'Agreement Date',
                render: (row) =>
                  row.milestoneCompletionDateAgreement
                    ? formatDate(row.milestoneCompletionDateAgreement)
                    : '-',
              },
              { key: 'pi', label: 'Project Leader' },
              { key: 'description', label: 'Description' },
            ]}
            rows={milestones}
            rowKey={(row) => row.serialNo}
            actions={[
              {
                label: 'Edit',
                variant: 'secondary',
                onClick: handleEdit,
              },
              {
                label: 'Delete',
                variant: 'danger',
                onClick: handleDelete,
              },
            ]}
            emptyTitle="No milestone records found"
            emptyDescription="Add the first milestone record to populate the monitoring register."
          />
        )}
      </section>
    </section>
  );
}

export default Prediction;
