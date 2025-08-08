import toast from 'react-hot-toast';

/**
 * Viser en suksess-toast.
 * @param message Meldingen som skal vises.
 */
export const showSuccess = (message: string) => {
  toast.success(message);
};

/**
 * Viser en feil-toast.
 * @param message Meldingen som skal vises.
 */
export const showError = (message: string) => {
  toast.error(message);
};

/**
 * Viser en lasting-toast. Returnerer toastId for å kunne dismisses senere.
 * @param message Meldingen som skal vises.
 * @returns ID-en til toasten.
 */
export const showLoading = (message: string) => {
  return toast.loading(message);
};

/**
 * Lukker en spesifikk toast.
 * @param toastId ID-en til toasten som skal lukkes.
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};