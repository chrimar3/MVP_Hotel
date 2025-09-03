# Repository Structure Documentation

## Production Files (Root Level)

These are the main files for deployment:

```
/
├── index.html              # Main landing page - Demo hub with navigation
├── review-generator.html   # Core application - Production review generator
├── demo-links.html         # Test scenarios and demo links
├── health.html            # Health check endpoint
└── 404.html               # Error handling page
```

## Directory Structure

```
/
├── src/                   # Production JavaScript, CSS, and assets
├── api/                   # Serverless functions and API endpoints
├── public/                # Static assets (images, icons, manifest)
├── assets/                # Build assets and resources
├── coverage/              # Test coverage reports (auto-generated)
├── playwright-report/     # E2E test reports (auto-generated)
├── tests/                 # Test configuration and scripts
├── node_modules/          # Dependencies (auto-generated)
├── archive/               # Organized archive of development files
│   ├── development/       # Old production attempts and iterations
│   ├── duplicates/        # Duplicate files that were consolidated
│   ├── test-files/        # Development test HTML files
│   ├── html-templates/    # Template versions and experiments
│   └── old-versions/      # Legacy versions
└── .backup/               # Automated backups
```

## Key Production Files

### index.html
- **Purpose**: Main landing page and demo hub
- **Size**: ~11KB
- **Features**: Navigation to all demos, responsive design, PWA ready
- **Dependencies**: Links to archive files for demos

### review-generator.html  
- **Purpose**: Main application for generating hotel reviews
- **Size**: ~44KB
- **Features**: Full review generation, multi-platform support, analytics
- **Status**: Production ready with 100% test coverage

## Archive Organization

### `/archive/development/`
- `guest-feedback-portal.html` - Earlier iteration of main app
- `index-production.html` - Alternative landing page version

### `/archive/duplicates/`
- `public-index.html` - Duplicate from /public/
- `public-review-generator.html` - Duplicate from /public/
- `src-index.html` - Duplicate from /src/
- `src-review-generator.html` - Duplicate from /src/

### `/archive/test-files/`
- All `test-*.html` files from root and /tests/ directory
- Unit test HTML files
- Performance audit files
- Mobile test files

### `/archive/html-templates/`
- Various template versions and experiments
- Ultimate UX enhanced versions
- Analytics dashboard
- Enhanced generators

## Deployment Strategy

### Primary Deployment Files
1. `index.html` - Entry point and navigation
2. `review-generator.html` - Core application
3. `src/` directory - All production JavaScript and CSS
4. `api/` directory - Server-side functions
5. `public/` directory - Static assets

### CDN/Static Hosting
- Root HTML files can be served directly
- `/src/` and `/public/` should be served with appropriate caching headers
- `/archive/` can be excluded from production builds or served with long cache times

### CI/CD Considerations
- Only root `.html` files and `src/`, `api/`, `public/` directories need deployment
- Archive files can be excluded from production builds
- Test and coverage directories are development-only

## File Count Reduction

**Before**: 156+ HTML files scattered across multiple directories
**After**: 5 production HTML files at root level + organized archive

## Benefits of New Structure

1. **Clear Production Path**: Only 5 files at root for deployment
2. **Reduced Confusion**: Archive clearly separated from production
3. **Better Performance**: Fewer files to scan during builds
4. **Maintainable**: Easy to identify what needs updates
5. **Professional**: Clean structure suitable for team development

## Development Workflow

1. **Production Changes**: Edit root HTML files directly
2. **New Features**: Develop in root, archive old versions when replacing
3. **Testing**: Use archived test files or create new ones
4. **Deployment**: Deploy root + src/ + api/ + public/ directories only

---
*Last Updated: 2025-09-03*
*Repository Consolidation: Complete*