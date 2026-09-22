import type { ReactNode } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function AppToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer
        position="bottom-center"
        autoClose={2600}
        hideProgressBar
        closeOnClick
        pauseOnFocusLoss
        pauseOnHover
        draggable
        theme="dark"
        limit={3}
        toastClassName="keepscore-toast"
      />
    </>
  );
}
