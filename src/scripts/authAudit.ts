/**
 * Authentication Audit Script
 * 
 * This script scans the codebase for components using useAuth
 * and verifies they are properly wrapped with AuthProvider.
 */

import fs from 'fs';
import path from 'path';
import { isComponentProperlyWrapped, generateFixRecommendation, generateAuthAuditReport, ComponentAuditItem } from '../lib/authAuditUtils';

// Configuration
const SRC_DIR = path.resolve(__dirname, '..');
const REPORT_PATH = path.resolve(__dirname, '../../documentation/auth_audit_report.md');

// File extensions to scan
const EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js'];

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git'];

/**
 * Recursively scans a directory for files with specified extensions
 */
function scanDirectory(dir: string): string[] {
  const files: string[] = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory() && !EXCLUDE_DIRS.includes(item)) {
      files.push(...scanDirectory(itemPath));
    } else if (stats.isFile() && EXTENSIONS.includes(path.extname(item))) {
      files.push(itemPath);
    }
  }
  
  return files;
}

/**
 * Checks if a file contains a React component that uses useAuth
 */
function analyzeFile(filePath: string): ComponentAuditItem | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip files that don't use useAuth
    if (!content.includes('useAuth')) {
      return null;
    }
    
    // Extract component name from file path
    const fileName = path.basename(filePath);
    const componentName = fileName.split('.')[0];
    
    // Check if component is properly wrapped
    const { usesAuth, properlyWrapped, wrapperType } = isComponentProperlyWrapped(content);
    
    if (!usesAuth) {
      return null;
    }
    
    // Create audit item
    const auditItem: ComponentAuditItem = {
      name: componentName,
      path: filePath.replace(SRC_DIR, 'src'),
      usesAuth,
      properlyWrapped,
      wrapperType,
    };
    
    // Generate fix recommendation if needed
    if (!properlyWrapped) {
      auditItem.fixRecommendation = generateFixRecommendation(auditItem);
    }
    
    return auditItem;
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Generates a markdown report from the audit results
 */
function generateMarkdownReport(components: ComponentAuditItem[]): string {
  const report = generateAuthAuditReport(components);
  
  let markdown = '# Authentication Audit Report\n\n';
  
  markdown += '## Overview\n\n';
  markdown += 'This document provides a comprehensive audit of all components using the `useAuth` hook in the FeedbackLoop platform. ';
  markdown += 'The audit was conducted to identify components that are not properly wrapped with `AuthProvider`, ';
  markdown += 'which could lead to runtime errors and inconsistent authentication behavior.\n\n';
  
  markdown += '## Audit Results\n\n';
  markdown += '### Summary\n\n';
  markdown += `- **Total Components Using useAuth**: ${report.usesAuthCount}\n`;
  markdown += `- **Properly Wrapped Components**: ${report.properlyWrappedCount}\n`;
  markdown += `- **Components Needing Fixes**: ${report.needsFixingCount}\n\n`;
  
  if (report.needsFixingCount > 0) {
    markdown += '### Components Needing Fixes\n\n';
    markdown += '| Component | Path | Current Wrapper | Fix Recommendation |\n';
    markdown += '|-----------|------|-----------------|--------------------|
';
    
    for (const component of report.needsFixing) {
      markdown += `| ${component.name} | ${component.path} | ${component.wrapperType} | ${component.fixRecommendation} |\n`;
    }
    
    markdown += '\n';
  }
  
  markdown += '### Properly Wrapped Components\n\n';
  markdown += '| Component | Path | Wrapper Type | Notes |\n';
  markdown += '|-----------|------|--------------|-------|
';
  
  for (const component of report.properlyWrapped) {
    const notes = component.notes || 'Used within main application flow, wrapped by App.tsx';
    markdown += `| ${component.name} | ${component.path} | ${component.wrapperType} | ${notes} |\n`;
  }
  
  return markdown;
}

/**
 * Main function to run the audit
 */
async function runAudit() {
  console.log('Starting authentication audit...');
  
  // Scan the codebase for files
  const files = scanDirectory(SRC_DIR);
  console.log(`Found ${files.length} files to analyze`);
  
  // Analyze each file
  const auditResults: ComponentAuditItem[] = [];
  
  for (const file of files) {
    const result = analyzeFile(file);
    if (result) {
      auditResults.push(result);
    }
  }
  
  console.log(`Found ${auditResults.length} components using useAuth`);
  console.log(`- ${auditResults.filter(r => r.properlyWrapped).length} properly wrapped`);
  console.log(`- ${auditResults.filter(r => !r.properlyWrapped).length} needing fixes`);
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(auditResults);
  
  // Write report to file
  fs.writeFileSync(REPORT_PATH, markdownReport);
  
  console.log(`Audit report written to ${REPORT_PATH}`);
}

// Run the audit
runAudit().catch(error => {
  console.error('Error running audit:', error);
  process.exit(1);
});
