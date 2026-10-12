import { Link } from "react-router-dom";
import {
  HiHome,
  HiUser,
  HiViewColumns,
  HiRectangleGroup,
  HiChatBubbleBottomCenterText,
  HiEnvelope,
} from "react-icons/hi2";

const navData = [
  { name: "home", path: "home", Icon: HiHome },
  { name: "about", path: "about", Icon: HiUser },
  { name: "services", path: "services", Icon: HiRectangleGroup },
  { name: "work", path: "work", Icon: HiViewColumns },
  {
    name: "testimonials",
    path: "testimonials",
    Icon: HiChatBubbleBottomCenterText,
  },
  {
    name: "contact",
    path: "contact",
    Icon: HiEnvelope,
  },
];

const Header = ({ activeTab, onSelectTab }) => {
  return (
    <header className="absolute z-10 w-full items-center px-16 xl:px-0 xl:h-22.5">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-y-6 py-8">
          <Link
            to="/"
            className="cursor-pointer bg-transparent border-0 p-0 text-left"
          >
            <span className="text-white tracking-wide text-2xl md:text-3xl whitespace-nowrap">
              <span className="font-bold">Blunder</span> <span className="font-light">Skuad</span><span className="text-[#F13024]">.</span>
            </span>
          </Link>

          <nav className="flex items-center gap-x-5 md:gap-x-8 text-2xl md:text-3xl xl:text-xl text-white">
            {navData.map((link, i) => (
              <button
                type="button"
                key={i}
                onClick={() => onSelectTab(link.path)}
                className={`${
                  link.path === activeTab ? "text-[#f13024]" : ""
                } relative flex items-center group hover:text-[#f13024] transition-all duration-300 cursor-pointer bg-transparent border-0`}
              >
                <div
                  role="tooltip"
                  className="absolute top-full mt-3 left-1/2 -translate-x-1/2 hidden xl:group-hover:flex pointer-events-none"
                >
                  <div className="bg-white relative flex text-[#131424] items-center p-1.5 rounded-[3px]">
                    <div className="text-[12px] leading-none font-semibold capitalize">
                      {link.name}
                    </div>
                    <div
                      className="border-solid border-t-white border-t-8 border-x-transparent border-x-[6px] border-b-0 absolute -top-2 left-1/2 -translate-x-1/2"
                      aria-hidden
                    />
                  </div>
                </div>

                <div>
                  <link.Icon aria-hidden />
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
