# Hotel Review Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://chrimar3.github.io/MVP_Hotel/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://www.javascript.com/)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/chrimar3/MVP_Hotel/graphs/commit-activity)

A lightweight, single-page application for generating hotel reviews across multiple platforms and languages.

## 🚀 Demo

**[Live Demo](https://chrimar3.github.io/MVP_Hotel/)** - Try it now

## ✨ Features

- **Multi-Platform Support** - Generate reviews for Booking.com, TripAdvisor, Google, and Expedia
- **7 Languages** - English, Spanish, French, German, Italian, Chinese, Greek
- **Mobile Optimized** - Responsive design with touch-friendly interface
- **Offline Support** - Progressive Web App with service worker caching
- **No Dependencies** - Pure vanilla JavaScript, no framework required
- **Fast Loading** - Single HTML file, <10KB gzipped

## 🛠️ Installation

### Option 1: Direct Use (No Installation)
Simply open the [live demo](https://chrimar3.github.io/MVP_Hotel/) in any modern browser.

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/chrimar3/MVP_Hotel.git
cd MVP_Hotel

# Install dependencies (for testing only)
npm install

# Start local server
npm start
# Opens at http://localhost:3000
```

### Option 3: Python Server

```bash
# Using Python 3
python3 -m http.server 3000 --directory public

# Using Python 2
python -m SimpleHTTPServer 3000
```

## 📖 Usage

1. Open the application in your browser
2. Select your preferred language
3. Choose review aspects (Location, Service, etc.)
4. Optionally add staff member name for recognition
5. Click "Generate Review" 
6. Copy the generated review to your clipboard
7. Paste on your preferred review platform

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 📁 Project Structure

```
MVP_Hotel/
├── public/           # Static files served to browser
│   ├── index.html    # Main application
│   └── manifest.json # PWA manifest
├── src/              # Source code
│   ├── services/     # Business logic
│   ├── utils/        # Utility functions
│   └── components/   # UI components
├── tests/            # Test suites
│   ├── unit/         # Unit tests
│   └── integration/  # Integration tests
├── config/           # Configuration files
└── docs/             # Documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📋 Requirements

- Any modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- No server or backend required

## 🔧 Available Scripts

```bash
npm start           # Start development server
npm test            # Run tests
npm run lint        # Check code quality
npm run format      # Format code
npm run build       # Build for production
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Author

**Chris Maragkoudakis** - [GitHub](https://github.com/chrimar3)

## 🙏 Acknowledgments

- Built with vanilla JavaScript for maximum compatibility
- Designed for simplicity and ease of use
- Optimized for mobile-first experience

---

For bugs, questions, and feature requests, please [create an issue](https://github.com/chrimar3/MVP_Hotel/issues).