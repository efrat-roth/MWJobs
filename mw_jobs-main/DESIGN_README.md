# MW Jobs - Event Staffing System

A modern, responsive web application for event staffing registration built with Next.js, featuring a beautiful Figma-designed UI.

## 🎨 Design Implementation

The application has been completely redesigned based on a professional Figma design with the following features:

### 🌟 Main Landing Page Features
- **Full-screen background design** with overlay effects
- **Responsive layout** - separate designs for desktop and mobile
- **RTL (Right-to-Left) support** for Hebrew content
- **Modern glassmorphism effects** with backdrop blur
- **Smooth animations and transitions**
- **Professional form design** with rounded inputs and proper spacing
- **WhatsApp integration button** with custom styling
- **Company branding** with logo placement

### 🎨 Design System
- **Primary Color**: #007AFF (iOS Blue)
- **WhatsApp Green**: #25D366
- **Typography**: Inter font family with proper Hebrew support
- **Rounded Design Language**: 50px border radius for inputs and buttons
- **Glassmorphism**: Transparent overlays with backdrop blur
- **Consistent Spacing**: 16px, 20px, 24px grid system

### 📱 Responsive Design
- **Desktop Layout**: Side-positioned form with background image
- **Mobile Layout**: Stacked vertical layout optimized for touch
- **Breakpoint**: 768px for mobile/desktop transition
- **Touch-friendly**: Larger buttons and inputs on mobile

## 🏗️ Project Structure

```
styles/
├── main.css      # Landing page styles
└── admin.css     # Admin panel styles

pages/
├── index.tsx     # Landing page component
├── admin/
│   └── index.tsx # Admin dashboard
└── _app.tsx      # App configuration

public/
├── background-desktop.jpg     # Desktop background
├── background-mobile.jpg      # Mobile background  
├── logo.jpg                   # Company logo
├── whatsapp-icon.svg         # WhatsApp button icon
├── submit-icon.svg           # Form submit icon
└── arrow-down.svg            # Dropdown arrow icon
```

## 🎯 Key Features

### User Registration Form
- **Multi-step validation** with real-time feedback
- **Event selection** with availability status
- **Hebrew form labels** and proper RTL layout
- **Loading states** and success/error messaging
- **Mobile-optimized input fields**

### Admin Dashboard
- **Consistent design language** following the main theme
- **Event management** with creation and deletion
- **Status tracking** with color-coded badges
- **Responsive table** for event listings
- **Google OAuth integration** for secure admin access

### Technical Implementation
- **CSS Modules approach** with separated concerns
- **No inline styles** - all styling in dedicated CSS files
- **Semantic HTML** structure for accessibility
- **Progressive enhancement** approach
- **Cross-browser compatibility**

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env.local.example` to `.env.local` and configure your settings.

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

## 📞 WhatsApp Integration

Update the WhatsApp link in `pages/index.tsx`:
```tsx
<a href="https://wa.me/YOUR_PHONE_NUMBER" className="whatsapp-button">
```

Replace `YOUR_PHONE_NUMBER` with your actual WhatsApp number in international format.

## 🎨 Customization

### Brand Colors
To change the brand colors, update the CSS variables in both `main.css` and `admin.css`:
- Primary: `#007AFF`
- WhatsApp: `#25D366`
- Text colors: `#FFFFFF`, `#7F8496`

### Typography
The application uses the Inter font family. To change fonts, update the `font-family` declarations in the CSS files.

### Background Images
Replace the background images in the `public/` folder:
- `background-desktop.jpg` (1920x1080 recommended)
- `background-mobile.jpg` (mobile optimized)

## 🔧 Development Notes

- **RTL Support**: The application is built with RTL support for Hebrew content
- **Accessibility**: Semantic HTML structure with proper ARIA labels
- **Performance**: Optimized images and minimal CSS for fast loading
- **SEO Ready**: Proper meta tags and semantic structure

## 📋 Component Architecture

### Reusable Components
The design system promotes reusability:
- **Form Field Groups**: Consistent input styling
- **Button Components**: Unified button design
- **Status Badges**: Color-coded status indicators
- **Card Layout**: Glassmorphism card containers

### State Management
- Form state with validation
- Loading states with UI feedback
- Error handling with user-friendly messages
- Real-time event availability updates

## 🌍 Internationalization

The application is built with Hebrew (RTL) support:
- RTL CSS layouts
- Hebrew typography
- Proper text alignment
- Cultural design considerations

---

**Note**: This implementation follows the Figma design precisely while maintaining clean, maintainable code structure. All styling is contained in separate CSS files without any inline styles, promoting better code organization and easier maintenance.
