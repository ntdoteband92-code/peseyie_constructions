declare module 'lucide-react' {
  import React from 'react'

  interface IconProps extends React.SVGAttributes<SVGSVGElement> {
    size?: number | string
    strokeWidth?: number | string
    absoluteStrokeWidth?: boolean
  }

  type Icon = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>

  const lucideReact: Record<string, Icon>
  
  export = lucideReact
}

// Re-export everything for named imports  
declare module 'lucide-react' {
  export const AlertCircle: any
  export const ArrowRight: any
  export const BarChart3: any
  export const Bell: any
  export const BookOpen: any
  export const Box: any
  export const Briefcase: any
  export const Calculator: any
  export const CheckCircle: any
  export const ChevronDown: any
  export const ChevronLeft: any
  export const ChevronRight: any
  export const Clock: any
  export const ClipboardList: any
  export const Cog: any
  export const Copy: any
  export const Database: any
  export const Edit: any
  export const File: any
  export const FileDown: any
  export const FileUp: any
  export const Filter: any
  export const Flame: any
  export const Folder: any
  export const FolderOpen: any
  export const Gauge: any
  export const Hash: any
  export const Home: any
  export const Inbox: any
  export const Info: any
  export const Key: any
  export const Layout: any
  export const Link: any
  export const LogOut: any
  export const Menu: any
  export const MessageCircle: any
  export const Minus: any
  export const MoreHorizontal: any
  export const MoreVertical: any
  export const Package: any
  export const PieChart: any
  export const Plus: any
  export const Power: any
  export const Search: any
  export const Settings: any
  export const Share2: any
  export const Shield: any
  export const Sliders: any
  export const Target: any
  export const Trash2: any
  export const TrendingUp: any
  export const Truck: any
  export const User: any
  export const Users: any
  export const X: any
}