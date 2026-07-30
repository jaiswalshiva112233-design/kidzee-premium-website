import Header from "./Header";import Footer from "./Footer";import FloatingWhatsApp from "./FloatingWhatsApp";
export default function PageShell({children}:{children:React.ReactNode}){return <><Header/><main>{children}</main><Footer/><FloatingWhatsApp/></>}
