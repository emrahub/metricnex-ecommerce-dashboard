# Test Kılavuzu 🧪

> **E-Commerce Dashboard Test Stratejisi ve Uygulama Rehberi**

## 🎯 Test Stratejisi

E-Commerce Dashboard için kapsamlı test stratejisi, kod kalitesini garanti altına almak ve güvenilir bir uygulama sunmak amacıyla tasarlanmıştır.

### Test Piramidi
```
           🔺 E2E Tests (10%)
          🔺🔺 Integration Tests (30%)  
         🔺🔺🔺 Unit Tests (60%)
```

---

## 🏗️ Test Altyapısı

### 1. Test Teknoloji Stack'i

#### **Backend Testing**
- **Jest:** Unit ve integration testleri
- **Supertest:** HTTP endpoint testleri
- **@testcontainers/postgresql:** Database testing
- **nock:** External API mocking

#### **Frontend Testing**
- **Jest:** Unit testleri
- **React Testing Library:** Component testleri
- **MSW (Mock Service Worker):** API mocking
- **Cypress:** E2E testleri

#### **Test Database**
- **PostgreSQL Test Container:** Isolated test database
- **Redis Test Instance:** Cache testing

### 2. Test Yapılandırması

**jest.config.js (Backend):**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/simple-app.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000
};
```

**jest.config.js (Frontend):**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

---

## 🔧 Unit Tests

### 1. Backend Unit Tests

#### **Google Analytics Service Test**
```typescript
// tests/unit/services/googleAnalytics.test.ts
import GoogleAnalyticsService from '../../../src/services/googleAnalytics';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

jest.mock('@google-analytics/data');

describe('GoogleAnalyticsService', () => {
  let service: GoogleAnalyticsService;
  let mockClient: jest.Mocked<BetaAnalyticsDataClient>;

  beforeEach(() => {
    mockClient = new BetaAnalyticsDataClient() as jest.Mocked<BetaAnalyticsDataClient>;
    service = new GoogleAnalyticsService();
    // Inject mock client
    (service as any).analyticsDataClient = mockClient;
  });

  describe('getReport', () => {
    it('should return formatted report data', async () => {
      // Arrange
      const mockResponse = [{
        rows: [{
          dimensionValues: [{ value: 'Turkey' }],
          metricValues: [{ value: '1000' }]
        }],
        rowCount: 1
      }];
      
      mockClient.runReport.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getReport(
        '123456789',
        '2025-01-01',
        '2025-01-31',
        ['sessions'],
        ['country']
      );

      // Assert
      expect(result).toEqual({
        rows: [{
          dimensionValues: [{ value: 'Turkey' }],
          metricValues: [{ value: '1000' }]
        }],
        rowCount: 1
      });

      expect(mockClient.runReport).toHaveBeenCalledWith({
        property: 'properties/123456789',
        dateRanges: [{ startDate: '2025-01-01', endDate: '2025-01-31' }],
        metrics: [{ name: 'sessions' }],
        dimensions: [{ name: 'country' }]
      });
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      mockClient.runReport.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(service.getReport(
        '123456789',
        '2025-01-01',
        '2025-01-31',
        ['sessions'],
        ['country']
      )).rejects.toThrow('API Error');
    });

    it('should validate required parameters', async () => {
      // Act & Assert
      await expect(service.getReport('', '', '', [], []))
        .rejects.toThrow('Property ID is required');
    });
  });
});
```

#### **Report Generator Test**
```typescript
// tests/unit/services/reportGenerator.test.ts
import ReportGeneratorService from '../../../src/services/reportGenerator';
import ExcelJS from 'exceljs';
import fs from 'fs';

jest.mock('exceljs');
jest.mock('fs');

describe('ReportGeneratorService', () => {
  let service: ReportGeneratorService;
  let mockWorkbook: jest.Mocked<ExcelJS.Workbook>;
  let mockWorksheet: jest.Mocked<ExcelJS.Worksheet>;

  beforeEach(() => {
    mockWorkbook = {
      addWorksheet: jest.fn(),
      xlsx: { writeFile: jest.fn() }
    } as any;
    
    mockWorksheet = {
      addRow: jest.fn(),
      getRow: jest.fn(),
      columns: []
    } as any;

    (ExcelJS.Workbook as jest.Mock).mockImplementation(() => mockWorkbook);
    mockWorkbook.addWorksheet.mockReturnValue(mockWorksheet);

    service = new ReportGeneratorService();
  });

  describe('generateExcelReport', () => {
    it('should generate Excel report with correct data', async () => {
      // Arrange
      const reportData = {
        data: [
          { country: 'Turkey', sessions: '1000' },
          { country: 'Germany', sessions: '500' }
        ]
      };
      
      const options = {
        metrics: ['sessions'],
        dimensions: ['country'],
        fileName: 'test-report'
      };

      // Act
      const filePath = await service.generateExcelReport(reportData, options);

      // Assert
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Google Analytics Raporu');
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(['Google Analytics Özel Raporu']);
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(['country', 'sessions']);
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(['Turkey', 1000]);
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(['Germany', 500]);
      expect(mockWorkbook.xlsx.writeFile).toHaveBeenCalled();
      expect(filePath).toContain('test-report');
    });
  });

  describe('generateCSVReport', () => {
    it('should generate CSV report with correct format', async () => {
      // Arrange
      const reportData = {
        data: [
          { country: 'Turkey', sessions: '1000' }
        ]
      };

      const options = {
        metrics: ['sessions'],
        dimensions: ['country'],
        fileName: 'test-report'
      };

      // Act
      const filePath = await service.generateCSVReport(reportData, options);

      // Assert
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.csv'),
        expect.stringContaining('country,sessions\n"Turkey",1000')
      );
    });
  });
});
```

### 2. Frontend Unit Tests

#### **GoogleAnalytics Component Test**
```typescript
// src/tests/components/GoogleAnalytics.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GoogleAnalytics from '../../pages/GoogleAnalytics';
import * as api from '../../services/api';

jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('GoogleAnalytics Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render weekly sessions report', async () => {
    // Arrange
    const mockData = {
      success: true,
      title: 'Son 7 Günlük Oturum Sayıları',
      data: [
        { date: '27.01.2025', sessions: 26500, activeUsers: 18750 }
      ]
    };
    
    mockedApi.getWeeklySessionsReport.mockResolvedValue(mockData);

    // Act
    render(<GoogleAnalytics />, { wrapper: createWrapper() });

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Son 7 Günlük Oturum Sayıları')).toBeInTheDocument();
      expect(screen.getByText('27.01.2025')).toBeInTheDocument();
      expect(screen.getByText('26,500')).toBeInTheDocument();
    });
  });

  it('should handle custom report form submission', async () => {
    // Arrange
    const mockCustomReport = {
      success: true,
      data: [
        { country: 'Turkey', sessions: '1000' }
      ]
    };
    
    mockedApi.getCustomReport.mockResolvedValue(mockCustomReport);

    render(<GoogleAnalytics />, { wrapper: createWrapper() });

    // Act
    // Switch to custom report tab
    fireEvent.click(screen.getByText('Özel Rapor'));
    
    // Select metrics
    const metricsDropdown = screen.getByTestId('metrics-select');
    fireEvent.click(metricsDropdown);
    fireEvent.click(screen.getByText('Oturumlar'));
    
    // Select dimensions
    const dimensionsDropdown = screen.getByTestId('dimensions-select');
    fireEvent.click(dimensionsDropdown);
    fireEvent.click(screen.getByText('Ülke'));
    
    // Set date range
    const startDate = screen.getByTestId('start-date');
    const endDate = screen.getByTestId('end-date');
    fireEvent.change(startDate, { target: { value: '2025-01-01' } });
    fireEvent.change(endDate, { target: { value: '2025-01-31' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Rapor Al'));

    // Assert
    await waitFor(() => {
      expect(mockedApi.getCustomReport).toHaveBeenCalledWith({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        metrics: ['sessions'],
        dimensions: ['country']
      });
    });
  });

  it('should display error message when API fails', async () => {
    // Arrange
    mockedApi.getWeeklySessionsReport.mockRejectedValue(
      new Error('Network Error')
    );

    // Act
    render(<GoogleAnalytics />, { wrapper: createWrapper() });

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Veri yüklenirken bir hata oluştu/)).toBeInTheDocument();
    });
  });
});
```

#### **API Service Test**
```typescript
// src/tests/services/api.test.ts
import axios from 'axios';
import { getWeeklySessionsReport, getCustomReport } from '../../services/api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWeeklySessionsReport', () => {
    it('should return weekly sessions data', async () => {
      // Arrange
      const mockResponse = {
        data: {
          success: true,
          title: 'Son 7 Günlük Oturum Sayıları',
          data: [{ date: '27.01.2025', sessions: 26500 }]
        }
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await getWeeklySessionsReport();

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/analytics/google-analytics/reports/weekly-sessions'
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      // Arrange
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      // Act & Assert
      await expect(getWeeklySessionsReport()).rejects.toThrow('Network Error');
    });
  });

  describe('getCustomReport', () => {
    it('should send correct request payload', async () => {
      // Arrange
      const params = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        metrics: ['sessions'],
        dimensions: ['country']
      };
      
      const mockResponse = {
        data: { success: true, data: [] }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      await getCustomReport(params);

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/analytics/google-analytics/report',
        params
      );
    });
  });
});
```

---

## 🔗 Integration Tests

### 1. API Integration Tests

#### **Analytics Routes Test**
```typescript
// tests/integration/routes/analytics.test.ts
import request from 'supertest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer } from 'testcontainers';
import app from '../../../src/simple-app';

describe('Analytics Routes Integration', () => {
  let postgresContainer: PostgreSqlContainer;
  let redisContainer: GenericContainer;

  beforeAll(async () => {
    // Start test containers
    postgresContainer = await new PostgreSqlContainer()
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    redisContainer = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    // Set test environment variables
    process.env.DATABASE_URL = postgresContainer.getConnectionUri();
    process.env.REDIS_URL = `redis://localhost:${redisContainer.getMappedPort(6379)}`;
  });

  afterAll(async () => {
    await postgresContainer.stop();
    await redisContainer.stop();
  });

  describe('POST /api/analytics/google-analytics/report', () => {
    it('should create custom report successfully', async () => {
      const payload = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        metrics: ['sessions', 'activeUsers'],
        dimensions: ['country']
      };

      const response = await request(app)
        .post('/api/analytics/google-analytics/report')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send(payload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.metrics).toEqual(payload.metrics);
      expect(response.body.dimensions).toEqual(payload.dimensions);
    });

    it('should return 400 for invalid date range', async () => {
      const payload = {
        startDate: '2025-01-31',
        endDate: '2025-01-01', // End date before start date
        metrics: ['sessions'],
        dimensions: ['country']
      };

      const response = await request(app)
        .post('/api/analytics/google-analytics/report')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send(payload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Geçersiz tarih aralığı');
    });

    it('should return 401 for missing authentication', async () => {
      const payload = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        metrics: ['sessions'],
        dimensions: ['country']
      };

      await request(app)
        .post('/api/analytics/google-analytics/report')
        .send(payload)
        .expect(401);
    });
  });

  describe('GET /api/analytics/google-analytics/reports/weekly-sessions', () => {
    it('should return weekly sessions data', async () => {
      const response = await request(app)
        .get('/api/analytics/google-analytics/reports/weekly-sessions')
        .set('Authorization', 'Bearer valid-jwt-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.title).toBe('Son 7 Günlük Oturum Sayıları');
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Check data structure
      if (response.body.data.length > 0) {
        const firstItem = response.body.data[0];
        expect(firstItem).toHaveProperty('date');
        expect(firstItem).toHaveProperty('sessions');
        expect(firstItem).toHaveProperty('activeUsers');
      }
    });
  });

  describe('POST /api/analytics/google-analytics/report/save', () => {
    it('should save report and return file paths', async () => {
      const reportData = {
        reportData: {
          data: [
            { country: 'Turkey', sessions: '1000' },
            { country: 'Germany', sessions: '500' }
          ]
        },
        reportName: 'Integration-Test',
        selectedMetrics: ['sessions'],
        selectedDimensions: ['country'],
        dateRange: {
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        }
      };

      const response = await request(app)
        .post('/api/analytics/google-analytics/report/save')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Rapor başarıyla kaydedildi');
      expect(response.body.files).toHaveProperty('excel');
      expect(response.body.files).toHaveProperty('csv');
      expect(response.body.reportInfo.rowCount).toBe(2);
    });
  });
});
```

### 2. Database Integration Tests

#### **User Repository Test**
```typescript
// tests/integration/repositories/user.test.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import UserRepository from '../../../src/repositories/UserRepository';

describe('User Repository Integration', () => {
  let prisma: PrismaClient;
  let userRepository: UserRepository;
  let container: PostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer()
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    process.env.DATABASE_URL = container.getConnectionUri();
    
    prisma = new PrismaClient();
    await prisma.$connect();
    
    // Run migrations
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { env: process.env });
    
    userRepository = new UserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.user.deleteMany();
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'user'
      };

      const user = await userRepository.createUser(userData);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'hashedPassword',
        role: 'user'
      };

      await userRepository.createUser(userData);

      await expect(userRepository.createUser(userData))
        .rejects.toThrow('Email already exists');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'findme@example.com',
        password: 'hashedPassword',
        role: 'admin'
      };

      await userRepository.createUser(userData);
      const foundUser = await userRepository.findByEmail(userData.email);

      expect(foundUser).toBeTruthy();
      expect(foundUser?.email).toBe(userData.email);
      expect(foundUser?.role).toBe(userData.role);
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });
});
```

---

## 🌐 End-to-End Tests

### 1. Cypress E2E Tests

#### **Google Analytics Dashboard E2E Test**
```typescript
// cypress/e2e/google-analytics.cy.ts
describe('Google Analytics Dashboard', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('admin@example.com', 'password');
    cy.visit('/google-analytics');
  });

  it('should display weekly sessions report', () => {
    // Intercept API call
    cy.intercept('GET', '/api/analytics/google-analytics/reports/weekly-sessions', {
      fixture: 'weekly-sessions.json'
    }).as('getWeeklySessions');

    // Wait for API call and check display
    cy.wait('@getWeeklySessions');
    
    cy.contains('Son 7 Günlük Oturum Sayıları').should('be.visible');
    cy.get('[data-testid="sessions-chart"]').should('be.visible');
    
    // Check table data
    cy.get('[data-testid="weekly-sessions-table"]').within(() => {
      cy.contains('27.01.2025').should('be.visible');
      cy.contains('26,500').should('be.visible');
    });
  });

  it('should create and save custom report', () => {
    // Switch to custom report tab
    cy.get('[data-testid="custom-report-tab"]').click();

    // Select metrics
    cy.get('[data-testid="metrics-select"]').click();
    cy.contains('Oturumlar').click();
    cy.contains('Aktif Kullanıcılar').click();
    cy.get('body').click(); // Close dropdown

    // Select dimensions
    cy.get('[data-testid="dimensions-select"]').click();
    cy.contains('Ülke').click();
    cy.get('body').click(); // Close dropdown

    // Set date range
    cy.get('[data-testid="start-date"]').type('2025-01-01');
    cy.get('[data-testid="end-date"]').type('2025-01-31');

    // Intercept custom report API
    cy.intercept('POST', '/api/analytics/google-analytics/report', {
      fixture: 'custom-report.json'
    }).as('getCustomReport');

    // Submit form
    cy.get('[data-testid="get-report-button"]').click();

    // Wait for results
    cy.wait('@getCustomReport');
    cy.get('[data-testid="report-results"]').should('be.visible');

    // Save report
    cy.intercept('POST', '/api/analytics/google-analytics/report/save', {
      body: {
        success: true,
        files: {
          excel: '/uploads/reports/test.xlsx',
          csv: '/uploads/reports/test.csv'
        }
      }
    }).as('saveReport');

    cy.get('[data-testid="save-report-button"]').click();
    cy.wait('@saveReport');

    // Check success message
    cy.contains('Rapor başarıyla kaydedildi').should('be.visible');
    
    // Check download links
    cy.get('[data-testid="download-excel"]').should('be.visible');
    cy.get('[data-testid="download-csv"]').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    // Intercept with error
    cy.intercept('GET', '/api/analytics/google-analytics/reports/weekly-sessions', {
      statusCode: 500,
      body: { success: false, message: 'Server Error' }
    }).as('getWeeklySessionsError');

    cy.visit('/google-analytics');
    cy.wait('@getWeeklySessionsError');

    // Check error message
    cy.contains('Veri yüklenirken bir hata oluştu').should('be.visible');
    
    // Check retry button
    cy.get('[data-testid="retry-button"]').should('be.visible');
  });

  it('should validate form inputs', () => {
    cy.get('[data-testid="custom-report-tab"]').click();

    // Try to submit without selections
    cy.get('[data-testid="get-report-button"]').click();

    // Check validation messages
    cy.contains('En az bir metrik seçmelisiniz').should('be.visible');
    cy.contains('Tarih aralığı gereklidir').should('be.visible');
  });

  it('should be responsive on mobile', () => {
    cy.viewport('iphone-6');
    
    // Check mobile layout
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    cy.get('[data-testid="sidebar"]').should('not.be.visible');
    
    // Open mobile menu
    cy.get('[data-testid="mobile-menu-button"]').click();
    cy.get('[data-testid="sidebar"]').should('be.visible');
    
    // Check table responsiveness
    cy.get('[data-testid="weekly-sessions-table"]').should('be.visible');
    cy.get('[data-testid="mobile-scroll-hint"]').should('be.visible');
  });
});
```

#### **Authentication E2E Test**
```typescript
// cypress/e2e/authentication.cy.ts
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should login successfully with valid credentials', () => {
    cy.visit('/login');

    // Fill login form
    cy.get('[data-testid="email-input"]').type('admin@example.com');
    cy.get('[data-testid="password-input"]').type('password');
    
    // Intercept login API
    cy.intercept('POST', '/api/auth/login', {
      body: {
        success: true,
        token: 'mock-jwt-token',
        user: { email: 'admin@example.com', role: 'admin' }
      }
    }).as('login');

    cy.get('[data-testid="login-button"]').click();
    
    cy.wait('@login');

    // Check redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Check user info in header
    cy.get('[data-testid="user-menu"]').should('contain', 'admin@example.com');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/login');

    cy.get('[data-testid="email-input"]').type('wrong@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    
    // Intercept login API with error
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { success: false, message: 'Geçersiz kimlik bilgileri' }
    }).as('loginError');

    cy.get('[data-testid="login-button"]').click();
    cy.wait('@loginError');

    // Check error message
    cy.contains('Geçersiz kimlik bilgileri').should('be.visible');
    
    // Should stay on login page
    cy.url().should('include', '/login');
  });

  it('should logout successfully', () => {
    cy.login('admin@example.com', 'password');
    cy.visit('/dashboard');

    // Open user menu and logout
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();

    // Check redirect to login
    cy.url().should('include', '/login');
    
    // Check token is removed
    cy.window().its('localStorage').should('not.have.property', 'authToken');
  });

  it('should redirect to login for protected routes', () => {
    cy.visit('/google-analytics');
    
    // Should redirect to login
    cy.url().should('include', '/login');
    
    // Should show message
    cy.contains('Bu sayfaya erişmek için giriş yapmalısınız').should('be.visible');
  });
});
```

### 2. Cypress Support Files

#### **Custom Commands**
```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      createReport(reportData: any): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password }
  }).then((response) => {
    window.localStorage.setItem('authToken', response.body.token);
  });
});

Cypress.Commands.add('createReport', (reportData) => {
  cy.window().its('localStorage.authToken').then((token) => {
    cy.request({
      method: 'POST',
      url: '/api/analytics/google-analytics/report',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: reportData
    });
  });
});
```

#### **Fixtures**
```json
// cypress/fixtures/weekly-sessions.json
{
  "success": true,
  "title": "Son 7 Günlük Oturum Sayıları",
  "data": [
    {
      "date": "27.01.2025",
      "rawDate": "20250127",
      "sessions": 26500,
      "activeUsers": 18750,
      "pageViews": 78900
    },
    {
      "date": "26.01.2025",
      "rawDate": "20250126",
      "sessions": 25200,
      "activeUsers": 17800,
      "pageViews": 75600
    }
  ]
}
```

---

## 🔧 Test Utilities

### 1. Test Database Setup

```typescript
// tests/utils/database.ts
import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

export class TestDatabase {
  private static instance: TestDatabase;
  private container: PostgreSqlContainer | null = null;
  private prisma: PrismaClient | null = null;

  static async getInstance(): Promise<TestDatabase> {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
      await TestDatabase.instance.setup();
    }
    return TestDatabase.instance;
  }

  private async setup(): Promise<void> {
    this.container = await new PostgreSqlContainer()
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    process.env.DATABASE_URL = this.container.getConnectionUri();
    
    this.prisma = new PrismaClient();
    await this.prisma.$connect();

    // Run migrations
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { env: process.env });
  }

  getPrisma(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Database not initialized');
    }
    return this.prisma;
  }

  async cleanup(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
    if (this.container) {
      await this.container.stop();
    }
  }

  async truncateAllTables(): Promise<void> {
    if (!this.prisma) return;

    const tablenames = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      }
    }
  }
}
```

### 2. Mock Data Factory

```typescript
// tests/utils/mockDataFactory.ts
export class MockDataFactory {
  static createUser(overrides: any = {}) {
    return {
      id: Math.floor(Math.random() * 1000),
      email: `user${Math.random()}@example.com`,
      password: 'hashedPassword123',
      role: 'user',
      createdAt: new Date(),
      ...overrides
    };
  }

  static createGoogleAnalyticsResponse(overrides: any = {}) {
    return {
      success: true,
      propertyId: '349428903',
      period: {
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      },
      metrics: ['sessions', 'activeUsers'],
      dimensions: ['country'],
      rowCount: '2',
      data: [
        {
          country: 'Turkey',
          sessions: '1000',
          activeUsers: '750'
        },
        {
          country: 'Germany',
          sessions: '500',
          activeUsers: '350'
        }
      ],
      ...overrides
    };
  }

  static createReportData(overrides: any = {}) {
    return {
      reportName: 'Test Report',
      selectedMetrics: ['sessions', 'activeUsers'],
      selectedDimensions: ['country'],
      dateRange: {
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      },
      reportData: {
        data: [
          { country: 'Turkey', sessions: '1000', activeUsers: '750' }
        ]
      },
      ...overrides
    };
  }
}
```

---

## 🚀 Test Automation

### 1. Test Scripts

**package.json (Backend):**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### 2. GitHub Actions Test Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: |
        cd backend && npm ci
        cd ../frontend && npm ci

    - name: Run backend unit tests
      run: |
        cd backend
        npm run test:unit

    - name: Run frontend unit tests
      run: |
        cd frontend
        npm test

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install backend dependencies
      run: cd backend && npm ci

    - name: Run integration tests
      run: cd backend && npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        cd backend && npm ci
        cd ../frontend && npm ci

    - name: Build frontend
      run: cd frontend && npm run build

    - name: Start backend server
      run: |
        cd backend
        npm run build
        npm start &
        npx wait-on http://localhost:3000/health

    - name: Run Cypress E2E tests
      uses: cypress-io/github-action@v5
      with:
        working-directory: frontend
        start: npm run preview
        wait-on: 'http://localhost:3001'
        browser: chrome
        record: true
      env:
        CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}

  coverage:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        cd backend && npm ci
        cd ../frontend && npm ci

    - name: Generate backend coverage
      run: cd backend && npm run test:coverage

    - name: Generate frontend coverage
      run: cd frontend && npm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage/lcov.info,./frontend/coverage/lcov.info
        fail_ci_if_error: true
```

### 3. Pre-commit Hooks

**.pre-commit-config.yaml:**
```yaml
repos:
  - repo: local
    hooks:
      - id: backend-tests
        name: Backend Tests
        entry: bash -c 'cd backend && npm run test:unit'
        language: system
        files: ^backend/
        pass_filenames: false
        
      - id: frontend-tests
        name: Frontend Tests
        entry: bash -c 'cd frontend && npm test'
        language: system
        files: ^frontend/
        pass_filenames: false
        
      - id: lint
        name: ESLint
        entry: bash -c 'cd backend && npm run lint && cd ../frontend && npm run lint'
        language: system
        files: \.(ts|tsx|js|jsx)$
        pass_filenames: false
```

---

## 📊 Test Coverage ve Metrikler

### 1. Coverage Hedefleri

```javascript
// jest.config.js coverage thresholds
coverageThreshold: {
  global: {
    branches: 80,
    functions: 85,
    lines: 85,
    statements: 85
  },
  './src/services/': {
    branches: 90,
    functions: 95,
    lines: 95,
    statements: 95
  },
  './src/routes/': {
    branches: 85,
    functions: 90,
    lines: 90,
    statements: 90
  }
}
```

### 2. Test Metrics Dashboard

```typescript
// scripts/test-metrics.ts
import { execSync } from 'child_process';
import fs from 'fs';

interface TestMetrics {
  unitTests: {
    total: number;
    passed: number;
    failed: number;
    coverage: number;
  };
  integrationTests: {
    total: number;
    passed: number;
    failed: number;
  };
  e2eTests: {
    total: number;
    passed: number;
    failed: number;
  };
}

function generateTestReport(): TestMetrics {
  // Run tests and collect metrics
  const unitTestResult = execSync('npm run test:unit -- --json', { encoding: 'utf8' });
  const unitTestData = JSON.parse(unitTestResult);

  const integrationTestResult = execSync('npm run test:integration -- --json', { encoding: 'utf8' });
  const integrationTestData = JSON.parse(integrationTestResult);

  const metrics: TestMetrics = {
    unitTests: {
      total: unitTestData.numTotalTests,
      passed: unitTestData.numPassedTests,
      failed: unitTestData.numFailedTests,
      coverage: unitTestData.coverageMap ? 
        Math.round(unitTestData.coverageMap.total.statements.pct) : 0
    },
    integrationTests: {
      total: integrationTestData.numTotalTests,
      passed: integrationTestData.numPassedTests,
      failed: integrationTestData.numFailedTests
    },
    e2eTests: {
      total: 0, // Will be filled by Cypress
      passed: 0,
      failed: 0
    }
  };

  // Save metrics to file
  fs.writeFileSync('test-metrics.json', JSON.stringify(metrics, null, 2));
  
  return metrics;
}

generateTestReport();
```

---

## 🐛 Debugging Tests

### 1. Jest Debugging

```javascript
// jest.config.js
module.exports = {
  // ... other config
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  detectLeaks: true, // Memory leak detection
  forceExit: true
};
```

**tests/setup.ts:**
```typescript
// Global test setup
import { TextEncoder, TextDecoder } from 'util';

// Setup global variables
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Cleanup after tests
afterEach(() => {
  jest.clearAllMocks();
});
```

### 2. Cypress Debugging

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    video: true,
    screenshot: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    setupNodeEvents(on, config) {
      // Debug plugin
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
    }
  }
});
```

---

**🧪 Bu test kılavuzu, Elle Shoes E-Commerce Dashboard'un kod kalitesini ve güvenilirliğini sağlamak için kapsamlı test stratejisini içerir. Test yazımı ve debugging konularında sorularınız için development ekibi ile iletişime geçin.**