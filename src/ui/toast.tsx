import type { ReactNode } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const appToast = {
  info: (message: string) => toast.info(message),
  success: (message: string) => toast.success(message),
  warning: (message: string) => toast.warning(message),
  error: (message: string) => toast.error(message),
};

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
