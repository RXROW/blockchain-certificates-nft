/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'spin-slow-reverse': 'spin-reverse 20s linear infinite',
        'scanline': 'scanline 4s ease-in-out infinite',
        'shine': 'shine 2s ease-in-out infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orbit': 'orbit 3s linear infinite',
        'orbit-delayed-1': 'orbit 3s linear 0.5s infinite',
        'orbit-delayed-2': 'orbit 3s linear 1s infinite',
        'orbit-delayed-3': 'orbit 3s linear 1.5s infinite',
        'burn-top': 'burnTop 2s ease-in forwards',
        'burn-bottom': 'burnBottom 2.5s ease-in forwards',
        'flicker': 'flicker 0.5s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        
        // Futuristic minting animations
        'door-open-left': 'doorOpenLeft 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'door-open-right': 'doorOpenRight 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'door-close-left': 'doorCloseLeft 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'door-close-right': 'doorCloseRight 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'smoke-pulse': 'smokePulse 3s ease-in-out infinite',
        'smoke-puff': 'smokePuff 2s ease-out forwards',
        'certificate-reveal': 'certificateReveal 0.8s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite',
        'scan-line': 'scanLine 2.5s linear infinite',
      },
      keyframes: {
        'spin-reverse': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        'scanline': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'shine': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'orbit': {
          '0%': { transform: 'rotate(0deg) translateX(8px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(8px) rotate(-360deg)' },
        },
        'burnTop': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'burnBottom': {
          '0%': { transform: 'translateY(20%)', opacity: '0' },
          '60%': { opacity: '1' },
          '100%': { transform: 'translateY(-15%)', opacity: '0' }
        },
        'flicker': {
          '0%': { opacity: '0.5', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '1', transform: 'translateY(-2px) scale(1.1)' }
        },
        'float': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '50%': { opacity: '0.5' },
          '100%': { transform: 'translateY(-20px)', opacity: '0' }
        },
        
        // Futuristic minting keyframes
        'doorOpenLeft': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        'doorOpenRight': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'doorCloseLeft': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'doorCloseRight': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'smokePulse': {
          '0%, 100%': { opacity: '0.2', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.05)' }
        },
        'smokePuff': {
          '0%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.2)' },
          '100%': { opacity: '0.1', transform: 'scale(1.5)' }
        },
        'certificateReveal': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(99, 102, 241, 0.7)' }
        },
        'scanLine': {
          '0%': { top: '0%' },
          '100%': { top: '100%' }
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
