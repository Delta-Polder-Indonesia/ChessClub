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

const Nav = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="flex flex-col items-center xl:justify-center gap-y-4 fixed h-max bottom-0 mt-auto xl:right-[2%] z-50 top-0 w-full xl:w-16 xl:max-w-md xl:h-screen">
      <div className="flex w-full xl:flex-col items-center justify-between xl:justify-center gap-y-10 px-4 md:px-40 xl:px-0 h-20 xl:h-max py-8 bg-white/10 backdrop-blur-xs text-3xl xl:text-xl xl:rounded-full">
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
              className="absolute pr-14 right-0 hidden xl:group-hover:flex pointer-events-none"
            >
              <div className="bg-white relative flex text-[#131424] items-center p-1.5 rounded-[3px]">
                <div className="text-[12px] leading-none font-semibold capitalize">
                  {link.name}
                </div>

                <div
                  className="border-solid border-l-white border-l-8 border-y-transparent border-y-[6px] border-r-0 absolute -right-2"
                  aria-hidden
                />
              </div>
            </div>

            <div>
              <link.Icon aria-hidden />
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Nav;
