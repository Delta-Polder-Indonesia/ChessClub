import { useState, useLayoutEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import {
  FaCss3,
  FaFigma,
  FaHtml5,
  FaJs,
  FaReact,
  FaWordpress,
} from "react-icons/fa";
import { SiFramer, SiNextdotjs } from "react-icons/si";
import { TbBrandAdobePhotoshop, TbBrandAdobeXd } from "react-icons/tb";
import {
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
} from "react-icons/ri";

import Avatar from "./components/Avatar.jsx";
import { SendIcon } from "../../components/icons.jsx";
import Bulb from "./components/Bulb.jsx";
import Circles from "./components/Circles.jsx";
import Header from "./components/Header.jsx";
import ParticlesContainer from "./components/ParticlesContainer.jsx";
import ProjectsBtn from "./components/ProjectsBtn.jsx";
import ServiceSlider from "./components/ServiceSlider.jsx";
import TestimonialSlider from "./components/TestimonialSlider.jsx";
import TopLeftImg from "./components/TopLeftImg.jsx";
import Transition from "./components/Transition.jsx";
import WorkSlider from "./components/WorkSlider.jsx";
import { fadeIn } from "./variants.js";
import { Button } from "../../components/ui/button.jsx";
import { kirimPesan } from "../../lib/api/index.js";

/* ----------------------------------------------------------- aboutData */

const aboutData = [
  {
    title: "skills",
    info: [
      {
        title: "Web Development",
        icons: [
          FaHtml5,
          FaCss3,
          FaJs,
          FaReact,
          SiNextdotjs,
          SiFramer,
          FaWordpress,
        ],
      },
      {
        title: "UI/UX Design",
        icons: [FaFigma, TbBrandAdobeXd, TbBrandAdobePhotoshop],
      },
    ],
  },
  {
    title: "awards",
    info: [
      {
        title: "Webby Awards - Honoree",
        stage: "2011 - 2012",
      },
      {
        title: "Adobe Design Achievement Awards - Finalist",
        stage: "2009 - 2010",
      },
    ],
  },
  {
    title: "experience",
    info: [
      {
        title: "UX/UI Designer - XYZ Company",
        stage: "2012 - 2023",
      },
      {
        title: "Web Developer - ABC Agency",
        stage: "2010 - 2012",
      },
      {
        title: "Intern - DEF Corporation",
        stage: "2008 - 2010",
      },
    ],
  },
  {
    title: "credentials",
    info: [
      {
        title: "Web Development - ABC University, LA, CA",
        stage: "2011",
      },
      {
        title: "Computer Science Diploma - AV Technical Institute",
        stage: "2009",
      },
      {
        title: "Certified Graphic Designer - ABC Institute, Los Angeles, CA",
        stage: "2006",
      },
    ],
  },
];

/* ---------------------------------------------------- validation utils */

const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const isValidContactName = (name) => {
  const trimmed = (name || "").trim();
  return trimmed.length >= 3 && trimmed.length <= 80;
};

const isValidContactEmail = (email) => {
  const trimmed = (email || "").trim();
  return trimmed.length <= 120 && Boolean(trimmed.toLowerCase().match(EMAIL_REGEX));
};

const isValidContactSubject = (subject) => {
  const trimmed = (subject || "").trim();
  return trimmed.length >= 3 && trimmed.length <= 150;
};

const isValidContactMessage = (message) => {
  const trimmed = (message || "").trim();
  return trimmed.length >= 5 && trimmed.length <= 5000;
};

const FIELD_VALIDATORS = {
  name: isValidContactName,
  email: isValidContactEmail,
  subject: isValidContactSubject,
  message: isValidContactMessage,
};

/* ------------------------------------------------------- HubungiKami */

const TAB_VALID = ["home", "about", "services", "work", "testimonials", "contact"];

export default function HubungiKami() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = TAB_VALID.includes(tab) ? tab : "contact";

  const [aboutIndex, setAboutIndex] = useState(0);

  // Form states
  const messageRef = useRef(null);
  const hasAttemptedSubmit = useRef(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    name: false,
    email: false,
    subject: false,
    message: false,
    agreement: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [statusError, setStatusError] = useState("");
  const [agreed, setAgreed] = useState(false);

  useLayoutEffect(() => {
    const el = messageRef.current;
    if (!el) return;

    el.style.overflowY = "hidden";
    el.style.height = "auto";

    const nextHeight = el.scrollHeight;
    const maxHeight = Number.parseFloat(getComputedStyle(el).maxHeight);

    if (Number.isFinite(maxHeight) && nextHeight >= maxHeight) {
      el.style.height = `${maxHeight}px`;
      el.style.overflowY = "auto";
      return;
    }

    el.style.height = `${nextHeight}px`;
  }, [form.message]);

  const handleChange = (e) => {
    const field = e.target.name;
    const value = e.target.value;

    setForm((prev) => ({ ...prev, [field]: value }));

    if (!hasAttemptedSubmit.current) return;

    const isInvalid = !FIELD_VALIDATORS[field](value);
    setFieldErrors((prev) =>
      prev[field] === isInvalid ? prev : { ...prev, [field]: isInvalid }
    );
  };

  const validateForm = () => {
    hasAttemptedSubmit.current = true;

    const nextErrors = {
      name: !isValidContactName(form.name),
      email: !isValidContactEmail(form.email),
      subject: !isValidContactSubject(form.subject),
      message: !isValidContactMessage(form.message),
      agreement: !agreed,
    };

    setFieldErrors(nextErrors);

    return (
      !nextErrors.name &&
      !nextErrors.email &&
      !nextErrors.subject &&
      !nextErrors.message &&
      !nextErrors.agreement
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setStatus("loading");
    setStatusError("");

    try {
      await kirimPesan({
        nama: form.name,
        email: form.email,
        subjek: form.subject,
        pesan: form.message,
      });

      setStatus("success");
      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setFieldErrors({
        name: false,
        email: false,
        subject: false,
        message: false,
        agreement: false,
      });
      setTimeout(() => setStatus("idle"), 3500);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setStatusError(error.message || "Pesan gagal terkirim. Silakan coba lagi.");
      setTimeout(() => setStatus("idle"), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const selectTab = (tab) => {
    navigate(`/hubungi-kami/${tab}`);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#131424] text-white font-sans bg-site bg-cover bg-no-repeat">
      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 6s linear infinite;
        }
        .text-accent {
          color: #f13024;
        }
        .bg-accent {
          background-color: #f13024;
        }
        .border-accent {
          border-color: #f13024;
        }
        .bg-primary\\/60 {
          background-color: rgba(19, 20, 36, 0.6);
        }
        .bg-primary\\/30 {
          background-color: rgba(19, 20, 36, 0.3);
        }
        .h1 {
          font-size: 35px;
          line-height: 1.25;
          margin-bottom: 2rem;
          font-weight: 600;
        }
        @media (min-width: 768px) {
          .h1 {
            font-size: 60px;
            line-height: 1.3;
          }
        }
        .h2 {
          font-size: 35px;
          line-height: 1.25;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        @media (min-width: 768px) {
          .h2 {
            font-size: 54px;
            line-height: 1.3;
          }
        }
        .input {
          height: 52px;
          width: 100%;
          border-radius: 0.5rem;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          outline: none;
        }
        .input:focus {
          border-color: rgba(255, 255, 255, 0.6);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6);
        }
        .textarea {
          width: 100%;
          min-height: 8rem;
          padding: 1.5rem;
          border-radius: 0.5rem;
          resize: none;
          overflow: hidden;
          max-height: 15rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          outline: none;
        }
        .textarea:focus {
          border-color: rgba(255, 255, 255, 0.6);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6);
        }
        .input.border-red-500,
        .textarea.border-red-500 {
          border-color: #f13024;
          box-shadow: 0 0 0 1px #f13024;
        }
        .btn {
          height: 52px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          max-width: 170px;
          padding-left: 2rem;
          padding-right: 2rem;
        }
      `}</style>

      {/* Decorative Top Left Image */}
      <TopLeftImg />

      {/* Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={selectTab}
      />

      {/* Animated Views Container */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} className="h-full">
          <Transition />

          {/* ==================================================== HOME */}
          {activeTab === "home" && (
            <div className="bg-primary/60 h-full">
              <div className="w-full h-full bg-linear-to-r from-primary/10 via-black/30 to-black/10">
                <div className="text-center flex flex-col justify-center xl:pt-40 xl:text-left h-full container mx-auto">
                  <motion.h1
                    variants={fadeIn("down", 0.2)}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="h1"
                  >
                    Transforming Ideas <br /> Into{" "}
                    <span className="text-accent">Digital Reality</span>
                  </motion.h1>

                  <motion.p
                    variants={fadeIn("down", 0.3)}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="max-w-sm xl:max-w-xl mx-auto xl:mx-0 mb-10 xl:mb-16 text-white/60 font-light leading-[1.8]"
                  >
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit. Voluptate,
                    exercitationem harum, quia nulla temporibus deleniti libero veniam
                    vero beatae numquam ducimus illum ab similique ipsam tempore fugit
                    quod laudantium debitis.
                  </motion.p>

                  <div className="flex justify-center xl:hidden relative">
                    <ProjectsBtn onClick={() => selectTab("work")} />
                  </div>
                  <motion.div
                    variants={fadeIn("down", 0.4)}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="hidden xl:flex"
                  >
                    <ProjectsBtn onClick={() => selectTab("work")} />
                  </motion.div>
                </div>
              </div>
              <div className="w-7xl h-full absolute right-0 bottom-0 pointer-events-none">
                <div
                  role="img"
                  className="bg-none xl:bg-explosion xl:bg-cover xl:bg-right xl:bg-no-repeat w-full h-full absolute mix-blend-color-dodge translate-z-0"
                  style={{ backgroundImage: "url('/bg-explosion.png')" }}
                  aria-hidden
                />

                <ParticlesContainer />

                <motion.div
                  variants={fadeIn("up", 0.5)}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="w-full h-full max-w-[737px] max-h-[678px] absolute -bottom-32 lg:bottom-0 lg:right-[8%]"
                >
                  <Avatar />
                </motion.div>
              </div>
            </div>
          )}

          {/* =================================================== ABOUT */}
          {activeTab === "about" && (
            <div className="h-full bg-primary/30 py-32 text-center xl:text-left overflow-y-auto overflow-x-hidden">
              <Circles />

              <motion.div
                variants={fadeIn("right", 0.2)}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="hidden xl:flex absolute bottom-0 -left-92.5 z-[1]"
              >
                <Avatar />
              </motion.div>

              <div className="container mx-auto h-full flex flex-col items-center xl:flex-row gap-x-6">
                <div className="flex-1 flex flex-col justify-center">
                  <motion.h2
                    variants={fadeIn("right", 0.2)}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="h2"
                  >
                    Captivating <span className="text-accent">stories</span> birth
                    magnificent designs.
                  </motion.h2>
                  <motion.p
                    variants={fadeIn("right", 0.4)}
                    initial="hidden"
                    animate="show"
                    className="max-w-[500px] mx-auto xl:mx-0 mb-6 xl:mb-12 px-2 xl:px-0 text-white/60 font-light leading-[1.8]"
                  >
                    10 years ago, I begin freelancing as a developer. Since then,
                    I&apos;ve done remote work for agencies, consulted for startups, and
                    collabrated on digital products for business and consumer use.
                  </motion.p>

                  <motion.div
                    variants={fadeIn("right", 0.6)}
                    initial="hidden"
                    animate="show"
                    className="hidden md:flex md:max-w-xl xl:max-w-none mx-auto xl:mx-0 mb-8"
                  >
                    <div className="flex flex-1 xl:gap-x-6">
                      <div className="relative flex-1 after:w-px after:h-full after:bg-white/10 after:absolute after:top-0 after:right-0">
                        <div className="text-2xl xl:text-4xl font-extrabold text-accent mb-2">
                          <CountUp start={0} end={10} duration={5} />
                        </div>
                        <div className="text-xs uppercase tracking-[1px] leading-[1.4] max-w-25">
                          Years of experience.
                        </div>
                      </div>

                      <div className="relative flex-1 after:w-px after:h-full after:bg-white/10 after:absolute after:top-0 after:right-0">
                        <div className="text-2xl xl:text-4xl font-extrabold text-accent mb-2">
                          <CountUp start={0} end={250} duration={5} />
                        </div>
                        <div className="text-xs uppercase tracking-[1px] leading-[1.4] max-w-25">
                          Satisfied clients.
                        </div>
                      </div>

                      <div className="relative flex-1 after:w-px after:h-full after:bg-white/10 after:absolute after:top-0 after:right-0">
                        <div className="text-2xl xl:text-4xl font-extrabold text-accent mb-2">
                          <CountUp start={0} end={650} duration={5} />
                        </div>
                        <div className="text-xs uppercase tracking-[1px] leading-[1.4] max-w-25">
                          Finished projects.
                        </div>
                      </div>

                      <div className="relative flex-1">
                        <div className="text-2xl xl:text-4xl font-extrabold text-accent mb-2">
                          <CountUp start={0} end={8} duration={5} />
                        </div>
                        <div className="text-xs uppercase tracking-[1px] leading-[1.4] max-w-25">
                          Winning awards.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  variants={fadeIn("left", 0.4)}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  className="flex flex-col w-full xl:max-w-[48%] h-120"
                >
                  <div className="flex gap-x-4 xl:gap-x-8 mx-auto xl:mx-0 mb-4">
                    {aboutData.map((item, itemI) => (
                      <div
                        key={itemI}
                        className={`${
                          aboutIndex === itemI &&
                          "text-accent after:w-full after:bg-accent after:transition-all after:duration-300"
                        } cursor-pointer capitalize xl:text-lg relative after:w-8 after:h-0.5 after:bg-white after:absolute after:-bottom-1 after:left-0`}
                        onClick={() => setAboutIndex(itemI)}
                      >
                        {item.title}
                      </div>
                    ))}
                  </div>

                  <div className="py-2 xl:py-6 flex flex-col gap-y-2 xl:gap-y-4 items-center xl:items-start">
                    {aboutData[aboutIndex].info.map((item, itemI) => (
                      <div
                        key={itemI}
                        className="flex-1 flex flex-col md:flex-row max-w-max gap-x-2 items-center text-center text-white/60"
                      >
                        <div className="font-light mb-2 md:mb-0">{item.title}</div>
                        <div className="hidden md:flex">-</div>
                        <div>{item.stage}</div>

                        <div className="flex gap-x-4">
                          {item.icons?.map((Icon, iconI) => (
                            <div key={iconI} className="text-2xl text-white">
                              <Icon />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* ================================================ SERVICES */}
          {activeTab === "services" && (
            <div className="h-full bg-primary/30 py-36 flex items-center">
              <Circles />
              <div className="container mx-auto">
                <div className="flex flex-col xl:flex-row gap-x-8">
                  <div className="text-center flex xl:w-[30vw] flex-col lg:text-left mb-4 xl:mb-0">
                    <motion.h2
                      variants={fadeIn("up", 0.2)}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="h2 xl:mt-8"
                    >
                      My services <span className="text-accent">.</span>
                    </motion.h2>
                    <motion.p
                      variants={fadeIn("up", 0.4)}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="mb-4 max-w-[400px] mx-auto lg:mx-0 text-white/60 font-light leading-[1.8]"
                    >
                      Lorem ipsum dolor sit amet consectetur adipisicing elit. Tenetur
                      tempora eligendi, quisquam tempore sint reiciendis.
                    </motion.p>
                  </div>

                  <motion.div
                    variants={fadeIn("down", 0.6)}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="w-full xl:max-w-[65%]"
                  >
                    <ServiceSlider />
                  </motion.div>
                </div>
              </div>
              <Bulb />
            </div>
          )}

          {/* ==================================================== WORK */}
          {activeTab === "work" && (
            <div className="h-full bg-primary/30 py-36 flex items-center">
              <Circles />
              <div className="container mx-auto">
                <div className="flex flex-col xl:flex-row gap-x-8">
                  <div className="text-center flex xl:w-[30vw] flex-col lg:text-left mb-4 xl:mb-0">
                    <motion.h2
                      variants={fadeIn("up", 0.2)}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="h2 xl:mt-12"
                    >
                      My work <span className="text-accent">.</span>
                    </motion.h2>
                    <motion.p
                      variants={fadeIn("up", 0.4)}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="mb-4 max-w-[400px] mx-auto lg:mx-0 text-white/60 font-light leading-[1.8]"
                    >
                      Lorem ipsum dolor sit amet consectetur adipisicing elit. Tenetur
                      tempora eligendi, quisquam tempore sint reiciendis.
                    </motion.p>
                  </div>

                  <motion.div
                    variants={fadeIn("down", 0.6)}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="w-full xl:max-w-[65%]"
                  >
                    <WorkSlider />
                  </motion.div>
                </div>
              </div>
              <Bulb />
            </div>
          )}

          {/* ============================================ TESTIMONIALS */}
          {activeTab === "testimonials" && (
            <div className="h-full bg-primary/30 py-32 text-center">
              <div className="container mx-auto h-full flex flex-col justify-center">
                <motion.h2
                  variants={fadeIn("up", 0.2)}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  className="h2 mb-8 xl:mb-0"
                >
                  What clients <span className="text-accent">say.</span>
                </motion.h2>

                <motion.div
                  variants={fadeIn("up", 0.4)}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                >
                  <TestimonialSlider />
                </motion.div>
              </div>
            </div>
          )}

          {/* ================================================= CONTACT */}
          {activeTab === "contact" && (
            <div className="h-full bg-primary/30 overflow-y-auto" id="hubungi-kami">
              <div className="container mx-auto py-8 xl:py-12 text-center xl:text-left flex min-h-full overflow-hidden">
                <div className="relative flex flex-col w-full max-w-[700px] m-auto">
                  <motion.h2
                    variants={fadeIn("up", 0.2)}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="h2 text-center mb-12"
                  >
                    Let&apos;s <span className="text-accent">connect.</span>
                  </motion.h2>

                  {/* Overlay status kirim — terpusat, tidak menggeser tata letak */}
                  {status !== "idle" && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#131424]/90 pointer-events-none"
                    >
                      {status === "loading" && (
                        <RiLoader4Line
                          key="loading"
                          aria-hidden
                          className="text-5xl text-white animate-spin"
                        />
                      )}
                      {status === "success" && (
                        <RiCheckboxCircleLine
                          key="success"
                          aria-hidden
                          className="text-5xl text-emerald-500 animate-in fade-in zoom-in-95 duration-300"
                        />
                      )}
                      {status === "error" && (
                        <RiCloseCircleLine
                          key="error"
                          aria-hidden
                          className="text-5xl text-rose-500 animate-in fade-in zoom-in-95 duration-300"
                        />
                      )}

                      {status === "loading" && (
                        <p className="text-sm font-medium text-white">Mengirim pesan...</p>
                      )}
                      {status === "success" && (
                        <div className="text-center">
                          <p className="font-semibold text-white">Pesan Anda berhasil dikirim!</p>
                          <p className="text-xs text-white/70 mt-1">
                            Terima kasih, kami akan segera membalas Anda.
                          </p>
                        </div>
                      )}
                      {status === "error" && (
                        <div className="text-center max-w-md">
                          <p className="font-semibold text-white">Pesan gagal terkirim.</p>
                          <p className="text-xs text-white/70 mt-1">{statusError}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <motion.form
                    variants={fadeIn("up", 0.4)}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="flex-1 flex flex-col gap-6 w-full mx-auto"
                    onSubmit={handleSubmit}
                    autoComplete="off"
                    autoCapitalize="off"
                    noValidate
                  >
                    <div className="flex gap-x-6 w-full">
                      <div className="flex-1 min-w-0">
                        <label htmlFor="name-input" className="sr-only">Nama Lengkap</label>
                        <input
                          id="name-input"
                          type="text"
                          name="name"
                          placeholder="Name"
                          className={`input ${fieldErrors.name ? "border-red-500" : ""}`}
                          value={form.name}
                          onChange={handleChange}
                          disabled={isLoading}
                          aria-disabled={isLoading}
                          maxLength={80}
                          aria-label="Nama Lengkap"
                          aria-invalid={fieldErrors.name}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label htmlFor="email-input" className="sr-only">Alamat Email</label>
                        <input
                          id="email-input"
                          type="email"
                          name="email"
                          placeholder="E-mail"
                          value={form.email}
                          onChange={handleChange}
                          disabled={isLoading}
                          aria-disabled={isLoading}
                          maxLength={120}
                          aria-label="Alamat Email"
                          aria-invalid={fieldErrors.email}
                          className={`input ${fieldErrors.email ? "border-red-500" : ""}`}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="subject-input" className="sr-only">Subjek Pesan</label>
                      <input
                        id="subject-input"
                        type="text"
                        name="subject"
                        placeholder="Subject"
                        className={`input ${fieldErrors.subject ? "border-red-500" : ""}`}
                        value={form.subject}
                        onChange={handleChange}
                        disabled={isLoading}
                        aria-disabled={isLoading}
                        maxLength={150}
                        aria-label="Subjek Pesan"
                        aria-invalid={fieldErrors.subject}
                      />
                    </div>
                    <div>
                      <label htmlFor="message-input" className="sr-only">Isi Pesan</label>
                      <textarea
                        id="message-input"
                        ref={messageRef}
                        name="message"
                        placeholder="Message..."
                        className={`textarea ${fieldErrors.message ? "border-red-500" : ""}`}
                        rows={4}
                        value={form.message}
                        onChange={handleChange}
                        disabled={isLoading}
                        aria-disabled={isLoading}
                        maxLength={5000}
                        aria-label="Isi Pesan"
                        aria-invalid={fieldErrors.message}
                      />
                    </div>

                    {/* Agreement checkbox (discreet for repo requirements) */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="agreement"
                        name="agreement"
                        checked={agreed}
                        onChange={(e) => {
                          setAgreed(e.target.checked);
                          if (e.target.checked) {
                            setFieldErrors((prev) =>
                              prev.agreement ? { ...prev, agreement: false } : prev
                            );
                          }
                        }}
                        className="w-4 h-4 text-accent accent-[#f13024] focus:ring-accent"
                      />
                      <label
                        htmlFor="agreement"
                        className={`text-xs cursor-pointer ${fieldErrors.agreement ? "text-red-500" : "text-white/50"}`}
                      >
                        I agree to the terms and data privacy conditions.
                      </label>
                    </div>

                    <Button
                      type="submit"
                      aria-label="Kirim Pesan"
                      variant="default"
                      size="lg"
                      loading={isLoading}
                      className="max-w-42.5 border-white text-white hover:bg-white/10"
                    >
                      <SendIcon aria-hidden className="size-4" />
                      Let&apos;s talk
                    </Button>
                  </motion.form>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
