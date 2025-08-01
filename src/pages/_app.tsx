import { SessionProvider } from "next-auth/react"
import Header from "@/components/header";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Header></Header>
      <Component {...pageProps} />
    </SessionProvider>
  )
}
