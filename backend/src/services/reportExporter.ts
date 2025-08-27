import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import fs from 'fs';
import { StorageConfig } from '../config/storage';

interface Report {
  id: string;
  title: string;
  type: string;
  data: any;
  metadata: any;
  created_at: string;
}

export async function exportReport(report: Report, format: string): Promise<{ buffer: any, filePath: string }> {
  let buffer: any;
  
  switch (format.toLowerCase()) {
    case 'pdf':
      buffer = await exportToPDF(report);
      break;
    case 'excel':
    case 'xlsx':
      buffer = await exportToExcel(report);
      break;
    case 'html':
      buffer = await exportToHTML(report);
      break;
    case 'json':
      buffer = JSON.stringify(exportToJSON(report), null, 2);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  // Save file to storage
  const filePath = StorageConfig.getReportPath(report.id, format);
  
  if (format.toLowerCase() === 'json' || format.toLowerCase() === 'html') {
    fs.writeFileSync(filePath, buffer, 'utf8');
  } else {
    fs.writeFileSync(filePath, buffer);
  }

  console.log(`📄 Report saved: ${filePath}`);
  
  return { buffer, filePath: StorageConfig.getRelativePath(filePath) };
}

async function exportToPDF(report: Report): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const html = generateHTMLReport(report);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function exportToExcel(report: Report): Promise<Buffer> {
  const workbook = XLSX.utils.book_new();
  
  // Add summary sheet
  const summaryData = [
    ['Report Title', report.title],
    ['Report Type', report.type],
    ['Generated At', report.metadata?.generatedAt || report.created_at],
    ['Total Records', report.metadata?.totalRecords || 0],
    [''],
    ['Summary']
  ];

  if (report.data.summary) {
    Object.entries(report.data.summary).forEach(([key, value]) => {
      summaryData.push([key, value]);
    });
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Add data sheet
  if (report.data.records && Array.isArray(report.data.records) && report.data.records.length > 0) {
    const dataSheet = XLSX.utils.json_to_sheet(report.data.records);
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data');
  }

  // Add charts sheet if available
  if (report.data.charts && Array.isArray(report.data.charts)) {
    const chartsData = [['Chart Information']];
    report.data.charts.forEach((chart: any, index: number) => {
      chartsData.push([`Chart ${index + 1}`, chart.title || 'Untitled Chart']);
      chartsData.push(['Type', chart.type]);
      if (chart.data && chart.data.labels) {
        chartsData.push(['Labels', chart.data.labels.join(', ')]);
      }
      chartsData.push(['']); // Empty row
    });

    const chartsSheet = XLSX.utils.aoa_to_sheet(chartsData);
    XLSX.utils.book_append_sheet(workbook, chartsSheet, 'Charts');
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function exportToHTML(report: Report): Promise<string> {
  return generateHTMLReport(report);
}

function exportToJSON(report: Report): any {
  return {
    report: {
      id: report.id,
      title: report.title,
      type: report.type,
      generatedAt: report.metadata?.generatedAt || report.created_at,
      metadata: report.metadata
    },
    data: report.data
  };
}

function generateHTMLReport(report: Report): string {
  const data = report.data;
  const metadata = report.metadata || {};

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            border-bottom: 3px solid #3B82F6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #1F2937;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
            padding: 20px;
            background: #F9FAFB;
            border-radius: 8px;
        }
        
        .metadata-item {
            display: flex;
            flex-direction: column;
        }
        
        .metadata-label {
            font-weight: 600;
            color: #6B7280;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .metadata-value {
            font-size: 16px;
            color: #1F2937;
            margin-top: 4px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 20px;
            color: #1F2937;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            padding: 20px;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            text-align: center;
            background: #fff;
        }
        
        .summary-card h3 {
            font-size: 14px;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        
        .summary-card .value {
            font-size: 24px;
            font-weight: 700;
            color: #1F2937;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
        }
        
        .data-table th,
        .data-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #E5E7EB;
        }
        
        .data-table th {
            background: #F9FAFB;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
        }
        
        .data-table tr:hover {
            background: #F9FAFB;
        }
        
        .chart-info {
            padding: 20px;
            background: #F0F9FF;
            border: 1px solid #BAE6FD;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .chart-info h4 {
            color: #0369A1;
            margin-bottom: 10px;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            color: #6B7280;
            font-size: 12px;
        }

        @media print {
            .container {
                max-width: none;
                margin: 0;
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${report.title}</h1>
            <p>Report Type: <strong>${report.type.toUpperCase()}</strong></p>
        </div>
        
        <div class="metadata">
            <div class="metadata-item">
                <span class="metadata-label">Generated At</span>
                <span class="metadata-value">${new Date(metadata.generatedAt || report.created_at).toLocaleString()}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Total Records</span>
                <span class="metadata-value">${metadata.totalRecords || 'N/A'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Execution Time</span>
                <span class="metadata-value">${metadata.executionTime || 0}ms</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Report ID</span>
                <span class="metadata-value">${report.id}</span>
            </div>
        </div>

        ${generateSummarySection(data.summary)}
        ${generateDataSection(data.records)}
        ${generateChartsSection(data.charts)}
        
        <div class="footer">
            <p>Generated by E-Commerce Dashboard</p>
            <p>© ${new Date().getFullYear()} All rights reserved</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

function generateSummarySection(summary: any): string {
  if (!summary || typeof summary !== 'object') return '';
  
  const summaryCards = Object.entries(summary).map(([key, value]) => `
    <div class="summary-card">
        <h3>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
        <div class="value">${formatValue(value)}</div>
    </div>
  `).join('');

  return `
    <div class="section">
        <h2 class="section-title">Summary</h2>
        <div class="summary-grid">
            ${summaryCards}
        </div>
    </div>
  `;
}

function generateDataSection(records: any[]): string {
  if (!records || !Array.isArray(records) || records.length === 0) return '';
  
  const headers = Object.keys(records[0]);
  const headerRow = headers.map(header => 
    `<th>${header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>`
  ).join('');
  
  const dataRows = records.slice(0, 100).map(record => { // Limit to 100 rows for HTML
    const cells = headers.map(header => `<td>${formatValue(record[header])}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <div class="section">
        <h2 class="section-title">Data (${records.length > 100 ? 'First 100 of ' + records.length : records.length} records)</h2>
        <table class="data-table">
            <thead>
                <tr>${headerRow}</tr>
            </thead>
            <tbody>
                ${dataRows}
            </tbody>
        </table>
    </div>
  `;
}

function generateChartsSection(charts: any[]): string {
  if (!charts || !Array.isArray(charts) || charts.length === 0) return '';
  
  const chartItems = charts.map((chart, index) => `
    <div class="chart-info">
        <h4>Chart ${index + 1}: ${chart.title || 'Untitled Chart'}</h4>
        <p><strong>Type:</strong> ${chart.type}</p>
        ${chart.data && chart.data.labels ? `<p><strong>Data Points:</strong> ${chart.data.labels.length}</p>` : ''}
        <p><em>Note: Chart visualization is not available in PDF/HTML export. Please view in the dashboard for interactive charts.</em></p>
    </div>
  `).join('');

  return `
    <div class="section">
        <h2 class="section-title">Charts</h2>
        ${chartItems}
    </div>
  `;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') {
    // Format numbers with commas
    return value.toLocaleString();
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}