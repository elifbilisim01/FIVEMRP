import { create } from "zustand";

type Store = {
  wallpaper: string;
  setwallpaper: (imageurl: string) => void;
};

const useStore = create<Store>()((set) => ({
  wallpaper: "1.png",
  backgroundPosition: "center",
  setwallpaper: (imageurl: string) => set((state) => ({ wallpaper: imageurl })),
}));

/*
function Counter() {
  const { count, inc } = useStore()
  return (
    <div>
      <span>{count}</span>
      <button onClick={inc}>one up</button>
    </div>
  )
}
  */

export default useStore;
