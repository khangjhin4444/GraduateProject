"use client";
import {
  CircleUserRound,
  Menu,
  ReceiptText,
  Search,
  ShoppingCart,
} from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon, UserIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import EditProfileForm from "./edit-profile-form";
import { useAppSelector } from "@/state/hooks";
import { handleLogout } from "@/lib/handleLogout";
import { Link, NavLink, useNavigate } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

function MobileSidebarTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      aria-label="Open navigation menu"
      className="text-foreground md:hidden"
      onClick={toggleSidebar}
    >
      <Menu className="h-7 w-7" />
    </button>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const isAuth = useAppSelector((state) => state.token.authChecked);
  const cartQuantity = useAppSelector((state) => state.profile.cartQuantity);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => {
      setHasScrolled(window.scrollY >= 100);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <>
      <header
        className={clsx(
          "sticky top-0 z-50 flex w-full flex-col items-center justify-center bg-background transition-shadow",
          { "shadow-xl": hasScrolled },
        )}
      >
        <div className="flex flex-row w-full justify-around items-center">
          <div className="flex-1 flex items-center justify-around md:justify-center">
            <MobileSidebarTrigger />
            <button>
              <img
                className=" object-contain rounded-[50%] cursor-pointer border border-foreground w-12 h-12 md:w-14 md:h-14"
                src="/logo.png"
                alt="Logo"
                onClick={() => {
                  navigate("/home");
                }}
              />
            </button>
          </div>

          <div className="flex-1 relative w-full flex justify-center ">
            <input
              type="text"
              className="focus-visible:ring-primary focus-visible:ring-2 w-full py-2 px-3 bg-secondary rounded-[40px] my-6 text-secondary-foreground placeholder:text-secondary-foreground  focus:outline-none placeholder:text-[13px] md:placeholder:text-[16px]"
              placeholder="Search items..."
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == "Enter" && keyword !== "") {
                  // router.push(`/search/${keyword}`);
                }
              }}
            />
            <div>
              <button
                aria-label="search-btn"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-secondary-foreground/70"
                onClick={() => {
                  if (keyword !== "") {
                    // router.push(`/search/${keyword}`);
                  }
                }}
              >
                <Search className="w-4 h-4 md:w-7 md:h-7" />
              </button>
            </div>
          </div>

          <div className="flex-1  flex-row items-center gap-7 flex justify-center">
            <button
              aria-label="cart-btn"
              onClick={() => {}}
              className="relative cursor-pointer"
            >
              <ShoppingCart className="w-8 h-8 text-foreground" />
              <div
                className={clsx(
                  "absolute select-none -right-2 -top-2 bg-red-500 text-white rounded-full p-2 w-6 h-6  items-center flex justify-center font-bold",
                  { hidden: !isAuth },
                )}
              >
                {cartQuantity}
              </div>
            </button>
            <button
              aria-label="order-btn"
              className="hidden md:flex justify-center font-semibold text-foreground cursor-pointer items-center"
              onClick={() => {}}
            >
              <ReceiptText className="mr-2 h-7 w-7" />
              Orders
            </button>

            {isAuth ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger>
                    <CircleUserRound className="text-text-foreground w-8 h-8 cursor-pointer" />
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-30">
                    <DropdownMenuGroup>
                      <DialogTrigger>
                        <DropdownMenuItem>
                          <UserIcon
                            aria-label="profile-btn"
                            className="mr-2 h-4 w-4"
                          />
                          Profile
                        </DropdownMenuItem>
                      </DialogTrigger>

                      <DropdownMenuItem
                        className="flex md:hidden"
                        onClick={() => {}}
                      >
                        <ReceiptText className="mr-2 h-4 w-4" />
                        Orders
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          handleLogout();
                        }}
                      >
                        <LogOutIcon className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DialogContent
                  className="sm:max-w-106.25"
                  aria-describedby={undefined}
                >
                  <DialogHeader>
                    <DialogTitle>User Profile</DialogTitle>
                  </DialogHeader>

                  <EditProfileForm onSuccess={() => setIsDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            ) : (
              <button
                onClick={() => {
                  navigate("/login");
                }}
              >
                <CircleUserRound className="text-foreground w-8 h-8 cursor-pointer" />
              </button>
            )}
          </div>
        </div>

        <div className="hidden md:flex md:flex-row">
          <HeaderLink href="/home">Home</HeaderLink>
          <div className="group relative">
            <button type="button" className="header-link mx-4 text-lg">
              Products
            </button>
            <div className="invisible absolute left-0 top-full z-10 flex w-36 translate-y-2 flex-col items-start gap-1 bg-background mt-2 p-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <HeaderLink href="/collection/kit">Kit</HeaderLink>
              <HeaderLink href="/collection/prebuild">Prebuild</HeaderLink>
              <HeaderLink href="/collection/keycap">Keycap</HeaderLink>
            </div>
          </div>

          <HeaderLink href="/about">About</HeaderLink>
          <HeaderLink href="/contact">Contact</HeaderLink>
        </div>
      </header>

      <div className="md:hidden">
        <Sidebar>
          <SidebarHeader>
            <span className="px-2 text-lg font-semibold text-sidebar-foreground">
              Navigation
            </span>
          </SidebarHeader>
          <SidebarContent>
            <MobileNavigationLink href="/home">Home</MobileNavigationLink>
            <Accordion>
              <AccordionItem>
                <AccordionTrigger className="px-4 py-3 text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-normal">
                  Products
                </AccordionTrigger>
                <AccordionContent className="flex flex-col border-b-2">
                  <MobileNavigationLink href="/home">
                    Keyboard Kit
                  </MobileNavigationLink>
                  <MobileNavigationLink href="/home">
                    Prebuild
                  </MobileNavigationLink>
                  <MobileNavigationLink href="/home">
                    Keycap
                  </MobileNavigationLink>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <MobileNavigationLink href="/about">About</MobileNavigationLink>
            <MobileNavigationLink href="/contact">Contact</MobileNavigationLink>
          </SidebarContent>
        </Sidebar>
      </div>
    </>
  );
}

function MobileNavigationLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <Link
      to={href}
      className="px-4 py-3 text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      onClick={() => setOpenMobile(false)}
    >
      {children}
    </Link>
  );
}

function HeaderLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink to={href} className="header-link mx-4 text-lg">
      {children}
    </NavLink>
  );
}
