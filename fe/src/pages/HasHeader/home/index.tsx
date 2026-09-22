import Carosel from "./_components/Carosel";
import KeyboardSection from "./_components/KeyboardSection";
import SwitchKeycapSection from "./_components/SwitchKeycapSection";

export default function Page() {
  return (
    <div className="flex gap-3 flex-col px-6 w-full">
      <title>JK Keyboard-Home Page</title>
      <Carosel></Carosel>

      <div className="flex flex-col justify-center items-center w-full pb-10">
        <h2 className="text-2xl font-semibold text-foreground">In stock</h2>
        <KeyboardSection></KeyboardSection>
        <SwitchKeycapSection></SwitchKeycapSection>
      </div>
    </div>
  );
}
