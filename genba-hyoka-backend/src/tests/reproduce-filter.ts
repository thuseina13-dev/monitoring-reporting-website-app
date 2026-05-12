import { roles } from '../db/schemas/auth';
import { buildRQBWhere } from '../utils/filter';
import { ne, and, isNull } from 'drizzle-orm';

// Mock ops from Drizzle RQB
const mockOps = {
  and: (...args: any[]) => ({ type: 'and', args }),
  or: (...args: any[]) => ({ type: 'or', args }),
  eq: (col: any, val: any) => ({ type: 'eq', col, val }),
  ne: (col: any, val: any) => ({ type: 'ne', col, val }),
  ilike: (col: any, val: any) => ({ type: 'ilike', col, val }),
  gt: (col: any, val: any) => ({ type: 'gt', col, val }),
};

// Mock fields from Drizzle RQB for 'roles' table
const mockFields = {
  id: { name: 'id' },
  name: { name: 'name' },
  type: { name: 'type' },
  code: { name: 'code' },
};

const query = { type_ne: 'super_admin' };
const filterOptions = {
  searchFields: ['name', 'code'],
  exactFields: ['type', 'code'],
  customConditions: [
    { type: 'isNull', col: 'deletedAt' }
  ]
};

const result = buildRQBWhere(mockFields, mockOps, query, filterOptions);
console.log('Filter Result:', JSON.stringify(result, null, 2));

if (JSON.stringify(result).includes('"type":"ne"') && JSON.stringify(result).includes('"val":"super_admin"')) {
  console.log('SUCCESS: Filter logic generated the correct NE condition.');
} else {
  console.log('FAILURE: Filter logic did NOT generate the correct NE condition.');
}
