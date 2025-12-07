import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:3000/api';

export const handlers = [
  // Breeds endpoints
  http.get(`${API_BASE}/breeds`, () => {
    return HttpResponse.json({
      status: 'OK',
      data: {
        items: [
          {
            id: 'breed-1',
            name: 'Golden Retriever',
            petType: 'dog',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'breed-2',
            name: 'Persian',
            petType: 'cat',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          hasNext: false,
          hasPrevious: false,
        },
      },
    });
  }),

  http.get(`${API_BASE}/breeds/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      status: 'OK',
      data: {
        id,
        name: 'Golden Retriever',
        petType: 'dog',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });
  }),

  http.post(`${API_BASE}/breeds/add`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(
      {
        status: 'OK',
        message: 'Breed created successfully',
        breed: {
          id: `breed-${Date.now()}`,
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  http.put(`${API_BASE}/breeds/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;
    return HttpResponse.json({
      status: 'OK',
      data: {
        id,
        ...body,
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete(`${API_BASE}/breeds/:id`, () => {
    return HttpResponse.json(
      {
        status: 'OK',
        data: { message: 'Breed deleted successfully' },
      },
      { status: 200 }
    );
  }),

  // Breed Types endpoints
  http.get(`${API_BASE}/breed-types`, () => {
    return HttpResponse.json({
      status: 'OK',
      data: [
        { id: 'dog', name: 'dog' },
        { id: 'cat', name: 'cat' },
        { id: 'bird', name: 'bird' },
      ],
    });
  }),

  // Pets endpoints
  http.get(`${API_BASE}/pets`, () => {
    return HttpResponse.json({
      status: 'OK',
      data: {
        items: [
          {
            id: 'pet-1',
            name: 'Max',
            type: 'dog',
            breed: 'Golden Retriever',
            photoUrl: 'https://example.com/max.jpg',
            totalSponsored: 100,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          hasNext: false,
          hasPrevious: false,
        },
      },
    });
  }),

  http.get(`${API_BASE}/pets/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      status: 'OK',
      data: {
        id,
        name: 'Max',
        type: 'dog',
        breed: 'Golden Retriever',
        photoUrl: 'https://example.com/max.jpg',
        totalSponsored: 100,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });
  }),

  http.post(`${API_BASE}/pets`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(
      {
        status: 'OK',
        data: {
          id: `pet-${Date.now()}`,
          ...body,
          totalSponsored: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  http.put(`${API_BASE}/pets/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;
    return HttpResponse.json({
      status: 'OK',
      data: {
        id,
        ...body,
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete(`${API_BASE}/pets/:id`, () => {
    return HttpResponse.json(
      {
        status: 'OK',
        data: { message: 'Pet deleted successfully' },
      },
      { status: 200 }
    );
  }),

  // Counters endpoint
  http.get(`${API_BASE}/counters`, () => {
    return HttpResponse.json({
      status: 'OK',
      data: {
        totalBreeds: 10,
        totalActivePets: 5,
        totalBreedTypes: 3,
        totalSponsorships: 8,
      },
    });
  }),
];
