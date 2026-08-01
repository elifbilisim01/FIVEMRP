import { create } from "zustand";

type Store = {
  IC_NAME: string;
  IC_SURNAME: string;
  IC_NAME_SURNAME_COLOR : string;
  KarakterOzellikleri? : [{id : string , ozellikadi: string , ozellikverisi : string}],

};

const useUser = create<Store>()((set) => ({
  IC_NAME: "string",
  IC_SURNAME: "string",
  IC_NAME_SURNAME_COLOR : "string",
  KarakterOzellikleri: undefined,
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

export default useUser;
