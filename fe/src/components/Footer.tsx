export default function Footer() {
  return (
    <footer className=" border-t bg-primary text-primary-foreground ">
      <div className="block md:flex justify-between  max-w-7xl mx-auto px-4 py-8">
        <div>
          <h3 className="text-2xl font-bold mb-6 text-left">JK Keyboard</h3>

          <div className="gap-8">
            <div className="text-left space-y-2 text-muted">
              <p className="font-semibold">Owner: Nguyen Le Duy Khang</p>
              <p>
                Ha Noi Branch: 102 Đ. Trần Phú, P. Mộ Lao, Hà Đông, TP.Hà Nội
              </p>
              <p>Ho Chi Minh Branch: 497 Hòa Hảo, Phường 7, Quận 10, TP.HCM</p>
            </div>
          </div>

          <p className="text-lg mt-8 mb-0 text-muted">
            &copy; 2026 My Website. All Rights Reserved.
          </p>
        </div>
        <div>
          <iframe
            src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D61575185811123&tabs&width=340&height=130&small_header=false&adapt_container_width=false&hide_cover=false&show_facepile=false&appId"
            width="340"
            height="250"
            className="border-0 rounded-2xl"
            allowFullScreen={true}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          ></iframe>
        </div>
      </div>
    </footer>
  );
}
