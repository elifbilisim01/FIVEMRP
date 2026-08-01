import { create } from "zustand";

type Store = {
  hatamesajibaslik: string;
  hatamesaji?: string;
  mesajturu: string;
  setmesaj: (mesaj: string) => void;
  setmesajbaslik: (mesajbaslik: string) => void;
  setmesajturu: (mesajturu: "warning" | "danger" | "success" | "") => void;
};

const useHataMesaji = create<Store>()((set) => ({
  hatamesajibaslik: "",
  hatamesaji: "",
  mesajturu: "",
  setmesaj: (mesaj: string) => {
    set({ hatamesaji: mesaj });
  },
  setmesajbaslik: (mesajbaslik: string) => {
    set({ hatamesajibaslik: mesajbaslik });
  },
  setmesajturu: (mesajturu: "warning" | "danger" | "success" | "") => {
    set({ mesajturu: mesajturu });
  },
}));

export default useHataMesaji;