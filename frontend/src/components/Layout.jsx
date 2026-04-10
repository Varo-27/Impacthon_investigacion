import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full h-full relative flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
