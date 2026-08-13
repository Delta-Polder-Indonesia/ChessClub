import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

export default function PageLayout() {
  return (
    <>
      <Header />
      <main className="page min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
