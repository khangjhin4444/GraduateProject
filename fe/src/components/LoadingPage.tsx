import { LoaderIcon } from "@/components/ui/loader";

export default function LoadingPage() {
  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-background">
      <h1 className="text-2xl text-foreground font-bold flex gap-2 justify-center items-center">
        Loading <LoaderIcon />
      </h1>
    </div>
  );
}
