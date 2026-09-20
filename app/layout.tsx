import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Continuum — Make room for your next step",description:"A considered workspace for tasks, notes, and picking up where you left off.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en" suppressHydrationWarning><body>{children}</body></html>}
