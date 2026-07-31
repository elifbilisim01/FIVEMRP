import { create } from "zustand";

type Store = {
  musicName: string;
  uzanti : string,
  setmusic: (musicname: string) => void;
  setvolume: (volume: number) => void;
  volume: number;
};

const useMusic = create<Store>()((set) => ({
  musicName: "Grippy - Concrete Teeth",
  uzanti: "mp3",
  setmusic: (_musicname: string , type : string) => {
    set({ musicName: _musicname , uzanti : type});
  },
  setvolume: (volume: number) => {},
  volume: 70,
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

export default useMusic;
