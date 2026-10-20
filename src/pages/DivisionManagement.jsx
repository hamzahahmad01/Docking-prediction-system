import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Table from '../components/Table.jsx';
import { DatabaseIcon, ShieldIcon } from '../components/Icons.jsx';
import { apiRequest } from '../utils/api.js';

const emptyForm = {
  div_name: '',
  employee_name: '',
};

function DivisionManagement() {
  const [divisions, setDivisions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    loadDivisions();
  }, []);

  async function loadDivisions() {
    try {
      setIsLoading(true);
      const data = await apiRequest('/division');
      setDivisions(data);
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
    if (!form.div_name.trim()) {
      return 'Division name is required.';
    }

    if (!form.employee_name.trim()) {
      return 'Employee name is required.';
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
        div_name: form.div_name.trim(),
        employee_name: form.employee_name.trim(),
      };

      if (editingId) {
        const response = await apiRequest(`/division/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        setDivisions((current) =>
          current.map((division) =>
            division.div_id === editingId ? response.division : division,
          ),
        );
        setFeedback({ type: 'success', message: response.message });
      } else {
        const response = await apiRequest('/division', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setDivisions((current) => [...current, response.division].sort((a, b) => a.div_id - b.div_id));
        setFeedback({ type: 'success', message: response.message });
      }

      resetForm();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(division) {
    setEditingId(division.div_id);
    setForm({
      div_name: division.div_name,
      employee_name: division.employee_name,
    });
    setFeedback({ type: '', message: '' });
  }

  async function handleDelete(division) {
    const confirmed = window.confirm(`Delete division "${division.div_name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiRequest(`/division/${division.div_id}`, {
        method: 'DELETE',
      });

      setDivisions((current) => current.filter((item) => item.div_id !== division.div_id));
      setFeedback({ type: 'success', message: response.message });

      if (editingId === division.div_id) {
        resetForm();
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  }

  const totalDivisions = divisions.length;
  const distinctOfficers = new Set(divisions.map((division) => division.employee_name)).size;

  return (
    <section className="page-section">
      <div className="section-toolbar">
        <div className="section-heading">
          <h2>Division Management</h2>
        </div>
      </div>

      <div className="metric-grid">
        <Card
          title="Registered Divisions"
          value={totalDivisions}
          icon={DatabaseIcon}
          tone="blue"
          meta="Division records available in the master table"
        />
        <Card
          title="Mapped Officers"
          value={distinctOfficers}
          icon={ShieldIcon}
          tone="slate"
          meta="Named officers linked with division ownership"
        />
      </div>

      <div className="content-grid two-column">
        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Division Registry</p>
              <h3>{editingId ? 'Edit division record' : 'Add division record'}</h3>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Division ID
              <input
                type="text"
                value={editingId ? String(editingId) : 'Auto generated by system'}
                readOnly
              />
            </label>

            <label>
              Division Name
              <input
                type="text"
                value={form.div_name}
                onChange={(event) => handleChange('div_name', event.target.value)}
                placeholder="Enter official division name"
              />
            </label>

            <label className="full-span">
              Employee Name
              <input
                type="text"
                value={form.employee_name}
                onChange={(event) => handleChange('employee_name', event.target.value)}
                placeholder="Enter responsible officer name"
              />
            </label>

            <div className="form-actions">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingId ? 'Update Division' : 'Add Division'}
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
              <h3>Division data control</h3>
            </div>
          </div>

          <div className="rules-list">
            <article>
              <strong>Existing table preserved</strong>
              <p>The module uses the current divisions structure with division ID, division name, and employee name.</p>
            </article>
            <article>
              <strong>Live database persistence</strong>
              <p>All create, update, and delete actions are sent to Express and stored in MySQL.</p>
            </article>
            <article>
              <strong>Division names can repeat</strong>
              <p>Multiple employees can be recorded under the same division name, which fits the current table design.</p>
            </article>
          </div>
        </section>
      </div>

      <section className="surface-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Division Records</p>
            <h3>Official division register</h3>
          </div>
          <Button type="button" variant="secondary" onClick={loadDivisions} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {isLoading ? (
          <div className="loading-panel">Loading division records...</div>
        ) : (
          <Table
            columns={[
              { key: 'div_id', label: 'Division ID' },
              { key: 'div_name', label: 'Division Name' },
              { key: 'employee_name', label: 'Employee Name' },
            ]}
            rows={divisions}
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
            emptyTitle="No division records found"
            emptyDescription="Add the first division record to initialize the master table."
          />
        )}
      </section>
    </section>
  );
}

export default DivisionManagement;
