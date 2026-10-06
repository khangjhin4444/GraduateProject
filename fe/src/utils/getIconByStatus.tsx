import { CircleX, Package, RotateCwFadingClock, Truck } from "lucide-react";

export function getIconByStatus(status: string) {
  switch (status) {
    case "Pending": {
      return <RotateCwFadingClock className="w-4 h-4" />;
    }
    case "Confirmed": {
      return <Package className="w-4 h-4" />;
    }
    case "Delivered": {
      return <Truck className="w-4 h-4" />;
    }
    case "Canceled": {
      return <CircleX className="w-4 h-4" />;
    }
  }
}
