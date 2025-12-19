# Zapnote

A modern, sleek knowledge management application that helps you organize your thoughts, links, and information in one convenient place. Built with cutting-edge web technologies for a smooth, intuitive user experience.

## ✨ Features

- **Unified Knowledge Hub**: Store and organize notes, links, and information in one place
- **Beautiful UI**: Modern design with smooth animations and responsive layout
- **Dark/Light Mode**: Seamless theme switching with system preference detection
- **Smooth Navigation**: Pill-style navigation with scroll-based highlighting
- **Interactive Animations**: Engaging hover effects and page transitions
- **Authentication System**: Secure user authentication and account management
- **Mobile Responsive**: Optimized for all device sizes

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth interactions
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts (Pacifico for branding, Geist for UI)
- **State Management**: React hooks with custom transition logic
- **TypeScript**: Full type safety throughout the application

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AnuGuin/Zapnote-Frontend.git
cd Zapnote-Frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and Tailwind imports
│   ├── layout.tsx           # Root layout with theme provider
│   └── page.tsx             # Landing page with all sections
├── components/
│   ├── landing/
│   │   ├── hero.tsx         # Hero section with animated title
│   │   ├── features.tsx     # Features showcase
│   │   ├── faq.tsx          # FAQ accordion section
│   │   ├── cta.tsx          # Call-to-action with animated paths
│   │   ├── footer.tsx       # Site footer
│   │   └── pill-nav.tsx     # Navigation with scroll detection
│   └── ui/                  # Reusable UI components
│       ├── button.tsx       # Custom button component
│       ├── concentric-loader.tsx # Loading animation
│       ├── geometric-shapes.tsx  # Background shapes
│       └── ...
├── hooks/
│   ├── use-page-transition.tsx # Navigation with loading states
│   ├── use-gsap.ts         # GSAP animation utilities
│   └── use-toast.ts        # Toast notification system
├── lib/
│   └── utils.ts            # Utility functions
└── theme/                  # Theme management
    ├── theme-provider.tsx  # Theme context provider
    └── toggle-theme.tsx    # Theme toggle component
```

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (`from-blue-600 to-blue-700`)
- **Accent**: Red/Pink for highlights
- **Neutral**: Adaptive light/dark mode colors

### Typography
- **Display**: Pacifico font for branding
- **Body**: Geist font for optimal readability
- **Sizes**: Responsive scaling from mobile to desktop

### Animations
- **Page Transitions**: Smooth fade and scale effects
- **Hover States**: Subtle scale and color transitions
- **Scroll Animations**: Path drawing and parallax effects

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint


## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on every push to main branch
3. Custom domain support included


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 📞 Contact

For questions or support, please reach out to #anubrata.guin2023@iem.edu.in

---

Built with ❤️ using Next.js, Tailwind CSS, and Framer Motion
