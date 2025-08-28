import React from 'react'

interface WohlersLogoProps {
  className?: string
}

export function WohlersLogo({ className = "h-8 w-auto" }: WohlersLogoProps) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 200 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Wohlers Text */}
        <text
          x="10"
          y="25"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="18"
          fontWeight="600"
          fill="currentColor"
          className="text-foreground"
        >
          Wohlers
        </text>
        
        {/* AM Text */}
        <text
          x="85"
          y="25"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="18"
          fontWeight="400"
          fill="currentColor"
          className="text-primary"
        >
          AM Explorer
        </text>
        
        {/* Geometric AM Symbol */}
        <g transform="translate(160, 8)" className="text-primary">
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1"/>
          <path
            d="M8 16 L12 8 L16 16 M10 14 L14 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="20" cy="8" r="2" fill="currentColor"/>
          <circle cx="20" cy="16" r="2" fill="currentColor"/>
        </g>
      </svg>
    </div>
  )
}
