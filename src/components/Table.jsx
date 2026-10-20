import Button from './Button.jsx';

function Table({
  columns,
  rows,
  actions = [],
  emptyTitle = 'No records found',
  emptyDescription = 'There is no data to show right now.',
  rowKey,
}) {
  if (!rows.length) {
    return (
      <div className="empty-state">
        <h3>{emptyTitle}</h3>
        <p>{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {actions.length ? <th className="actions-column">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey ? rowKey(row) : row.id || row.emp_id || row.div_id || index}>
              {columns.map((column) => (
                <td key={column.key} className={column.className || ''}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
              {actions.length ? (
                <td>
                  <div className="table-actions">
                    {actions.map((action) => (
                      <Button
                        key={action.label}
                        size="small"
                        variant={action.variant || 'secondary'}
                        disabled={Boolean(action.disabled?.(row))}
                        onClick={() => action.onClick(row)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
