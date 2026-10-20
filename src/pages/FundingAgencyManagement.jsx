import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Table from '../components/Table.jsx';
import { DatabaseIcon, ReportIcon, ShieldIcon } from '../components/Icons.jsx';
import { apiRequest } from '../utils/api.js';

const emptyForm = {
  agency_name: '',
  email: '',
  address: '',
  agency_type: 'Govt',
};

function FundingAgencyManagement() {
  const [fundingAgencies, setFundingAgencies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    loadFundingAgencies();
  }, []);

  async function loadFundingAgencies() {
    try {
      setIsLoading(true);
      const data = await apiRequest('/funding-agency');
      setFundingAgencies(data);
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
    if (!form.agency_name.trim()) {
      return 'Agency name is required.';
    }

    if (!form.email.trim()) {
      return 'Email is required.';
    }

    if (!form.address.trim()) {
      return 'Address is required.';
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
        agency_name: form.agency_name.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        agency_type: form.agency_type,
      };

      if (editingId) {
        const response = await apiRequest(`/funding-agency/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        setFundingAgencies((current) =>
          current.map((agency) => (agency.serial_no === editingId ? response.fundingAgency : agency)),
        );
        setFeedback({ type: 'success', message: response.message });
      } else {
        const response = await apiRequest('/funding-agency', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setFundingAgencies((current) =>
          [...current, response.fundingAgency].sort((left, right) => left.serial_no - right.serial_no),
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

  function handleEdit(fundingAgency) {
    setEditingId(fundingAgency.serial_no);
    setForm({
      agency_name: fundingAgency.agency_name,
      email: fundingAgency.email,
      address: fundingAgency.address,
      agency_type: fundingAgency.agency_type,
    });
    setFeedback({ type: '', message: '' });
  }

  async function handleDelete(fundingAgency) {
    const confirmed = window.confirm(`Delete funding agency "${fundingAgency.agency_name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiRequest(`/funding-agency/${fundingAgency.serial_no}`, {
        method: 'DELETE',
      });

      setFundingAgencies((current) => current.filter((item) => item.serial_no !== fundingAgency.serial_no));
      setFeedback({ type: 'success', message: response.message });

      if (editingId === fundingAgency.serial_no) {
        resetForm();
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  }

  const govtAgencies = fundingAgencies.filter((agency) => agency.agency_type === 'Govt').length;
  const foreignAgencies = fundingAgencies.filter((agency) => agency.agency_type === 'Foreign').length;

  return (
    <section className="page-section">
      <div className="section-toolbar">
        <div className="section-heading">
          <h2>Funding Agency Management</h2>
        </div>
      </div>

      <div className="metric-grid">
        <Card
          title="Registered Agencies"
          value={fundingAgencies.length}
          icon={DatabaseIcon}
          tone="blue"
          meta="Available sponsor records in the funding agency register"
        />
        <Card
          title="Government Agencies"
          value={govtAgencies}
          icon={ShieldIcon}
          tone="slate"
          meta="Funding agencies marked under the government category"
        />
        <Card
          title="Foreign Agencies"
          value={foreignAgencies}
          icon={ReportIcon}
          tone="green"
          meta="External funding agencies available for project mapping"
        />
      </div>

      <div className="content-grid two-column">
        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Agency Register</p>
              <h3>{editingId ? 'Edit funding agency record' : 'Add funding agency record'}</h3>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Agency Name
              <input
                type="text"
                value={form.agency_name}
                onChange={(event) => handleChange('agency_name', event.target.value)}
                placeholder="Enter agency name"
              />
            </label>

            <label>
              Agency Type
              <select
                value={form.agency_type}
                onChange={(event) => handleChange('agency_type', event.target.value)}
              >
                <option value="Govt">Govt</option>
                <option value="PSU">PSU</option>
                <option value="Pvt">Pvt</option>
                <option value="Foreign">Foreign</option>
              </select>
            </label>

            <label className="full-span">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="agency@example.org"
              />
            </label>

            <label className="full-span">
              Address
              <textarea
                value={form.address}
                onChange={(event) => handleChange('address', event.target.value)}
                placeholder="Enter official address"
              />
            </label>

            <div className="form-actions">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingId ? 'Update Agency' : 'Add Agency'}
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
              <h3>Funding agency control</h3>
            </div>
          </div>

          <div className="rules-list">
            <article>
              <strong>Existing database preserved</strong>
              <p>The module uses the current funding_agencies table without redesigning the stored schema.</p>
            </article>
            <article>
              <strong>Project mapping ready</strong>
              <p>Agency names maintained here can be used directly by the project registration flow and linked by backend mapping.</p>
            </article>
            <article>
              <strong>Category-aware records</strong>
              <p>Each funding agency remains grouped by the existing database categories: Govt, PSU, Pvt, and Foreign.</p>
            </article>
          </div>
        </section>
      </div>

      <section className="surface-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Funding Agency Records</p>
            <h3>Official sponsor register</h3>
          </div>
          <Button type="button" variant="secondary" onClick={loadFundingAgencies} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {isLoading ? (
          <div className="loading-panel">Loading funding agency records...</div>
        ) : (
          <Table
            columns={[
              { key: 'serial_no', label: 'Serial No.' },
              { key: 'agency_name', label: 'Agency Name' },
              { key: 'agency_type', label: 'Agency Type' },
              { key: 'email', label: 'Email' },
              { key: 'address', label: 'Address' },
            ]}
            rows={fundingAgencies}
            rowKey={(row) => row.serial_no}
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
            emptyTitle="No funding agency records found"
            emptyDescription="Add the first funding agency record to build the sponsor master data."
          />
        )}
      </section>
    </section>
  );
}

export default FundingAgencyManagement;
