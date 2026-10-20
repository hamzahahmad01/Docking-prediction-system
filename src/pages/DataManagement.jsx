import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Table from '../components/Table.jsx';
import { apiRequest } from '../utils/api.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

const emptyForm = {
  projectNumber: '',
  title: '',
  employeeId: '',
  sponsoredBy: '',
  startDate: '',
  completionDate: '',
  revisedCompletionDate: '',
  projectCost: '',
  status: 'Ongoing',
};

function DataManagement({ projects, setProjects }) {
  const [employees, setEmployees] = useState([]);
  const [fundingAgencies, setFundingAgencies] = useState([]);
  const [nextProjectNumber, setNextProjectNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoadingReferences, setIsLoadingReferences] = useState(true);

  useEffect(() => {
    loadReferences();
  }, []);

  useEffect(() => {
    if (!editingId) {
      loadNextProjectNumber();
    }
  }, [editingId]);

  async function loadReferences() {
    try {
      setIsLoadingReferences(true);
      const [employeeData, agencyData] = await Promise.all([
        apiRequest('/employee'),
        apiRequest('/funding-agency'),
      ]);

      setEmployees(
        employeeData.map((employee) => ({
          employeeId: employee.emp_id,
          name: employee.emp_name,
          division: employee.div_name,
          designation: employee.position,
          role: employee.member_type,
        })),
      );
      setFundingAgencies(
        agencyData
          .map((agency) => ({
            serialNo: agency.serial_no,
            agencyName: agency.agency_name,
          }))
          .sort((left, right) => left.agencyName.localeCompare(right.agencyName)),
      );
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoadingReferences(false);
    }
  }

  async function loadNextProjectNumber() {
    try {
      const response = await apiRequest('/project/next-number');
      setNextProjectNumber(response.projectNumber || '');
      setForm((current) => ({
        ...current,
        projectNumber: response.projectNumber || '',
      }));
    } catch (error) {
      setMessage(error.message);
    }
  }

  const selectedEmployee = employees.find((employee) => employee.employeeId === form.employeeId) || null;

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm((current) => ({
      ...emptyForm,
      projectNumber: nextProjectNumber,
    }));
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedEmployee) {
      setMessage('Please select an employee ID before saving the project.');
      return;
    }

    const existingProject = editingId
      ? projects.find((project) => project.projectNumber === editingId || project.id === editingId) || null
      : null;

      const projectPayload = {
      projectNumber: editingId || form.projectNumber,
      title: form.title,
      employeeId: selectedEmployee.employeeId,
      employeeName: selectedEmployee.name,
      division: selectedEmployee.division,
      sponsoredBy: form.sponsoredBy,
      startDate: form.startDate,
      completionDate: form.completionDate,
      projectCost: Number(form.projectCost),
      status: form.status,
      milestoneMaturityDate: existingProject?.milestoneMaturityDate || '',
      milestoneStatus: existingProject?.milestoneStatus || 'Pending',
      probableMilestoneDate: existingProject?.probableMilestoneDate || '',
      probableCompletionDate: form.revisedCompletionDate || existingProject?.probableCompletionDate || form.completionDate,
      previousProbableCompletionDate: existingProject?.previousProbableCompletionDate || '',
      actualCompletionDate: existingProject?.actualCompletionDate || '',
      remarks: existingProject?.remarks || '',
    };

    try {
      setIsSaving(true);

      const payload = {
        title: form.title,
        employeeId: selectedEmployee.employeeId,
        sponsoredBy: form.sponsoredBy.trim(),
        startDate: form.startDate,
        completionDate: form.completionDate,
        projectCost: Number(form.projectCost),
        status: form.status,
      };

      if (editingId) {
        const response = await apiRequest(`/project/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        let closure = null;
        let projectStatus = response.project.status;

        if (form.revisedCompletionDate) {
          const closureResponse = await apiRequest(`/project-closure/${editingId}`, {
            method: 'PUT',
            body: JSON.stringify({
              probableCompletionDate: form.revisedCompletionDate,
              remarks: existingProject?.remarks || '',
            }),
          });

          closure = closureResponse.closure;
          projectStatus = closureResponse.projectStatus;
        }

        setProjects((currentProjects) =>
          currentProjects.map((project) =>
            project.projectNumber === editingId || project.id === editingId
              ? {
                  ...projectPayload,
                  ...response.project,
                  previousProbableCompletionDate: closure?.previousProbableCompletionDate || response.project.previousProbableCompletionDate || project.previousProbableCompletionDate || '',
                  probableCompletionDate: closure?.probableCompletionDate || projectPayload.probableCompletionDate,
                  actualCompletionDate: closure?.actualCompletionDate || response.project.actualCompletionDate || project.actualCompletionDate || '',
                  remarks: closure?.remarks || response.project.remarks || project.remarks || '',
                  status: projectStatus || response.project.status,
                }
              : project,
          ),
        );
        setMessage(response.message);
      } else {
        const response = await apiRequest('/project', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        let closure = null;
        let projectStatus = response.project.status;

        if (form.revisedCompletionDate) {
          const closureResponse = await apiRequest(`/project-closure/${response.project.projectNumber}`, {
            method: 'PUT',
            body: JSON.stringify({
              probableCompletionDate: form.revisedCompletionDate,
              remarks: '',
            }),
          });

          closure = closureResponse.closure;
          projectStatus = closureResponse.projectStatus;
        }

        setProjects((currentProjects) =>
          [{
            ...projectPayload,
            ...response.project,
            previousProbableCompletionDate: closure?.previousProbableCompletionDate || response.project.previousProbableCompletionDate || '',
            probableCompletionDate: closure?.probableCompletionDate || projectPayload.probableCompletionDate,
            actualCompletionDate: closure?.actualCompletionDate || response.project.actualCompletionDate || '',
            remarks: closure?.remarks || response.project.remarks || '',
            status: projectStatus || response.project.status,
          }, ...currentProjects].sort((left, right) =>
            left.projectNumber.localeCompare(right.projectNumber),
          ),
        );
        setMessage(response.message);
        await loadNextProjectNumber();
      }

      resetForm();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (project) => {
    setEditingId(project.projectNumber);
    setForm({
      projectNumber: project.projectNumber,
      title: project.title,
      employeeId: project.employeeId,
      sponsoredBy: project.sponsoredBy,
      startDate: project.startDate,
      completionDate: project.completionDate,
      revisedCompletionDate: project.probableCompletionDate || '',
      projectCost: String(project.projectCost),
      status: project.status,
    });
  };

  return (
    <section className="page-section">
      <div className="section-toolbar">
        <div className="section-heading">
          <h2>Project registration</h2>
        </div>
      </div>

      <div className="content-grid two-column">
        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Admin Entry</p>
              <h3>Create or update project record</h3>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Project Number
              <input
                type="text"
                value={form.projectNumber}
                readOnly
                placeholder="Auto generated"
              />
            </label>

            <label>
              Project Title
              <input
                type="text"
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                placeholder="Enter project title"
                required
              />
            </label>

            <label>
              Employee ID
              <select
                value={form.employeeId}
                onChange={(event) => handleChange('employeeId', event.target.value)}
                required
                disabled={isLoadingReferences}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.employeeId} value={employee.employeeId}>
                    {`${employee.employeeId} - ${employee.name}`}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Division
              <input type="text" value={selectedEmployee?.division || ''} placeholder="Auto filled from employee" readOnly />
            </label>

            <label>
              Sponsored By
              <select
                value={form.sponsoredBy}
                onChange={(event) => handleChange('sponsoredBy', event.target.value)}
                required
                disabled={isLoadingReferences}
              >
                <option value="">Select funding agency</option>
                {fundingAgencies.map((agency) => (
                  <option key={agency.serialNo} value={agency.agencyName}>
                    {agency.agencyName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date of Start
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => handleChange('startDate', event.target.value)}
                required
              />
            </label>

            <label>
              Date of Completion
              <input
                type="date"
                value={form.completionDate}
                onChange={(event) => handleChange('completionDate', event.target.value)}
                required
              />
            </label>

            <label>
              Revised Completion Date
              <input
                type="date"
                value={form.revisedCompletionDate}
                onChange={(event) => handleChange('revisedCompletionDate', event.target.value)}
              />
            </label>

            <label>
              Project Cost
              <input
                type="number"
                value={form.projectCost}
                onChange={(event) => handleChange('projectCost', event.target.value)}
                placeholder="Enter project cost"
                required
              />
            </label>

            <label>
              Project Status
              <select value={form.status} onChange={(event) => handleChange('status', event.target.value)}>
                <option value="Ongoing">Ongoing</option>
                <option value="Milestone Pending">Milestone Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </label>

            <div className="form-actions">
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : editingId ? 'Update Project' : 'Save Project'}</Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={isSaving}>
                Clear
              </Button>
              <div className="inline-note">
                {isLoadingReferences
                  ? 'Loading employee and funding agency records...'
                  : `${employees.length} employee records and ${fundingAgencies.length} funding agencies available`}
              </div>
            </div>
          </form>

          {message ? <div className="notice">{message}</div> : null}
        </section>

        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Selected Employee</p>
              <h3>Employee and division preview</h3>
            </div>
          </div>

          <div className="detail-grid">
            <div>
              <span>Employee Name</span>
              <strong>{selectedEmployee?.name || 'Not selected'}</strong>
            </div>
            <div>
              <span>Division</span>
              <strong>{selectedEmployee?.division || 'Not selected'}</strong>
            </div>
            <div>
              <span>Designation</span>
              <strong>{selectedEmployee?.designation || 'Not selected'}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>{selectedEmployee?.role || 'Not selected'}</strong>
            </div>
            <div>
              <span>Revised Completion</span>
              <strong>{form.revisedCompletionDate ? formatDate(form.revisedCompletionDate) : 'Not selected'}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="surface-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Registered Projects</p>
            <h3>Saved project list</h3>
          </div>
        </div>

        <Table
          columns={[
            { key: 'projectNumber', label: 'Project No.' },
            { key: 'title', label: 'Project Title' },
            { key: 'employeeId', label: 'Employee ID' },
            { key: 'division', label: 'Division' },
            { key: 'sponsoredBy', label: 'Sponsored By' },
            { key: 'startDate', label: 'Start', render: (row) => formatDate(row.startDate) },
            { key: 'completionDate', label: 'Completion', render: (row) => formatDate(row.completionDate) },
            {
              key: 'probableCompletionDate',
              label: 'Revised Completion',
              render: (row) => (row.probableCompletionDate ? formatDate(row.probableCompletionDate) : '-'),
            },
            { key: 'projectCost', label: 'Cost', render: (row) => formatCurrency(row.projectCost) },
            {
              key: 'status',
              label: 'Status',
              render: (row) => (
                <span className={`status-pill status-${row.status.toLowerCase().replace(/\s+/g, '-')}`}>{row.status}</span>
              ),
            },
          ]}
          rows={projects}
          actions={[
            {
              label: 'Edit',
              variant: 'secondary',
              onClick: handleEdit,
            },
          ]}
          emptyTitle="No project records"
          emptyDescription="Projects saved from the form will appear here."
        />
      </section>
    </section>
  );
}

export default DataManagement;
