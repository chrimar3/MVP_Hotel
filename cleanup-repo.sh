#!/bin/bash

# Repository Cleanup Script
# Removes duplicate files and organizes the repository

echo "🧹 Starting Repository Cleanup..."
echo "================================"

# Create backup first
echo "📦 Creating backup..."
mkdir -p .backup/$(date +%Y%m%d)
cp -r *.html .backup/$(date +%Y%m%d)/

# Create organized structure
echo "📁 Creating organized structure..."
mkdir -p archive/old-versions
mkdir -p archive/test-files

# Move old HTML versions to archive
echo "🗂️ Archiving old HTML versions..."
mv guest-feedback-portal-v*.html archive/old-versions/ 2>/dev/null
mv review-generator-v*.html archive/old-versions/ 2>/dev/null
mv hotel-review-*.html archive/old-versions/ 2>/dev/null
mv test-*.html archive/test-files/ 2>/dev/null
mv demo-*.html archive/test-files/ 2>/dev/null

# Keep only production files in root
echo "✅ Keeping production files..."
# These should remain in root:
# - index.html (main production file)
# - index-production.html (production-ready version)
# - 404.html (error page)
# - health.html (health check)

# Clean up test artifacts
echo "🧪 Cleaning test artifacts..."
rm -rf playwright-report/ 2>/dev/null
rm -rf test-results/ 2>/dev/null
rm -f *.png 2>/dev/null
rm -f *.jpg 2>/dev/null

# Update .gitignore
echo "📝 Updating .gitignore..."
cat >> .gitignore << 'EOL'

# Archive directories
archive/
.backup/

# Test artifacts
playwright-report/
test-results/
*.png
*.jpg
screenshots/

# Environment files
.env
.env.local
.env.production

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Coverage
coverage/
.nyc_output/

# Production builds
dist/
build/
EOL

# Create main index.html if not exists
if [ ! -f "index.html" ]; then
    echo "📄 Creating main index.html..."
    cp index-production.html index.html 2>/dev/null || \
    cp guest-feedback-portal-v8-accessible.html index.html 2>/dev/null
fi

# Count files
echo ""
echo "📊 Repository Statistics:"
echo "------------------------"
echo "HTML files in root: $(ls -1 *.html 2>/dev/null | wc -l)"
echo "Archived files: $(find archive -name "*.html" 2>/dev/null | wc -l)"
echo "JavaScript files: $(find src -name "*.js" 2>/dev/null | wc -l)"
echo "Test files: $(find tests -name "*.js" 2>/dev/null | wc -l)"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Review files in archive/ directory"
echo "2. Delete archive/ if files are not needed"
echo "3. Commit changes: git add . && git commit -m 'chore: clean up repository structure'"
echo "4. Update deployment configuration to use index.html"