export function getClassTextByStatus(status: string) {
  switch (status) {
    case "Pending": {
      return "bg-accent/20 border border-accent";
    }
    case "Confirmed": {
      return "bg-primary/20 border border-primary text-primary";
    }
    case "Delivered": {
      return "bg-background/20 border border-foreground/20";
    }
    case "Canceled": {
      return "bg-background/20 border border-foreground/20";
    }
  }
}
