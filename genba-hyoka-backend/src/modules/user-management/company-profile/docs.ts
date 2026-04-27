import { t } from 'elysia';
import { errorResponses, paginatedResponse, successResponse } from '../../../utils/schema';

const userNested = t.Object({
  fullName: t.String(),
  email: t.String(),
  phoneNo: t.Union([t.String(), t.Null()]),
  address: t.Union([t.String(), t.Null()]),
  gender: t.Union([t.String(), t.Null()]),
  isActive: t.Boolean(),
});

const companyProfileResponseObj = t.Object({
  id: t.String(),
  name: t.String(),
  desc: t.Union([t.String(), t.Null()]),
  address: t.Union([t.String(), t.Null()]),
  logo: t.Union([t.String(), t.Null()]),
  phoneNo: t.Union([t.String(), t.Null()]),
  email: t.Union([t.String(), t.Null()]),
  users: t.Optional(t.Array(userNested)),
});

export const listCompanyProfilesDocs = {
  detail: {
    summary: 'Daftar Company Profile',
    description: 'Get list of company profiles. Use query "include=users" to load associated users with full details (except ID).',
    tags: ['Company Profiles'],
    security: [{ cookieAuth: [] }],
  },
  response: {
    200: paginatedResponse(companyProfileResponseObj),
    ...errorResponses([400, 401, 403, 500]),
  },
  query: t.Object({
    page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
    search: t.Optional(t.String({ description: 'Cari nama/email (Case-insensitive)' })),
    name: t.Optional(t.String()),
    email: t.Optional(t.String()),
    phoneNo: t.Optional(t.String()),
    address: t.Optional(t.String()),
    cursor: t.Optional(t.String({ description: 'ID terakhir untuk paginasi cursor.' })),
    include: t.Optional(t.String({ description: 'Relasi yang ingin dimuat (contoh: users)' })),
  }),
};

export const getCompanyProfileDocs = {
  detail: {
    summary: 'Detail Company Profile',
    description: 'Get company profile by ID. Use query "include=users" to load associated users with full details (except ID).',
    tags: ['Company Profiles'],
    security: [{ cookieAuth: [] }],
  },
  query: t.Object({
    include: t.Optional(t.String({ description: 'Relasi yang ingin dimuat (contoh: users)' })),
  }),
  response: {
    200: successResponse(companyProfileResponseObj),
    ...errorResponses([401, 403, 404, 500]),
  },
};

export const createCompanyProfileDocs = {
  body: t.Object({
    name: t.String(),
    desc: t.Optional(t.String()),
    address: t.Optional(t.String()),
    logo: t.Optional(t.String()),
    phoneNo: t.Optional(t.String()),
    email: t.Optional(t.String()),
  }),
  detail: {
    summary: 'Create Company Profile',
    description: 'Create a new company profile',
    tags: ['Company Profiles'],
    security: [{ cookieAuth: [], csrfToken: [] }],
  },
  response: {
    201: successResponse(companyProfileResponseObj),
    ...errorResponses([400, 401, 403, 500]),
  },
};

export const updateCompanyProfileDocs = {
  body: t.Object({
    name: t.Optional(t.String()),
    desc: t.Optional(t.String()),
    address: t.Optional(t.String()),
    logo: t.Optional(t.String()),
    phoneNo: t.Optional(t.String()),
    email: t.Optional(t.String()),
  }),
  detail: {
    summary: 'Update Company Profile',
    description: 'Update a company profile',
    tags: ['Company Profiles'],
    security: [{ cookieAuth: [], csrfToken: [] }],
  },
  response: {
    200: successResponse(companyProfileResponseObj),
    ...errorResponses([400, 401, 403, 404, 500]),
  },
};

export const deleteCompanyProfileDocs = {
  detail: {
    summary: 'Delete Company Profile',
    description: 'Delete a company profile',
    tags: ['Company Profiles'],
    security: [{ cookieAuth: [], csrfToken: [] }],
  },
  response: {
    200: successResponse(t.Null()),
    ...errorResponses([401, 403, 404, 500]),
  },
};
