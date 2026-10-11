import { HiArrowRight } from "react-icons/hi2";

const ProjectsBtn = ({ onClick }) => {
  return (
    <div className="mx-auto xl:mx-0">
      <button
        type="button"
        onClick={onClick}
        className="relative w-46.25 h-46.25 flex justify-center items-center bg-circle-star bg-cover bg-center bg-no-repeat group cursor-pointer border-0 bg-transparent p-0"
        style={{ backgroundImage: "url('/circle-star.svg')" }}
      >
        <img
          src="/rounded-text.png"
          alt="rounded text"
          width={141}
          height={148}
          className="animate-spin-slow w-full h-full max-w-35.25 max-h-37 pointer-events-none select-none"
        />
        <HiArrowRight
          className="absolute text-4xl group-hover:translate-x-2 transition-all duration-300"
          aria-hidden
        />
      </button>
    </div>
  );
};

export default ProjectsBtn;
