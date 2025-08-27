import path from 'path';
import fs from 'fs';

export class StorageConfig {
  public static readonly BASE_UPLOAD_DIR = path.join(process.cwd(), 'uploads');
  public static readonly REPORTS_DIR = path.join(this.BASE_UPLOAD_DIR, 'reports');
  public static readonly TEMP_DIR = path.join(this.BASE_UPLOAD_DIR, 'temp');
  public static readonly TEMPLATES_DIR = path.join(this.BASE_UPLOAD_DIR, 'templates');
  
  // Format specific directories
  public static readonly PDF_DIR = path.join(this.REPORTS_DIR, 'pdf');
  public static readonly EXCEL_DIR = path.join(this.REPORTS_DIR, 'excel');
  public static readonly HTML_DIR = path.join(this.REPORTS_DIR, 'html');
  public static readonly JSON_DIR = path.join(this.REPORTS_DIR, 'json');

  public static initializeDirectories(): void {
    const directories = [
      this.BASE_UPLOAD_DIR,
      this.REPORTS_DIR,
      this.TEMP_DIR,
      this.TEMPLATES_DIR,
      this.PDF_DIR,
      this.EXCEL_DIR,
      this.HTML_DIR,
      this.JSON_DIR
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  public static getReportPath(reportId: string, format: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportId}_${timestamp}.${this.getFileExtension(format)}`;
    
    switch (format.toLowerCase()) {
      case 'pdf':
        return path.join(this.PDF_DIR, filename);
      case 'excel':
      case 'xlsx':
        return path.join(this.EXCEL_DIR, filename);
      case 'html':
        return path.join(this.HTML_DIR, filename);
      case 'json':
        return path.join(this.JSON_DIR, filename);
      default:
        return path.join(this.REPORTS_DIR, filename);
    }
  }

  public static getTempPath(filename: string): string {
    return path.join(this.TEMP_DIR, filename);
  }

  public static getTemplatePath(templateName: string): string {
    return path.join(this.TEMPLATES_DIR, templateName);
  }

  private static getFileExtension(format: string): string {
    switch (format.toLowerCase()) {
      case 'excel':
        return 'xlsx';
      case 'pdf':
        return 'pdf';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      default:
        return format.toLowerCase();
    }
  }

  // Clean up old files (older than specified days)
  public static async cleanupOldFiles(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const directories = [this.PDF_DIR, this.EXCEL_DIR, this.HTML_DIR, this.JSON_DIR, this.TEMP_DIR];

    for (const directory of directories) {
      try {
        const files = fs.readdirSync(directory);
        
        for (const file of files) {
          const filePath = path.join(directory, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Cleaned up old file: ${filePath}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error cleaning up directory ${directory}:`, error);
      }
    }
  }

  // Get file size in bytes
  public static getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  // Check if file exists
  public static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  // Get relative path for database storage
  public static getRelativePath(absolutePath: string): string {
    return path.relative(process.cwd(), absolutePath);
  }

  // Get absolute path from relative path
  public static getAbsolutePath(relativePath: string): string {
    return path.join(process.cwd(), relativePath);
  }
}