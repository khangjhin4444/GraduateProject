import { Link } from "react-router/internal/react-server-client";
import assemImg1 from "@/assets/assem-2.webp";
import assemImg2 from "@/assets/assem-3.webp";
import assemImg3 from "@/assets/assem-4.webp";
import assemImg4 from "@/assets/assem-5.webp";
import assemImg5 from "@/assets/assem-6.webp";
export default function Page() {
  return (
    <main className="px-8">
      <h1 className="text-2xl font-medium">Keyboard Modding Service</h1>
      <div className="flex flex-col items-center justify-center w-full">
        <section className="w-full md:w-2/3 lg:w-2/3 mt-10">
          <p>
            Each custom mechanical keyboard is not just a tool for work or
            entertainment, but also an item that expresses your personal style.
            At <span className="text-lg font-semibold">JK Keyboard</span>, we
            understand your passion and perfectly turn your desires into
            reality. Whether you are a beginner or a veteran enthusiast, our
            professional services will help you get your dream keyboard without
            worrying about complex technical processes.
          </p>
          <div className="w-full flex justify-center mt-10">
            <Link
              to={"https://www.facebook.com/profile.php?id=61575185811123"}
              target="blank"
              className="text-center font-medium w-2/3 md:w-1/2 bg-accent text-accent-foreground px-4 py-3 rounded-lg cursor-pointer"
            >
              CONTACT FOR CONSULTATION
            </Link>
          </div>
          <h2 className="mt-10 text-lg font-semibold">Keyboard Assembling</h2>
          <p className="mt-4">
            JK Keyboard's assembly service is not simply putting components
            together, but also a process of consulting and tuning to create a
            keyboard with the sound and typing feel that suits you. Every step
            is meticulously executed, ensuring the highest quality and
            performance. More importantly, the assembly fee includes "risk
            insurance", committing to protect your keyboard kit (especially
            high-value products) from rare damages during the assembly process.
          </p>
          <img
            src={assemImg1}
            alt="Assemble image"
            className="object-cover mt-4 rounded-lg"
          />
          <h2 className="mt-10 text-lg font-semibold">Stabilizer Tuning</h2>
          <div className="mt-4">
            <p>
              Stabilizers directly affect the typing experience on long keys. If
              left untreated, they will cause annoying rattling noises. Our
              Stabilizer Tuning service will:
            </p>
            <ul className="list-disc px-4">
              <li>
                Wire Balancing: Ensure the stabilizer wire is straight,
                eliminating the main source of rattle.
              </li>
              <li>
                Lubing: Use specialized grease (Krytox 205g0, XHT-BDZ) to
                lubricate contact points, bringing a smooth feel and eliminating
                noise.
              </li>
              <li>
                Additional Tuning: Depending on the customer's stabilizer type,
                the shop will make minor adjustments during the finishing
                process to provide the best experience.
              </li>
            </ul>
          </div>
          The result is a solid, firm, smooth typing experience and clear sound.
          <div className="flex  items-center flex-col lg:flex-row gap-5 justify-center">
            <img
              src={assemImg2}
              alt="Stab tunning image"
              className="object-cover mt-4 rounded-lg w-full lg:w-1/2"
            />
            <img
              src={assemImg3}
              alt="Stab tunning image"
              className="object-cover mt-4 rounded-lg w-full lg:w-1/2"
            />
          </div>
          <h2 className="mt-10 text-lg font-semibold">Switch Modding</h2>
          <div className="mt-4">
            <p>
              Switches are the "soul" of a mechanical keyboard, determining 80%
              of the typing feel and sound. MOKB Store provides in-depth switch
              modding services:
            </p>
            <ul className="list-disc px-4">
              <li>
                Switch Cleaning: Remove uneven factory lube, creating a
                perfectly "clean" surface before re-lubing.
              </li>
              <li>
                Switch Lubing: Lubricate internal parts (stem, spring, housing)
                with premium lube (Krytox 205g0, Tribosys 3203/3204) to
                eliminate scratchiness and make the keystroke smooth.
              </li>
              <li>
                Switch Filming: Insert thin films (PC, HTV, Poron, ...) between
                the top and bottom housing to reduce wobbling, providing a solid
                typing feel and improving sound.
              </li>
            </ul>
          </div>
          <div className="flex  items-center flex-col lg:flex-row gap-5 justify-center">
            <img
              src={assemImg4}
              alt="Switch modding image"
              className="object-cover mt-4 rounded-lg w-full lg:w-1/2"
            />
            <img
              src={assemImg5}
              alt="Switch modding image"
              className="object-cover mt-4 rounded-lg w-full lg:w-1/2"
            />
          </div>
          <h2 className="mt-10 text-lg font-semibold">Process & Notes</h2>
          <div className="mt-4">
            <ul className="list-disc px-4">
              <li>
                Warranty: The assembly service comes with a 7-day technical
                warranty. Warranty does not apply to user-induced faults (e.g.,
                impact, improper disassembly, water damage, etc.).
              </li>
              <li>
                External components: We accept assembling/modding components
                purchased by customers themselves. We will inspect and notify
                the condition before execution.
              </li>
              <li>
                Number of switches: Customers should provide 3-5 extra switches
                in case of manufacturer defects (bent pins, non-functioning).
              </li>
              <li>
                Layout request: Please clearly state your layout and mounting
                requests (if any). If there are no specific requests, we will
                default to the most popular layout and mounting style.
              </li>
              <li>
                Keycaps: You are not required to provide keycaps, but if you
                have the keycaps you usually use, it will help technicians tune
                the stabilizers more accurately.
              </li>
            </ul>
          </div>
          <div className="mb-20 w-full flex justify-center mt-10">
            <Link
              to={"https://www.facebook.com/profile.php?id=61575185811123"}
              target="blank"
              className="text-center font-medium w-2/3 md:w-1/2 bg-accent text-accent-foreground px-4 py-3 rounded-lg cursor-pointer"
            >
              CONTACT FOR CONSULTATION
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
