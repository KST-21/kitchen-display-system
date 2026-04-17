import { Loader2 } from "lucide-react";

const Spinner = () => (
  <div className="flex flex-col justify-center items-center h-screen w-full p-10">
    <Loader2 className="w-20 h-20 animate-spin" />
  </div>
);

export default Spinner;
