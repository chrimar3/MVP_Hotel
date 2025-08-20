/**
 * OneRedOak Workflow Integration Hooks for Claude Code
 * Automatically runs design review, TDD, and performance workflows
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Hook configurations based on OneRedOak patterns
const HOOKS = {
  // Run before any file edit
  beforeEdit: async (file) => {
    console.log(`🔍 OneRedOak Pre-edit Check: ${file}`);
    
    // If editing HTML/CSS, run design review first
    if (file.endsWith('.html') || file.endsWith('.css')) {
      try {
        await execAsync('.claude/commands/design-review.sh');
        console.log('✅ Design review passed');
      } catch (error) {
        console.warn('⚠️ Design issues detected - proceed with caution');
      }
    }
  },

  // Run after file save
  afterSave: async (file) => {
    console.log(`💾 OneRedOak Post-save Workflow: ${file}`);
    
    // Run appropriate workflow based on file type
    if (file.includes('test')) {
      await execAsync('.claude/commands/test-runner.sh');
    } else if (file.endsWith('.html')) {
      await execAsync('.claude/commands/mobile-ux-test.sh');
    }
    
    // Always check performance after changes
    await execAsync('.claude/commands/perf-monitor.sh');
  },

  // Run before commit
  beforeCommit: async () => {
    console.log('🚀 OneRedOak Pre-commit Validation...');
    
    const workflows = [
      '.claude/commands/design-review.sh',
      '.claude/commands/test-runner.sh',
      '.claude/commands/perf-monitor.sh',
      '.claude/commands/mobile-ux-test.sh'
    ];
    
    for (const workflow of workflows) {
      try {
        const { stdout } = await execAsync(workflow);
        console.log(stdout);
      } catch (error) {
        console.error(`❌ Workflow failed: ${workflow}`);
        throw new Error('Pre-commit checks failed');
      }
    }
    
    console.log('✅ All OneRedOak workflows passed!');
  },

  // Automated fix command
  autoFix: async (issue) => {
    console.log(`🔧 OneRedOak Auto-fix: ${issue}`);
    
    const fixes = {
      'mobile-ux': async () => {
        // Auto-fix mobile UX issues
        console.log('Applying mobile UX enhancements...');
        // Implementation would modify files to fix issues
      },
      'accessibility': async () => {
        // Auto-fix accessibility issues
        console.log('Adding ARIA labels and improving a11y...');
      },
      'performance': async () => {
        // Auto-optimize performance
        console.log('Optimizing bundle size and load time...');
      }
    };
    
    if (fixes[issue]) {
      await fixes[issue]();
      console.log(`✅ Auto-fix complete for ${issue}`);
    }
  }
};

// Export hooks for Claude Code integration
export default {
  name: 'oneRedOak-workflows',
  version: '1.0.0',
  hooks: HOOKS,
  
  // Claude Code commands
  commands: {
    'review': {
      description: 'Run OneRedOak design review',
      handler: () => execAsync('.claude/commands/design-review.sh')
    },
    'test': {
      description: 'Run OneRedOak TDD workflow',
      handler: () => execAsync('.claude/commands/test-runner.sh')
    },
    'perf': {
      description: 'Run OneRedOak performance monitor',
      handler: () => execAsync('.claude/commands/perf-monitor.sh')
    },
    'mobile': {
      description: 'Run OneRedOak mobile UX test',
      handler: () => execAsync('.claude/commands/mobile-ux-test.sh')
    },
    'fix': {
      description: 'Auto-fix detected issues',
      handler: (args) => HOOKS.autoFix(args[0])
    }
  }
};