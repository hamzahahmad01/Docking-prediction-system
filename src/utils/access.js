export const rolePermissions = {
  Admin: {
    overview: true,
    divisions: true,
    employees: true,
    fundingAgencies: true,
    registration: true,
    upload: true,
    milestones: true,
    leaderForm: true,
  },
  DEO: {
    overview: true,
    divisions: false,
    employees: true,
    fundingAgencies: false,
    registration: false,
    upload: true,
    milestones: true,
    leaderForm: false,
  },
  'Project Lead': {
    overview: true,
    divisions: false,
    employees: false,
    fundingAgencies: false,
    registration: false,
    upload: false,
    milestones: false,
    leaderForm: true,
  },
  Viewer: {
    overview: true,
    divisions: false,
    employees: false,
    fundingAgencies: false,
    registration: false,
    upload: false,
    milestones: false,
    leaderForm: false,
  },
};

export function canAccess(role, feature) {
  return Boolean(rolePermissions[role]?.[feature]);
}
