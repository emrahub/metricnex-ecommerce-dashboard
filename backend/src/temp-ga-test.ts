import 'dotenv/config';
import googleAnalyticsService from './services/googleAnalytics';

async function testGoogleAnalytics() {
  try {
    const report = await googleAnalyticsService.getReport(
      '349428903',
      '2024-01-01',
      '2024-01-31',
      ['activeUsers'],
      ['country']
    );
    console.log('Successfully fetched report from Google Analytics:');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Failed to fetch report from Google Analytics:', error);
  }
}

testGoogleAnalytics();