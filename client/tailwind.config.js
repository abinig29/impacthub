/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950:'#04060f',900:'#080c1a',850:'#0c1220',800:'#101828',
          750:'#141e30',700:'#1a2540',600:'#1f2d4e',500:'#263358',
          400:'#2e3d6a',300:'#3d527e',200:'#4e6494',100:'#7b93c4',
        },
        surface: {
          0:'#04060f',1:'#080c1a',2:'#0c1220',3:'#101828',
          4:'#141e30',5:'#1a2540',6:'#1f2d4e',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        'pill': '9999px',
        '4xl': '2rem',
      },
      animation: {
        'fade-in':  'fadeIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-up':  'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-down':'fadeDown 0.3s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'bounce-soft':'bounceSoft 1.2s ease-in-out infinite',
        'shimmer':  'shimmer 2s ease-in-out infinite',
        'pulse-slow':'pulse 4s ease-in-out infinite',
        'ticker':   'ticker 40s linear infinite',
      },
      keyframes: {
        fadeIn:     {'0%':{opacity:'0'},'100%':{opacity:'1'}},
        fadeUp:     {'0%':{opacity:'0',transform:'translateY(16px)'},'100%':{opacity:'1',transform:'translateY(0)'}},
        fadeDown:   {'0%':{opacity:'0',transform:'translateY(-8px)'},'100%':{opacity:'1',transform:'translateY(0)'}},
        scaleIn:    {'0%':{opacity:'0',transform:'scale(0.96)'},'100%':{opacity:'1',transform:'scale(1)'}},
        bounceSoft: {'0%,100%':{transform:'translateY(-20%)'},'50%':{transform:'translateY(0)'}},
        shimmer:    {'0%':{backgroundPosition:'-200% 0'},'100%':{backgroundPosition:'200% 0'}},
        ticker:     {'0%':{transform:'translateX(0)'},'100%':{transform:'translateX(-50%)'}},
        scanLine:   {'0%':{top:'0%'},'100%':{top:'100%'}},
      },
    },
  },
  plugins: [],
}
