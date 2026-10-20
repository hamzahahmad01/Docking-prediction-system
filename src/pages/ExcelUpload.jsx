import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Table from '../components/Table.jsx';
import { CheckFileIcon, DatabaseIcon, UploadIcon } from '../components/Icons.jsx';
import { API_BASE_URL, apiRequest } from '../utils/api.js';
import { getStoredAuthSession } from '../utils/auth.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

const defaultHistoryFilters = {
  status: '',
  fileName: '',
  uploadedBy: '',
  dateFrom: '',
  dateTo: '',
};

function ExcelUpload({ currentEmployee, setProjects }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [previewHistoryId, setPreviewHistoryId] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExportingHistory, setIsExportingHistory] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [preparedRows, setPreparedRows] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [historyFilters, setHistoryFilters] = useState(defaultHistoryFilters);
  const [summary, setSummary] = useState({
    totalRows: 0,
    readyRows: 0,
    blockedRows: 0,
  });
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const canUpload = currentEmployee.role === 'Admin' || currentEmployee.role === 'DEO';

  useEffect(() => {
    loadImportHistory();
  }, []);

  function buildHistoryQuery(filters = historyFilters) {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query.set(key, value);
      }
    });

    query.set('limit', '100');
    return query.toString();
  }

  async function downloadProtectedFile(path, fileNameToSave) {
    const session = getStoredAuthSession();
    const token = session?.token || '';

    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      let message = 'Download failed.';

      if (contentType.includes('application/json')) {
        const body = await response.json();
        message = body.message || message;
      } else {
        const text = await response.text();
        message = text || message;
      }

      throw new Error(message);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = fileNameToSave;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  async function loadImportHistory(filters = historyFilters) {
    try {
      setIsLoadingHistory(true);
      const query = buildHistoryQuery(filters);
      const response = await apiRequest(`/project-import/history?${query}`);
      setImportHistory(response.history || []);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsLoadingHistory(false);
    }
  }

  function resetImportState() {
    setPreviewRows([]);
    setPreparedRows([]);
    setPreviewHistoryId(null);
    setSummary({
      totalRows: 0,
      readyRows: 0,
      blockedRows: 0,
    });
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setFileName(file ? file.name : '');
    setFeedback({ type: '', message: '' });
    resetImportState();
  }

  async function handlePreview() {
    if (!selectedFile) {
      setFeedback({ type: 'error', message: 'Please select an Excel or CSV file first.' });
      return;
    }

    try {
      setIsPreviewing(true);
      setFeedback({ type: '', message: '' });

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await apiRequest('/project-import/preview', {
        method: 'POST',
        body: formData,
      });

      setPreviewRows(response.previewRows || []);
      setPreparedRows(response.preparedRows || []);
      setPreviewHistoryId(response.historyId || null);
      setSummary(response.summary || { totalRows: 0, readyRows: 0, blockedRows: 0 });
      setFeedback({ type: 'success', message: response.message });
      loadImportHistory(historyFilters);
    } catch (error) {
      resetImportState();
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleImport() {
    if (!preparedRows.length) {
      setFeedback({ type: 'error', message: 'There are no validated rows ready to import.' });
      return;
    }

    try {
      setIsImporting(true);
      setFeedback({ type: '', message: '' });

      const response = await apiRequest('/project-import/commit', {
        method: 'POST',
        body: JSON.stringify({
          rows: preparedRows,
          historyId: previewHistoryId,
          readyRows: summary.readyRows,
          blockedRows: summary.blockedRows,
        }),
      });

      const latestProjects = await apiRequest('/project');
      setProjects(latestProjects);
      setFeedback({
        type: 'success',
        message: `${response.message} ${response.insertedRows} row(s) inserted into the live register.`,
      });
      setSelectedFile(null);
      setFileName('');
      resetImportState();
      loadImportHistory(historyFilters);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
      loadImportHistory(historyFilters);
    } finally {
      setIsImporting(false);
    }
  }

  function handleClear() {
    setSelectedFile(null);
    setFileName('');
    setFeedback({ type: '', message: '' });
    resetImportState();
  }

  function handleHistoryFilterChange(event) {
    const { name, value } = event.target;
    setHistoryFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleApplyHistoryFilters() {
    loadImportHistory(historyFilters);
  }

  function handleResetHistoryFilters() {
    setHistoryFilters(defaultHistoryFilters);
    loadImportHistory(defaultHistoryFilters);
  }

  async function handleDownloadTemplate() {
    try {
      setIsDownloadingTemplate(true);
      setFeedback({ type: '', message: '' });
      await downloadProtectedFile('/project-import/template', 'csir-iip-project-import-template.xlsx');
      setFeedback({ type: 'success', message: 'Official project import template downloaded successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handleExportHistory() {
    try {
      setIsExportingHistory(true);
      setFeedback({ type: '', message: '' });
      const query = buildHistoryQuery(historyFilters);
      await downloadProtectedFile(`/project-import/history/export?${query}`, 'project-import-history.csv');
      setFeedback({ type: 'success', message: 'Filtered import history exported successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsExportingHistory(false);
    }
  }

  return (
    <section className="page-section">
      <div className="section-toolbar">
        <div className="section-heading">
          <h2>Excel Upload</h2>
        </div>
        <div className="section-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleDownloadTemplate}
            disabled={!canUpload || isDownloadingTemplate || isPreviewing || isImporting}
          >
            {isDownloadingTemplate ? 'Preparing Template...' : 'Download Official Template'}
          </Button>
        </div>
      </div>

      <div className="metric-grid">
        <Card
          title="Rows Detected"
          value={summary.totalRows}
          icon={DatabaseIcon}
          tone="blue"
          meta="Rows read from the selected spreadsheet"
        />
        <Card
          title="Ready to Import"
          value={summary.readyRows}
          icon={CheckFileIcon}
          tone="green"
          meta="Rows validated against employees and funding agencies"
        />
        <Card
          title="Blocked Rows"
          value={summary.blockedRows}
          icon={UploadIcon}
          tone="slate"
          meta="Rows that need correction before live import"
        />
      </div>

      <div className="content-grid two-column">
        <section className="surface-panel upload-surface">
          <div className="upload-icon">
            <UploadIcon size={34} />
          </div>
          <h3>Upload project registration sheet</h3>
          <p>
            Import project records into the live register using the same project fields already used by the backend.
          </p>

          <label className={`file-drop ${!canUpload ? 'file-drop-disabled' : ''}`}>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} disabled={!canUpload} />
            <span>{canUpload ? 'Select Excel or CSV file' : 'Upload disabled for current role'}</span>
          </label>

          {fileName ? <div className="selected-file">Selected file: {fileName}</div> : null}

          <div className="form-actions upload-actions">
            <Button type="button" onClick={handlePreview} disabled={!canUpload || !selectedFile || isPreviewing || isImporting}>
              {isPreviewing ? 'Validating...' : 'Validate File'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleImport}
              disabled={!canUpload || !preparedRows.length || isPreviewing || isImporting}
            >
              {isImporting ? 'Importing...' : 'Import Ready Rows'}
            </Button>
            <Button type="button" variant="ghost" onClick={handleClear} disabled={isPreviewing || isImporting}>
              Clear
            </Button>
          </div>

          {feedback.message ? (
            <div className={feedback.type === 'error' ? 'form-error notice-error' : 'notice'}>
              {feedback.message}
            </div>
          ) : null}

          <div className="import-checklist">
            <article>
              <strong>Required columns</strong>
              <p>Project Number, Project Title, Employee ID, Sponsored By, Start Date, Completion Date, Project Cost, and Status.</p>
            </article>
            <article>
              <strong>Database validation</strong>
              <p>Employee ID must exist in the employee register, and Sponsored By must match a stored funding agency.</p>
            </article>
            <article>
              <strong>Live insertion</strong>
              <p>Only rows marked Ready are inserted into the existing projects table when you confirm import.</p>
            </article>
          </div>
        </section>

        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Upload Summary</p>
              <h3>Import readiness snapshot</h3>
            </div>
          </div>

          <div className="rules-list">
            <article>
              <strong>Accepted files</strong>
              <p>`.xlsx`, `.xls`, and `.csv` files are supported in this module.</p>
            </article>
            <article>
              <strong>Reference mapping</strong>
              <p>Division is derived automatically from the employee linked in the database.</p>
            </article>
            <article>
              <strong>Role access</strong>
              <p>Admin and DEO can validate and import sheets into the live project register.</p>
            </article>
            <article>
              <strong>Official template</strong>
              <p>Use the download button above to get the approved import columns and sheet instructions.</p>
            </article>
          </div>
        </section>
      </div>

      <section className="surface-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Preview</p>
            <h3>Spreadsheet validation result</h3>
          </div>
        </div>

        <Table
          columns={[
            { key: 'rowNumber', label: 'Row' },
            { key: 'projectNumber', label: 'Project Number' },
            { key: 'title', label: 'Project Title' },
            { key: 'employeeId', label: 'Employee ID' },
            { key: 'sponsoredBy', label: 'Sponsored By' },
            {
              key: 'startDate',
              label: 'Start Date',
              render: (row) => (row.startDate ? formatDate(row.startDate) : '-'),
            },
            {
              key: 'completionDate',
              label: 'Completion Date',
              render: (row) => (row.completionDate ? formatDate(row.completionDate) : '-'),
            },
            {
              key: 'projectCost',
              label: 'Project Cost',
              render: (row) => (Number.isNaN(Number(row.projectCost)) ? '-' : formatCurrency(Number(row.projectCost))),
            },
            { key: 'status', label: 'Status' },
            {
              key: 'validationStatus',
              label: 'Validation',
              render: (row) => (
                <span className={`status-pill ${row.validationStatus === 'Ready' ? 'status-achieved' : 'status-delayed'}`}>
                  {row.validationStatus}
                </span>
              ),
            },
            {
              key: 'remarks',
              label: 'Remarks',
              className: 'table-cell-wrap',
            },
          ]}
          rows={previewRows}
          rowKey={(row) => `${row.projectNumber || 'row'}-${row.rowNumber}`}
          emptyTitle="No preview rows available"
          emptyDescription="Validate a spreadsheet to inspect which rows are ready for live import."
        />
      </section>

      <section className="surface-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Audit History</p>
            <h3>Recent import activity</h3>
          </div>
          <div className="history-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleExportHistory}
              disabled={!canUpload || isExportingHistory || isLoadingHistory}
            >
              {isExportingHistory ? 'Exporting...' : 'Export History'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => loadImportHistory(historyFilters)} disabled={isLoadingHistory}>
              {isLoadingHistory ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        <div className="history-filter-panel">
          <div className="history-filter-grid">
            <label>
              File Name
              <input
                type="text"
                name="fileName"
                placeholder="Search by uploaded file"
                value={historyFilters.fileName}
                onChange={handleHistoryFilterChange}
              />
            </label>
            <label>
              Uploaded By
              <input
                type="text"
                name="uploadedBy"
                placeholder="Employee ID"
                value={historyFilters.uploadedBy}
                onChange={handleHistoryFilterChange}
              />
            </label>
            <label>
              Status
              <select name="status" value={historyFilters.status} onChange={handleHistoryFilterChange}>
                <option value="">All statuses</option>
                <option value="Imported">Imported</option>
                <option value="Validated">Validated</option>
                <option value="Validation Issues">Validation Issues</option>
                <option value="Template Rejected">Template Rejected</option>
                <option value="Import Failed">Import Failed</option>
              </select>
            </label>
            <label>
              Date From
              <input type="date" name="dateFrom" value={historyFilters.dateFrom} onChange={handleHistoryFilterChange} />
            </label>
            <label>
              Date To
              <input type="date" name="dateTo" value={historyFilters.dateTo} onChange={handleHistoryFilterChange} />
            </label>
          </div>

          <div className="form-actions history-filter-actions">
            <Button type="button" onClick={handleApplyHistoryFilters} disabled={isLoadingHistory}>
              Apply Filters
            </Button>
            <Button type="button" variant="ghost" onClick={handleResetHistoryFilters} disabled={isLoadingHistory}>
              Reset
            </Button>
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="loading-panel">Loading import history...</div>
        ) : (
          <Table
            columns={[
              {
                key: 'createdAt',
                label: 'Imported At',
                render: (row) =>
                  new Date(row.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
              },
              { key: 'fileName', label: 'File Name' },
              { key: 'worksheetName', label: 'Sheet' },
              { key: 'uploadedByEmployeeId', label: 'Uploaded By' },
              { key: 'totalRows', label: 'Total Rows' },
              { key: 'readyRows', label: 'Ready' },
              { key: 'blockedRows', label: 'Blocked' },
              { key: 'importedRows', label: 'Imported' },
              {
                key: 'status',
                label: 'Status',
                render: (row) => {
                  const className =
                    row.status === 'Imported'
                      ? 'status-achieved'
                      : row.status === 'Validated'
                        ? 'status-ongoing'
                        : 'status-delayed';
                  return <span className={`status-pill ${className}`}>{row.status}</span>;
                },
              },
              {
                key: 'errorMessage',
                label: 'Notes',
                className: 'table-cell-wrap',
                render: (row) => row.errorMessage || '-',
              },
            ]}
            rows={importHistory}
            rowKey={(row) => row.importId}
            emptyTitle="No import history found"
            emptyDescription="Validated and imported spreadsheet activity will appear here."
          />
        )}
      </section>
    </section>
  );
}

export default ExcelUpload;
