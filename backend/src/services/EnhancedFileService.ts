import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { createWriteStream, createReadStream } from 'fs';
import { Logger } from '../utils/logger';

interface CommitResult {
  success: boolean;
  commitHash: string;
  message: string;
}

interface Documentation {
  content: string;
  format: 'markdown' | 'html' | 'pdf';
  sections: string[];
}

interface FileSearchResult {
  files: Array<{
    path: string;
    matches: Array<{
      line: number;
      content: string;
      context: string;
    }>;
  }>;
  totalMatches: number;
}

export class EnhancedFileService {
  private logger = new Logger('EnhancedFileService');
  private basePath: string;

  constructor(basePath: string = './projects') {
    this.basePath = basePath;
  }

  // Enhanced file operations from bolt.diy integration
  async createFile(filePath: string, content: string): Promise<any> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const dir = path.dirname(fullPath);
      await this.ensureDirectory(dir);
      await fs.writeFile(fullPath, content, 'utf8');
      
      const stats = await this.getFileStats(filePath);
      this.logger.debug(`File created: ${fullPath}`);
      
      return {
        id: Buffer.from(filePath).toString('base64'),
        name: path.basename(filePath),
        path: filePath,
        content,
        size: stats.size,
        created: stats.created,
        modified: stats.modified,
      };
    } catch (error) {
      this.logger.error(`Failed to create file ${filePath}:`, error);
      throw error;
    }
  }

  async readFile(id: string): Promise<any> {
    try {
      const filePath = Buffer.from(id, 'base64').toString();
      const fullPath = path.join(this.basePath, filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      const stats = await this.getFileStats(filePath);
      
      return {
        id,
        name: path.basename(filePath),
        path: filePath,
        content,
        size: stats.size,
        created: stats.created,
        modified: stats.modified,
      };
    } catch (error) {
      this.logger.error(`Failed to read file ${id}:`, error);
      throw error;
    }
  }

  async updateFile(id: string, content: string): Promise<any> {
    try {
      const filePath = Buffer.from(id, 'base64').toString();
      const fullPath = path.join(this.basePath, filePath);
      await fs.writeFile(fullPath, content, 'utf8');
      
      const stats = await this.getFileStats(filePath);
      this.logger.debug(`File updated: ${fullPath}`);
      
      return {
        id,
        name: path.basename(filePath),
        path: filePath,
        content,
        size: stats.size,
        modified: stats.modified,
      };
    } catch (error) {
      this.logger.error(`Failed to update file ${id}:`, error);
      throw error;
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      const filePath = Buffer.from(id, 'base64').toString();
      const fullPath = path.join(this.basePath, filePath);
      await fs.unlink(fullPath);
      this.logger.debug(`File deleted: ${fullPath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${id}:`, error);
      throw error;
    }
  }

  async searchInFiles(projectPath: string, query: string, options?: {
    fileTypes?: string[];
    caseSensitive?: boolean;
    regex?: boolean;
  }): Promise<FileSearchResult> {
    try {
      const fullProjectPath = path.join(this.basePath, projectPath);
      const results: FileSearchResult = {
        files: [],
        totalMatches: 0,
      };

      const searchFiles = async (dirPath: string): Promise<void> => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            await searchFiles(entryPath);
          } else if (entry.isFile()) {
            // Check file type filter
            if (options?.fileTypes && options.fileTypes.length > 0) {
              const ext = path.extname(entry.name).toLowerCase();
              if (!options.fileTypes.includes(ext)) {
                continue;
              }
            }
            
            try {
              const content = await fs.readFile(entryPath, 'utf8');
              const lines = content.split('\n');
              const matches: any[] = [];
              
              lines.forEach((line, index) => {
                let found = false;
                
                if (options?.regex) {
                  const regex = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
                  found = regex.test(line);
                } else {
                  const searchTerm = options?.caseSensitive ? query : query.toLowerCase();
                  const searchLine = options?.caseSensitive ? line : line.toLowerCase();
                  found = searchLine.includes(searchTerm);
                }
                
                if (found) {
                  matches.push({
                    line: index + 1,
                    content: line,
                    context: lines.slice(Math.max(0, index - 2), index + 3).join('\n'),
                  });
                }
              });
              
              if (matches.length > 0) {
                results.files.push({
                  path: path.relative(fullProjectPath, entryPath),
                  matches,
                });
                results.totalMatches += matches.length;
              }
            } catch (error) {
              // Skip files that can't be read as text
              this.logger.debug(`Skipping file ${entryPath}: ${error}`);
            }
          }
        }
      };

      await searchFiles(fullProjectPath);
      return results;
    } catch (error) {
      this.logger.error(`Search failed in ${projectPath}:`, error);
      throw error;
    }
  }

  async createProjectArchive(projectPath: string): Promise<string> {
    try {
      const fullProjectPath = path.join(this.basePath, projectPath);
      const archivePath = path.join(this.basePath, `${projectPath}-${Date.now()}.zip`);
      
      return new Promise((resolve, reject) => {
        const output = createWriteStream(archivePath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
          this.logger.info(`Archive created: ${archivePath} (${archive.pointer()} bytes)`);
          resolve(archivePath);
        });
        
        archive.on('error', (err) => {
          this.logger.error('Archive creation failed:', err);
          reject(err);
        });
        
        archive.pipe(output);
        archive.directory(fullProjectPath, false);
        archive.finalize();
      });
    } catch (error) {
      this.logger.error(`Failed to create archive for ${projectPath}:`, error);
      throw error;
    }
  }

  async extractProjectArchive(archivePath: string, extractPath: string): Promise<void> {
    try {
      const fullArchivePath = path.join(this.basePath, archivePath);
      const fullExtractPath = path.join(this.basePath, extractPath);
      
      await this.ensureDirectory(fullExtractPath);
      
      return new Promise((resolve, reject) => {
        createReadStream(fullArchivePath)
          .pipe(unzipper.Extract({ path: fullExtractPath }))
          .on('close', () => {
            this.logger.info(`Archive extracted to: ${fullExtractPath}`);
            resolve();
          })
          .on('error', (err) => {
            this.logger.error('Archive extraction failed:', err);
            reject(err);
          });
      });
    } catch (error) {
      this.logger.error(`Failed to extract archive ${archivePath}:`, error);
      throw error;
    }
  }

  async generateProjectDocumentation(projectPath: string): Promise<Documentation> {
    try {
      const fullProjectPath = path.join(this.basePath, projectPath);
      const packageJsonPath = path.join(fullProjectPath, 'package.json');
      
      let projectInfo: any = {};
      try {
        const packageContent = await fs.readFile(packageJsonPath, 'utf8');
        projectInfo = JSON.parse(packageContent);
      } catch {
        // No package.json found
      }
      
      const sections = ['Overview', 'Installation', 'Usage', 'API', 'Contributing'];
      const content = `# ${projectInfo.name || 'Project'} Documentation

## Overview
${projectInfo.description || 'No description available'}

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
${projectInfo.scripts ? Object.keys(projectInfo.scripts).map(script => `- \`npm run ${script}\``).join('\n') : 'No scripts available'}

## API
Auto-generated API documentation would go here.

## Contributing
Please read the contributing guidelines before submitting pull requests.
`;

      return {
        content,
        format: 'markdown',
        sections,
      };
    } catch (error) {
      this.logger.error(`Failed to generate documentation for ${projectPath}:`, error);
      throw error;
    }
  }

  // Utility methods
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create directory ${dirPath}:`, error);
      throw error;
    }
  }

  private async getFileStats(filePath: string): Promise<any> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const stats = await fs.stat(fullPath);
      return {
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        modified: stats.mtime,
        created: stats.birthtime,
      };
    } catch (error) {
      this.logger.error(`Failed to get file stats ${filePath}:`, error);
      throw error;
    }
  }
}
