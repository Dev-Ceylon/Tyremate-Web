// Role & permission constants for the application
// Centralizes bootstrap role/permission data consumed by the database seed.

// [roleId, roleName, description, isSystem]
const ROLES_SEED = [
  [0, 'Super Admin', 'Full system access', 1],
  [1, 'Admin', 'Administrative access', 1],
  [2, 'Manager', 'Operational access', 1],
  [3, 'Cashier', 'Point of sale access', 1],
  [4, 'SalesRep', 'Sales representative access', 1],
]

// [permissionKey, description]
const PERMISSIONS_SEED = [
  ['inquiry.view',   'View customer inquiries'],
  ['inquiry.create', 'Create customer inquiries'],
  ['inquiry.edit',   'Edit customer inquiries'],
  ['inquiry.delete', 'Delete customer inquiries'],
  ['po.view',       'View purchase orders'],
  ['po.create',     'Create purchase orders'],
  ['po.edit',       'Edit purchase orders'],
  ['po.delete',     'Delete purchase orders'],
  ['po.approve',    'Approve purchase orders'],
  ['so.view',       'View sales orders'],
  ['so.create',     'Create sales orders'],
  ['so.edit',       'Edit sales orders'],
  ['so.delete',     'Delete sales orders'],
  ['so.approve',    'Approve sales orders'],
  ['dag.view',      'View DAG services'],
  ['dag.create',    'Create DAG services'],
  ['dag.edit',      'Edit DAG services'],
  ['dag.delete',    'Delete DAG services'],
  ['dag.approve',   'Assign contractors and capture contractor approval on DAGs'],
  ['other.view',    'View other services'],
  ['other.create',  'Create other services'],
  ['other.edit',    'Edit other services'],
  ['other.delete',  'Delete other services'],
  ['invoice.view',   'View invoices'],
  ['invoice.create', 'Create and credit invoices'],
  ['invoice.edit',   'Edit and cancel invoices'],
  ['invoice.print',  'Print invoices'],
  ['inventory.view',   'View inventory'],
  ['inventory.manage', 'Manage inventory'],
  ['customers.view',   'View customers'],
  ['customers.manage', 'Manage customers'],
  ['suppliers.view',   'View suppliers'],
  ['suppliers.manage', 'Manage suppliers'],
  ['reports.view',     'View reports'],
  ['settings.manage',  'Manage settings'],
  ['user.view',        'View users'],
  ['user.manage',      'Manage users and roles'],
  ['violations.view',   'View policy violations'],
  ['violations.create', 'Create policy violations'],
  ['violations.approve', 'Approve/Reject policy violations'],
  ['targets.view_own',  'View own assigned sales targets and progress'],
  ['targets.manage',    'Create, update, and manage all sales targets'],
  ['god',              'Super access - bypasses all permission checks'],
]

// Permission keys granted to each role. '*' grants every seeded permission.
const ROLE_PERMISSIONS = {
  0: '*',
  1: '*',
  2: [
    'inquiry.view', 'inquiry.create', 'inquiry.edit', 'inquiry.delete',
    'po.view', 'po.create', 'po.edit',
    'so.view', 'so.create', 'so.edit',
    'dag.view', 'dag.create', 'dag.edit', 'dag.approve',
    'other.view', 'other.create', 'other.edit',
    'invoice.view', 'invoice.create', 'invoice.edit', 'invoice.print',
    'inventory.view', 'inventory.manage',
    'customers.view', 'customers.manage',
    'suppliers.view', 'suppliers.manage',
    'reports.view',
    'violations.view', 'violations.create', 'violations.approve',
    'targets.manage', 'targets.view_own',
  ],
  3: [
    'so.view', 'so.create',
    'dag.view', 'dag.create',
    'other.view', 'other.create',
    'invoice.view', 'invoice.create', 'invoice.print',
    'customers.view',
    'inventory.view',
    'violations.view',
  ],
  4: [
    'inquiry.view',
    'inquiry.create',
    'inquiry.edit',
    'inquiry.delete',
    'targets.view_own',
  ],
}

module.exports = {
  ROLES_SEED,
  PERMISSIONS_SEED,
  ROLE_PERMISSIONS,
}
