export default function Page() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans">
      <div className="mb-12 space-y-4">
        <h1 className="text-2xl font-medium text-left mb-6">About Us</h1>
        <p className="text-left font-medium text-xl text-gray-800">
          JK Keyboard is a store specializing in mechanical keyboards and
          related accessories. With a mission to deliver the best experience to
          users, we are committed to doing our best to ensure every product
          reaches customers in the most perfect condition.
        </p>
        <p className="text-left text-lg text-gray-700">
          JK Keyboard was established in 2019, originally known as{" "}
          <span className="text-rose-600 text-[18px] font-semibold">
            Khang MK
          </span>{" "}
          - a place that provided various types of keycaps and keyboards
          manufactured in China. In early 2022, it was rebranded as JK Keyboard
          with the goal of becoming a leading supplier in Vietnam for products
          such as mechanical keyboards, switches, keycaps, springs, stabilizers,
          and other related accessories.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="w-full">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.668647928707!2d106.65945181022185!3d10.760000089343515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752eefc9c265e9%3A0x5801541ce0809648!2zS8O9IHTDumMgeMOhIELDoWNoIEtob2E!5e0!3m2!1svi!2s!4v1743821378220!5m2!1svi!2s"
            width="100%"
            height="300"
            style={{ border: 0, borderRadius: "0.5rem" }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
        <div className="text-left space-y-2">
          <h5 className="text-2xl font-bold pb-3">
            JK Keyboard Ho Chi Minh Branch
          </h5>
          <p className="text-lg">
            <span className="font-bold">Address:</span> 497 Hòa Hảo, Phường 7,
            Quận 10, TP.HCM
          </p>
          <p className="text-lg">
            <span className="font-bold">Phone:</span>{" "}
            <span className="text-blue-600 font-semibold">
              1234567890 (Mr. Khang)
            </span>
          </p>
          <p className="text-lg font-bold mt-4">Hours:</p>
          <p className="text-lg">Mon - Fri: 8:00 - 22:00</p>
          <p className="text-lg">Sat & Sun: 8:00 - 18:00</p>
        </div>
      </div>
    </div>
  );
}
