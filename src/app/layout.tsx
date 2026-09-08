import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'ScholarNexus — The Evidence Desk',description:'Search academic sources, organize a literature review, and trace findings to their supporting passages.',icons:{icon:'/logo.svg'},openGraph:{title:'ScholarNexus — The Evidence Desk',description:'A personal workspace for source-linked research.',siteName:'ScholarNexus',type:'website'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
