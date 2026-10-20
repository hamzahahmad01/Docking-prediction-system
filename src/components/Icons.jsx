function IconBase({ children, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function MenuIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </IconBase>
  );
}

export function DashboardIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 13h6V5H4z" />
      <path d="M14 19h6V5h-6z" />
      <path d="M4 19h6v-2H4z" />
    </IconBase>
  );
}

export function DatabaseIcon(props) {
  return (
    <IconBase {...props}>
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
      <path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </IconBase>
  );
}

export function UploadIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M5 19h14" />
    </IconBase>
  );
}

export function LogoutIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" />
      <path d="M14 16l4-4-4-4" />
      <path d="M18 12H9" />
    </IconBase>
  );
}

export function RupeeIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M7 5h10" />
      <path d="M7 9h10" />
      <path d="M9 5c5 0 5 8 0 8" />
      <path d="M9 13l7 6" />
    </IconBase>
  );
}

export function BriefcaseIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
      <path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M4 12h16" />
    </IconBase>
  );
}

export function CheckFileIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="m9 14 2 2 4-5" />
    </IconBase>
  );
}

export function PredictionIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 19h16" />
      <path d="M7 16V9" />
      <path d="M12 16V5" />
      <path d="M17 16v-4" />
      <path d="m6 8 4-3 4 2 4-3" />
    </IconBase>
  );
}

export function ReportIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
      <path d="M9 8h2" />
    </IconBase>
  );
}

export function ShieldIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3 5 6v5c0 5 3.4 8.7 7 10 3.6-1.3 7-5 7-10V6z" />
      <path d="m9.5 11.5 1.7 1.7 3.3-3.7" />
    </IconBase>
  );
}

export function TeamIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-1A3.5 3.5 0 0 0 8 18.5V20" />
      <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M5 20v-1a2.5 2.5 0 0 1 2.5-2.5" />
      <path d="M19 20v-1a2.5 2.5 0 0 0-2.5-2.5" />
      <path d="M7 11a2.2 2.2 0 1 0-2.2-2.2" />
      <path d="M17 11a2.2 2.2 0 1 1 2.2-2.2" />
    </IconBase>
  );
}

export function SearchIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </IconBase>
  );
}

export function FilterIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </IconBase>
  );
}

export function EyeIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

export function EyeOffIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 4.24A10.4 10.4 0 0 1 12 4c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.1 4.06" />
      <path d="M6.1 6.1A17.7 17.7 0 0 0 2 11s3.5 7 10 7c1.1 0 2.15-.18 3.13-.5" />
    </IconBase>
  );
}

export function ArrowRightIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}
