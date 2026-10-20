import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Table from '../components/Table.jsx';
import { DatabaseIcon, ShieldIcon, TeamIcon } from '../components/Icons.jsx';
import { apiRequest } from '../utils/api.js';

const emptyForm = {
  emp_id: '',
  emp_name: '',
  division_id: '',
  member_type: 'Team Member',
};

function EmployeeManagement({ currentEmployee }) {
  const [employees, setEmployees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const isAdmin = currentEmployee.role === 'Admin';
  const isReadOnlyDelete = !isAdmin;

  useEffect(() => {
    loadModuleData();
  }, []);

  async function loadModuleData() {
    try {
      setIsLoading(true);
      const [employeeData, divisionData] = await Promise.all([
        apiRequest('/employee'),
        apiRequest('/division'),
      ]);
      setEmployees(employeeData);
      setDivisions(divisionData);
      setFeedback({ type: '', message: '' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  const divisionOptions = useMemo(
    () =>
      divisions
        .slice()
        .sort((left, right) => left.div_name.localeCompare(right.div_name) || left.div_id - right.div_id),
    [divisions],
  );

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
    if (!form.emp_id.trim()) {
      return 'Employee ID is required.';
    }

    if (!form.emp_name.trim()) {
      return 'Employee name is required.';
    }

    if (!form.division_id) {
      return 'Please select a division.';
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
        emp_id: form.emp_id.trim(),
        emp_name: form.emp_name.trim(),
        division_id: Number(form.division_id),
        member_type: form.member_type,
        position:
          employees.find((employee) => employee.emp_id === editingId)?.position ||
          form.member_type,
      };

      if (editingId) {
        const response = await apiRequest(`/employee/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        setEmployees((current) =>
          current.map((employee) => (employee.emp_id === editingId ? response.employee : employee)),
        );
        setFeedback({ type: 'success', message: response.message });
      } else {
        const response = await apiRequest('/employee', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setEmployees((current) =>
          [...current, response.employee].sort((left, right) => left.emp_id.localeCompare(right.emp_id)),
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

  function handleEdit(employee) {
    setEditingId(employee.emp_id);
    setForm({
      emp_id: employee.emp_id,
      emp_name: employee.emp_name,
      division_id: String(employee.division_id),
      member_type: employee.member_type,
    });
    setFeedback({ type: '', message: '' });
  }

  async function handleDelete(employee) {
    if (isReadOnlyDelete) {
      setFeedback({ type: 'error', message: 'Only Admin can delete employee records.' });
      return;
    }

    const confirmed = window.confirm(`Delete employee "${employee.emp_id}"?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiRequest(`/employee/${employee.emp_id}`, {
        method: 'DELETE',
      });

      setEmployees((current) => current.filter((item) => item.emp_id !== employee.emp_id));
      setFeedback({ type: 'success', message: response.message });

      if (editingId === employee.emp_id) {
        resetForm();
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  }

  const hodCount = employees.filter((employee) => employee.member_type === 'HOD').length;
  const teamMemberCount = employees.filter((employee) => employee.member_type === 'Team Member').length;

  return (
    <section className="page-section">
      <div className="section-toolbar">
        <div className="section-heading">
          <h2>Employee Management</h2>
        </div>
      </div>

      <div className="metric-grid">
        <Card
          title="Registered Employees"
          value={employees.length}
          icon={TeamIcon}
          tone="blue"
          meta="Live employee records available for project workflows"
        />
        <Card
          title="Division Heads"
          value={hodCount}
          icon={ShieldIcon}
          tone="slate"
          meta="Employees marked as HOD in the current register"
        />
        <Card
          title="Team Members"
          value={teamMemberCount}
          icon={DatabaseIcon}
          tone="green"
          meta="Operational staff available for assignment and coordination"
        />
      </div>

      <div className="content-grid two-column">
        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Employee Registry</p>
              <h3>{editingId ? 'Edit employee record' : 'Add employee record'}</h3>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Employee ID
              <input
                type="text"
                value={form.emp_id}
                onChange={(event) => handleChange('emp_id', event.target.value.toUpperCase())}
                placeholder="EMP006"
                disabled={Boolean(editingId)}
              />
            </label>

            <label>
              Employee Name
              <input
                type="text"
                value={form.emp_name}
                onChange={(event) => handleChange('emp_name', event.target.value)}
                placeholder="Enter employee name"
              />
            </label>

            <label>
              Division
              <select
                value={form.division_id}
                onChange={(event) => handleChange('division_id', event.target.value)}
              >
                <option value="">Select division</option>
                {divisionOptions.map((division) => (
                  <option key={division.div_id} value={division.div_id}>
                    {`${division.div_name} (${division.div_id})`}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Member Type
              <select
                value={form.member_type}
                onChange={(event) => handleChange('member_type', event.target.value)}
              >
                <option value="HOD">HOD</option>
                <option value="Team Member">Team Member</option>
              </select>
            </label>

            <div className="form-actions">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingId ? 'Update Employee' : 'Add Employee'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={isSaving}>
                Clear
              </Button>
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
              <p className="eyebrow">Module Notes</p>
              <h3>Employee registry control</h3>
            </div>
          </div>

          <div className="rules-list">
            <article>
              <strong>Existing tables preserved</strong>
              <p>The module uses the current employees table and live division mapping already present in MySQL.</p>
            </article>
            <article>
              <strong>Linked division selection</strong>
              <p>Every employee is attached to a stored division record, which keeps project assignment data consistent.</p>
            </article>
            <article>
              <strong>Role-aware actions</strong>
              <p>Admin can create, edit, and delete. DEO can create and edit, while deletion remains restricted.</p>
            </article>
          </div>
        </section>
      </div>

      <section className="surface-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Employee Records</p>
            <h3>Official employee register</h3>
          </div>
          <Button type="button" variant="secondary" onClick={loadModuleData} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {isLoading ? (
          <div className="loading-panel">Loading employee records...</div>
        ) : (
          <Table
            columns={[
              { key: 'emp_id', label: 'Employee ID' },
              { key: 'emp_name', label: 'Employee Name' },
              { key: 'div_name', label: 'Division' },
              { key: 'member_type', label: 'Member Type' },
            ]}
            rows={employees}
            rowKey={(row) => row.emp_id}
            actions={[
              {
                label: 'Edit',
                variant: 'secondary',
                onClick: handleEdit,
              },
              {
                label: 'Delete',
                variant: 'danger',
                disabled: () => isReadOnlyDelete,
                onClick: handleDelete,
              },
            ]}
            emptyTitle="No employee records found"
            emptyDescription="Add the first employee record to enable assignment across project workflows."
          />
        )}
      </section>
    </section>
  );
}

export default EmployeeManagement;
