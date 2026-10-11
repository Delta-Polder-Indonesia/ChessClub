import Socials from "./Socials.jsx";

const Header = ({ onLogoClick }) => {
  return (
    <header className="absolute z-30 w-full items-center px-16 xl:px-0 xl:h-22.5">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-y-6 py-8">
          <button
            type="button"
            onClick={onLogoClick}
            className="cursor-pointer bg-transparent border-0 p-0 text-left"
          >
            <img
              src="/logo.svg"
              alt="logo"
              width={220}
              height={48}
            />
          </button>

          <Socials />
        </div>
      </div>
    </header>
  );
};

export default Header;
