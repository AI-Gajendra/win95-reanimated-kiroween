# Win95 Reanimated

> Resurrect the classic Windows 95 desktop as a modern, AI-augmented environment while preserving the original visual feel and interaction patterns.

Win95 Reanimated is an Electron + React + TypeScript application that recreates the nostalgic Windows 95 experience with a modern twist: AI-powered features for text summarization, natural language commands, and intelligent file organization.

## ✨ Features

### 🖥️ Classic Win95 Desktop
- Full-screen desktop with taskbar and Start Menu
- Authentic Win95 visual styling (beveled borders, classic grey palette)
- Window management with drag, resize, minimize, maximize, and close
- System tray with clock

### 📝 AI-Augmented Notepad
- Classic Notepad interface with modern AI capabilities
- **Summarize**: Generate concise summaries of your documents
- **Rewrite**: Transform text with different styles (formal, casual, concise)
- Autosave functionality
- Win95-style menus and dialogs

### 📁 Intelligent File Explorer
- Dual-pane interface (folder tree + file list)
- **Explain This Folder**: AI-powered folder analysis with organization recommendations
- Create, rename, delete files and folders
- Navigate with toolbar buttons (Back, Forward, Up)
- Search functionality

### 🔍 AI-Powered Start Menu Search
- Natural language command interpretation
- Examples:
  - "open notepad" → Opens Notepad
  - "create a todo list" → Opens Notepad with a todo template
  - "search for documents" → Searches the file system

### 🎬 Boot Experience
- Authentic Win95-style boot screen
- "Resurrecting system components..." message
- Smooth transition to desktop

## 🏗️ Architecture

Win95 Reanimated is built with a clean, modular architecture:

```
win95-reanimated/
├── .kiro/                    # Kiro specs, hooks, and steering
│   ├── specs/               # Feature specifications
│   │   ├── desktop/         # Desktop system spec
│   │   ├── notepad/         # Notepad app spec
│   │   ├── explorer/        # Explorer app spec
│   │   ├── vfs/             # Virtual file system spec
│   │   ├── ai-engine/       # AI engine spec
│   │   └── electron/        # Electron shell spec
│   ├── hooks/               # Kiro hooks for automation
│   │   ├── onAppLaunch.js
│   │   ├── startMenuSearch.js
│   │   ├── onFileCreate.js
│   │   └── onTextEdit.js
│   └── steering/            # Development guidelines
│       ├── ui-style.md      # Win95 UI style guide
│       └── architecture.md  # Architecture patterns
├── apps/                    # Application modules
│   ├── notepad/
│   ├── explorer/
│   └── start-menu/
├── core/                    # Core services
│   ├── window-manager/      # Window state management
│   ├── file-system/         # Virtual file system (VFS)
│   └── ai-engine/           # AI service abstraction
├── electron/                # Electron main process
│   ├── main.ts
│   └── preload.ts
├── src/                     # React application
│   ├── components/
│   ├── App.tsx
│   └── index.tsx
└── public/                  # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/win95-reanimated.git
cd win95-reanimated

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open in an Electron window with hot reload enabled.

### Building for Production

```bash
# Build the application
npm run build

# Package for your platform
npm run package

# Or package for specific platforms
npm run package:win    # Windows
npm run package:mac    # macOS
npm run package:linux  # Linux
```

## 🤖 AI Configuration

Win95 Reanimated works out of the box with a mock AI provider for demo purposes. To use real AI capabilities:

1. Create a `.env` file in the project root:

```env
AI_PROVIDER=openai
AI_API_KEY=your_api_key_here
AI_TIMEOUT=30000
```

2. Supported providers:
   - `mock` (default): Simulated AI responses
   - `openai`: OpenAI GPT models
   - `anthropic`: Anthropic Claude models
   - `test`: Deterministic responses for testing

## 📚 Kiro Integration

This project showcases extensive use of Kiro for specification-driven development:

### Specs
Detailed specifications for each module in `.kiro/specs/`:
- Requirements (user stories and acceptance criteria)
- Design (architecture and component interfaces)
- Tasks (implementation plan with checkboxes)

### Hooks
Automated behaviors triggered by events:
- **onAppLaunch**: System diagnostics on startup
- **startMenuSearch**: Natural language command interpretation
- **onFileCreate**: Automatic file summarization
- **onTextEdit**: Real-time document analysis

### Steering
Development guidelines enforced across the codebase:
- **ui-style.md**: Win95 visual style guide
- **architecture.md**: Code organization and patterns

## 🎨 Win95 Style Guide

All UI components follow authentic Windows 95 design:

- **Colors**: Classic grey (#c0c0c0), navy blue (#000080), white, black
- **Borders**: 3D beveled appearance (outset for raised, inset for sunken)
- **Typography**: MS Sans Serif, Courier New
- **No modern effects**: No rounded corners, shadows, or smooth animations
- **Interactions**: Instant state changes, dotted focus indicators

See `.kiro/steering/ui-style.md` for complete guidelines.

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 📖 Documentation

- [Desktop System Spec](.kiro/specs/desktop/requirements.md)
- [Notepad Spec](.kiro/specs/notepad/requirements.md)
- [Explorer Spec](.kiro/specs/explorer/requirements.md)
- [VFS Spec](.kiro/specs/vfs/requirements.md)
- [AI Engine Spec](.kiro/specs/ai-engine/requirements.md)
- [Electron Shell Spec](.kiro/specs/electron/requirements.md)

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Read the architecture guide in `.kiro/steering/architecture.md`
2. Follow the UI style guide in `.kiro/steering/ui-style.md`
3. Create specs for new features in `.kiro/specs/`
4. Write tests for all new functionality
5. Ensure Win95 aesthetics are maintained

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the classic Windows 95 operating system
- Built with Kiro for specification-driven development
- Powered by modern web technologies (Electron, React, TypeScript)

## 🎯 Roadmap

- [ ] Additional Win95 applications (Paint, Calculator, Minesweeper)
- [ ] Multiplayer features (shared desktop sessions)
- [ ] Plugin system for custom applications
- [ ] Themes (Windows 98, Windows XP)
- [ ] Mobile companion app
- [ ] Cloud sync for VFS

## 📧 Contact

For questions, suggestions, or feedback, please open an issue on GitHub.

---

**Made with ❤️ and nostalgia for the golden age of computing**
