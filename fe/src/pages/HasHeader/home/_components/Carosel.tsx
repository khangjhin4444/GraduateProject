import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Carosel_1 from "@/assets/carosel_1.webp";
import Carosel_2 from "@/assets/carosel_2.webp";
import Carosel_3 from "@/assets/carosel_3.webp";
import Carosel_4 from "@/assets/carosel_4.webp";
import { Link } from "react-router";

const CAROSEL_OBJECT = [
  {
    img: Carosel_1,
    link: "/product/1",
  },
  {
    img: Carosel_2,
    link: "/product/1",
  },
  {
    img: Carosel_3,
    link: "/product/1",
  },
  {
    img: Carosel_4,
    link: "/product/1",
  },
];

export default function Carosel() {
  return (
    <Carousel
      className="w-full rounded-2xl"
      plugins={[
        Autoplay({
          delay: 3000,
        }),
      ]}
    >
      <CarouselContent>
        {CAROSEL_OBJECT.map((obj, index) => (
          <CarouselItem key={index}>
            <div className="p-1 h-120">
              {/* <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card> */}
              <Link to={obj.link}>
                <img
                  src={obj.img}
                  alt="Carosel Image"
                  className="object-cover h-full w-full rounded-2xl"
                />
              </Link>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-5 w-10 h-10 z-10 cursor-pointer" />
      <CarouselNext className="absolute right-5 w-10 h-10 z-10 cursor-pointer " />
    </Carousel>
  );
}
