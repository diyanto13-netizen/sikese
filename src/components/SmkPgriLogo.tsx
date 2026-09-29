import React from 'react';

interface SmkPgriLogoProps {
  className?: string;
  size?: number | string;
  customLogoUrl?: string;
}

export const SmkPgriLogo: React.FC<SmkPgriLogoProps> = ({
  className = 'w-28 sm:w-32 h-auto',
  size,
  customLogoUrl
}) => {
  // Jika pengguna mengunggah logo kustom sendiri (PNG/JPG/SVG)
  if (customLogoUrl) {
    return (
      <img
        src={customLogoUrl}
        alt="Logo Sekolah"
        className={`object-contain drop-shadow-md mx-auto ${className}`}
        style={size ? { width: size, height: size } : undefined}
      />
    );
  }

  // Logo Vektor Resmi Standar PGRI & SMK PGRI 1 Kota Sukabumi (Preserve Aspect Ratio 100% tanpa distorsi)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 540"
      className={className}
      style={size ? { width: size, height: 'auto' } : undefined}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Logo Resmi SMK PGRI 1 Kota Sukabumi"
    >
      <defs>
        {/* Gold Gradient for Wings & Torch */}
        <linearGradient id="pgriGoldComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Red Flame Gradient */}
        <linearGradient id="pgriFlameComp" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#b91c1c" />
          <stop offset="60%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>

        {/* Shield Border Gradient */}
        <linearGradient id="pgriBorderGoldComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        {/* Arcs for Circular Text */}
        <path id="arcTopTextComp" d="M 105,210 A 145,145 0 1,1 395,210" fill="none" />
      </defs>

      {/* 1. CAKRA / LINGKARAN UTAMA (MERAH - PUTIH) */}
      <circle cx="250" cy="210" r="185" fill="#dc2626" stroke="#b45309" strokeWidth="3" />
      <circle cx="250" cy="210" r="172" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="250" cy="210" r="132" fill="#dc2626" stroke="#b45309" strokeWidth="2" />
      <circle cx="250" cy="210" r="126" fill="#15803d" stroke="#14532d" strokeWidth="2" />

      {/* Teks Melingkar Atas */}
      <text
        fontFamily="'Arial', 'Helvetica', sans-serif"
        fontWeight="900"
        fontSize="13"
        fill="#1e293b"
        letterSpacing="1.2"
      >
        <textPath href="#arcTopTextComp" startOffset="50%" textAnchor="middle">
          YAYASAN PEMBINA LEMBAGA PENDIDIKAN PGRI
        </textPath>
      </text>

      {/* 2. SAYAP KUNING EMAS (5 HELAI KIRI & KANAN) */}
      <g fill="url(#pgriGoldComp)" stroke="#78350f" strokeWidth="1.8" strokeLinejoin="round">
        {/* Kiri */}
        <path d="M 230,265 C 190,265 155,255 142,238 C 158,236 182,244 205,252 Z" />
        <path d="M 225,255 C 180,248 145,232 135,212 C 152,212 178,225 205,240 Z" />
        <path d="M 220,245 C 175,230 142,206 135,182 C 152,185 178,202 205,224 Z" />
        <path d="M 222,235 C 178,212 152,180 148,155 C 164,162 186,182 210,210 Z" />
        <path d="M 228,225 C 190,192 172,158 170,132 C 184,144 202,168 220,196 Z" />
        {/* Kanan */}
        <path d="M 270,265 C 310,265 345,255 358,238 C 342,236 318,244 295,252 Z" />
        <path d="M 275,255 C 320,248 355,232 365,212 C 348,212 322,225 295,240 Z" />
        <path d="M 280,245 C 325,230 358,206 365,182 C 348,185 322,202 295,224 Z" />
        <path d="M 278,235 C 322,212 348,180 352,155 C 336,162 314,182 290,210 Z" />
        <path d="M 272,225 C 310,192 328,158 330,132 C 316,144 298,168 280,196 Z" />
      </g>

      {/* 3. EMPAT BUKU PUTIH (SUMBER ILMU PENGETAHUAN) */}
      <g fill="#ffffff" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round">
        <path d="M 205,255 L 246,252 L 246,275 L 205,278 Z" />
        <line x1="205" y1="262" x2="246" y2="259" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="205" y1="270" x2="246" y2="267" stroke="#94a3b8" strokeWidth="1.5" />

        <path d="M 295,255 L 254,252 L 254,275 L 295,278 Z" />
        <line x1="295" y1="262" x2="254" y2="259" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="295" y1="270" x2="254" y2="267" stroke="#94a3b8" strokeWidth="1.5" />

        <path d="M 218,205 L 242,205 L 242,252 L 218,255 Z" />
        <line x1="226" y1="205" x2="226" y2="253" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="234" y1="205" x2="234" y2="253" stroke="#94a3b8" strokeWidth="1.5" />

        <path d="M 282,205 L 258,205 L 258,252 L 282,255 Z" />
        <line x1="274" y1="205" x2="274" y2="253" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="266" y1="205" x2="266" y2="253" stroke="#94a3b8" strokeWidth="1.5" />
      </g>

      {/* 4. SULUH / OBOR TEGAK & API 5 SINAR */}
      <g fill="url(#pgriGoldComp)" stroke="#78350f" strokeWidth="2">
        <path d="M 244,188 L 256,188 L 254,272 L 246,272 Z" />
        <rect x="238" y="180" width="24" height="8" rx="2" fill="#fde047" />
        <rect x="241" y="186" width="18" height="5" rx="1.5" fill="#ca8a04" />
      </g>

      {/* Nyala Api Merah 5 Sinar */}
      <path
        d="
          M 238,180
          C 230,172 216,162 214,146
          C 222,152 232,160 236,160
          C 230,145 234,126 244,116
          C 245,132 248,142 250,146
          C 252,134 255,116 262,122
          C 268,128 266,145 264,160
          C 268,160 278,152 286,146
          C 284,162 270,172 262,180
          Z
        "
        fill="url(#pgriFlameComp)"
        stroke="#7f1d1d"
        strokeWidth="2"
      />
      <path
        d="
          M 243,180
          C 238,172 236,158 244,142
          C 246,152 248,158 250,160
          C 252,152 254,142 257,148
          C 262,158 258,172 257,180
          Z
        "
        fill="#fef08a"
        opacity="0.85"
      />

      {/* 5. PITA PUTIH PGRI DI TENGAH */}
      <g>
        <path d="M 185,275 L 155,268 L 165,282 L 150,296 L 188,290 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="2" />
        <path d="M 315,275 L 345,268 L 335,282 L 350,296 L 312,290 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="2" />
        <path
          d="
            M 175,270
            C 215,264 285,264 325,270
            L 320,305
            C 280,312 220,312 180,305
            Z
          "
          fill="#ffffff"
          stroke="#1e293b"
          strokeWidth="2.5"
        />
        <text
          x="250"
          y="297"
          fontFamily="'Arial Black', Arial, sans-serif"
          fontWeight="900"
          fontSize="28"
          fill="#dc2626"
          textAnchor="middle"
          letterSpacing="3"
        >
          PGRI
        </text>
      </g>

      {/* 6. BADGE / PITA IDENTITAS: SMK PGRI 1 KOTA SUKABUMI */}
      <g transform="translate(0, 395)">
        <path
          d="
            M 60,18
            L 90,0
            L 410,0
            L 440,18
            L 425,75
            C 340,95 160,95 75,75
            Z
          "
          fill="#0f172a"
          stroke="url(#pgriBorderGoldComp)"
          strokeWidth="3"
        />
        <path
          d="
            M 75,22
            L 95,8
            L 405,8
            L 425,22
            L 412,68
            C 335,85 165,85 88,68
            Z
          "
          fill="none"
          stroke="#facc15"
          strokeWidth="1.2"
          opacity="0.8"
        />
        <text
          x="250"
          y="38"
          fontFamily="'Arial Black', Impact, sans-serif"
          fontWeight="900"
          fontSize="24"
          fill="#ffffff"
          textAnchor="middle"
          letterSpacing="2"
        >
          SMK PGRI 1
        </text>
        <text
          x="250"
          y="64"
          fontFamily="'Arial Black', Arial, sans-serif"
          fontWeight="900"
          fontSize="16"
          fill="#facc15"
          textAnchor="middle"
          letterSpacing="3"
        >
          KOTA SUKABUMI
        </text>
      </g>
    </svg>
  );
};
